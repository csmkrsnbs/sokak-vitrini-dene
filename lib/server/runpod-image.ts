import { CATEGORY_CONFIG } from "@/lib/categories";
import type { PreviewCategory } from "@/lib/types";

type RunPodJobResponse = {
  id?: unknown;
  status?: unknown;
  output?: unknown;
  error?: unknown;
  message?: unknown;
};

type RunPodImageOutput = {
  image_base64?: unknown;
  mime_type?: unknown;
  model?: unknown;
  error?: unknown;
};

const DEFAULT_MODEL = "black-forest-labs/FLUX.2-klein-4B";
const RUNPOD_API_BASE = "https://api.runpod.ai/v2";
const ENDPOINT_ID_PATTERN = /^[a-zA-Z0-9_-]{3,80}$/;
const JOB_ID_PATTERN = /^[a-zA-Z0-9_-]{3,160}$/;

export class ImageGenerationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "ImageGenerationError";
  }
}

function categoryPrompt(category: PreviewCategory) {
  const prompts: Record<PreviewCategory, string> = {
    jewelry:
      "Place the exact jewelry from Reference Image 1 naturally on the appropriate visible body area in Reference Image 2. Preserve the jewelry design, stones, metal color, proportions and distinctive details. Match realistic scale, perspective, skin contact, occlusion, reflections and lighting.",
    clothing:
      "Dress the person in Reference Image 2 with the exact clothing item from Reference Image 1. Preserve the garment color, fabric, pattern, cut, buttons and distinctive details. Fit it naturally to the existing pose and body while keeping believable folds, shadows and occlusion.",
    furniture:
      "Place the exact furniture item from Reference Image 1 into the room in Reference Image 2. Preserve the product design, materials, color and proportions. Respect the room perspective, floor plane, available space, contact shadows and existing lighting.",
    car:
      "Place the exact vehicle from Reference Image 1 into the location in Reference Image 2. Preserve the vehicle body shape, color, wheels and distinctive design details. Match road or ground perspective, realistic scale, tire contact, reflections, shadows and local lighting.",
  };

  return prompts[category];
}

