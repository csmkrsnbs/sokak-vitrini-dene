import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
  couponCodes,
  dailyGenerationEvents,
  previewRequests,
} from "@/lib/db/schema";
import { noStoreHeaders } from "@/lib/server/api";
import {
  getImageModelName,
  isImageGenerationConfigured,
} from "@/lib/server/ai-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const aiConfigured = isImageGenerationConfigured();
  const couponConfigured = Boolean(
    (process.env.COUPON_SIGNING_SECRET?.trim().length ?? 0) >= 32 &&
      (process.env.ADMIN_ACCESS_KEY?.trim().length ?? 0) >= 32,
  );
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
            mode: previewRequests.mode,
            productKind: previewRequests.productKind,
            providerJobId: previewRequests.providerJobId,
          })
          .from(previewRequests)
          .limit(1),
        db
          .select({
            id: couponCodes.id,
            claimedSessionId: couponCodes.claimedSessionId,
          })
          .from(couponCodes)
          .limit(1),
        db
          .select({ id: dailyGenerationEvents.previewId })
          .from(dailyGenerationEvents)
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
    couponConfigured &&
    securityConfigured;

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks: {
        databaseConfigured,
        databaseReachable,
        schemaReady,
        aiConfigured,
        couponConfigured,
        securityConfigured,
        aiProvider: "fashn-api",
        aiModels: {
          clothingTryOn: getImageModelName("clothing", "personal"),
          wearableTryOn: getImageModelName("jewelry", "personal"),
          businessStudio: getImageModelName("clothing", "studio"),
        },
      },
    },
    { status: ready ? 200 : 503, headers: noStoreHeaders() },
  );
}
