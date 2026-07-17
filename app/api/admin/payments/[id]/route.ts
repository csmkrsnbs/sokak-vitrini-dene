import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { paymentRequests } from "@/lib/db/schema";
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
import { serializeAdminPayment } from "@/lib/server/payment-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.uuid();
const actionSchema = z.object({ action: z.enum(["approve", "reject"]) });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) {
    return apiError("INVALID_ORIGIN", "İstek doğrulanamadı.", 403, noStoreHeaders());
  }

  try {
    if (!isAdminAuthenticated(request)) {
      return apiError("UNAUTHORIZED", "Yönetim girişi gerekli.", 401, noStoreHeaders());
    }

    const { id } = await context.params;
    const action = actionSchema.safeParse(await request.json());
    if (!idSchema.safeParse(id).success || !action.success) {
      return apiError("INVALID_REQUEST", "Geçersiz ödeme işlemi.", 400, noStoreHeaders());
    }

    const db = getDb();

    if (action.data.action === "approve") {
      const couponId = crypto.randomUUID();
      const couponCode = generateCouponCode(id);
      const codeHash = hashCouponCode(couponCode);

      await db.execute(sql`
        WITH approved AS (
          UPDATE payment_requests
          SET status = 'approved', reviewed_at = NOW()
          WHERE id = ${id}::uuid AND status = 'pending'
          RETURNING id, credits
        )
        INSERT INTO coupon_codes (
          id, payment_request_id, code_hash, total_credits, remaining_credits, status
        )
        SELECT ${couponId}::uuid, approved.id, ${codeHash}, approved.credits, approved.credits, 'active'
        FROM approved
        ON CONFLICT (payment_request_id) DO NOTHING
      `);
    } else {
      await db
        .update(paymentRequests)
        .set({ status: "rejected", reviewedAt: new Date() })
        .where(
          and(
            eq(paymentRequests.id, id),
            eq(paymentRequests.status, "pending"),
          ),
        );
    }

    const [updated] = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.id, id))
      .limit(1);
    if (!updated) {
      return apiError("PAYMENT_NOT_FOUND", "Ödeme talebi bulunamadı.", 404, noStoreHeaders());
    }

    return NextResponse.json(
      { payment: serializeAdminPayment(updated) },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    if (
      error instanceof MissingAdminConfigurationError ||
      error instanceof MissingCouponConfigurationError
    ) {
      return apiError("PAYMENT_ADMIN_NOT_CONFIGURED", "Ödeme yönetimi yapılandırılmadı.", 503);
    }
    console.error("Admin payment update failed", error);
    return apiError("PAYMENT_UPDATE_FAILED", "Ödeme talebi güncellenemedi.", 500);
  }
}
