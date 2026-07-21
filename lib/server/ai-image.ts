import { PRODUCT_KIND_CONFIG } from "@/lib/categories";
import { ImageGenerationError } from "@/lib/server/image-generation-error";
import type {
  ClothingType,
  GarmentPhotoType,
  PreviewCategory,
  PreviewMode,
  PreviewProviderStatus,
  ProductKind,
} from "@/lib/types";

export { ImageGenerationError } from "@/lib/server/image-generation-error";

const API_BASE = "https://api.fashn.ai/v1";
const JOB_ID_PATTERN = /^[a-zA-Z0-9_-]{3,160}$/;
const DEFAULT_CLOTHING_MODEL = "tryon-v1.6";
const DEFAULT_WEARABLE_MODEL = "tryon-max";
const DEFAULT_STUDIO_MODEL = "product-to-model";

type FashnError = {
  name?: unknown;
  message?: unknown;
};

type FashnResponse = {
  id?: unknown;
  status?: unknown;
  output?: unknown;
  error?: unknown;
  message?: unknown;
};

type GenerationResult = {
  model: string;
  imageBase64: string;
  mime: "image/jpeg" | "image/png";
  bytes: number;
};

function envEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function getConfig() {
  const apiKey = process.env.FASHN_API_KEY?.trim();
  if (!apiKey) {
    throw new ImageGenerationError(
      "AI_NOT_CONFIGURED",
      "Görsel üretim servisi henüz yapılandırılmamış.",
      503,
    );
  }

  return {
    apiKey,
    clothingModel:
      process.env.FASHN_CLOTHING_MODEL?.trim() || DEFAULT_CLOTHING_MODEL,
    wearableModel:
      process.env.FASHN_WEARABLE_MODEL?.trim() || DEFAULT_WEARABLE_MODEL,
    studioModel: process.env.FASHN_STUDIO_MODEL?.trim() || DEFAULT_STUDIO_MODEL,
    clothingMode: envEnum(
      process.env.FASHN_CLOTHING_MODE,
      ["performance", "balanced", "quality"] as const,
      "balanced",
    ),
    maxMode: envEnum(
      process.env.FASHN_MAX_MODE,
      ["fast", "balanced", "quality"] as const,
      "fast",
    ),
    studioMode: envEnum(
      process.env.FASHN_STUDIO_MODE,
      ["fast", "balanced", "quality"] as const,
      "fast",
    ),
    resolution: envEnum(
      process.env.FASHN_RESOLUTION,
      ["1k", "2k", "4k"] as const,
      "1k",
    ),
    outputFormat: envEnum(
      process.env.FASHN_OUTPUT_FORMAT,
      ["jpeg", "png"] as const,
      "jpeg",
    ),
  };
}

export function isImageGenerationConfigured() {
  return Boolean(process.env.FASHN_API_KEY?.trim());
}

export function getImageModelName(
  category: PreviewCategory = "clothing",
  mode: PreviewMode = "personal",
) {
  if (mode === "studio") {
    return (process.env.FASHN_STUDIO_MODEL?.trim() || DEFAULT_STUDIO_MODEL).slice(
      0,
      80,
    );
  }
  if (category === "clothing") {
    return (
      process.env.FASHN_CLOTHING_MODEL?.trim() || DEFAULT_CLOTHING_MODEL
    ).slice(0, 80);
  }
  return (
    process.env.FASHN_WEARABLE_MODEL?.trim() || DEFAULT_WEARABLE_MODEL
  ).slice(0, 80);
}

async function fileToDataUrl(file: File) {
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

function errorText(payload: FashnResponse | null) {
  const value = payload?.error;
  if (typeof value === "string") return value.slice(0, 300);
  if (value && typeof value === "object") {
    const typed = value as FashnError;
    const name = typeof typed.name === "string" ? typed.name : "";
    const message = typeof typed.message === "string" ? typed.message : "";
    return `${name} ${message}`.trim().slice(0, 300);
  }
  return typeof payload?.message === "string"
    ? payload.message.slice(0, 300)
    : "";
}

async function readJson(response: Response) {
  return (await response.json().catch(() => null)) as FashnResponse | null;
}

function mapHttpError(response: Response, payload: FashnResponse | null): never {
  const diagnostic = errorText(payload);
  if (diagnostic) console.error("FASHN request failed", response.status, diagnostic);

  if (response.status === 401 || response.status === 403) {
    throw new ImageGenerationError(
      "AI_AUTHENTICATION_FAILED",
      "Görsel üretim servisi anahtarı geçersiz veya yetkisiz.",
      503,
    );
  }

  if (response.status === 429 && /outofcredits|credit/i.test(diagnostic)) {
    throw new ImageGenerationError(
      "AI_CREDITS_EXHAUSTED",
      "Görsel üretim servisi kredisi tükendi. Kullanım hakkınız düşürülmedi.",
      503,
    );
  }

  if (response.status === 429) {
    throw new ImageGenerationError(
      "AI_BUSY",
      "Görsel servisi şu anda yoğun. Kullanım hakkınız düşürülmedi; lütfen kısa süre sonra yeniden deneyin.",
      503,
    );
  }

  if (response.status === 400 || response.status === 422) {
    throw new ImageGenerationError(
      "AI_INPUT_INVALID",
      "Fotoğraflar servis tarafından işlenemedi. Daha net ve uygun kadrajlı görsellerle yeniden deneyin.",
      422,
    );
  }

  throw new ImageGenerationError(
    "AI_UPSTREAM_ERROR",
    "Görsel servisi isteği tamamlayamadı. Kullanım hakkınız düşürülmedi; lütfen yeniden deneyin.",
    response.status >= 500 ? 503 : 502,
  );
}

async function fashnFetch(path: string, init: RequestInit) {
  const config = getConfig();
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ImageGenerationError(
        "AI_UPSTREAM_TIMEOUT",
        "Görsel servisine bağlanırken süre sınırı aşıldı.",
        504,
      );
    }
    throw new ImageGenerationError(
      "AI_UNAVAILABLE",
      "Görsel servisine şu anda ulaşılamıyor. Lütfen biraz sonra deneyin.",
      503,
    );
  }
}

