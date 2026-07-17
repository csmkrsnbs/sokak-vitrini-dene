import base64
import binascii
import io
import os
from threading import Lock

import runpod
import torch
from diffusers import Flux2KleinPipeline
from PIL import Image, ImageOps, UnidentifiedImageError
from transformers import (
    AutoImageProcessor,
    AutoModelForImageClassification,
    AutoProcessor,
    CLIPModel,
)


MODEL_ID = os.getenv("FLUX_MODEL_ID", "black-forest-labs/FLUX.2-klein-4B")
MODEL_PATH = os.getenv("FLUX_MODEL_PATH", MODEL_ID)
MODEL_REVISION = os.getenv(
    "FLUX_MODEL_REVISION", "0eeac0d3d5a1179e84510324ffcac805059a296f"
)
NSFW_MODEL_ID = os.getenv(
    "SAFETY_NSFW_MODEL_ID", "Falconsai/nsfw_image_detection"
)
NSFW_MODEL_REVISION = os.getenv(
    "SAFETY_NSFW_MODEL_REVISION", "04367978d3474804ab1a00a9bd6548b741764069"
)
CLIP_MODEL_ID = os.getenv(
    "SAFETY_CLIP_MODEL_ID", "openai/clip-vit-base-patch32"
)
CLIP_MODEL_REVISION = os.getenv(
    "SAFETY_CLIP_MODEL_REVISION", "c7244be81152024ce0e99ac8d2e373a8953d9f9a"
)
MAX_INPUT_BYTES = 2_500_000
MAX_OUTPUT_BYTES = 10_000_000
MAX_PROMPT_LENGTH = 4_000
ALLOWED_OUTPUT_SIZES = {(1024, 1536), (1536, 1024)}

SEMANTIC_SAFETY_POLICIES = (
    (
        "SAFETY_MINOR_THRESHOLD",
        "a photo whose subject is a child or teenager under 18 years old",
        "a photo of an adult person or an inanimate shopping product, room, furniture, car or street",
        0.72,
    ),
    (
        "SAFETY_POLITICAL_THRESHOLD",
        "a politician, political leader, election campaign, political party, protest, rally or political propaganda",
        "an ordinary non-political shopping product, adult portrait, room, furniture, car or street",
        0.68,
    ),
    (
        "SAFETY_VIOLENCE_THRESHOLD",
        "graphic violence, blood, severe injury, abuse, self-harm or a dead body",
        "an ordinary peaceful scene without violence, blood or injury",
        0.70,
    ),
    (
        "SAFETY_WEAPON_THRESHOLD",
        "a firearm, gun, explosive, combat weapon or threatening knife",
        "an ordinary safe shopping product or everyday scene without weapons",
        0.72,
    ),
    (
        "SAFETY_HATE_THRESHOLD",
        "a hate symbol, terrorist propaganda, extremist organization logo or hateful content",
        "an ordinary neutral image without hate or extremist symbols",
        0.68,
    ),
)

Image.MAX_IMAGE_PIXELS = 25_000_000

_pipeline = None
_pipeline_lock = Lock()
_safety_bundle = None
_safety_load_lock = Lock()
_safety_inference_lock = Lock()


