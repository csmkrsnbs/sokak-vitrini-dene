import { ImageGenerationError } from "@/lib/server/image-generation-error";
import type {
  ClothingType,
  GarmentPhotoType,
  PreviewProviderStatus,
} from "@/lib/types";

type RunPodJobResponse = {
  id?: unknown;
  status?: unknown;
  output?: unknown;
  error?: unknown;
  message?: unknown;
};

type RunPodVtonOutput = {
  image_base64?: unknown;
  mime_type?: unknown;
  model?: unknown;
  error_code?: unknown;
  error?: unknown;
};

const RUNPOD_API_BASE = "https://api.runpod.ai/v2";
const DEFAULT_VTON_MODEL = "fashn-ai/fashn-vton-1.5-flat-lay";
const ENDPOINT_ID_PATTERN = /^[a-zA-Z0-9_-]{3,80}$/;
const JOB_ID_PATTERN = /^[a-zA-Z0-9_-]{3,160}$/;

function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, minimum), maximum)
    : fallback;
}

function getRunPodVtonConfig() {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  const endpointId = process.env.RUNPOD_VTON_ENDPOINT_ID?.trim();

  if (!apiKey || !endpointId) {
    throw new ImageGenerationError(
      "VTON_NOT_CONFIGURED",
      "Giyim önizleme servisi henüz yapılandırılmamış.",
      503,
    );
  }

  if (!ENDPOINT_ID_PATTERN.test(endpointId)) {
    throw new ImageGenerationError(
      "VTON_INVALID_CONFIGURATION",
      "Giyim önizleme servisi yapılandırması geçersiz.",
      503,
    );
  }

  return {
    apiKey,
    endpointId,
    executionTimeoutMs: boundedInteger(
      process.env.RUNPOD_VTON_EXECUTION_TIMEOUT_MS ??
        process.env.RUNPOD_EXECUTION_TIMEOUT_MS ??
        process.env.RUNPOD_TIMEOUT_MS,
      300_000,
      30_000,
      900_000,
    ),
    ttlMs: boundedInteger(
      process.env.RUNPOD_VTON_JOB_TTL_MS ?? process.env.RUNPOD_JOB_TTL_MS,
      1_200_000,
      120_000,
      1_800_000,
    ),
  };
}

export function isRunPodVtonConfigured() {
  const endpointId = process.env.RUNPOD_VTON_ENDPOINT_ID?.trim();
  return Boolean(
    process.env.RUNPOD_API_KEY?.trim() &&
      endpointId &&
      ENDPOINT_ID_PATTERN.test(endpointId),
  );
}

export function getRunPodVtonModelName() {
  const configured = process.env.VTON_IMAGE_MODEL?.trim();
  return (configured || DEFAULT_VTON_MODEL).slice(0, 80);
}

async function fileToBase64(file: File) {
  return Buffer.from(await file.arrayBuffer()).toString("base64");
}

async function readJson(response: Response) {
  return (await response.json().catch(() => null)) as RunPodJobResponse | null;
}

function upstreamMessage(payload: RunPodJobResponse | null) {
  const value = payload?.error ?? payload?.message;
  return typeof value === "string" ? value.slice(0, 300) : null;
}

function mapHttpError(response: Response, payload: RunPodJobResponse | null): never {
  const diagnostic = upstreamMessage(payload);
  if (diagnostic) {
    console.error("RunPod VTON request failed", response.status, diagnostic);
  }

  if (response.status === 401 || response.status === 403) {
    throw new ImageGenerationError(
      "VTON_AUTHENTICATION_FAILED",
      "Giyim önizleme servisi kimlik doğrulaması başarısız.",
      503,
    );
  }

  if (response.status === 429) {
    throw new ImageGenerationError(
      "AI_BUSY",
      "Giyim önizleme servisi şu anda yoğun. Kupon hakkınız düşürülmedi; lütfen kısa süre sonra yeniden deneyin.",
      503,
    );
  }

  throw new ImageGenerationError(
    "AI_UPSTREAM_ERROR",
    "Giyim önizleme servisi isteği tamamlayamadı. Kupon hakkınız düşürülmedi; lütfen yeniden deneyin.",
    response.status >= 500 ? 503 : 502,
  );
}

async function runPodVtonFetch(
  url: string,
  apiKey: string,
  init: RequestInit,
  timeoutMs = 20_000,
) {
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ImageGenerationError(
        "AI_UPSTREAM_TIMEOUT",
        "Giyim önizleme servisine bağlanırken süre sınırı aşıldı.",
        504,
      );
    }

    throw new ImageGenerationError(
      "AI_UNAVAILABLE",
      "Giyim önizleme servisine şu anda ulaşılamıyor. Lütfen biraz sonra deneyin.",
      503,
    );
  }
}