function buildPrompt(category: PreviewCategory, note: string | null) {
  const targetType =
    category === "furniture"
      ? "room/interior"
      : category === "car"
        ? "location/driveway"
        : "person";

  return [
    "Create one photorealistic product preview using exactly two reference images.",
    "Reference Image 1 is only the product reference. Reference Image 2 is the target person or place and must be the composition of the final image.",
    categoryPrompt(category),
    `Preserve the identity, face, body, pose, architecture, camera angle and all unrelated details of the target ${targetType} from Reference Image 2.`,
    "Change only what is necessary to add or wear the referenced product. Do not replace the person, room, street or house. Do not beautify faces or alter body shape.",
    "Return a single natural photograph matching Reference Image 2, not a collage. Add no labels, text, logos, frames, split screen, before/after panel, watermark or interface elements.",
    note ? `Placement preference: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

function getRunPodConfig() {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  const endpointId = process.env.RUNPOD_ENDPOINT_ID?.trim();

  if (!apiKey || !endpointId) {
    throw new ImageGenerationError(
      "AI_NOT_CONFIGURED",
      "Görsel üretim servisi henüz yapılandırılmamış.",
      503,
    );
  }

  if (!ENDPOINT_ID_PATTERN.test(endpointId)) {
    throw new ImageGenerationError(
      "AI_INVALID_CONFIGURATION",
      "Görsel üretim servisi yapılandırması geçersiz.",
      503,
    );
  }

  return {
    apiKey,
    endpointId,
    pollIntervalMs: boundedInteger(process.env.RUNPOD_POLL_INTERVAL_MS, 2_000, 1_000, 10_000),
    timeoutMs: boundedInteger(process.env.RUNPOD_TIMEOUT_MS, 240_000, 30_000, 270_000),
  };
}

export function isImageGenerationConfigured() {
  const endpointId = process.env.RUNPOD_ENDPOINT_ID?.trim();
  return Boolean(
    process.env.RUNPOD_API_KEY?.trim() &&
      endpointId &&
      ENDPOINT_ID_PATTERN.test(endpointId),
  );
}

export function getImageModelName() {
  const configured = process.env.FLUX_IMAGE_MODEL?.trim();
  return (configured || DEFAULT_MODEL).slice(0, 80);
}

function outputDimensions(category: PreviewCategory) {
  const [width, height] = CATEGORY_CONFIG[category].outputSize.split("x").map(Number);
  return { width, height };
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
  if (diagnostic) console.error("RunPod request failed", response.status, diagnostic);

  if (response.status === 401 || response.status === 403) {
    throw new ImageGenerationError(
      "AI_AUTHENTICATION_FAILED",
      "Görsel üretim servisi kimlik doğrulaması başarısız.",
      503,
    );
  }

  if (response.status === 429) {
    throw new ImageGenerationError(
      "AI_BUSY",
      "Görsel servisi şu anda yoğun. Lütfen kısa süre sonra yeniden deneyin.",
      503,
    );
  }

  throw new ImageGenerationError(
    "AI_UPSTREAM_ERROR",
    "Görsel servisi isteği tamamlayamadı. Lütfen yeniden deneyin.",
    502,
  );
}

async function runPodFetch(
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

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.toUpperCase() : "UNKNOWN";
}

function parseCompletedOutput(payload: RunPodJobResponse) {
  const output = payload.output as RunPodImageOutput | null;
  if (!output || typeof output !== "object") {
    throw new ImageGenerationError(
      "EMPTY_AI_RESULT",
      "Görsel servisi boş bir sonuç döndürdü. Lütfen yeniden deneyin.",
    );
  }

  if (typeof output.error === "string") {
    console.error("RunPod worker returned an error", output.error.slice(0, 300));
    throw new ImageGenerationError(
      "AI_WORKER_ERROR",
      "Görsel hazırlanamadı. Daha net fotoğraflarla yeniden deneyin.",
      502,
    );
  }

  if (typeof output.image_base64 !== "string") {
    throw new ImageGenerationError(
      "EMPTY_AI_RESULT",
      "Görsel servisi boş bir sonuç döndürdü. Lütfen yeniden deneyin.",
    );
  }

  const imageBase64 = output.image_base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  if (
    imageBase64.length === 0 ||
    imageBase64.length % 4 !== 0 ||
    !/^[a-zA-Z0-9+/]+={0,2}$/.test(imageBase64)
  ) {
    throw new ImageGenerationError(
      "INVALID_AI_RESULT",
      "Hazırlanan görsel doğrulanamadı. Lütfen yeniden deneyin.",
    );
  }

  const bytes = Buffer.byteLength(imageBase64, "base64");
  if (bytes <= 0 || bytes > 10_000_000) {
    throw new ImageGenerationError(
      "INVALID_AI_RESULT",
      "Hazırlanan görsel doğrulanamadı. Lütfen yeniden deneyin.",
    );
  }

  const mime =
    output.mime_type === "image/png" || output.mime_type === "image/jpeg"
      ? output.mime_type
      : "image/webp";
  const model =
    typeof output.model === "string" && output.model.trim()
      ? output.model.trim().slice(0, 80)
      : getImageModelName();

  return { model, imageBase64, mime, bytes };
}

async function cancelJob(endpointId: string, jobId: string, apiKey: string) {
  try {
    await runPodFetch(
      `${RUNPOD_API_BASE}/${endpointId}/cancel/${jobId}`,
      apiKey,
      { method: "POST" },
      10_000,
    );
  } catch (error) {
    console.error("RunPod job cancellation failed", error);
  }
}

async function waitForJob(input: {
  endpointId: string;
  jobId: string;
  apiKey: string;
  timeoutMs: number;
  pollIntervalMs: number;
}) {
  const deadline = Date.now() + input.timeoutMs;

  while (Date.now() < deadline) {
    await delay(input.pollIntervalMs);
    const response = await runPodFetch(
      `${RUNPOD_API_BASE}/${input.endpointId}/status/${input.jobId}`,
      input.apiKey,
      { method: "GET" },
    );
    const payload = await readJson(response);
    if (!response.ok || !payload) mapHttpError(response, payload);

    const status = normalizeStatus(payload.status);
    if (status === "COMPLETED") return parseCompletedOutput(payload);
    if (status === "FAILED" || status === "ERROR" || status === "CANCELLED") {
      const diagnostic = upstreamMessage(payload);
      if (diagnostic) console.error("RunPod job failed", diagnostic);
      throw new ImageGenerationError(
        "AI_GENERATION_FAILED",
        "Görsel hazırlanamadı. Daha net fotoğraflarla yeniden deneyin.",
        502,
      );
    }
    if (status === "TIMED_OUT") {
      throw new ImageGenerationError(
        "AI_TIMEOUT",
        "Görsel hazırlanırken süre sınırı aşıldı. Lütfen yeniden deneyin.",
        504,
      );
    }
  }

  await cancelJob(input.endpointId, input.jobId, input.apiKey);
  throw new ImageGenerationError(
    "AI_TIMEOUT",
    "Görsel hazırlanırken süre sınırı aşıldı. Lütfen yeniden deneyin.",
    504,
  );
}

export async function generateProductPreview(input: {
  category: PreviewCategory;
  product: File;
  target: File;
  note: string | null;
}) {
  const config = getRunPodConfig();
  const { width, height } = outputDimensions(input.category);
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const [productImageBase64, targetImageBase64] = await Promise.all([
    fileToBase64(input.product),
    fileToBase64(input.target),
  ]);

  const response = await runPodFetch(
    `${RUNPOD_API_BASE}/${config.endpointId}/run`,
    config.apiKey,
    {
      method: "POST",
      body: JSON.stringify({
        input: {
          product_image_base64: productImageBase64,
          target_image_base64: targetImageBase64,
          prompt: buildPrompt(input.category, input.note),
          width,
          height,
          seed,
        },
        policy: {
          executionTimeout: config.timeoutMs,
          ttl: Math.min(config.timeoutMs + 60_000, 330_000),
        },
      }),
    },
  );
  const payload = await readJson(response);
  if (!response.ok || !payload) mapHttpError(response, payload);

  if (normalizeStatus(payload.status) === "COMPLETED") {
    return parseCompletedOutput(payload);
  }

  if (typeof payload.id !== "string" || !JOB_ID_PATTERN.test(payload.id)) {
    throw new ImageGenerationError(
      "INVALID_AI_RESPONSE",
      "Görsel servisi geçersiz bir cevap döndürdü. Lütfen yeniden deneyin.",
      502,
    );
  }

  return waitForJob({
    endpointId: config.endpointId,
    jobId: payload.id,
    apiKey: config.apiKey,
    timeoutMs: config.timeoutMs,
    pollIntervalMs: config.pollIntervalMs,
  });
}
