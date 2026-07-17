import { and, eq, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";
import {
  releasePreviewAccess,
  type PreviewAccessReservation,
} from "@/lib/server/access";
import { apiError, noStoreHeaders } from "@/lib/server/api";
import { getPreviewJobMaxAgeMs } from "@/lib/server/preview-job-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function retentionDays() {
  const parsed = Number.parseInt(process.env.IMAGE_RETENTION_DAYS || "30", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 365) : 30;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return apiError("UNAUTHORIZED", "Yetkisiz istek.", 401, noStoreHeaders());
  }

  try {
    const days = retentionDays();
    const now = Date.now();
    const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
    const staleCutoff = new Date(now - getPreviewJobMaxAgeMs());
    const db = getDb();
    const stale = await db
      .select({
        id: previewRequests.id,
        creditSource: previewRequests.creditSource,
        couponId: previewRequests.couponId,
      })
      .from(previewRequests)
      .where(
        and(
          eq(previewRequests.status, "processing"),
          lt(previewRequests.createdAt, staleCutoff),
        ),
      )
      .limit(50);

    let released = 0;
    for (const row of stale) {
      const reservation: PreviewAccessReservation | null =
        row.creditSource === "free"
          ? { source: "free", couponId: null }
          : row.creditSource === "coupon" && row.couponId
            ? { source: "coupon", couponId: row.couponId }
            : null;

      await db
        .update(previewRequests)
        .set({ providerStatus: "TIMED_OUT", providerCheckedAt: new Date() })
        .where(
          and(
            eq(previewRequests.id, row.id),
            eq(previewRequests.status, "processing"),
          ),
        );

      if (reservation) {
        await releasePreviewAccess(row.id, reservation, "AI_TIMEOUT");
      } else {
        await db
          .update(previewRequests)
          .set({ status: "failed", errorCode: "AI_TIMEOUT", completedAt: new Date() })
          .where(
            and(
              eq(previewRequests.id, row.id),
              eq(previewRequests.status, "processing"),
            ),
          );
      }
      released += 1;
    }

    const deleted = await db
      .delete(previewRequests)
      .where(lt(previewRequests.createdAt, cutoff))
      .returning({ id: previewRequests.id });

    return NextResponse.json(
      { ok: true, released, deleted: deleted.length, retentionDays: days },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("Cleanup failed", error);
    return apiError("CLEANUP_FAILED", "Temizleme işlemi başarısız.", 500);
  }
}