function normalizeProviderStatus(value: unknown): PreviewProviderStatus {
  const status = typeof value === "string" ? value.toUpperCase() : "UNKNOWN";
  if (
    status === "IN_QUEUE" ||
    status === "IN_PROGRESS" ||
    status === "RUNNING" ||
    status === "COMPLETED" ||
    status === "FAILED" ||
    status === "ERROR" ||
    status === "CANCELLED" ||
    status === "TIMED_OUT"
  ) {
    return status;
  }
  return "UNKNOWN";
}

function workerError(output: RunPodVtonOutput) {
  const code = typeof output.error_code === "string" ? output.error_code : "";

  if (code === "UNSAFE_CONTENT") {
    return new ImageGenerationError(
      "UNSAFE_CONTENT",
      "Fotoğraflar içerik kurallarımıza uygun bulunmadı. İşlem durduruldu, sonuç kaydedilmedi ve kullanım hakkınız iade edildi.",
      422,
    );
  }

  if (code === "MODERATION_UNAVAILABLE") {
    return new ImageGenerationError(
      "MODERATION_UNAVAILABLE",
      "Güvenlik kontrolü şu anda tamamlanamadı. İşlem durduruldu, sonuç kaydedilmedi ve kullanım hakkınız iade edildi.",
      503,
    );
  }

  if (code === "VTON_INPUT_INVALID") {
    return new ImageGenerationError(
      "VTON_INPUT_INVALID",
      "Giyim motoru kişi pozunu veya ürünü yeterince net algılayamadı. Önden çekilmiş yetişkin fotoğrafı ve sade fonda ürünün tamamını gösteren fotoğrafla yeniden deneyin. Kullanım hakkınız iade edildi.",
      422,
    );
  }

  if (code === "GPU_MEMORY_EXHAUSTED") {
    return new ImageGenerationError(
      "AI_GPU_MEMORY",
      "Giyim sunucusunun GPU belleği yetersiz kaldı. Kullanım hakkınız iade edildi; yönetici GPU ayarını kontrol etmelidir.",
      503,
    );
  }

  if (code === "MODEL_LOAD_FAILED") {
    return new ImageGenerationError(
      "AI_MODEL_LOAD_FAILED",
      "Giyim modeli worker üzerinde yüklenemedi. Kullanım hakkınız iade edildi; yönetici RunPod loglarını ve volume bağlantısını kontrol etmelidir.",
      503,
    );
  }

  if (code === "VTON_GENERATION_FAILED") {
    return new ImageGenerationError(
      "AI_GENERATION_FAILED",
      "Giyim motoru işlemi tamamlayamadı. Kullanım hakkınız iade edildi; lütfen yeniden deneyin.",
      502,
    );
  }

  if (typeof output.error === "string") {
    console.error("RunPod VTON worker returned an error", output.error.slice(0, 300));
    return new ImageGenerationError(
      "AI_GENERATION_FAILED",
      "Giyim önizlemesi hazırlanamadı. Kullanım hakkınız iade edildi; lütfen yeniden deneyin.",
      502,
    );
  }

  return null;
}

function parseCompletedOutput(payload: RunPodJobResponse) {
  const output = payload.output as RunPodVtonOutput | null;
  if (!output || typeof output !== "object") {
    throw new ImageGenerationError(
      "EMPTY_AI_RESULT",
      "Giyim önizleme servisi boş bir sonuç döndürdü. Lütfen yeniden deneyin.",
    );
  }

  const structuredError = workerError(output);
  if (structuredError) throw structuredError;

  if (typeof output.image_base64 !== "string") {
    throw new ImageGenerationError(
      "EMPTY_AI_RESULT",
      "Giyim önizleme servisi boş bir sonuç döndürdü. Lütfen yeniden deneyin.",
    );
  }

  const imageBase64 = output.image_base64.replace(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
    "",
  );
  if (
    imageBase64.length === 0 ||
    imageBase64.length % 4 !== 0 ||
    !/^[a-zA-Z0-9+/]+={0,2}$/.test(imageBase64)
  ) {
    throw new ImageGenerationError(
      "INVALID_AI_RESULT",
      "Hazırlanan giyim önizlemesi doğrulanamadı. Lütfen yeniden deneyin.",
    );
  }

  const bytes = Buffer.byteLength(imageBase64, "base64");
  if (bytes <= 0 || bytes > 10_000_000) {
    throw new ImageGenerationError(
      "INVALID_AI_RESULT",
      "Hazırlanan giyim önizlemesi doğrulanamadı. Lütfen yeniden deneyin.",
    );
  }

  const mime =
    output.mime_type === "image/png" || output.mime_type === "image/jpeg"
      ? output.mime_type
      : "image/webp";
  const model =
    typeof output.model === "string" && output.model.trim()
      ? output.model.trim().slice(0, 80)
      : getRunPodVtonModelName();

  return { model, imageBase64, mime, bytes };
}

