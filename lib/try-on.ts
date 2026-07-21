import { z } from "zod";

export const categorySchema = z.enum(["tops", "bottoms", "one-pieces", "two-piece"]);
export const garmentPhotoTypeSchema = z.enum(["auto", "flat-lay", "model"]);

export function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export async function fileToBase64(file: File) {
  return Buffer.from(await file.arrayBuffer()).toString("base64");
}

export function parseWorkerOutput(payload: unknown) {
  const candidate = payload as {
    output?: unknown;
    image_base64?: unknown;
    image_mime?: unknown;
    model?: unknown;
    processing_ms?: unknown;
    metrics?: unknown;
    error?: unknown;
  };

  const value = candidate.output && typeof candidate.output === "object"
    ? (candidate.output as typeof candidate)
    : candidate;

  if (value.error) {
    throw new Error(typeof value.error === "string" ? value.error : "GPU servisi işlemi tamamlayamadı.");
  }

  const imageBase64 = typeof value.image_base64 === "string" ? value.image_base64 : null;
  const imageMime = typeof value.image_mime === "string" ? value.image_mime : "image/png";
  const metrics = value.metrics as {
    accepted?: unknown;
    overall?: unknown;
    color?: unknown;
    structure?: unknown;
    grade?: unknown;
    message?: unknown;
  } | undefined;

  return {
    imageDataUrl: imageBase64 ? `data:${imageMime};base64,${imageBase64}` : null,
    model: typeof value.model === "string" ? value.model : "fashn-vton-1.5-self-hosted",
    processingMs: typeof value.processing_ms === "number" ? value.processing_ms : 0,
    metrics: {
      accepted: Boolean(metrics?.accepted),
      overall: typeof metrics?.overall === "number" ? metrics.overall : 0,
      color: typeof metrics?.color === "number" ? metrics.color : 0,
      structure: typeof metrics?.structure === "number" ? metrics.structure : 0,
      grade: metrics?.grade === "high" || metrics?.grade === "medium" ? metrics.grade : "low",
      message:
        typeof metrics?.message === "string"
          ? metrics.message
          : "Ürün sadakati doğrulanamadı.",
    },
  };
}
