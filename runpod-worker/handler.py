import base64
import binascii
import io
import os
from threading import Lock

import runpod
import torch
from diffusers import Flux2KleinPipeline
from PIL import Image, ImageOps, UnidentifiedImageError


MODEL_ID = os.getenv("FLUX_MODEL_ID", "black-forest-labs/FLUX.2-klein-4B")
MODEL_PATH = os.getenv("FLUX_MODEL_PATH", MODEL_ID)
MODEL_REVISION = os.getenv(
    "FLUX_MODEL_REVISION", "0eeac0d3d5a1179e84510324ffcac805059a296f"
)
MAX_INPUT_BYTES = 2_500_000
MAX_OUTPUT_BYTES = 10_000_000
MAX_PROMPT_LENGTH = 4_000
ALLOWED_OUTPUT_SIZES = {(1024, 1536), (1536, 1024)}

Image.MAX_IMAGE_PIXELS = 25_000_000

_pipeline = None
_pipeline_lock = Lock()


def _env_true(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_pipeline() -> Flux2KleinPipeline:
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    with _pipeline_lock:
        if _pipeline is not None:
            return _pipeline

        if not torch.cuda.is_available():
            raise RuntimeError("CUDA GPU is required")

        dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
        load_options = {"torch_dtype": dtype}
        if not os.path.isdir(MODEL_PATH) and MODEL_REVISION:
            load_options["revision"] = MODEL_REVISION

        pipeline = Flux2KleinPipeline.from_pretrained(MODEL_PATH, **load_options)
        if _env_true("FLUX_CPU_OFFLOAD"):
            pipeline.enable_model_cpu_offload()
        else:
            pipeline.to("cuda")

        pipeline.set_progress_bar_config(disable=True)
        _pipeline = pipeline
        return _pipeline


def _decode_image(value: object, field_name: str) -> Image.Image:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{field_name} is required")

    encoded = value.split(",", 1)[1] if value.startswith("data:image/") and "," in value else value
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ValueError(f"{field_name} is not valid base64") from error

    if not raw or len(raw) > MAX_INPUT_BYTES:
        raise ValueError(f"{field_name} size is invalid")

    try:
        with Image.open(io.BytesIO(raw)) as source:
            source.verify()
        with Image.open(io.BytesIO(raw)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise ValueError(f"{field_name} is not a supported image") from error

    if image.width < 256 or image.height < 256 or image.width > 4096 or image.height > 4096:
        raise ValueError(f"{field_name} dimensions are invalid")
    return image


def _bounded_int(value: object, fallback: int, minimum: int, maximum: int) -> int:
    if isinstance(value, bool):
        return fallback
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback
    return min(max(parsed, minimum), maximum)


def _encode_result(image: Image.Image) -> tuple[str, str, int]:
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="WEBP", quality=86, method=6)
    raw = buffer.getvalue()
    if not raw or len(raw) > MAX_OUTPUT_BYTES:
        raise RuntimeError("Generated image size is invalid")
    return base64.b64encode(raw).decode("ascii"), "image/webp", len(raw)


@runpod.serverless.register_fitness_check
def check_gpu_available():
    if not torch.cuda.is_available():
        raise RuntimeError("A CUDA GPU is required for FLUX.2")


def handler(job):
    job_input = job.get("input")
    if not isinstance(job_input, dict):
        raise ValueError("input must be an object")

    product = _decode_image(job_input.get("product_image_base64"), "product_image_base64")
    target = _decode_image(job_input.get("target_image_base64"), "target_image_base64")
    prompt = job_input.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip() or len(prompt) > MAX_PROMPT_LENGTH:
        raise ValueError("prompt is invalid")

    width = _bounded_int(job_input.get("width"), 1024, 512, 1536)
    height = _bounded_int(job_input.get("height"), 1536, 512, 1536)
    if (width, height) not in ALLOWED_OUTPUT_SIZES:
        raise ValueError("output dimensions are not allowed")

    seed = _bounded_int(job_input.get("seed"), 42, 0, 2**32 - 1)
    steps = _bounded_int(os.getenv("FLUX_INFERENCE_STEPS"), 4, 4, 8)
    generator = torch.Generator(device="cuda").manual_seed(seed)

    runpod.serverless.progress_update(job, "Model ve referanslar hazırlanıyor")
    pipeline = _get_pipeline()
    runpod.serverless.progress_update(job, "Önizleme oluşturuluyor")

    result = pipeline(
        image=[product, target],
        prompt=prompt.strip(),
        width=width,
        height=height,
        num_inference_steps=steps,
        guidance_scale=1.0,
        generator=generator,
        num_images_per_prompt=1,
    ).images[0]

    image_base64, mime_type, byte_count = _encode_result(result)
    return {
        "image_base64": image_base64,
        "mime_type": mime_type,
        "bytes": byte_count,
        "model": "FLUX.2-klein-4B",
        "seed": seed,
    }


runpod.serverless.start({"handler": handler})
