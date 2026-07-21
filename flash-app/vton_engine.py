from __future__ import annotations

import base64
import io
import os
import time
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Literal

try:
    import numpy as np
    from PIL import Image, ImageOps
except ModuleNotFoundError:
    # RunPod Flash discovers every Python module in the project locally before
    # it installs the endpoint's remote dependencies. The workflow installs
    # these packages too, but this guard keeps discovery deterministic.
    np = None  # type: ignore[assignment]
    Image = None  # type: ignore[assignment]
    ImageOps = None  # type: ignore[assignment]


def _require_image_dependencies() -> None:
    if np is None or Image is None or ImageOps is None:
        raise RuntimeError("NumPy/Pillow bağımlılıkları worker ortamında yüklenemedi.")

Category = Literal["tops", "bottoms", "one-pieces", "two-piece"]
PhotoType = Literal["auto", "flat-lay", "model"]

_PIPELINE = None
_PIPELINE_LOCK = Lock()
_INFERENCE_LOCK = Lock()
_WEIGHTS_LOCK = Lock()


@dataclass
class FidelityResult:
    accepted: bool
    overall: float
    color: float
    structure: float
    grade: str
    message: str

    def as_dict(self) -> dict:
        return {
            "accepted": self.accepted,
            "overall": round(self.overall, 4),
            "color": round(self.color, 4),
            "structure": round(self.structure, 4),
            "grade": self.grade,
            "message": self.message,
        }


def _weights_dir() -> Path:
    path = Path(os.getenv("FASHN_WEIGHTS_DIR", "/runpod-volume/fashn-vton/weights"))
    path.mkdir(parents=True, exist_ok=True)
    (path / "dwpose").mkdir(parents=True, exist_ok=True)
    return path


def _download(repo_id: str, filename: str, local_dir: Path) -> Path:
    from huggingface_hub import hf_hub_download

    last_error: Exception | None = None
    for attempt in range(1, 4):
        try:
            value = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                local_dir=str(local_dir),
                resume_download=True,
            )
            return Path(value)
        except TypeError:
            # Yeni huggingface_hub sürümlerinde resume_download kaldırılmış olabilir.
            value = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                local_dir=str(local_dir),
            )
            return Path(value)
        except Exception as exc:
            last_error = exc
            print(f"[weights] {repo_id}/{filename} attempt {attempt}/3 failed: {exc}", flush=True)
            if attempt < 3:
                time.sleep(attempt * 4)
    raise RuntimeError(f"Model dosyası indirilemedi: {repo_id}/{filename}") from last_error


def prepare_weights() -> str:
    root = _weights_dir()
    required = [
        root / "model.safetensors",
        root / "dwpose" / "yolox_l.onnx",
        root / "dwpose" / "dw-ll_ucoco_384.onnx",
    ]
    if all(path.is_file() for path in required):
        return str(root)

    with _WEIGHTS_LOCK:
        if not (root / "model.safetensors").is_file():
            print("[weights] downloading FASHN VTON model", flush=True)
            _download("fashn-ai/fashn-vton-1.5", "model.safetensors", root)

        dwpose = root / "dwpose"
        for filename in ("yolox_l.onnx", "dw-ll_ucoco_384.onnx"):
            if not (dwpose / filename).is_file():
                print(f"[weights] downloading DWPose {filename}", flush=True)
                _download("fashn-ai/DWPose", filename, dwpose)

        missing = [str(path) for path in required if not path.is_file()]
        if missing:
            raise RuntimeError(f"Eksik model dosyaları: {', '.join(missing)}")

    print(f"[weights] ready at {root}", flush=True)
    return str(root)


def get_pipeline():
    global _PIPELINE
    if _PIPELINE is not None:
        return _PIPELINE

    with _PIPELINE_LOCK:
        if _PIPELINE is None:
            import torch
            from fashn_vton import TryOnPipeline

            if not torch.cuda.is_available():
                raise RuntimeError("CUDA GPU kullanılamıyor.")

            if torch.cuda.get_device_properties(0).major >= 8:
                torch.backends.cuda.matmul.allow_tf32 = True
                torch.backends.cudnn.allow_tf32 = True

            _PIPELINE = TryOnPipeline(
                weights_dir=prepare_weights(),
                device="cuda",
            )
            print("[pipeline] ready", flush=True)
    return _PIPELINE


def normalize_image(image: Image.Image) -> Image.Image:
    _require_image_dependencies()
    image = ImageOps.exif_transpose(image).convert("RGB")
    max_side = int(os.getenv("VTON_MAX_INPUT_SIDE", "1800"))
    if max(image.size) > max_side:
        image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image


def decode_base64_image(payload: str | None) -> Image.Image:
    if not payload:
        raise ValueError("Görsel verisi eksik.")
    try:
        raw = base64.b64decode(payload, validate=True)
        return normalize_image(Image.open(io.BytesIO(raw)))
    except Exception as exc:
        raise ValueError("Geçersiz base64 görseli.") from exc


def encode_image(image: Image.Image) -> tuple[str, str]:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return base64.b64encode(buffer.getvalue()).decode("ascii"), "image/png"


