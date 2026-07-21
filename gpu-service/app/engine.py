from __future__ import annotations

import base64
import io
import os
import time
from dataclasses import dataclass
from threading import Lock
from typing import Literal

import numpy as np
from PIL import Image, ImageOps

Category = Literal["tops", "bottoms", "one-pieces", "two-piece"]
PhotoType = Literal["auto", "flat-lay", "model"]

_PIPELINE = None
_PIPELINE_LOCK = Lock()
_INFERENCE_LOCK = Lock()


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


def get_pipeline():
    global _PIPELINE
    if _PIPELINE is not None:
        return _PIPELINE

    with _PIPELINE_LOCK:
        if _PIPELINE is None:
            from fashn_vton import TryOnPipeline

            weights_dir = os.getenv("FASHN_WEIGHTS_DIR", "/opt/fashn-vton/weights")
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
    kwargs = {
        "person_image": person,
        "garment_image": garment,
        "category": category,
        "garment_photo_type": garment_photo_type,
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
