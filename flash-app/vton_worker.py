from runpod_flash import DataCenter, Endpoint, GpuGroup, NetworkVolume

MODEL_VOLUME = NetworkVolume(
    name="sv-vton-model-cache",
    size=20,
    datacenter=DataCenter.EU_RO_1,
)


@Endpoint(
    name="sv-vton-flash",
    gpu=GpuGroup.ANY,
    workers=(0, 1),
    idle_timeout=600,
    execution_timeout_ms=1200000,
    flashboot=True,
    datacenter=DataCenter.EU_RO_1,
    volume=MODEL_VOLUME,
    min_cuda_version="12.1",
    accelerate_downloads=True,
    system_dependencies=["git", "libgl1", "libglib2.0-0"],
    dependencies=[
        "numpy>=1.26,<2",
        "pillow>=10.4,<12",
        "huggingface_hub>=0.34,<2",
    ],
    env={
        "HF_HOME": "/runpod-volume/huggingface-cache",
        "FASHN_WEIGHTS_DIR": "/runpod-volume/fashn-vton/weights",
        "VTON_NUM_TIMESTEPS": "30",
        "VTON_GUIDANCE_SCALE": "1.5",
        "VTON_SEGMENTATION_FREE": "true",
        "VTON_FIDELITY_THRESHOLD": "0.30",
        "SV_VTON_WORKER_VERSION": "v10-matplotlib",
    },
)
def vton_worker(
    action: str = "try-on",
    person_image_base64: str | None = None,
    person_image_mime: str | None = None,
    garment_image_base64: str | None = None,
    garment_image_mime: str | None = None,
    second_garment_image_base64: str | None = None,
    second_garment_image_mime: str | None = None,
    category: str = "one-pieces",
    garment_photo_type: str = "auto",
) -> dict:
    del person_image_mime, garment_image_mime, second_garment_image_mime

    import os
    import torch

    version = os.getenv("SV_VTON_WORKER_VERSION", "v10-matplotlib")
    normalized_action = (action or "try-on").strip().lower()

    if normalized_action == "health":
        from vton_engine import runtime_dependency_status

        return {
            "ok": True,
            "worker_version": version,
            "cuda_available": torch.cuda.is_available(),
            "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
            "volume_mounted": os.path.isdir("/runpod-volume"),
            "runtime_dependencies": runtime_dependency_status(),
        }

    from vton_engine import decode_base64_image, get_pipeline, run_try_on

    if normalized_action == "warmup":
        get_pipeline()
        return {
            "ok": True,
            "worker_version": version,
            "cuda_available": torch.cuda.is_available(),
            "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
            "pipeline_ready": True,
        }

    try:
        person = decode_base64_image(person_image_base64)
        garment = decode_base64_image(garment_image_base64)
        second = decode_base64_image(second_garment_image_base64) if second_garment_image_base64 else None
        return run_try_on(
            person=person,
            garment=garment,
            category=category,  # type: ignore[arg-type]
            garment_photo_type=garment_photo_type,  # type: ignore[arg-type]
            second_garment=second,
        )
    except Exception as exc:
        print(f"[job-error] {type(exc).__name__}: {exc}", flush=True)
        return {
            "error": str(exc),
            "error_type": type(exc).__name__,
            "worker_version": version,
        }
