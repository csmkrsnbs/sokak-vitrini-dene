import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb, MissingDatabaseConfigurationError } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";
import {
  getAccessState,
  releasePreviewAccess,
  type PreviewAccessReservation,
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
  previewListSelection,
  serializePreview,
} from "@/lib/server/preview-select";
import { getPreviewJobMaxAgeMs } from "@/lib/server/preview-job-policy";
import {
  cancelProductPreviewJob,
  getProductPreviewJob,
  ImageGenerationError,
} from "@/lib/server/runpod-image";
import type { PreviewProviderStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const idSchema = z.uuid();

const statusSelection = {
  ...previewListSelection,
  providerJobId: previewRequests.providerJobId,
  providerSubmittedAt: previewRequests.providerSubmittedAt,
  creditSource: previewRequests.creditSource,
  couponId: previewRequests.couponId,
  errorCode: previewRequests.errorCode,
};

function reservationFor(row: {
  creditSource: string | null;
  couponId: string | null;
}): PreviewAccessReservation | null {
  if (row.creditSource === "free") return { source: "free", couponId: null };
  if (row.creditSource === "coupon" && row.couponId) {
    return { source: "coupon", couponId: row.couponId };
  }
  return null;
}

function terminalMessage(errorCode: string | null) {
  if (errorCode === "AI_TIMEOUT") {
    return "GPU sırası zamanında tamamlanamadı. Kullanım hakkınız iade edildi.";
  }
  if (errorCode === "UNSAFE_CONTENT") {
    return "Fotoğraflar içerik kurallarımıza uygun bulunmadı. İşlem durduruldu, sonuç kaydedilmedi ve kullanım hakkınız iade edildi.";
  }
  if (errorCode === "MODERATION_UNAVAILABLE") {
    return "Güvenlik kontrolü şu anda tamamlanamadı. İşlem durduruldu, sonuç kaydedilmedi ve kullanım hakkınız iade edildi.";
  }
  if (errorCode === "AI_GPU_MEMORY") {
    return "Görsel üretim sunucusunun GPU belleği yetersiz kaldı. Kullanım hakkınız iade edildi; yönetici GPU ayarını kontrol etmelidir.";
  }
  if (errorCode === "AI_GENERATION_FAILED") {
    return "Görsel üretim motoru işlemi tamamlayamadı. Kullanım hakkınız iade edildi; lütfen yeniden deneyin.";
  }
  if (errorCode === "AI_MODEL_LOAD_FAILED") {
    return "Görsel üretim modeli worker üzerinde yüklenemedi. Kullanım hakkınız iade edildi; yönetici RunPod loglarını ve volume bağlantısını kontrol etmelidir.";
  }
  if (errorCode === "VTON_INPUT_INVALID") {
    return "Giyim motoru kişi pozunu veya ürünü yeterince net algılayamadı. Önden çekilmiş yetişkin fotoğrafı ve ürünün tamamını gösteren net bir fotoğrafla yeniden deneyin. Kullanım hakkınız iade edildi.";
  }
  return "Görsel hazırlanamadı. Kullanım hakkınız iade edildi.";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return apiError("INVALID_ID", "Geçersiz kayıt.", 400, noStoreHeaders());
  }

  const session = getSession(request);
  const clientKey = getClientKey(request, session.id);

  try {
    const db = getDb();
    const loadRow = async () => {
      const [row] = await db
        .select(statusSelection)
        .from(previewRequests)
        .where(
          and(
            eq(previewRequests.id, id),
            eq(previewRequests.sessionId, session.id),
          ),
        )
        .limit(1);
      return row;
    };

    const respond = async (
      row: NonNullable<Awaited<ReturnType<typeof loadRow>>>,
      terminalError: { code: string; message: string } | null,
    ) => {
      const access = await getAccessState({
        request,
        sessionId: session.id,
        clientKey,
      });
      const response = NextResponse.json(
        { preview: serializePreview(row), access, terminalError },
        { headers: noStoreHeaders() },
      );
      return attachSessionCookie(response, session);
    };

    let row = await loadRow();
    if (!row) {
      return apiError("NOT_FOUND", "İşlem bulunamadı.", 404, noStoreHeaders());
    }

    if (row.status === "completed") return respond(row, null);
    if (row.status === "failed") {
      return respond(row, {
        code: row.errorCode || "AI_GENERATION_FAILED",
        message: terminalMessage(row.errorCode),
      });
    }

    const failProcessing = async (
      providerStatus: PreviewProviderStatus,
      code: string,
      message: string,
    ) => {
      await db
        .update(previewRequests)
        .set({ providerStatus, providerCheckedAt: new Date() })
        .where(
          and(
            eq(previewRequests.id, id),
            eq(previewRequests.sessionId, session.id),
            eq(previewRequests.status, "processing"),
          ),
        );

      const reservation = reservationFor(row);
      if (reservation) {
        await releasePreviewAccess(id, reservation, code);
      } else {
        await db
          .update(previewRequests)
          .set({ status: "failed", errorCode: code, completedAt: new Date() })
          .where(
            and(
              eq(previewRequests.id, id),
              eq(previewRequests.sessionId, session.id),
              eq(previewRequests.status, "processing"),
            ),
          );
      }

      row = (await loadRow()) ?? row;
      if (row.status === "completed") return respond(row, null);
      return respond(row, { code, message });
    };

    if (!row.providerJobId) {
      return failProcessing(
        "ERROR",
        "AI_JOB_MISSING",
        "Görsel işi başlatılamadı. Kullanım hakkınız iade edildi.",
      );
    }

    const submittedAt = row.providerSubmittedAt ?? row.createdAt;
    if (Date.now() - submittedAt.getTime() > getPreviewJobMaxAgeMs()) {
      await cancelProductPreviewJob(row.providerJobId, row.category);
      return failProcessing(
        "TIMED_OUT",
        "AI_TIMEOUT",
        "GPU sırası zamanında tamamlanamadı. Kullanım hakkınız iade edildi.",
      );
    }

    const job = await getProductPreviewJob(row.providerJobId, row.category);
    if (job.state === "completed") {
      const [completed] = await db
        .update(previewRequests)
        .set({
          status: "completed",
          providerStatus: "COMPLETED",
          providerCheckedAt: new Date(),
          model: job.result.model,
          resultImageBase64: job.result.imageBase64,
          resultMime: job.result.mime,
          resultBytes: job.result.bytes,
          completedAt: new Date(),
          errorCode: null,
        })
        .where(
          and(
            eq(previewRequests.id, id),
            eq(previewRequests.sessionId, session.id),
            eq(previewRequests.status, "processing"),
          ),
        )
        .returning(statusSelection);

      row = completed ?? (await loadRow()) ?? row;
      return respond(row, null);
    }

    if (job.state === "failed") {
      return failProcessing(job.providerStatus, job.code, job.message);
    }

    const [processing] = await db
      .update(previewRequests)
      .set({
        providerStatus: job.providerStatus,
        providerCheckedAt: new Date(),
      })
      .where(
        and(
          eq(previewRequests.id, id),
          eq(previewRequests.sessionId, session.id),
          eq(previewRequests.status, "processing"),
        ),
      )
      .returning(statusSelection);

    row = processing ?? (await loadRow()) ?? row;
    return respond(row, null);
  } catch (error) {
    if (error instanceof MissingDatabaseConfigurationError) {
      return apiError(
        "DATABASE_NOT_CONFIGURED",
        "Veritabanı bağlantısı henüz yapılandırılmamış.",
        503,
        noStoreHeaders(),
      );
    }
    if (error instanceof ImageGenerationError) {
      return apiError(error.code, error.message, error.status, noStoreHeaders());
    }
    console.error("Preview status failed", error);
    return apiError(
      "PREVIEW_STATUS_FAILED",
      "Görsel durumu şu anda alınamıyor. İşlem arka planda devam ediyor.",
      503,
      noStoreHeaders(),
    );
  }
}

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
    const [existing] = await db
      .select({
        status: previewRequests.status,
        category: previewRequests.category,
        providerJobId: previewRequests.providerJobId,
        creditSource: previewRequests.creditSource,
        couponId: previewRequests.couponId,
      })
      .from(previewRequests)
      .where(
        and(
          eq(previewRequests.id, id),
          eq(previewRequests.sessionId, session.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return apiError("NOT_FOUND", "Görsel bulunamadı.", 404, noStoreHeaders());
    }

    if (existing.status === "processing") {
      if (existing.providerJobId) {
        await cancelProductPreviewJob(existing.providerJobId, existing.category);
      }
      const reservation = reservationFor(existing);
      if (reservation) {
        await releasePreviewAccess(id, reservation, "USER_CANCELLED");
      }
    }

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
