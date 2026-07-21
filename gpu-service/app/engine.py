from __future__ import annotations

import base64
import io
import os
import shutil
import time
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Literal

import numpy as np
from PIL import Image, ImageOps

Category = Literal["tops", "bottoms", "one-pieces", "two-piece"]
PhotoType = Literal["auto", "flat-lay", "model"]

_PIPELINE = None
_PIPELINE_LOCK = Lock()
_INFERENCE_LOCK = Lock()
_WEIGHTS_LOCK = Lock()
_PREPARED_WEIGHTS_DIR: str | None = None


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


def _resolve_hf_snapshot(model_id: str) -> Path | None:
    """RunPod Cached Model ile bağlanan Hugging Face snapshot yolunu bul."""
    if "/" not in model_id:
        return None

    org, name = model_id.split("/", 1)
    cache_root = Path(os.getenv("HF_CACHE_ROOT", "/runpod-volume/huggingface-cache/hub"))
    model_root = cache_root / f"models--{org}--{name}"
    refs_main = model_root / "refs" / "main"
    snapshots_dir = model_root / "snapshots"

    if refs_main.is_file():
        snapshot_hash = refs_main.read_text(encoding="utf-8").strip()
        candidate = snapshots_dir / snapshot_hash
        if candidate.is_dir():
            return candidate

    if snapshots_dir.is_dir():
        candidates = sorted(path for path in snapshots_dir.iterdir() if path.is_dir())
        if candidates:
            return candidates[-1]

    return None


def _select_runtime_root() -> Path:
    preferred = Path(os.getenv("FASHN_RUNTIME_ROOT", "/runpod-volume/sv-vton-runtime"))
    candidates = [preferred, Path("/tmp/sv-vton-runtime")]

    for candidate in candidates:
        try:
            candidate.mkdir(parents=True, exist_ok=True)
            probe = candidate / ".write-test"
            probe.write_text("ok", encoding="utf-8")
            probe.unlink(missing_ok=True)
            return candidate
        except OSError:
            continue

    raise RuntimeError("Model çalışma klasörü oluşturulamadı.")


def _link_or_copy(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() or destination.is_symlink():
        return

    try:
        destination.symlink_to(source)
    except OSError:
        shutil.copy2(source, destination)


def _download_hf_file(repo_id: str, filename: str, local_dir: Path) -> Path:
    from huggingface_hub import hf_hub_download

    last_error: Exception | None = None
    for attempt in range(1, 4):
        try:
            downloaded = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                local_dir=str(local_dir),
            )
            return Path(downloaded)
        except Exception as exc:  # pragma: no cover - ağ koşuluna bağlı
            last_error = exc
            print(f"[weights] {repo_id}/{filename} indirme denemesi {attempt}/3 başarısız: {exc}")
            if attempt < 3:
                time.sleep(attempt * 3)

    raise RuntimeError(f"Model dosyası indirilemedi: {repo_id}/{filename}") from last_error


def prepare_weights_dir() -> str:
    """
    Ana 1.94 GB modeli RunPod Cached Model alanından kullanır.
    Küçük DWPose ONNX dosyalarını ilk worker açılışında indirir ve aynı runtime
    klasöründe saklar. Cached model bulunamazsa geliştirme ortamında ana modeli
    Hugging Face üzerinden indirmeye geri döner.
    """
    global _PREPARED_WEIGHTS_DIR
    if _PREPARED_WEIGHTS_DIR:
        return _PREPARED_WEIGHTS_DIR

    with _WEIGHTS_LOCK:
        if _PREPARED_WEIGHTS_DIR:
            return _PREPARED_WEIGHTS_DIR

        explicit = os.getenv("FASHN_WEIGHTS_DIR", "").strip()
        if explicit:
            explicit_path = Path(explicit)
            required = [
                explicit_path / "model.safetensors",
                explicit_path / "dwpose" / "yolox_l.onnx",
                explicit_path / "dwpose" / "dw-ll_ucoco_384.onnx",
            ]
            if all(path.is_file() for path in required):
                _PREPARED_WEIGHTS_DIR = str(explicit_path)
                return _PREPARED_WEIGHTS_DIR

        runtime_root = _select_runtime_root()
        weights_dir = runtime_root / "weights"
        dwpose_dir = weights_dir / "dwpose"
        weights_dir.mkdir(parents=True, exist_ok=True)
        dwpose_dir.mkdir(parents=True, exist_ok=True)

        model_id = os.getenv("FASHN_MODEL_ID", "fashn-ai/fashn-vton-1.5")
        cached_snapshot = _resolve_hf_snapshot(model_id)
        cached_model = cached_snapshot / "model.safetensors" if cached_snapshot else None
        model_destination = weights_dir / "model.safetensors"

        if not model_destination.is_file():
            if cached_model and cached_model.is_file():
                print(f"[weights] RunPod cached model kullanılıyor: {cached_model}")
                _link_or_copy(cached_model, model_destination)
            else:
                print("[weights] Cached model bulunamadı; ana model Hugging Face üzerinden indiriliyor.")
                _download_hf_file(model_id, "model.safetensors", weights_dir)

        dwpose_repo = os.getenv("FASHN_DWPOSE_MODEL_ID", "fashn-ai/DWPose")
        for filename in ("yolox_l.onnx", "dw-ll_ucoco_384.onnx"):
            destination = dwpose_dir / filename
            if not destination.is_file():
                print(f"[weights] DWPose indiriliyor: {filename}")
                _download_hf_file(dwpose_repo, filename, dwpose_dir)

        required = [
            model_destination,
            dwpose_dir / "yolox_l.onnx",
            dwpose_dir / "dw-ll_ucoco_384.onnx",
        ]
        missing = [str(path) for path in required if not path.is_file()]
        if missing:
            raise RuntimeError(f"Eksik model dosyaları: {', '.join(missing)}")

        _PREPARED_WEIGHTS_DIR = str(weights_dir)
        print(f"[weights] Hazır: {_PREPARED_WEIGHTS_DIR}")
        return _PREPARED_WEIGHTS_DIR


