import { CATEGORY_CONFIG } from "@/lib/categories";
import type { PreviewCategory } from "@/lib/types";

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string }>;
  output_format?: "png" | "jpeg" | "webp";
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
};

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
      "Place the exact jewelry from Image 1 naturally on the appropriate visible body area in Image 2. Preserve the jewelry's design, stones, metal color, proportions and distinctive details. Match realistic scale, perspective, skin contact, occlusion, reflections and lighting.",
    clothing:
      "Dress the person in Image 2 with the exact clothing item from Image 1. Preserve the garment's color, fabric, pattern, cut, buttons and distinctive details. Fit it naturally to the existing pose and body while keeping believable folds, shadows and occlusion.",
    furniture:
      "Place the exact furniture item from Image 1 into the room in Image 2. Preserve the product's design, materials, color and proportions. Respect the room perspective, floor plane, available space, contact shadows and existing lighting.",
    car:
      "Place the exact vehicle from Image 1 into the location in Image 2. Preserve the vehicle body shape, color, wheels and distinctive design details without adding any brand marks. Match road or ground perspective, realistic scale, tire contact, reflections, shadows and local lighting.",
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
    "You are creating a photorealistic product preview from exactly two reference images.",
    "Image 1 is the product reference. Image 2 is the target person or place.",
    categoryPrompt(category),
    `Preserve the identity, face, body, pose, architecture and all unrelated details of the target ${targetType} from Image 2.`,
    "Change only what is necessary to add or wear the referenced product. Do not replace the person, room, street or house. Do not beautify faces or alter body shape.",
    "The final image must look like a natural photograph, with no labels, text, logos, frames, split screen, before/after panel, watermark or interface elements.",
    note ? `User placement note: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeQuality(value: string | undefined) {
  if (value === "low" || value === "high" || value === "auto") return value;
  return "medium";
}

export async function generateProductPreview(input: {
  category: PreviewCategory;
  product: File;
  target: File;
  note: string | null;
  userId: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new ImageGenerationError(
      "AI_NOT_CONFIGURED",
      "Görsel üretim servisi henüz yapılandırılmamış.",
      503,
    );
  }

  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";
  const formData = new FormData();
  formData.append("model", model);
  formData.append("image[]", input.product, input.product.name || "product.jpg");
  formData.append("image[]", input.target, input.target.name || "target.jpg");
  formData.append("prompt", buildPrompt(input.category, input.note));
  formData.append("input_fidelity", "high");
  formData.append("quality", normalizeQuality(process.env.OPENAI_IMAGE_QUALITY));
  formData.append("size", CATEGORY_CONFIG[input.category].outputSize);
  formData.append("output_format", "webp");
  formData.append("output_compression", "84");
  formData.append("moderation", "auto");
  formData.append("n", "1");
  formData.append("user", input.userId);

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(240_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ImageGenerationError(
        "AI_TIMEOUT",
        "Görsel hazırlanırken süre sınırı aşıldı. Lütfen yeniden deneyin.",
        504,
      );
    }
    throw new ImageGenerationError(
      "AI_UNAVAILABLE",
      "Görsel servisine şu anda ulaşılamıyor. Lütfen biraz sonra deneyin.",
      503,
    );
  }

  const payload = (await response.json().catch(() => null)) as OpenAIImageResponse | null;

  if (!response.ok) {
    const upstreamCode = payload?.error?.code || payload?.error?.type || "UPSTREAM_ERROR";
    const publicMessage =
      response.status === 429
        ? "Görsel servisi şu anda yoğun. Lütfen kısa süre sonra yeniden deneyin."
        : response.status === 400
          ? "Fotoğraflar bu işlem için uygun bulunmadı. Daha net fotoğraflarla yeniden deneyin."
          : "Görsel hazırlanamadı. Lütfen yeniden deneyin.";

    throw new ImageGenerationError(String(upstreamCode).slice(0, 80), publicMessage, 502);
  }

  const imageBase64 = payload?.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new ImageGenerationError(
      "EMPTY_AI_RESULT",
      "Görsel servisi boş bir sonuç döndürdü. Lütfen yeniden deneyin.",
    );
  }

  const bytes = Buffer.byteLength(imageBase64, "base64");
  if (bytes <= 0 || bytes > 10_000_000) {
    throw new ImageGenerationError(
      "INVALID_AI_RESULT",
      "Hazırlanan görsel doğrulanamadı. Lütfen yeniden deneyin.",
    );
  }

  return {
    model,
    imageBase64,
    mime: payload?.output_format === "png" ? "image/png" : "image/webp",
    bytes,
  };
}
