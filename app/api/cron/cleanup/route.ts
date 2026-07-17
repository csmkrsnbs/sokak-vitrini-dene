import { lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";
import { apiError, noStoreHeaders } from "@/lib/server/api";

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
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const db = getDb();
    const deleted = await db
      .delete(previewRequests)
      .where(lt(previewRequests.createdAt, cutoff))
      .returning({ id: previewRequests.id });

    return NextResponse.json(
      { ok: true, deleted: deleted.length, retentionDays: days },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("Cleanup failed", error);
    return apiError("CLEANUP_FAILED", "Temizleme işlemi başarısız.", 500);
  }
}
