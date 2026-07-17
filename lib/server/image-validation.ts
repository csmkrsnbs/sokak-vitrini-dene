const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const IMAGE_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (bytes: Uint8Array) =>
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes: Uint8Array) =>
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  "image/webp": (bytes: Uint8Array) =>
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP",
};

export const MAX_IMAGE_BYTES = 1_800_000;

export class ImageValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export async function validateImageFile(
  value: FormDataEntryValue | null,
  label: string,
) {
  if (!(value instanceof File) || value.size === 0) {
    throw new ImageValidationError("IMAGE_REQUIRED", `${label} gerekli.`);
  }

  if (!ALLOWED_IMAGE_TYPES.has(value.type)) {
    throw new ImageValidationError(
      "UNSUPPORTED_IMAGE",
      `${label} JPG, PNG veya WEBP biçiminde olmalı.`,
    );
  }

  if (value.size > MAX_IMAGE_BYTES) {
    throw new ImageValidationError(
      "IMAGE_TOO_LARGE",
      `${label} en fazla 1,8 MB olabilir.`,
    );
  }

  const signature = new Uint8Array(await value.slice(0, 16).arrayBuffer());
  if (!IMAGE_SIGNATURES[value.type]?.(signature)) {
    throw new ImageValidationError(
      "INVALID_IMAGE_CONTENT",
      `${label} içeriği geçerli bir fotoğraf değil.`,
    );
  }

  return value;
}
