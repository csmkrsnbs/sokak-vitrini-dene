import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { paymentRequests } from "@/lib/db/schema";
import { apiError, noStoreHeaders } from "@/lib/server/api";
import {
  isAdminAuthenticated,
  MissingAdminConfigurationError,
} from "@/lib/server/admin-auth";
import { serializeAdminPayment } from "@/lib/server/payment-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return apiError("UNAUTHORIZED", "Yönetim girişi gerekli.", 401, noStoreHeaders());
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(paymentRequests)
      .orderBy(desc(paymentRequests.createdAt))
      .limit(100);

    return NextResponse.json(
      { payments: rows.map(serializeAdminPayment) },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    if (error instanceof MissingAdminConfigurationError) {
      return apiError("ADMIN_NOT_CONFIGURED", "Yönetim erişimi henüz yapılandırılmadı.", 503);
    }
    console.error("Admin payments failed", error);
    return apiError("ADMIN_PAYMENTS_FAILED", "Ödeme talepleri alınamadı.", 500);
  }
}
