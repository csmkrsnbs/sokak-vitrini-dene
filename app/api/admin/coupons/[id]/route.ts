import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb, MissingDatabaseConfigurationError } from "@/lib/db";
import { couponCodes, previewRequests } from "@/lib/db/schema";
import {
  apiError,
  isSameOrigin,
  noStoreHeaders,
} from "@/lib/server/api";
import {
  isAdminAuthenticated,
  MissingAdminConfigurationError,
} from "@/lib/server/admin-auth";
import { serializeAdminCoupon } from "@/lib/server/coupon-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.uuid();
const actionSchema = z.object({ action: z.literal("revoke") });

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
      return apiError("INVALID_REQUEST", "Geçersiz kupon işlemi.", 400, noStoreHeaders());
    }

    const [updated] = await getDb()
      .update(couponCodes)
      .set({ status: "revoked" })
      .where(and(eq(couponCodes.id, id), eq(couponCodes.status, "active")))
      .returning();

    if (!updated) {
      return apiError(
        "COUPON_NOT_ACTIVE",
        "Kupon bulunamadı veya artık etkin değil.",
        404,
        noStoreHeaders(),
      );
    }

    return NextResponse.json(
      { coupon: serializeAdminCoupon(updated) },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    if (
      error instanceof MissingAdminConfigurationError ||
      error instanceof MissingDatabaseConfigurationError
    ) {
      return apiError("ADMIN_NOT_CONFIGURED", "Kupon yönetimi henüz yapılandırılmadı.", 503);
    }
    console.error("Admin coupon update failed", error);
    return apiError("COUPON_UPDATE_FAILED", "Kupon güncellenemedi.", 500);
  }
}

export async function DELETE(
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
    if (!idSchema.safeParse(id).success) {
      return apiError("INVALID_REQUEST", "Geçersiz kupon.", 400, noStoreHeaders());
    }
    const db = getDb();
    // Atomically require an inactive coupon and no pending generation/refund.
    // Completed previews are independent records and are deliberately retained.
    const [deleted] = await db.delete(couponCodes).where(and(
      eq(couponCodes.id, id),
      sql`(${couponCodes.status} IN ('revoked','exhausted','expired') OR ${couponCodes.remainingCredits} <= 0 OR ${couponCodes.expiresAt} <= NOW())`,
      sql`NOT EXISTS (SELECT 1 FROM ${previewRequests} WHERE ${previewRequests.couponId} = ${couponCodes.id} AND ${previewRequests.status} = 'processing')`,
    )).returning({ id: couponCodes.id });
    if (!deleted) {
      const [existing] = await db.select({ id: couponCodes.id }).from(couponCodes).where(eq(couponCodes.id,id)).limit(1);
      return existing
        ? apiError("COUPON_DELETE_BLOCKED", "Etkin kupon veya devam eden üretime bağlı kupon silinemez.", 409, noStoreHeaders())
        : apiError("COUPON_NOT_FOUND", "Kupon bulunamadı.", 404, noStoreHeaders());
    }
    return NextResponse.json({ ok: true, id: deleted.id }, { headers: noStoreHeaders() });
  } catch (error) {
    if (error instanceof MissingAdminConfigurationError || error instanceof MissingDatabaseConfigurationError) {
      return apiError("ADMIN_NOT_CONFIGURED", "Kupon yönetimi henüz yapılandırılmadı.", 503, noStoreHeaders());
    }
    console.error("Admin coupon deletion failed", error);
    return apiError("COUPON_DELETE_FAILED", "Kupon silinemedi.", 500, noStoreHeaders());
  }
}
