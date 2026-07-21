import { NextResponse } from "next/server";

import {
  categorySchema,
  envNumber,
  fileToBase64,
  garmentPhotoTypeSchema,
  parseWorkerOutput,
} from "@/lib/try-on";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function validImage(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.type.startsWith("image/");
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const person = form.get("person");
    const garment = form.get("garment");
    const secondGarment = form.get("secondGarment");
    const categoryResult = categorySchema.safeParse(form.get("category"));
    const photoTypeResult = garmentPhotoTypeSchema.safeParse(form.get("garmentPhotoType") || "auto");

    if (!validImage(person) || !validImage(garment)) {
      return errorResponse("MISSING_IMAGES", "Kişi ve ürün fotoğrafı zorunludur.", 400);
    }
    if (!categoryResult.success || !photoTypeResult.success) {
      return errorResponse("INVALID_OPTIONS", "Ürün tipi geçersiz.", 400);
    }
    if (categoryResult.data === "two-piece" && !validImage(secondGarment)) {
      return errorResponse("SECOND_GARMENT_REQUIRED", "Takım ürünleri için üst ve alt ürün fotoğrafı gereklidir.", 400);
    }

    const maxBytes = envNumber("VTON_MAX_UPLOAD_MB", 12) * 1024 * 1024;
    for (const file of [person, garment, validImage(secondGarment) ? secondGarment : null]) {
      if (file && file.size > maxBytes) {
        return errorResponse("FILE_TOO_LARGE", "Her fotoğraf en fazla 12 MB olabilir.", 413);
      }
    }

    const provider = process.env.VTON_PROVIDER?.trim().toLowerCase() || "direct";
    const timeoutMs = envNumber("VTON_REQUEST_TIMEOUT_MS", 180000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (provider === "runpod") {
        const endpointId = process.env.RUNPOD_ENDPOINT_ID?.trim();
        const apiKey = process.env.RUNPOD_API_KEY?.trim();
        if (!endpointId || !apiKey) {
          return errorResponse("GPU_NOT_CONFIGURED", "RunPod GPU servisi yapılandırılmamış.", 503);
        }

        const input = {
          person_image_base64: await fileToBase64(person),
          person_image_mime: person.type,
          garment_image_base64: await fileToBase64(garment),
          garment_image_mime: garment.type,
          second_garment_image_base64: validImage(secondGarment)
            ? await fileToBase64(secondGarment)
            : null,
          second_garment_image_mime: validImage(secondGarment) ? secondGarment.type : null,
          category: categoryResult.data,
          garment_photo_type: photoTypeResult.data,
        };

        const response = await fetch(`https://api.runpod.ai/v2/${endpointId}/runsync`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input }),
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          return errorResponse("GPU_REQUEST_FAILED", "GPU servisi isteği başarısız oldu.", response.status);
        }
        return NextResponse.json(parseWorkerOutput(payload));
      }

      const baseUrl = process.env.VTON_ENDPOINT_URL?.trim()?.replace(/\/$/, "");
      if (!baseUrl) {
        return errorResponse("GPU_NOT_CONFIGURED", "Self-hosted GPU servisi yapılandırılmamış.", 503);
      }

      const outbound = new FormData();
      outbound.set("person_image", person);
      outbound.set("garment_image", garment);
      if (validImage(secondGarment)) outbound.set("second_garment_image", secondGarment);
      outbound.set("category", categoryResult.data);
      outbound.set("garment_photo_type", photoTypeResult.data);

      const response = await fetch(`${baseUrl}/v1/try-on`, {
        method: "POST",
        headers: process.env.VTON_SHARED_SECRET
          ? { "X-SV-Secret": process.env.VTON_SHARED_SECRET }
          : undefined,
        body: outbound,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload && typeof payload.detail === "string"
            ? payload.detail
            : "GPU servisi işlemi tamamlayamadı.";
        return errorResponse("GPU_REQUEST_FAILED", message, response.status);
      }
      return NextResponse.json(parseWorkerOutput(payload));
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return errorResponse("GPU_TIMEOUT", "GPU işlemi zaman aşımına uğradı.", 504);
    }
    console.error("try-on route error", error);
    return errorResponse("INTERNAL_ERROR", "Önizleme oluşturulamadı.", 500);
  }
}
