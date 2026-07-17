import { and, count, desc, eq, gte, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { isPreviewCategory } from "@/lib/categories";
import { getDb, MissingDatabaseConfigurationError } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";
import {
  apiError,
  attachSessionCookie,
  getSession,
  isSameOrigin,
  noStoreHeaders,
} from "@/lib/server/api";
import { getClientKey } from "@/lib/server/client-key";
import {
  ImageValidationError,
  validateImageFile,
} from "@/lib/server/image-validation";
import {
  generateProductPreview,
  ImageGenerationError,
} from "@/lib/server/openai-image";
import {
  previewListSelection,
  serializePreview,
} from "@/lib/server/preview-select";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function dailyLimit() {
  const parsed = Number.parseInt(process.env.AI_PREVIEW_DAILY_LIMIT || "10", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 10;
}

function normalizeNote(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 300);
}

export async function GET(request: NextRequest) {
  const session = getSession(request);

  try {
    const db = getDb();
    const rows = await db
      .select(previewListSelection)
      .from(previewRequests)
      .where(
        and(
          eq(previewRequests.sessionId, session.id),
          eq(previewRequests.status, "completed"),
        ),
      )
      .orderBy(desc(previewRequests.createdAt))
      .limit(12);

    const response = NextResponse.json(
      { previews: rows.map(serializePreview) },
      { headers: noStoreHeaders() },
    );
    return attachSessionCookie(response, session);
  } catch (error) {
    if (error instanceof MissingDatabaseConfigurationError) {
      return apiError(
        "DATABASE_NOT_CONFIGURED",
        "Veritabanı bağlantısı henüz yapılandırılmamış.",
        503,
        noStoreHeaders(),
      );
    }

    console.error("Preview list failed", error);
    return apiError(
      "PREVIEW_LIST_FAILED",
      "Geçmiş şu anda yüklenemiyor.",
      500,
      noStoreHeaders(),
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return apiError("INVALID_ORIGIN", "İstek doğrulanamadı.", 403, noStoreHeaders());
  }

  const session = getSession(request);
  const clientKey = getClientKey(request, session.id);
  let requestId: string | null = null;

  try {
    const formData = await request.formData();
    const categoryValue = formData.get("category");
    if (!isPreviewCategory(categoryValue)) {
      return apiError("INVALID_CATEGORY", "Geçerli bir ürün türü seçin.", 400);
    }

    if (formData.get("consent") !== "true") {
      return apiError(
        "CONSENT_REQUIRED",
        "Fotoğrafları kullanma iznini onaylamalısınız.",
        400,
      );
    }

    const product = validateImageFile(formData.get("product"), "Ürün fotoğrafı");
    const target = validateImageFile(formData.get("target"), "Hedef fotoğraf");
    const note = normalizeNote(formData.get("note"));
    const model = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";
    const db = getDb();

    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [usage] = await db
      .select({ total: count() })
      .from(previewRequests)
      .where(
        and(
          gte(previewRequests.createdAt, windowStart),
          or(
            eq(previewRequests.sessionId, session.id),
            eq(previewRequests.clientKey, clientKey),
          ),
        ),
      );

    const limit = dailyLimit();
    if ((usage?.total ?? 0) >= limit) {
      const response = apiError(
        "DAILY_LIMIT_REACHED",
        `Son 24 saatlik ${limit} deneme sınırına ulaştınız.`,
        429,
        { ...noStoreHeaders(), "Retry-After": "3600" },
      );
      return attachSessionCookie(response, session);
    }

    requestId = crypto.randomUUID();
    await db.insert(previewRequests).values({
      id: requestId,
      sessionId: session.id,
      clientKey,
      category: categoryValue,
      note,
      status: "processing",
      model,
    });

    const generated = await generateProductPreview({
      category: categoryValue,
      product,
      target,
      note,
      userId: session.id,
    });

    const [completed] = await db
      .update(previewRequests)
      .set({
        status: "completed",
        model: generated.model,
        resultImageBase64: generated.imageBase64,
        resultMime: generated.mime,
        resultBytes: generated.bytes,
        completedAt: new Date(),
        errorCode: null,
      })
      .where(
        and(
          eq(previewRequests.id, requestId),
          eq(previewRequests.sessionId, session.id),
        ),
      )
      .returning(previewListSelection);

    if (!completed) {
      throw new Error("Completed preview row was not found");
    }

    const response = NextResponse.json(
      { preview: serializePreview(completed) },
      { status: 201, headers: noStoreHeaders() },
    );
    return attachSessionCookie(response, session);
  } catch (error) {
    if (requestId) {
      try {
        const db = getDb();
        await db
          .update(previewRequests)
          .set({
            status: "failed",
            errorCode:
              error instanceof ImageGenerationError
                ? error.code.slice(0, 80)
                : "INTERNAL_ERROR",
            completedAt: new Date(),
          })
          .where(eq(previewRequests.id, requestId));
      } catch (updateError) {
        console.error("Failed preview status update failed", updateError);
      }
    }

    if (error instanceof ImageValidationError) {
      return apiError(error.code, error.message, 400, noStoreHeaders());
    }

    if (error instanceof MissingDatabaseConfigurationError) {
      return apiError(
        "DATABASE_NOT_CONFIGURED",
        "Veritabanı bağlantısı henüz yapılandırılmamış.",
        503,
        noStoreHeaders(),
      );
    }

    if (error instanceof ImageGenerationError) {
      const response = apiError(error.code, error.message, error.status, noStoreHeaders());
      return attachSessionCookie(response, session);
    }

    console.error("Preview generation failed", error);
    const response = apiError(
      "PREVIEW_FAILED",
      "Görsel hazırlanırken beklenmeyen bir hata oluştu.",
      500,
      noStoreHeaders(),
    );
    return attachSessionCookie(response, session);
  }
}
