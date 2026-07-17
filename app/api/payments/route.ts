import { and, count, desc, eq, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb, MissingDatabaseConfigurationError } from "@/lib/db";
import { paymentRequests } from "@/lib/db/schema";
import {
  apiError,
  attachSessionCookie,
  getSession,
  isSameOrigin,
  noStoreHeaders,
} from "@/lib/server/api";
import {
  getBankDetails,
  isPaymentConfigured,
  STANDARD_PACKAGE,
} from "@/lib/server/billing";
import { getClientKey } from "@/lib/server/client-key";
import { MissingCouponConfigurationError } from "@/lib/server/coupons";
import { serializePayment } from "@/lib/server/payment-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paymentSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.email().max(254).transform((value) => value.toLowerCase()),
});

function referenceCode(id: string) {
  return `SV-${id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

async function latestPayment(sessionId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.sessionId, sessionId))
    .orderBy(desc(paymentRequests.createdAt))
    .limit(1);
  return row ?? null;
}

export async function GET(request: NextRequest) {
  const session = getSession(request);

  try {
    const bank = getBankDetails();
    if (!bank || !isPaymentConfigured()) {
      return apiError("PAYMENT_NOT_CONFIGURED", "Ödeme bilgileri henüz yapılandırılmadı.", 503);
    }

    const row = await latestPayment(session.id);
    const response = NextResponse.json(
      { payment: row ? serializePayment(row, bank) : null },
      { headers: noStoreHeaders() },
    );
    return attachSessionCookie(response, session);
  } catch (error) {
    if (
      error instanceof MissingDatabaseConfigurationError ||
      error instanceof MissingCouponConfigurationError
    ) {
      return apiError("PAYMENT_NOT_CONFIGURED", "Ödeme sistemi henüz yapılandırılmadı.", 503);
    }
    console.error("Payment fetch failed", error);
    return apiError("PAYMENT_FETCH_FAILED", "Ödeme talebi alınamadı.", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return apiError("INVALID_ORIGIN", "İstek doğrulanamadı.", 403, noStoreHeaders());
  }

  const session = getSession(request);
  const clientKey = getClientKey(request, session.id);

  try {
    const bank = getBankDetails();
    if (!bank || !isPaymentConfigured()) {
      return apiError("PAYMENT_NOT_CONFIGURED", "Ödeme bilgileri henüz yapılandırılmadı.", 503);
    }

    const parsed = paymentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        "INVALID_PAYMENT_REQUEST",
        "Adınızı ve geçerli e-posta adresinizi girin.",
        400,
        noStoreHeaders(),
      );
    }

    const current = await latestPayment(session.id);
    if (current?.status === "pending") {
      const response = NextResponse.json(
        { payment: serializePayment(current, bank) },
        { headers: noStoreHeaders() },
      );
      return attachSessionCookie(response, session);
    }

    const db = getDb();
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1_000);
    const [recent] = await db
      .select({ total: count() })
      .from(paymentRequests)
      .where(
        and(
          eq(paymentRequests.clientKey, clientKey),
          gte(paymentRequests.createdAt, windowStart),
        ),
      );
    if ((recent?.total ?? 0) >= 3) {
      return apiError(
        "PAYMENT_REQUEST_LIMIT",
        "Çok sayıda ödeme talebi oluşturdunuz. Lütfen mevcut talebi kullanın.",
        429,
        noStoreHeaders(),
      );
    }

    const id = crypto.randomUUID();
    const [created] = await db
      .insert(paymentRequests)
      .values({
        id,
        sessionId: session.id,
        clientKey,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        referenceCode: referenceCode(id),
        packageCode: STANDARD_PACKAGE.code,
        amountKurus: STANDARD_PACKAGE.amountKurus,
        credits: STANDARD_PACKAGE.credits,
        status: "pending",
      })
      .returning();

    const response = NextResponse.json(
      { payment: serializePayment(created, bank) },
      { status: 201, headers: noStoreHeaders() },
    );
    return attachSessionCookie(response, session);
  } catch (error) {
    if (
      error instanceof MissingDatabaseConfigurationError ||
      error instanceof MissingCouponConfigurationError
    ) {
      return apiError("PAYMENT_NOT_CONFIGURED", "Ödeme sistemi henüz yapılandırılmadı.", 503);
    }
    console.error("Payment create failed", error);
    return apiError("PAYMENT_CREATE_FAILED", "Ödeme talebi oluşturulamadı.", 500);
  }
}
