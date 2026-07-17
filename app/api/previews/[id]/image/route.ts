import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";
import { apiError, getSession } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.uuid();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return apiError("INVALID_ID", "Geçersiz kayıt.", 400);
  }

  const session = getSession(request);

  try {
    const db = getDb();
    const [row] = await db
      .select({
        image: previewRequests.resultImageBase64,
        mime: previewRequests.resultMime,
      })
      .from(previewRequests)
      .where(
        and(
          eq(previewRequests.id, id),
          eq(previewRequests.sessionId, session.id),
          eq(previewRequests.status, "completed"),
        ),
      )
      .limit(1);

    if (!row?.image) {
      return apiError("NOT_FOUND", "Görsel bulunamadı.", 404);
    }

    const image = Buffer.from(row.image, "base64");
    return new Response(image, {
      status: 200,
      headers: {
        "Content-Type": row.mime || "image/webp",
        "Content-Length": String(image.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `inline; filename="sokak-vitrini-${id}.webp"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Preview image failed", error);
    return apiError("IMAGE_FAILED", "Görsel yüklenemedi.", 500);
  }
}
