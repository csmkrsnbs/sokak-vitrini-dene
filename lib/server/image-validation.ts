const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

export function validateImageFile(value: FormDataEntryValue | null, label: string) {
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

  return value;
}
