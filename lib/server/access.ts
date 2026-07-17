import { and, count, eq, gt, isNull, or, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { couponCodes, freeUsageEvents } from "@/lib/db/schema";
import type { AccessState, PreviewCategory } from "@/lib/types";
import { dailyGenerationLimit, FREE_PREVIEW_LIMIT } from "@/lib/server/usage-limits";
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
  allowFree: boolean;
  freeTrialRestriction: "anonymizer" | null;
};

export class PreviewCreditsRequiredError extends Error {
  constructor() {
    super("2 ücretsiz deneme hakkınız bitti. Devam etmek için kupon kullanın.");
    this.name = "PreviewCreditsRequiredError";
  }
}

export class PreviewVpnRestrictedError extends Error {
  constructor() {
    super(
      "VPN, proxy veya Tor bağlantısıyla ücretsiz deneme kullanılamaz. Bağlantıyı kapatın veya kuponunuzu etkinleştirin.",
    );
    this.name = "PreviewVpnRestrictedError";
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
        AND (expires_at IS NULL OR expires_at > NOW())
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
  let reservation: PreviewAccessReservation | null = null;

  if (input.allowFree && (await reserveFreePreview(input))) {
    reservation = { source: "free", couponId: null };
  }

  if (!reservation && input.couponId && (await reserveCouponPreview(input, input.couponId))) {
    reservation = { source: "coupon", couponId: input.couponId };
  }

  if (!reservation && input.freeTrialRestriction === "anonymizer") {
    throw new PreviewVpnRestrictedError();
  }

  if (!reservation) {
    throw new PreviewCreditsRequiredError();
  }

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
      .where(
        and(
          eq(couponCodes.id, couponId),
          or(eq(couponCodes.status, "active"), eq(couponCodes.status, "exhausted")),
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
      limit: FREE_PREVIEW_LIMIT,
      used,
      remaining: Math.max(0, FREE_PREVIEW_LIMIT - used),
    },
    coupon,
  };
}