def _foreground_pixels(image: Image.Image) -> np.ndarray:
    _require_image_dependencies()
    arr = np.asarray(image.resize((192, 192), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
    flat = arr.reshape(-1, 3)
    brightness = flat.mean(axis=1)
    chroma = flat.max(axis=1) - flat.min(axis=1)
    selected = flat[~((brightness > 0.92) & (chroma < 0.08))]
    return selected if selected.shape[0] > 300 else flat


def _result_crop(image: Image.Image, category: Category) -> Image.Image:
    width, height = image.size
    if category == "tops":
        box = (int(width * 0.16), int(height * 0.10), int(width * 0.84), int(height * 0.64))
    elif category == "bottoms":
        box = (int(width * 0.14), int(height * 0.36), int(width * 0.86), int(height * 0.98))
    else:
        box = (int(width * 0.10), int(height * 0.08), int(width * 0.90), int(height * 0.98))
    return image.crop(box)


def _color_histogram(image: Image.Image) -> np.ndarray:
    _require_image_dependencies()
    pixels = _foreground_pixels(image)
    histograms = []
    for channel in range(3):
        hist, _ = np.histogram(pixels[:, channel], bins=8, range=(0.0, 1.0), density=False)
        histograms.append(hist.astype(np.float32))
    value = np.concatenate(histograms)
    total = value.sum()
    return value / total if total else value


def _edge_density(image: Image.Image) -> float:
    _require_image_dependencies()
    gray = np.asarray(image.resize((192, 192), Image.Resampling.LANCZOS).convert("L"), dtype=np.float32) / 255.0
    return float((np.abs(np.diff(gray, axis=1)).mean() + np.abs(np.diff(gray, axis=0)).mean()) / 2.0)


def compute_fidelity(
    garment: Image.Image,
    result: Image.Image,
    category: Category,
    second_garment: Image.Image | None = None,
) -> FidelityResult:
    crop = _result_crop(result, category)
    garment_hist = _color_histogram(garment)
    if second_garment is not None:
        garment_hist = (garment_hist + _color_histogram(second_garment)) / 2.0

    result_hist = _color_histogram(crop)
    color_distance = float(np.abs(garment_hist - result_hist).sum() / 2.0)
    color_score = max(0.0, min(1.0, 1.0 - color_distance))

    garment_edge = _edge_density(garment)
    if second_garment is not None:
        garment_edge = (garment_edge + _edge_density(second_garment)) / 2.0
    result_edge = _edge_density(crop)
    denominator = max(garment_edge, result_edge, 1e-6)
    structure_score = max(0.0, min(1.0, 1.0 - abs(garment_edge - result_edge) / denominator))

    overall = color_score * 0.72 + structure_score * 0.28
    threshold = float(os.getenv("VTON_FIDELITY_THRESHOLD", "0.30"))
    accepted = overall >= threshold
    grade = "high" if overall >= 0.72 else "medium" if overall >= threshold else "low"
    message = (
        "Renk ve görsel yapı kontrolü yüksek sadakat gösteriyor."
        if grade == "high"
        else "Sonuç yayınlanabilir; gerçek ürün 360° çekimiyle birlikte gösterilmelidir."
        if accepted
        else "Ürün sadakati yeterli bulunmadı. Sonuç kullanıcıya gösterilmedi."
    )
    return FidelityResult(accepted, overall, color_score, structure_score, grade, message)


def _pipeline_call(
    person: Image.Image,
    garment: Image.Image,
    category: Literal["tops", "bottoms", "one-pieces"],
    garment_photo_type: PhotoType,
    seed: int,
) -> Image.Image:
    pipeline = get_pipeline()
    resolved_photo_type: Literal["flat-lay", "model"] = "model" if garment_photo_type == "model" else "flat-lay"
    result = pipeline(
        person_image=person,
        garment_image=garment,
        category=category,
        garment_photo_type=resolved_photo_type,
        num_samples=1,
        num_timesteps=int(os.getenv("VTON_NUM_TIMESTEPS", "30")),
        guidance_scale=float(os.getenv("VTON_GUIDANCE_SCALE", "1.5")),
        seed=seed,
        segmentation_free=os.getenv("VTON_SEGMENTATION_FREE", "true").lower() == "true",
    )
    return result.images[0].convert("RGB")


def run_try_on(
    person: Image.Image,
    garment: Image.Image,
    category: Category,
    garment_photo_type: PhotoType = "auto",
    second_garment: Image.Image | None = None,
    seed: int = 42,
) -> dict:
    person = normalize_image(person)
    garment = normalize_image(garment)
    second_garment = normalize_image(second_garment) if second_garment else None

    if category == "two-piece" and second_garment is None:
        raise ValueError("İki parçalı takım için ikinci ürün görseli gereklidir.")

    started = time.perf_counter()
    with _INFERENCE_LOCK:
        if category == "two-piece":
            first = _pipeline_call(person, garment, "tops", garment_photo_type, seed)
            output = _pipeline_call(first, second_garment, "bottoms", garment_photo_type, seed + 1)  # type: ignore[arg-type]
        elif category in ("tops", "bottoms", "one-pieces"):
            output = _pipeline_call(person, garment, category, garment_photo_type, seed)
        else:
            raise ValueError("Ürün kategorisi geçersiz.")

    metrics = compute_fidelity(garment, output, category, second_garment)
    image_base64 = None
    if metrics.accepted or os.getenv("VTON_RETURN_REJECTED_IMAGE", "false").lower() == "true":
        image_base64, _ = encode_image(output)

    return {
        "image_base64": image_base64,
        "image_mime": "image/png",
        "model": "fashn-vton-1.5-flash",
        "processing_ms": int((time.perf_counter() - started) * 1000),
        "metrics": metrics.as_dict(),
    }
