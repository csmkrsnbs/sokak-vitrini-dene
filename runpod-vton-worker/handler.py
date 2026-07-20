import base64
import binascii
import io
import os
from threading import Lock

import runpod
import torch
from fashn_vton import TryOnPipeline
from model_assets import prepare_weights_dir
from PIL import Image, ImageOps, UnidentifiedImageError
from transformers import (
    AutoImageProcessor,
    AutoModelForImageClassification,
    AutoProcessor,
    CLIPModel,
)


MODEL_REPO_ID = os.getenv("VTON_MODEL_REPO_ID", "fashn-ai/fashn-vton-1.5")
MODEL_REVISION = os.getenv(
    "VTON_MODEL_REVISION", "7720683168567eb5a2a4c67f15116c6e29c83ded"
)
DWPOSE_REPO_ID = os.getenv("VTON_DWPOSE_REPO_ID", "fashn-ai/DWPose")
DWPOSE_REVISION = os.getenv(
    "VTON_DWPOSE_REVISION", "548b5df25b84d9f4aac0611dfa1c2a7a12f15571"
)
WEIGHTS_DIR = os.getenv("VTON_WEIGHTS_DIR", "/tmp/fashn-vton-1.5")
STATIC_ASSETS_DIR = os.getenv("VTON_STATIC_ASSETS_DIR", "/opt/vton-assets")
MODEL_CACHE_ROOT = os.getenv(
    "RUNPOD_MODEL_CACHE_ROOT", "/runpod-volume/huggingface-cache/hub"
)

NSFW_MODEL_ID = os.getenv(
    "SAFETY_NSFW_MODEL_ID", "Falconsai/nsfw_image_detection"
)
NSFW_MODEL_REVISION = os.getenv(
    "SAFETY_NSFW_MODEL_REVISION", "04367978d3474804ab1a00a9bd6548b741764069"
)
CLIP_MODEL_ID = os.getenv("SAFETY_CLIP_MODEL_ID", "openai/clip-vit-base-patch32")
CLIP_MODEL_REVISION = os.getenv(
    "SAFETY_CLIP_MODEL_REVISION", "c7244be81152024ce0e99ac8d2e373a8953d9f9a"
)

MAX_INPUT_BYTES = 2_500_000
MAX_OUTPUT_BYTES = 10_000_000
GARMENT_CATEGORIES = {"tops", "bottoms", "one-pieces"}
GARMENT_PHOTO_TYPES = {"flat-lay", "model"}

SAFE_EVERYDAY_LABEL = (
    "an ordinary harmless fashion, shopping product, adult portrait, home, "
    "furniture, vehicle or everyday street photograph"
)

SEMANTIC_SAFETY_POLICIES = (
    (
        "SAFETY_MINOR_THRESHOLD",
        "a photo whose subject is a child or teenager under 18 years old",
        "a photo of an adult person or an inanimate shopping product, room, furniture, car or street",
        0.84,
    ),
    (
        "SAFETY_POLITICAL_THRESHOLD",
        "a politician, political leader, election campaign, political party, protest, rally or political propaganda",
        SAFE_EVERYDAY_LABEL,
        0.82,
    ),
    (
        "SAFETY_VIOLENCE_THRESHOLD",
        "a real person being physically attacked or seriously injured, an open wound, self-harm or a dead body",
        SAFE_EVERYDAY_LABEL,
        0.98,
    ),
    (
        "SAFETY_WEAPON_THRESHOLD",
        "a real firearm, handgun, rifle, explosive device or military combat weapon held or displayed",
        SAFE_EVERYDAY_LABEL,
        0.84,
    ),
    (
        "SAFETY_HATE_THRESHOLD",
        "a visible hate symbol, terrorist propaganda or extremist organization emblem",
        SAFE_EVERYDAY_LABEL,
        0.82,
    ),
)

Image.MAX_IMAGE_PIXELS = 25_000_000

_pipeline = None
_pipeline_load_lock = Lock()
_pipeline_inference_lock = Lock()
_weights_lock = Lock()
_safety_bundle = None
_safety_load_lock = Lock()
_safety_inference_lock = Lock()


def _env_true(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _bounded_int(value: object, fallback: int, minimum: int, maximum: int) -> int:
    if isinstance(value, bool):
        return fallback
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback
    return min(max(parsed, minimum), maximum)


def _bounded_float(
    name: str, fallback: float, minimum: float, maximum: float
) -> float:
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
        nsfw_inputs = bundle["nsfw_processor"](images=images, return_tensors="pt")
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
            "SAFETY_NSFW_THRESHOLD", 0.72, 0.10, 0.95
        )
        nsfw_score = float(torch.max(nsfw_probabilities[:, nsfw_index]).item())
        if nsfw_score >= nsfw_threshold:
            print(
                f"Safety rejected: NSFW score={nsfw_score:.4f} "
                f"threshold={nsfw_threshold:.4f}"
            )
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
                threshold = _bounded_float(threshold_name, fallback, 0.50, 0.995)
                if risk_probability >= threshold:
                    print(
                        f"Safety rejected: {threshold_name} "
                        f"score={risk_probability:.4f} threshold={threshold:.4f}"
                    )
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
        "MODEL_LOAD_FAILED": "Virtual try-on model could not be loaded",
        "VTON_INPUT_INVALID": "Person or garment image is not suitable for virtual try-on",
        "VTON_GENERATION_FAILED": "Virtual try-on generation failed",
    }
    return {"error_code": code, "error": messages[code]}