def _env_true(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _bounded_float(name: str, fallback: float, minimum: float, maximum: float) -> float:
    value = os.getenv(name)
    if value is None:
        return fallback
    try:
        parsed = float(value)
    except ValueError:
        return fallback
    return min(max(parsed, minimum), maximum)


def _move_inputs(inputs, device: torch.device, dtype: torch.dtype):
    return {
        name: value.to(device=device, dtype=dtype)
        if torch.is_floating_point(value)
        else value.to(device=device)
        for name, value in inputs.items()
    }


def _get_safety_bundle():
    global _safety_bundle
    if _safety_bundle is not None:
        return _safety_bundle

    with _safety_load_lock:
        if _safety_bundle is not None:
            return _safety_bundle

        # Keep the lightweight safety models on CPU so the 24 GB worker GPU is
        # reserved for FLUX. Running all three models on CUDA can exhaust VRAM.
        configured_device = os.getenv("SAFETY_DEVICE", "cpu").strip().lower()
        if configured_device.startswith("cuda") and not torch.cuda.is_available():
            raise RuntimeError("CUDA is required for configured safety inference")

        device = torch.device(configured_device)
        dtype = torch.float16 if device.type == "cuda" else torch.float32
        common_model_options = {
            "dtype": dtype,
            "use_safetensors": True,
            "trust_remote_code": False,
            "low_cpu_mem_usage": True,
        }

        nsfw_processor = AutoImageProcessor.from_pretrained(
            NSFW_MODEL_ID,
            revision=NSFW_MODEL_REVISION,
            trust_remote_code=False,
        )
        nsfw_model = AutoModelForImageClassification.from_pretrained(
            NSFW_MODEL_ID,
            revision=NSFW_MODEL_REVISION,
            **common_model_options,
        ).to(device)
        nsfw_model.eval()

        clip_processor = AutoProcessor.from_pretrained(
            CLIP_MODEL_ID,
            revision=CLIP_MODEL_REVISION,
            trust_remote_code=False,
        )
        clip_model = CLIPModel.from_pretrained(
            CLIP_MODEL_ID,
            revision=CLIP_MODEL_REVISION,
            **common_model_options,
        ).to(device)
        clip_model.eval()

        _safety_bundle = {
            "device": device,
            "dtype": dtype,
            "nsfw_processor": nsfw_processor,
            "nsfw_model": nsfw_model,
            "clip_processor": clip_processor,
            "clip_model": clip_model,
        }
        return _safety_bundle


def _moderate_images(images: list[Image.Image]) -> bool:
    bundle = _get_safety_bundle()
    device = bundle["device"]
    dtype = bundle["dtype"]

    with _safety_inference_lock, torch.inference_mode():
        nsfw_inputs = bundle["nsfw_processor"](
            images=images,
            return_tensors="pt",
        )
        nsfw_inputs = _move_inputs(nsfw_inputs, device, dtype)
        nsfw_logits = bundle["nsfw_model"](**nsfw_inputs).logits.float()
        nsfw_probabilities = torch.softmax(nsfw_logits, dim=-1)
        labels = {
            str(label).strip().lower(): int(index)
            for index, label in bundle["nsfw_model"].config.id2label.items()
        }
        nsfw_index = labels.get("nsfw")
        if nsfw_index is None:
            raise RuntimeError("NSFW model label mapping is invalid")

        nsfw_threshold = _bounded_float(
            "SAFETY_NSFW_THRESHOLD", 0.40, 0.10, 0.95
        )
        if bool(torch.any(nsfw_probabilities[:, nsfw_index] >= nsfw_threshold)):
            return False

        candidate_labels = []
        for _, risk_label, safe_label, _ in SEMANTIC_SAFETY_POLICIES:
            candidate_labels.extend((risk_label, safe_label))

        clip_inputs = bundle["clip_processor"](
            text=candidate_labels,
            images=images,
            return_tensors="pt",
            padding=True,
        )
        clip_inputs = _move_inputs(clip_inputs, device, dtype)
        clip_logits = bundle["clip_model"](**clip_inputs).logits_per_image.float()

        for image_logits in clip_logits:
            for policy_index, (threshold_name, _, _, fallback) in enumerate(
                SEMANTIC_SAFETY_POLICIES
            ):
                pair_start = policy_index * 2
                risk_probability = torch.softmax(
                    image_logits[pair_start : pair_start + 2], dim=0
                )[0].item()
                threshold = _bounded_float(threshold_name, fallback, 0.50, 0.95)
                if risk_probability >= threshold:
                    return False

    return True


def _safety_error(code: str):
    messages = {
        "UNSAFE_CONTENT": "Content rejected by safety policy",
        "MODERATION_UNAVAILABLE": "Safety moderation is unavailable",
    }
    return {"error_code": code, "error": messages[code]}


def _generation_error(code: str):
    messages = {
        "GPU_MEMORY_EXHAUSTED": "GPU memory exhausted during generation",
        "GENERATION_FAILED": "Image generation failed",
    }
    return {"error_code": code, "error": messages[code]}


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

    runpod.serverless.progress_update(job, "Görseller güvenlik kontrolünden geçiriliyor")
    try:
        if not _moderate_images([product, target]):
            return _safety_error("UNSAFE_CONTENT")
    except Exception as error:
        print("Safety moderation unavailable:", type(error).__name__)
        return _safety_error("MODERATION_UNAVAILABLE")

    runpod.serverless.progress_update(job, "Model ve referanslar hazırlanıyor")
    pipeline = _get_pipeline()
    runpod.serverless.progress_update(job, "Önizleme oluşturuluyor")

    try:
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
    except torch.cuda.OutOfMemoryError:
        print("Generation failed: CUDA out of memory")
        torch.cuda.empty_cache()
        return _generation_error("GPU_MEMORY_EXHAUSTED")
    except Exception as error:
        print("Generation failed:", type(error).__name__, str(error)[:500])
        return _generation_error("GENERATION_FAILED")

    runpod.serverless.progress_update(job, "Sonuç güvenlik kontrolünden geçiriliyor")
    try:
        if not _moderate_images([result]):
            return _safety_error("UNSAFE_CONTENT")
    except Exception as error:
        print("Safety moderation unavailable:", type(error).__name__)
        return _safety_error("MODERATION_UNAVAILABLE")

    image_base64, mime_type, byte_count = _encode_result(result)
    return {
        "image_base64": image_base64,
        "mime_type": mime_type,
        "bytes": byte_count,
        "model": "FLUX.2-klein-4B",
        "seed": seed,
    }


runpod.serverless.start({"handler": handler})