function normalizeProviderStatus(value: unknown): PreviewProviderStatus {
  const status = typeof value === "string" ? value.toLowerCase() : "unknown";
  if (status === "starting") return "STARTING";
  if (status === "in_queue" || status === "queued") return "IN_QUEUE";
  if (status === "processing" || status === "running") return "PROCESSING";
  if (status === "completed") return "COMPLETED";
  if (status === "failed") return "FAILED";
  if (status === "cancelled") return "CANCELLED";
  return "UNKNOWN";
}

function parseOutput(payload: FashnResponse, model: string): GenerationResult {
  if (!Array.isArray(payload.output) || typeof payload.output[0] !== "string") {
    throw new ImageGenerationError(
      "EMPTY_AI_RESULT",
      "Görsel servisi boş bir sonuç döndürdü. Kullanım hakkınız iade edildi.",
      502,
    );
  }

  const first = payload.output[0];
  const match = /^data:image\/(jpeg|jpg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    first,
  );
  if (!match) {
    throw new ImageGenerationError(
      "INVALID_AI_RESULT",
      "Hazırlanan görsel güvenli biçimde alınamadı. Kullanım hakkınız iade edildi.",
      502,
    );
  }

  const imageBase64 = match[2];
  const bytes = Buffer.byteLength(imageBase64, "base64");
  if (bytes <= 0 || bytes > 12_000_000) {
    throw new ImageGenerationError(
      "INVALID_AI_RESULT",
      "Hazırlanan görsel doğrulanamadı. Kullanım hakkınız iade edildi.",
      502,
    );
  }

  return {
    model: model.slice(0, 80),
    imageBase64,
    mime: match[1] === "png" ? "image/png" : "image/jpeg",
    bytes,
  };
}

function runtimeFailure(payload: FashnResponse) {
  const diagnostic = errorText(payload);
  const name =
    payload.error && typeof payload.error === "object"
      ? String((payload.error as FashnError).name || "")
      : "";

  if (/ContentModerationError/i.test(name + diagnostic)) {
    return new ImageGenerationError(
      "UNSAFE_CONTENT",
      "Fotoğraflar içerik kurallarına uygun bulunmadı. İşlem durduruldu ve kullanım hakkınız iade edildi.",
      422,
    );
  }
  if (/PoseError/i.test(name + diagnostic)) {
    return new ImageGenerationError(
      "VTON_INPUT_INVALID",
      "Kişi pozu veya ürün yeterince net algılanamadı. Önden çekilmiş yetişkin fotoğrafı ve ürünün tamamını gösteren fotoğrafla yeniden deneyin.",
      422,
    );
  }
  if (/ImageLoadError|InputValidationError/i.test(name + diagnostic)) {
    return new ImageGenerationError(
      "AI_INPUT_INVALID",
      "Fotoğraflardan biri işlenemedi. Daha net ve uygun biçimli görsellerle yeniden deneyin.",
      422,
    );
  }
  if (/UnavailableError|ThirdPartyError/i.test(name + diagnostic)) {
    return new ImageGenerationError(
      "AI_UNAVAILABLE",
      "Görsel servisi geçici olarak kullanılamıyor. Kullanım hakkınız iade edildi.",
      503,
    );
  }

  if (diagnostic) console.error("FASHN runtime failed", diagnostic);
  return new ImageGenerationError(
    "AI_GENERATION_FAILED",
    "Görsel hazırlanamadı. Kullanım hakkınız iade edildi; lütfen yeniden deneyin.",
    502,
  );
}