def get_pipeline():
    global _PIPELINE
    if _PIPELINE is not None:
        return _PIPELINE

    with _PIPELINE_LOCK:
        if _PIPELINE is None:
            from fashn_vton import TryOnPipeline

            weights_dir = prepare_weights_dir()
            device = os.getenv("VTON_DEVICE") or None
            kwargs = {"weights_dir": weights_dir}
            if device:
                kwargs["device"] = device
            _PIPELINE = TryOnPipeline(**kwargs)
    return _PIPELINE


def normalize_image(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image).convert("RGB")
    max_side = int(os.getenv("VTON_MAX_INPUT_SIDE", "1800"))
    if max(image.size) > max_side:
        image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image


def decode_base64_image(payload: str) -> Image.Image:
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
    arr = np.asarray(image.resize((192, 192), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
    flat = arr.reshape(-1, 3)
    brightness = flat.mean(axis=1)
    chroma = flat.max(axis=1) - flat.min(axis=1)
    mask = ~((brightness > 0.92) & (chroma < 0.08))
    selected = flat[mask]
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
    pixels = _foreground_pixels(image)
    bins = 8
    histograms = []
    for channel in range(3):
        hist, _ = np.histogram(pixels[:, channel], bins=bins, range=(0.0, 1.0), density=False)
        histograms.append(hist.astype(np.float32))
    histogram = np.concatenate(histograms)
    total = histogram.sum()
    return histogram / total if total else histogram


def _edge_density(image: Image.Image) -> float:
    gray = np.asarray(image.resize((192, 192), Image.Resampling.LANCZOS).convert("L"), dtype=np.float32) / 255.0
    gx = np.abs(np.diff(gray, axis=1)).mean()
    gy = np.abs(np.diff(gray, axis=0)).mean()
    return float((gx + gy) / 2.0)


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

    if accepted and grade == "high":
        message = "Renk ve görsel yapı kontrolü yüksek sadakat gösteriyor."
    elif accepted:
        message = "Sonuç yayınlanabilir; gerçek ürün 360° çekimiyle birlikte gösterilmelidir."
    else:
        message = "Ürün sadakati yeterli bulunmadı. Sonuç kullanıcıya gösterilmedi."

    return FidelityResult(
        accepted=accepted,
        overall=overall,
        color=color_score,
        structure=structure_score,
        grade=grade,
        message=message,
    )


def _pipeline_call(
    person: Image.Image,
    garment: Image.Image,
    category: Literal["tops", "bottoms", "one-pieces"],
    garment_photo_type: PhotoType,
    seed: int,
) -> Image.Image:
    pipeline = get_pipeline()
    resolved_photo_type: Literal["flat-lay", "model"] = (
        "model" if garment_photo_type == "model" else "flat-lay"
    )
    kwargs = {
        "person_image": person,
        "garment_image": garment,
        "category": category,
        "garment_photo_type": resolved_photo_type,
        "num_samples": 1,
        "num_timesteps": int(os.getenv("VTON_NUM_TIMESTEPS", "30")),
        "guidance_scale": float(os.getenv("VTON_GUIDANCE_SCALE", "1.5")),
        "seed": seed,
        "segmentation_free": os.getenv("VTON_SEGMENTATION_FREE", "true").lower() == "true",
    }
    result = pipeline(**kwargs)
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
        else:
            output = _pipeline_call(person, garment, category, garment_photo_type, seed)  # type: ignore[arg-type]

    metrics = compute_fidelity(garment, output, category, second_garment)
    processing_ms = int((time.perf_counter() - started) * 1000)

    image_base64 = None
    image_mime = "image/png"
    if metrics.accepted or os.getenv("VTON_RETURN_REJECTED_IMAGE", "false").lower() == "true":
        image_base64, image_mime = encode_image(output)

    return {
        "image_base64": image_base64,
        "image_mime": image_mime,
        "model": "fashn-vton-1.5-self-hosted",
        "processing_ms": processing_ms,
        "metrics": metrics.as_dict(),
    }
