import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";
import { noStoreHeaders } from "@/lib/server/api";
import {
  getImageModelName,
  isImageGenerationConfigured,
} from "@/lib/server/runpod-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const aiConfigured = isImageGenerationConfigured();
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
        aiProvider: "runpod",
        aiModel: getImageModelName(),
      },
    },
    { status: ready ? 200 : 503, headers: noStoreHeaders() },
  );
}
