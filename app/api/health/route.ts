import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";
import { noStoreHeaders } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  let databaseReachable = false;

  if (databaseConfigured) {
    try {
      const db = getDb();
      await db.select({ id: previewRequests.id }).from(previewRequests).limit(1);
      databaseReachable = true;
    } catch (error) {
      console.error("Health database check failed", error);
    }
  }

  const ready = databaseReachable && aiConfigured;
  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks: {
        databaseConfigured,
        databaseReachable,
        schemaReady: databaseReachable,
        aiConfigured,
      },
    },
    { status: ready ? 200 : 503, headers: noStoreHeaders() },
  );
}
