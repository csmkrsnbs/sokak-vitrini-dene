import { and, asc, eq, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
  dailyGenerationEvents,
  networkRiskChecks,
  requestRateLimits,
  previewRequests,
} from "@/lib/db/schema";
import {
  releasePreviewAccess,
  type PreviewAccessReservation,
} from "@/lib/server/access";
import { apiError, noStoreHeaders } from "@/lib/server/api";
import { getPreviewJobMaxAgeMs } from "@/lib/server/preview-job-policy";
import { getProductPreviewJob } from "@/lib/server/ai-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
        providerJobId: previewRequests.providerJobId,
        category: previewRequests.category,
        mode: previewRequests.mode,
        createdAt: previewRequests.createdAt,
        providerSubmittedAt: previewRequests.providerSubmittedAt,
      })
      .from(previewRequests)
      .where(
        and(
          eq(previewRequests.status, "processing"),
          lt(previewRequests.createdAt, new Date(now - 90_000)),
        ),
      )
      .orderBy(asc(previewRequests.providerCheckedAt), asc(previewRequests.createdAt))
      .limit(8);

    let released = 0, completed = 0, deferred = 0;
    const reconcile = async (row: typeof stale[number]) => {
      const reservation: PreviewAccessReservation | null = row.creditSource === "free" ? { source: "free", couponId: null } : row.creditSource === "coupon" && row.couponId ? { source: "coupon", couponId: row.couponId } : null;
      const condition = and(eq(previewRequests.id, row.id), eq(previewRequests.status, "processing"));
      let failure = "AI_TIMEOUT";
      if (row.providerJobId) {
        try {
          const job = await getProductPreviewJob(row.providerJobId, row.category, row.mode);
          if (job.state === "completed") {
            const saved = await db.update(previewRequests).set({ status:"completed",providerStatus:"COMPLETED",providerCheckedAt:new Date(),model:job.result.model,resultImageBase64:job.result.imageBase64,resultMime:job.result.mime,resultBytes:job.result.bytes,providerCredits:job.creditsUsed ?? undefined,completedAt:new Date(),errorCode:null }).where(condition).returning({id:previewRequests.id});
            completed += saved.length;
            return;
          }
          await db.update(previewRequests).set({providerStatus:job.providerStatus,providerCheckedAt:new Date(),providerCredits:job.creditsUsed ?? undefined}).where(condition);
          if (job.state === "failed") failure = job.code;
          else if ((row.providerSubmittedAt ?? row.createdAt) >= staleCutoff) { deferred++; return; }
        } catch {
          await db.update(previewRequests).set({providerCheckedAt:new Date()}).where(condition);
          // An unavailable status endpoint is not proof of a failed paid job.
          if (now - (row.providerSubmittedAt ?? row.createdAt).getTime() < 24 * 60 * 60 * 1000) { deferred++; return; }
        }
      } else if (row.createdAt >= staleCutoff) { deferred++; return; }
      if (failure === "AI_TIMEOUT") await db.update(previewRequests).set({providerStatus:"TIMED_OUT",providerCheckedAt:new Date()}).where(condition);
      if (reservation) await releasePreviewAccess(row.id,reservation,failure);
      else await db.update(previewRequests).set({status:"failed",errorCode:failure,completedAt:new Date()}).where(condition);
      released++;
    };
    for (let i = 0; i < stale.length; i += 4) {
      const results = await Promise.allSettled(stale.slice(i,i+4).map(reconcile));
      deferred += results.filter(result=>result.status==="rejected").length;
    }

    const rateLimitsDeleted = await db.delete(requestRateLimits).where(lt(requestRateLimits.expiresAt, new Date(now - 24 * 60 * 60 * 1000))).returning({key:requestRateLimits.key});
    const deleted = await db
      .delete(previewRequests)
      .where(lt(previewRequests.createdAt, cutoff))
      .returning({ id: previewRequests.id });

    const riskChecksDeleted = await db
      .delete(networkRiskChecks)
      .where(lt(networkRiskChecks.expiresAt, new Date()))
      .returning({ clientKey: networkRiskChecks.clientKey });

    const dailyCapacityDeleted = await db
      .delete(dailyGenerationEvents)
      .where(
        lt(
          dailyGenerationEvents.createdAt,
          new Date(now - 3 * 24 * 60 * 60 * 1000),
        ),
      )
      .returning({ previewId: dailyGenerationEvents.previewId });

    return NextResponse.json(
      {
        ok: true,
        released,
        completed,
        deferred,
        rateLimitsDeleted: rateLimitsDeleted.length,
        deleted: deleted.length,
        riskChecksDeleted: riskChecksDeleted.length,
        dailyCapacityDeleted: dailyCapacityDeleted.length,
        retentionDays: days,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("Cleanup failed", error);
    return apiError("CLEANUP_FAILED", "Temizleme işlemi başarısız.", 500);
  }
}