function failureFromPayload(payload: RunPodJobResponse) {
  const output = payload.output as RunPodVtonOutput | null;
  if (!output || typeof output !== "object") return null;
  return workerError(output);
}

export async function submitRunPodVtonTryOn(input: {
  product: File;
  target: File;
  clothingType: ClothingType;
  garmentPhotoType: GarmentPhotoType;
}) {
  const config = getRunPodVtonConfig();
  const [productImageBase64, targetImageBase64] = await Promise.all([
    fileToBase64(input.product),
    fileToBase64(input.target),
  ]);
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];

  const response = await runPodVtonFetch(
    `${RUNPOD_API_BASE}/${config.endpointId}/run`,
    config.apiKey,
    {
      method: "POST",
      body: JSON.stringify({
        input: {
          product_image_base64: productImageBase64,
          target_image_base64: targetImageBase64,
          garment_category: input.clothingType,
          garment_photo_type: input.garmentPhotoType,
          seed,
        },
        policy: {
          executionTimeout: config.executionTimeoutMs,
          ttl: Math.max(config.ttlMs, config.executionTimeoutMs + 60_000),
        },
      }),
    },
  );
  const payload = await readJson(response);
  if (!response.ok || !payload) mapHttpError(response, payload);

  if (typeof payload.id !== "string" || !JOB_ID_PATTERN.test(payload.id)) {
    throw new ImageGenerationError(
      "INVALID_AI_RESPONSE",
      "Giyim önizleme servisi geçersiz bir cevap döndürdü.",
      502,
    );
  }

  const providerStatus = normalizeProviderStatus(payload.status);
  if (providerStatus === "COMPLETED") {
    return {
      jobId: payload.id,
      providerStatus,
      result: parseCompletedOutput(payload),
    };
  }

  if (
    providerStatus === "FAILED" ||
    providerStatus === "ERROR" ||
    providerStatus === "CANCELLED" ||
    providerStatus === "TIMED_OUT"
  ) {
    const structuredFailure = failureFromPayload(payload);
    if (structuredFailure) throw structuredFailure;
    throw new ImageGenerationError(
      providerStatus === "TIMED_OUT" ? "AI_TIMEOUT" : "AI_GENERATION_FAILED",
      providerStatus === "TIMED_OUT"
        ? "Giyim önizlemesi hazırlanırken süre sınırı aşıldı. Kullanım hakkınız iade edildi."
        : "Giyim önizlemesi hazırlanamadı. Kullanım hakkınız iade edildi; lütfen yeniden deneyin.",
      providerStatus === "TIMED_OUT" ? 504 : 502,
    );
  }

  return { jobId: payload.id, providerStatus, result: undefined };
}

export async function getRunPodVtonJob(jobId: string) {
  if (!JOB_ID_PATTERN.test(jobId)) {
    throw new ImageGenerationError(
      "INVALID_AI_RESPONSE",
      "Giyim önizleme iş kaydı geçersiz.",
      502,
    );
  }

  const config = getRunPodVtonConfig();
  const response = await runPodVtonFetch(
    `${RUNPOD_API_BASE}/${config.endpointId}/status/${jobId}`,
    config.apiKey,
    { method: "GET" },
  );
  const payload = await readJson(response);
  if (!response.ok || !payload) mapHttpError(response, payload);

  const providerStatus = normalizeProviderStatus(payload.status);
  if (providerStatus === "COMPLETED") {
    try {
      return {
        state: "completed" as const,
        providerStatus,
        result: parseCompletedOutput(payload),
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

  if (
    providerStatus === "FAILED" ||
    providerStatus === "ERROR" ||
    providerStatus === "CANCELLED"
  ) {
    const structuredFailure = failureFromPayload(payload);
    return {
      state: "failed" as const,
      providerStatus,
      code: structuredFailure?.code || "AI_GENERATION_FAILED",
      message:
        structuredFailure?.message ||
        "Giyim önizlemesi hazırlanamadı. Kullanım hakkınız iade edildi.",
    };
  }

  if (providerStatus === "TIMED_OUT") {
    return {
      state: "failed" as const,
      providerStatus,
      code: "AI_TIMEOUT",
      message: "Giyim GPU sırası zamanında tamamlanamadı. Kullanım hakkınız iade edildi.",
    };
  }

  return {
    state:
      providerStatus === "IN_PROGRESS" || providerStatus === "RUNNING"
        ? ("running" as const)
        : ("queued" as const),
    providerStatus,
  };
}

export async function cancelRunPodVtonJob(jobId: string) {
  if (!JOB_ID_PATTERN.test(jobId)) return;
  const config = getRunPodVtonConfig();
  try {
    await runPodVtonFetch(
      `${RUNPOD_API_BASE}/${config.endpointId}/cancel/${jobId}`,
      config.apiKey,
      { method: "POST" },
      10_000,
    );
  } catch (error) {
    console.error("RunPod VTON job cancellation failed", error);
  }
}
