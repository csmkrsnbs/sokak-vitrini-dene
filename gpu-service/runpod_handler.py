from __future__ import annotations

import os
from pathlib import Path

import runpod

from app.engine import decode_base64_image, get_pipeline, run_try_on

WORKER_VERSION = os.getenv("SV_VTON_WORKER_VERSION", "v6-light")


def _cached_model_present() -> bool:
    root = Path("/runpod-volume/huggingface-cache/hub/models--fashn-ai--fashn-vton-1.5")
    return root.exists()


def _health() -> dict:
    import torch

    return {
        "ok": True,
        "worker_version": WORKER_VERSION,
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "cached_model_present": _cached_model_present(),
    }


def handler(job: dict) -> dict:
    payload = job.get("input") or {}
    action = str(payload.get("action") or "try-on").strip().lower()

    try:
        if action == "health":
            return _health()

        if action == "warmup":
            get_pipeline()
            return {**_health(), "pipeline_ready": True}

        person = decode_base64_image(payload["person_image_base64"])
        garment = decode_base64_image(payload["garment_image_base64"])
        second_payload = payload.get("second_garment_image_base64")
        second = decode_base64_image(second_payload) if second_payload else None
        return run_try_on(
            person=person,
            garment=garment,
            category=payload.get("category", "one-pieces"),
            garment_photo_type=payload.get("garment_photo_type", "auto"),
            second_garment=second,
        )
    except Exception as exc:
        print(f"[job-error] {type(exc).__name__}: {exc}", flush=True)
        return {
            "error": str(exc),
            "error_type": type(exc).__name__,
            "worker_version": WORKER_VERSION,
        }


print(f"[boot] SV VTON RunPod worker {WORKER_VERSION} starting", flush=True)
runpod.serverless.start({"handler": handler})
