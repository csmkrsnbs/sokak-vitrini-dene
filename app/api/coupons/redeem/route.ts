import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb, MissingDatabaseConfigurationError } from "@/lib/db";
import { couponCodes } from "@/lib/db/schema";
import { getAccessState } from "@/lib/server/access";
import {
  apiError,
  attachSessionCookie,
  getSession,
  isSameOrigin,
  noStoreHeaders,
} from "@/lib/server/api";
import { getClientKey } from "@/lib/server/client-key";
import {
  attachCouponCookie,
  hashCouponCode,
  MissingCouponConfigurationError,
} from "@/lib/server/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redeemSchema = z.object({
  code: z.string().trim().min(8).max(40),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return apiError("INVALID_ORIGIN", "İstek doğrulanamadı.", 403, noStoreHeaders());
  }

  const session = getSession(request);

  try {
    const parsed = redeemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("INVALID_COUPON", "Geçerli bir kupon kodu girin.", 400, noStoreHeaders());
    }

    const db = getDb();
    const codeHash = hashCouponCode(parsed.data.code);
    const [coupon] = await db
      .update(couponCodes)
      .set({
        claimedSessionId: session.id,
        activatedAt: sql`COALESCE(${couponCodes.activatedAt}, NOW())`,
      })
      .where(
        and(
          eq(couponCodes.codeHash, codeHash),
          eq(couponCodes.status, "active"),
          gt(couponCodes.remainingCredits, 0),
          or(
            isNull(couponCodes.claimedSessionId),
            eq(couponCodes.claimedSessionId, session.id),
          ),
          or(isNull(couponCodes.expiresAt), gt(couponCodes.expiresAt, new Date())),
        ),
      )
      .returning({ id: couponCodes.id });

    if (!coupon) {
      const [existing] = await db
        .select({ claimedSessionId: couponCodes.claimedSessionId })
        .from(couponCodes)
        .where(
          and(
            eq(couponCodes.codeHash, codeHash),
            eq(couponCodes.status, "active"),
            gt(couponCodes.remainingCredits, 0),
            or(isNull(couponCodes.expiresAt), gt(couponCodes.expiresAt, new Date())),
          ),
        )
        .limit(1);

      if (existing?.claimedSessionId && existing.claimedSessionId !== session.id) {
        return apiError(
          "COUPON_ALREADY_CLAIMED",
          "Bu kupon başka bir tarayıcıda etkinleştirilmiş. Yöneticiyle iletişime geçin.",
          409,
          noStoreHeaders(),
        );
      }

      return apiError(
        "COUPON_NOT_AVAILABLE",
        "Kupon bulunamadı, süresi dolmuş, kullanım dışı veya hakkı bitmiş.",
        404,
        noStoreHeaders(),
      );
    }

    const access = await getAccessState({
      request,
      sessionId: session.id,
      clientKey: getClientKey(request, session.id),
      couponIdOverride: coupon.id,
    });
    const response = NextResponse.json({ access }, { headers: noStoreHeaders() });
    attachSessionCookie(response, session);
    return attachCouponCookie(response, coupon.id);
  } catch (error) {
    if (
      error instanceof MissingDatabaseConfigurationError ||
      error instanceof MissingCouponConfigurationError
    ) {
      return apiError("COUPON_NOT_CONFIGURED", "Kupon sistemi henüz yapılandırılmadı.", 503);
    }
    console.error("Coupon redeem failed", error);
    return apiError("COUPON_REDEEM_FAILED", "Kupon etkinleştirilemedi.", 500);
  }
}
