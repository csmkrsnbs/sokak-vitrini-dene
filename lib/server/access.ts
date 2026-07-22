import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { couponCodes } from "@/lib/db/schema";
import type { AccessState, PreviewCategory, PreviewMode, ProductKind } from "@/lib/types";
import { dailyGenerationLimit } from "@/lib/server/usage-limits";
import { getCouponId } from "@/lib/server/coupons";

export type PreviewAccessReservation =
  | { source: "free"; couponId: null }
  | { source: "coupon"; couponId: string };

type PreviewReservationInput = {
  id: string;
  sessionId: string;
  clientKey: string;
  mode: PreviewMode;
  category: PreviewCategory;
  productKind: ProductKind;
  note: string | null;
  model: string;
  couponId: string | null;
};

export class PreviewCreditsRequiredError extends Error {
  constructor() {
    super("Önizleme oluşturmak için geçerli ve bakiyesi bulunan bir kupon etkinleştirin.");
    this.name = "PreviewCreditsRequiredError";
  }
}

export class DailyGenerationCapacityError extends Error {
  constructor() {
    super("Bugünkü görsel üretim kapasitesi doldu. Kullanım hakkınız düşürülmedi; lütfen daha sonra yeniden deneyin.");
    this.name = "DailyGenerationCapacityError";
  }
}

function resultRows(result: unknown) {
  if (!result || typeof result !== "object" || !("rows" in result)) return [];
  const rows = (result as { rows?: unknown[] }).rows;
  return Array.isArray(rows) ? rows : [];
}


async function reserveCouponPreview(input: PreviewReservationInput, couponId: string) {
  const db = getDb();
  const result = await db.execute(sql`
    WITH charged_coupon AS (
      UPDATE coupon_codes
      SET
        remaining_credits = remaining_credits - 1,
        status = CASE WHEN remaining_credits - 1 = 0 THEN 'exhausted' ELSE status END,
        claimed_session_id = COALESCE(claimed_session_id, ${input.sessionId}),
        activated_at = COALESCE(activated_at, NOW())
      WHERE id = ${couponId}::uuid
        AND status = 'active'
        AND remaining_credits > 0
        AND (claimed_session_id IS NULL OR claimed_session_id = ${input.sessionId})
        AND (expires_at IS NULL OR expires_at > NOW())
      RETURNING id
    )
    INSERT INTO preview_requests (
      id, session_id, client_key, mode, category, product_kind, note, status, model, credit_source, coupon_id
    )
    SELECT
      ${input.id}::uuid,
      ${input.sessionId},
      ${input.clientKey},
      ${input.mode},
      ${input.category},
      ${input.productKind},
      ${input.note},
      'processing',
      ${input.model},
      'coupon',
      charged_coupon.id
    FROM charged_coupon
    RETURNING id
  `);

  return resultRows(result).length > 0;
}

function istanbulDayKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function reserveDailyGeneration(previewId: string) {
  const db = getDb();
  const limit = dailyGenerationLimit();
  const dayKey = istanbulDayKey();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await db.execute(sql`
      INSERT INTO daily_generation_events (preview_id, day_key, slot)
      SELECT ${previewId}::uuid, ${dayKey}, slots.slot
      FROM generate_series(1, ${limit}) AS slots(slot)
      WHERE NOT EXISTS (
        SELECT 1 FROM daily_generation_events
        WHERE day_key = ${dayKey} AND daily_generation_events.slot = slots.slot
      )
      ORDER BY slots.slot
      LIMIT 1
      ON CONFLICT DO NOTHING
      RETURNING preview_id
    `);

    if (resultRows(result).length > 0) return true;

    const existing = await db.execute(sql`
      SELECT 1 FROM daily_generation_events
      WHERE preview_id = ${previewId}::uuid
      LIMIT 1
    `);
    if (resultRows(existing).length > 0) return true;
  }

  return false;
}

export async function reservePreviewAccess(
  input: PreviewReservationInput,
): Promise<PreviewAccessReservation> {
  if (!input.couponId || !(await reserveCouponPreview(input, input.couponId))) {
    throw new PreviewCreditsRequiredError();
  }

  const reservation: PreviewAccessReservation = {
    source: "coupon",
    couponId: input.couponId,
  };

  if (!(await reserveDailyGeneration(input.id))) {
    await releasePreviewAccess(input.id, reservation, "DAILY_CAPACITY_REACHED");
    throw new DailyGenerationCapacityError();
  }

  return reservation;
}

export async function releasePreviewAccess(
  previewId: string,
  reservation: PreviewAccessReservation,
  errorCode: string,
) {
  const db = getDb();

  if (reservation.source === "free") {
    await db.execute(sql`
      WITH refundable AS (
        UPDATE preview_requests
        SET
          status = 'failed',
          error_code = ${errorCode},
          completed_at = NOW()
        WHERE id = ${previewId}::uuid
          AND status = 'processing'
        RETURNING id
      )
      DELETE FROM free_usage_events
      USING refundable
      WHERE free_usage_events.preview_id = refundable.id
    `);
    return;
  }

  await db.execute(sql`
    WITH refundable AS (
      UPDATE preview_requests
      SET
        status = 'failed',
        error_code = ${errorCode},
        completed_at = NOW(),
        credit_refunded_at = NOW()
      WHERE id = ${previewId}::uuid
        AND credit_source = 'coupon'
        AND status = 'processing'
        AND credit_refunded_at IS NULL
      RETURNING coupon_id
    )
    UPDATE coupon_codes
    SET
      remaining_credits = remaining_credits + 1,
      status = CASE WHEN coupon_codes.status = 'exhausted' THEN 'active' ELSE coupon_codes.status END
    FROM refundable
    WHERE coupon_codes.id = refundable.coupon_id
  `);
}

export async function getAccessState({
  request,
  sessionId,
  couponIdOverride,
}: {
  request: NextRequest;
  sessionId: string;
  clientKey: string;
  couponIdOverride?: string | null;
}): Promise<AccessState> {
  const db = getDb();
  const couponId = couponIdOverride === undefined ? getCouponId(request) : couponIdOverride;
  let coupon: AccessState["coupon"] = null;

  if (couponId) {
    const [row] = await db
      .select({
        status: couponCodes.status,
        total: couponCodes.totalCredits,
        remaining: couponCodes.remainingCredits,
      })
      .from(couponCodes)
      .where(
        and(
          eq(couponCodes.id, couponId),
          or(eq(couponCodes.status, "active"), eq(couponCodes.status, "exhausted")),
          or(
            isNull(couponCodes.claimedSessionId),
            eq(couponCodes.claimedSessionId, sessionId),
          ),
          or(isNull(couponCodes.expiresAt), gt(couponCodes.expiresAt, new Date())),
        ),
      )
      .limit(1);

    if (row) {
      coupon = {
        active: row.status === "active" && row.remaining > 0,
        total: row.total,
        remaining: Math.max(0, row.remaining),
      };
    }
  }

  return {
    free: {
      limit: 0,
      used: 0,
      remaining: 0,
    },
    coupon,
  };
}
