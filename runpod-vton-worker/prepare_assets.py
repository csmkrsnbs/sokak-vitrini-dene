import os
from pathlib import Path

import torch
from fashn_human_parser import FashnHumanParser
from huggingface_hub import hf_hub_download
from transformers import (
    AutoImageProcessor,
    AutoModelForImageClassification,
    AutoProcessor,
    CLIPModel,
)


ASSETS_DIR = Path(os.getenv("VTON_STATIC_ASSETS_DIR", "/opt/vton-assets"))
DWPOSE_REPO_ID = os.getenv("VTON_DWPOSE_REPO_ID", "fashn-ai/DWPose")
DWPOSE_REVISION = os.getenv(
    "VTON_DWPOSE_REVISION", "548b5df25b84d9f4aac0611dfa1c2a7a12f15571"
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


def prepare_dwpose() -> None:
    destination = ASSETS_DIR / "dwpose"
    destination.mkdir(parents=True, exist_ok=True)
    for filename in ("yolox_l.onnx", "dw-ll_ucoco_384.onnx"):
        hf_hub_download(
            repo_id=DWPOSE_REPO_ID,
            filename=filename,
            revision=DWPOSE_REVISION,
            local_dir=destination,
        )


def prepare_safety_models() -> None:
    AutoImageProcessor.from_pretrained(
        NSFW_MODEL_ID,
        revision=NSFW_MODEL_REVISION,
        trust_remote_code=False,
    )
    nsfw_model = AutoModelForImageClassification.from_pretrained(
        NSFW_MODEL_ID,
        revision=NSFW_MODEL_REVISION,
        dtype=torch.float32,
        use_safetensors=True,
        trust_remote_code=False,
        low_cpu_mem_usage=True,
    )
    del nsfw_model

    AutoProcessor.from_pretrained(
        CLIP_MODEL_ID,
        revision=CLIP_MODEL_REVISION,
        trust_remote_code=False,
    )
    clip_model = CLIPModel.from_pretrained(
        CLIP_MODEL_ID,
        revision=CLIP_MODEL_REVISION,
        dtype=torch.float32,
        use_safetensors=True,
        trust_remote_code=False,
        low_cpu_mem_usage=True,
    )
    del clip_model


def prepare_human_parser() -> None:
    parser = FashnHumanParser(device="cpu")
    del parser


if __name__ == "__main__":
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    prepare_dwpose()
    prepare_safety_models()
    prepare_human_parser()
    print(f"Bundled VTON helper assets are ready in {ASSETS_DIR}")
