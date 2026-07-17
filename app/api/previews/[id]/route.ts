import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb, MissingDatabaseConfigurationError } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";
import {
  apiError,
  getSession,
  isSameOrigin,
  noStoreHeaders,
} from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.uuid();

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) {
    return apiError("INVALID_ORIGIN", "İstek doğrulanamadı.", 403, noStoreHeaders());
  }

  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return apiError("INVALID_ID", "Geçersiz kayıt.", 400, noStoreHeaders());
  }

  const session = getSession(request);

  try {
    const db = getDb();
    const deleted = await db
      .delete(previewRequests)
      .where(
        and(
          eq(previewRequests.id, id),
          eq(previewRequests.sessionId, session.id),
        ),
      )
      .returning({ id: previewRequests.id });

    if (deleted.length === 0) {
      return apiError("NOT_FOUND", "Görsel bulunamadı.", 404, noStoreHeaders());
    }

    return NextResponse.json({ ok: true }, { headers: noStoreHeaders() });
  } catch (error) {
    if (error instanceof MissingDatabaseConfigurationError) {
      return apiError(
        "DATABASE_NOT_CONFIGURED",
        "Veritabanı bağlantısı henüz yapılandırılmamış.",
        503,
        noStoreHeaders(),
      );
    }
    console.error("Preview delete failed", error);
    return apiError("DELETE_FAILED", "Görsel silinemedi.", 500, noStoreHeaders());
  }
}