def _ensure_weights():
    required = (
        os.path.join(WEIGHTS_DIR, "model.safetensors"),
        os.path.join(WEIGHTS_DIR, "dwpose", "yolox_l.onnx"),
        os.path.join(WEIGHTS_DIR, "dwpose", "dw-ll_ucoco_384.onnx"),
    )
    if all(os.path.isfile(path) for path in required):
        return

    with _weights_lock:
        if not all(os.path.isfile(path) for path in required):
            resolved = prepare_weights_dir(
                weights_dir=WEIGHTS_DIR,
                static_assets_dir=STATIC_ASSETS_DIR,
                model_cache_root=MODEL_CACHE_ROOT,
                model_repo_id=MODEL_REPO_ID,
                model_revision=MODEL_REVISION,
                dwpose_repo_id=DWPOSE_REPO_ID,
                dwpose_revision=DWPOSE_REVISION,
                explicit_cached_model_path=os.getenv("VTON_CACHED_MODEL_PATH"),
                allow_download_fallback=_env_true(
                    "VTON_ALLOW_DOWNLOAD_FALLBACK", False
                ),
            )
            print(f"VTON weights ready: {resolved}")


def _get_pipeline() -> TryOnPipeline:
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    with _pipeline_load_lock:
        if _pipeline is not None:
            return _pipeline
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA GPU is required")

        _ensure_weights()
        _pipeline = TryOnPipeline(weights_dir=WEIGHTS_DIR, device="cuda")
        return _pipeline


def _decode_image(value: object, field_name: str) -> Image.Image:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{field_name} is required")

    encoded = (
        value.split(",", 1)[1]
        if value.startswith("data:image/") and "," in value
        else value
    )
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

    if (
        image.width < 256
        or image.height < 256
        or image.width > 4096
        or image.height > 4096
    ):
        raise ValueError(f"{field_name} dimensions are invalid")
    return image


def _encode_result(image: Image.Image) -> tuple[str, str, int]:
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="WEBP", quality=90, method=6)
    raw = buffer.getvalue()
    if not raw or len(raw) > MAX_OUTPUT_BYTES:
        raise RuntimeError("Generated image size is invalid")
    return base64.b64encode(raw).decode("ascii"), "image/webp", len(raw)


@runpod.serverless.register_fitness_check
def check_gpu_available():
    if not torch.cuda.is_available():
        raise RuntimeError("A CUDA GPU is required for FASHN VTON")


def handler(job):
    job_input = job.get("input")
    if not isinstance(job_input, dict):
        raise ValueError("input must be an object")

    product = _decode_image(
        job_input.get("product_image_base64"), "product_image_base64"
    )
    target = _decode_image(
        job_input.get("target_image_base64"), "target_image_base64"
    )
    category = job_input.get("garment_category")
    photo_type = job_input.get("garment_photo_type")
    if category not in GARMENT_CATEGORIES:
        raise ValueError("garment_category is invalid")
    if photo_type not in GARMENT_PHOTO_TYPES:
        raise ValueError("garment_photo_type is invalid")

    seed = _bounded_int(job_input.get("seed"), 42, 0, 2**32 - 1)
    timesteps = _bounded_int(os.getenv("VTON_TIMESTEPS"), 30, 20, 50)
    guidance_scale = _bounded_float("VTON_GUIDANCE_SCALE", 1.5, 1.0, 2.5)
    segmentation_free = _env_true("VTON_SEGMENTATION_FREE", True)

    runpod.serverless.progress_update(
        job, "Görseller güvenlik kontrolünden geçiriliyor"
    )
    try:
        if not _moderate_images([product, target]):
            return _safety_error("UNSAFE_CONTENT")
    except Exception as error:
        print("Safety moderation unavailable:", type(error).__name__)
        return _safety_error("MODERATION_UNAVAILABLE")

    runpod.serverless.progress_update(job, "Giyim modeli hazırlanıyor")
    try:
        pipeline = _get_pipeline()
    except torch.cuda.OutOfMemoryError:
        print("Model load failed: CUDA out of memory")
        torch.cuda.empty_cache()
        return _generation_error("GPU_MEMORY_EXHAUSTED")
    except Exception as error:
        print("Model load failed:", type(error).__name__, str(error)[:500])
        return _generation_error("MODEL_LOAD_FAILED")

    runpod.serverless.progress_update(job, "Kıyafet kişiye uygulanıyor")
    try:
        with _pipeline_inference_lock:
            result = pipeline(
                person_image=target,
                garment_image=product,
                category=category,
                garment_photo_type=photo_type,
                num_samples=1,
                num_timesteps=timesteps,
                guidance_scale=guidance_scale,
                skip_cfg_last_n_steps=1,
                seed=seed,
                segmentation_free=segmentation_free,
            ).images[0]
    except torch.cuda.OutOfMemoryError:
        print("Generation failed: CUDA out of memory")
        torch.cuda.empty_cache()
        return _generation_error("GPU_MEMORY_EXHAUSTED")
    except (ValueError, IndexError) as error:
        print("Input validation failed:", type(error).__name__, str(error)[:500])
        return _generation_error("VTON_INPUT_INVALID")
    except Exception as error:
        print("Generation failed:", type(error).__name__, str(error)[:500])
        return _generation_error("VTON_GENERATION_FAILED")

    runpod.serverless.progress_update(
        job, "Sonuç güvenlik kontrolünden geçiriliyor"
    )
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
        "model": "fashn-ai/fashn-vton-1.5",
        "seed": seed,
        "garment_category": category,
    }


runpod.serverless.start({"handler": handler})
