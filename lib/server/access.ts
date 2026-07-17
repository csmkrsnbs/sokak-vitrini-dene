import { and, count, eq, or, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { couponCodes, freeUsageEvents, previewRequests } from "@/lib/db/schema";
import type { AccessState, PreviewCategory } from "@/lib/types";
import {
  FREE_PREVIEW_LIMIT,
  isPaymentConfigured,
  STANDARD_PACKAGE,
} from "@/lib/server/billing";
import { getCouponId } from "@/lib/server/coupons";

export type PreviewAccessReservation =
  | { source: "free"; couponId: null }
  | { source: "coupon"; couponId: string };

type PreviewReservationInput = {
  id: string;
  sessionId: string;
  clientKey: string;
  category: PreviewCategory;
  note: string | null;
  model: string;
  couponId: string | null;
};

export class PreviewCreditsRequiredError extends Error {
  constructor() {
    super("3 ücretsiz deneme hakkınız bitti. Devam etmek için kupon kullanın.");
    this.name = "PreviewCreditsRequiredError";
  }
}

function resultRows(result: unknown) {
  if (!result || typeof result !== "object" || !("rows" in result)) return [];
  const rows = (result as { rows?: unknown[] }).rows;
  return Array.isArray(rows) ? rows : [];
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}

async function reserveFreePreview(input: PreviewReservationInput) {
  const db = getDb();

  for (let attempt = 0; attempt < FREE_PREVIEW_LIMIT; attempt += 1) {
    try {
      const result = await db.execute(sql`
        WITH available_slot AS (
          SELECT slot
          FROM generate_series(1, ${FREE_PREVIEW_LIMIT}) AS slots(slot)
          WHERE NOT EXISTS (
            SELECT 1 FROM free_usage_events
            WHERE session_id = ${input.sessionId} AND free_usage_events.slot = slots.slot
          )
          AND NOT EXISTS (
            SELECT 1 FROM free_usage_events
            WHERE client_key = ${input.clientKey} AND free_usage_events.slot = slots.slot
          )
          ORDER BY slot
          LIMIT 1
        ), inserted_preview AS (
          INSERT INTO preview_requests (
            id, session_id, client_key, category, note, status, model, credit_source
          )
          SELECT
            ${input.id}::uuid,
            ${input.sessionId},
            ${input.clientKey},
            ${input.category},
            ${input.note},
            'processing',
            ${input.model},
            'free'
          FROM available_slot
          RETURNING id
        )
        INSERT INTO free_usage_events (preview_id, session_id, client_key, slot)
        SELECT inserted_preview.id, ${input.sessionId}, ${input.clientKey}, available_slot.slot
        FROM inserted_preview
        CROSS JOIN available_slot
        RETURNING preview_id
      `);

      return resultRows(result).length > 0;
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === FREE_PREVIEW_LIMIT - 1) {
        if (isUniqueViolation(error)) return false;
        throw error;
      }
    }
  }

  return false;
}

async function reserveCouponPreview(input: PreviewReservationInput, couponId: string) {
  const db = getDb();
  const result = await db.execute(sql`
    WITH charged_coupon AS (
      UPDATE coupon_codes
      SET
        remaining_credits = remaining_credits - 1,
        status = CASE WHEN remaining_credits - 1 = 0 THEN 'exhausted' ELSE status END
      WHERE id = ${couponId}::uuid
        AND status = 'active'
        AND remaining_credits > 0
      RETURNING id
    )
    INSERT INTO preview_requests (
      id, session_id, client_key, category, note, status, model, credit_source, coupon_id
    )
    SELECT
      ${input.id}::uuid,
      ${input.sessionId},
      ${input.clientKey},
      ${input.category},
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

export async function reservePreviewAccess(
  input: PreviewReservationInput,
): Promise<PreviewAccessReservation> {
  if (await reserveFreePreview(input)) {
    return { source: "free", couponId: null };
  }

  if (input.couponId && (await reserveCouponPreview(input, input.couponId))) {
    return { source: "coupon", couponId: input.couponId };
  }

  throw new PreviewCreditsRequiredError();
}

export async function releasePreviewAccess(
  previewId: string,
  reservation: PreviewAccessReservation,
  errorCode: string,
) {
  const db = getDb();

  if (reservation.source === "free") {
    await db.delete(freeUsageEvents).where(eq(freeUsageEvents.previewId, previewId));
    await db
      .update(previewRequests)
      .set({ status: "failed", errorCode, completedAt: new Date() })
      .where(eq(previewRequests.id, previewId));
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
        AND credit_refunded_at IS NULL
      RETURNING coupon_id
    )
    UPDATE coupon_codes
    SET remaining_credits = remaining_credits + 1, status = 'active'
    FROM refundable
    WHERE coupon_codes.id = refundable.coupon_id
  `);
}

export async function getAccessState({
  request,
  sessionId,
  clientKey,
  couponIdOverride,
}: {
  request: NextRequest;
  sessionId: string;
  clientKey: string;
  couponIdOverride?: string | null;
}): Promise<AccessState> {
  const db = getDb();
  const [freeUsage] = await db
    .select({ total: count() })
    .from(freeUsageEvents)
    .where(
      or(
        eq(freeUsageEvents.sessionId, sessionId),
        eq(freeUsageEvents.clientKey, clientKey),
      ),
    );

  const used = Math.min(freeUsage?.total ?? 0, FREE_PREVIEW_LIMIT);
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
      .where(and(eq(couponCodes.id, couponId), or(eq(couponCodes.status, "active"), eq(couponCodes.status, "exhausted"))))
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
      limit: FREE_PREVIEW_LIMIT,
      used,
      remaining: Math.max(0, FREE_PREVIEW_LIMIT - used),
    },
    coupon,
    package: STANDARD_PACKAGE,
    paymentConfigured: isPaymentConfigured(),
  };
}
