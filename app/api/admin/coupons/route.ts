import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb, MissingDatabaseConfigurationError } from "@/lib/db";
import { couponCodes } from "@/lib/db/schema";
import {
  apiError,
  isSameOrigin,
  noStoreHeaders,
} from "@/lib/server/api";
import {
  isAdminAuthenticated,
  MissingAdminConfigurationError,
} from "@/lib/server/admin-auth";
import {
  generateCouponCode,
  hashCouponCode,
  MissingCouponConfigurationError,
} from "@/lib/server/coupons";
import { serializeAdminCoupon } from "@/lib/server/coupon-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  label: z.string().trim().min(2).max(120),
  credits: z.number().int().min(1).max(3),
  expiresAt: z.string().trim().min(1).max(40),
});

const DAY_MS = 24 * 60 * 60 * 1_000;
const EXPIRY_TOLERANCE_MS = 5 * 60 * 1_000;

function authenticated(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return apiError("UNAUTHORIZED", "Yönetim girişi gerekli.", 401, noStoreHeaders());
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authError = authenticated(request);
    if (authError) return authError;

    const rows = await getDb()
      .select()
      .from(couponCodes)
      .orderBy(desc(couponCodes.createdAt))
      .limit(200);

    return NextResponse.json(
      { coupons: rows.map(serializeAdminCoupon) },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    if (
      error instanceof MissingAdminConfigurationError ||
      error instanceof MissingDatabaseConfigurationError
    ) {
      return apiError("ADMIN_NOT_CONFIGURED", "Kupon yönetimi henüz yapılandırılmadı.", 503);
    }
    console.error("Admin coupons failed", error);
    return apiError("ADMIN_COUPONS_FAILED", "Kuponlar alınamadı.", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return apiError("INVALID_ORIGIN", "İstek doğrulanamadı.", 403, noStoreHeaders());
  }

  try {
    const authError = authenticated(request);
    if (authError) return authError;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        "INVALID_COUPON_REQUEST",
        "Kampanya adı, 1–3 hak ve 7–30 gün arasında son kullanım tarihi girin.",
        400,
        noStoreHeaders(),
      );
    }

    const expiresAt = new Date(parsed.data.expiresAt);
    const validityMs = expiresAt.getTime() - Date.now();
    if (
      !Number.isFinite(expiresAt.getTime()) ||
      validityMs < 7 * DAY_MS - EXPIRY_TOLERANCE_MS ||
      validityMs > 30 * DAY_MS + EXPIRY_TOLERANCE_MS
    ) {
      return apiError(
        "INVALID_COUPON_EXPIRY",
        "Son kullanım tarihi 7–30 gün arasında olmalıdır.",
        400,
        noStoreHeaders(),
      );
    }

    const db = getDb();
    const code = generateCouponCode();
    const [created] = await db
      .insert(couponCodes)
      .values({
        id: crypto.randomUUID(),
        label: parsed.data.label,
        codeHash: hashCouponCode(code),
        totalCredits: parsed.data.credits,
        remainingCredits: parsed.data.credits,
        status: "active",
        expiresAt,
      })
      .returning();

    return NextResponse.json(
      { coupon: serializeAdminCoupon(created), code },
      { status: 201, headers: noStoreHeaders() },
    );
  } catch (error) {
    if (
      error instanceof MissingAdminConfigurationError ||
      error instanceof MissingCouponConfigurationError ||
      error instanceof MissingDatabaseConfigurationError
    ) {
      return apiError("COUPON_ADMIN_NOT_CONFIGURED", "Kupon yönetimi henüz yapılandırılmadı.", 503);
    }
    console.error("Admin coupon create failed", error);
    return apiError("COUPON_CREATE_FAILED", "Kupon oluşturulamadı.", 500);
  }
}