function safePrompt(productKind: ProductKind, note: string | null, studio: boolean) {
  const base = PRODUCT_KIND_CONFIG[productKind].studioPrompt;
  const userNote = note?.trim() ? note.trim().slice(0, 300) : "";
  if (studio) {
    return [
      base,
      "adult fashion model, premium clean e-commerce photography, tasteful and non-explicit",
      "preserve the exact product design, color, material, print and distinctive details",
      "no text, no watermark, no logo overlay, no collage",
      userNote,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return [
    "Preserve the person's identity, face, body proportions, pose and background.",
    "Apply only the exact wearable product and preserve its color, material and distinctive details.",
    "Tasteful adult fashion result, non-explicit, no body reshaping, no beauty filter.",
    userNote,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function submitProductPreview(input: {
  mode: PreviewMode;
  category: PreviewCategory;
  productKind: ProductKind;
  product: File;
  target: File | null;
  note: string | null;
  clothingType: ClothingType;
  garmentPhotoType: GarmentPhotoType;
}) {
  const config = getConfig();
  const productImage = await fileToDataUrl(input.product);
  let modelName: string;
  let inputs: Record<string, unknown>;

  if (input.mode === "studio") {
    modelName = config.studioModel;
    inputs = {
      product_image: productImage,
      prompt: safePrompt(input.productKind, input.note, true),
      aspect_ratio: "4:5",
      resolution: config.resolution,
      generation_mode: config.studioMode,
      num_images: 1,
      output_format: config.outputFormat,
      return_base64: true,
      seed: crypto.getRandomValues(new Uint32Array(1))[0],
    };
  } else {
    if (!input.target) {
      throw new ImageGenerationError(
        "IMAGE_REQUIRED",
        "Dijital profil veya kişi fotoğrafı gerekli.",
        400,
      );
    }
    const targetImage = await fileToDataUrl(input.target);

    if (input.category === "clothing") {
      modelName = config.clothingModel;
      inputs = {
        model_image: targetImage,
        garment_image: productImage,
        category: input.clothingType,
        garment_photo_type: input.garmentPhotoType,
        mode: config.clothingMode,
        moderation_level: "permissive",
        num_samples: 1,
        output_format: config.outputFormat,
        return_base64: true,
        seed: crypto.getRandomValues(new Uint32Array(1))[0],
      };
    } else {
      modelName = config.wearableModel;
      inputs = {
        model_image: targetImage,
        product_image: productImage,
        prompt: safePrompt(input.productKind, input.note, false),
        resolution: config.resolution,
        generation_mode: config.maxMode,
        num_images: 1,
        output_format: config.outputFormat,
        return_base64: true,
        seed: crypto.getRandomValues(new Uint32Array(1))[0],
      };
    }
  }

  const response = await fashnFetch("/run", {
    method: "POST",
    body: JSON.stringify({ model_name: modelName, inputs }),
  });
  const payload = await readJson(response);
  if (!response.ok || !payload) mapHttpError(response, payload);

  if (typeof payload.id !== "string" || !JOB_ID_PATTERN.test(payload.id)) {
    throw new ImageGenerationError(
      "INVALID_AI_RESPONSE",
      "Görsel servisi geçersiz bir cevap döndürdü.",
      502,
    );
  }

  const providerStatus = normalizeProviderStatus(payload.status);
  if (providerStatus === "COMPLETED") {
    return {
      jobId: payload.id,
      providerStatus,
      result: parseOutput(payload, modelName),
    };
  }
  if (providerStatus === "FAILED") throw runtimeFailure(payload);

  return { jobId: payload.id, providerStatus, result: undefined };
}

export async function getProductPreviewJob(
  jobId: string,
  category: PreviewCategory,
  mode: PreviewMode,
) {
  if (!JOB_ID_PATTERN.test(jobId)) {
    throw new ImageGenerationError(
      "INVALID_AI_RESPONSE",
      "Görsel servisi iş kaydı geçersiz.",
      502,
    );
  }

  const response = await fashnFetch(`/status/${jobId}`, { method: "GET" });
  const payload = await readJson(response);
  if (!response.ok || !payload) mapHttpError(response, payload);

  const providerStatus = normalizeProviderStatus(payload.status);
  if (providerStatus === "COMPLETED") {
    try {
      return {
        state: "completed" as const,
        providerStatus,
        result: parseOutput(payload, getImageModelName(category, mode)),
      };
    } catch (error) {
      if (error instanceof ImageGenerationError) {
        return {
          state: "failed" as const,
          providerStatus: "ERROR" as const,
          code: error.code,
          message: error.message,
        };
      }
      throw error;
    }
  }

  if (providerStatus === "FAILED" || providerStatus === "CANCELLED") {
    const failure = runtimeFailure(payload);
    return {
      state: "failed" as const,
      providerStatus,
      code: failure.code,
      message: failure.message,
    };
  }

  return {
    state:
      providerStatus === "PROCESSING" || providerStatus === "RUNNING"
        ? ("running" as const)
        : ("queued" as const),
    providerStatus,
  };
}

export async function cancelProductPreviewJob(
  jobId?: string,
  category?: PreviewCategory,
) {
  void jobId;
  void category;
  // FASHN REST API currently exposes run/status; local record cancellation is enough.
}
