import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
  couponCodes,
  freeUsageEvents,
  networkRiskChecks,
  paymentRequests,
  previewRequests,
} from "@/lib/db/schema";
import { noStoreHeaders } from "@/lib/server/api";
import { isPaymentConfigured } from "@/lib/server/billing";
import {
  getImageModelName,
  isImageGenerationConfigured,
} from "@/lib/server/runpod-image";
import { isVpnDetectionConfigured } from "@/lib/server/network-risk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const aiConfigured = isImageGenerationConfigured();
  const paymentConfigured = isPaymentConfigured();
  const vpnDetectionConfigured = isVpnDetectionConfigured();
  const securityConfigured = Boolean(
    (process.env.RATE_LIMIT_SALT?.trim().length ?? 0) >= 32 &&
      (process.env.CRON_SECRET?.trim().length ?? 0) >= 32,
  );
  let databaseReachable = false;
  let schemaReady = false;

  if (databaseConfigured) {
    try {
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      databaseReachable = true;
      await Promise.all([
        db
          .select({
            id: previewRequests.id,
            providerJobId: previewRequests.providerJobId,
          })
          .from(previewRequests)
          .limit(1),
        db.select({ id: freeUsageEvents.previewId }).from(freeUsageEvents).limit(1),
        db.select({ id: paymentRequests.id }).from(paymentRequests).limit(1),
        db.select({ id: couponCodes.id }).from(couponCodes).limit(1),
        db
          .select({ clientKey: networkRiskChecks.clientKey })
          .from(networkRiskChecks)
          .limit(1),
      ]);
      schemaReady = true;
    } catch (error) {
      console.error("Health database check failed", error);
    }
  }

  const ready =
    databaseReachable &&
    schemaReady &&
    aiConfigured &&
    paymentConfigured &&
    vpnDetectionConfigured &&
    securityConfigured;
  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks: {
        databaseConfigured,
        databaseReachable,
        schemaReady,
        aiConfigured,
        paymentConfigured,
        vpnDetectionConfigured,
        securityConfigured,
        aiProvider: "runpod",
        aiModel: getImageModelName(),
      },
    },
    { status: ready ? 200 : 503, headers: noStoreHeaders() },
  );
}
