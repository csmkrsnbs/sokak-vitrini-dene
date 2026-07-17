import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { isPreviewCategory } from "@/lib/categories";
import { getDb, MissingDatabaseConfigurationError } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";
import {
  getAccessState,
  PreviewCreditsRequiredError,
  type PreviewAccessReservation,
  releasePreviewAccess,
  reservePreviewAccess,
} from "@/lib/server/access";
import {
  apiError,
  attachSessionCookie,
  getSession,
  isSameOrigin,
  noStoreHeaders,
} from "@/lib/server/api";
import { getClientKey } from "@/lib/server/client-key";
import {
  getCouponId,
  MissingCouponConfigurationError,
} from "@/lib/server/coupons";
import {
  ImageValidationError,
  validateImageFile,
} from "@/lib/server/image-validation";
import {
  generateProductPreview,
  getImageModelName,
  ImageGenerationError,
} from "@/lib/server/runpod-image";
import {
  previewListSelection,
  serializePreview,
} from "@/lib/server/preview-select";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  let reservation: PreviewAccessReservation | null = null;

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
    const model = getImageModelName();
    const db = getDb();

    requestId = crypto.randomUUID();
    reservation = await reservePreviewAccess({
      id: requestId,
      sessionId: session.id,
      clientKey,
      category: categoryValue,
      note,
      model,
      couponId: getCouponId(request),
    });

    const generated = await generateProductPreview({
      category: categoryValue,
      product,
      target,
      note,
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

    const access = await getAccessState({
      request,
      sessionId: session.id,
      clientKey,
    });
    const response = NextResponse.json(
      { preview: serializePreview(completed), access },
      { status: 201, headers: noStoreHeaders() },
    );
    return attachSessionCookie(response, session);
  } catch (error) {
    if (requestId && reservation) {
      try {
        await releasePreviewAccess(
          requestId,
          reservation,
          error instanceof ImageGenerationError
            ? error.code.slice(0, 80)
            : "INTERNAL_ERROR",
        );
      } catch (updateError) {
        console.error("Preview credit release failed", updateError);
      }
    }

    if (error instanceof PreviewCreditsRequiredError) {
      const response = apiError(
        "CREDITS_REQUIRED",
        error.message,
        402,
        noStoreHeaders(),
      );
      return attachSessionCookie(response, session);
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

    if (error instanceof MissingCouponConfigurationError) {
      return apiError(
        "COUPON_NOT_CONFIGURED",
        "Kupon sistemi henüz yapılandırılmamış.",
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
