FROM runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/opt/huggingface \
    VTON_WEIGHTS_DIR=/tmp/fashn-vton-1.5 \
    VTON_STATIC_ASSETS_DIR=/opt/vton-assets \
    RUNPOD_MODEL_CACHE_ROOT=/runpod-volume/huggingface-cache/hub \
    VTON_ALLOW_DOWNLOAD_FALLBACK=false \
    VTON_MODEL_REPO_ID=fashn-ai/fashn-vton-1.5 \
    VTON_MODEL_REVISION=7720683168567eb5a2a4c67f15116c6e29c83ded \
    VTON_DWPOSE_REPO_ID=fashn-ai/DWPose \
    VTON_DWPOSE_REVISION=548b5df25b84d9f4aac0611dfa1c2a7a12f15571 \
    VTON_TIMESTEPS=30 \
    VTON_GUIDANCE_SCALE=1.5 \
    VTON_SEGMENTATION_FREE=true \
    SAFETY_DEVICE=cpu \
    SAFETY_NSFW_MODEL_ID=Falconsai/nsfw_image_detection \
    SAFETY_NSFW_MODEL_REVISION=04367978d3474804ab1a00a9bd6548b741764069 \
    SAFETY_CLIP_MODEL_ID=openai/clip-vit-base-patch32 \
    SAFETY_CLIP_MODEL_REVISION=c7244be81152024ce0e99ac8d2e373a8953d9f9a \
    SAFETY_NSFW_THRESHOLD=0.72

WORKDIR /app

RUN apt-get update && \
    apt-get install --yes --no-install-recommends git libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip && \
    python -m pip install --requirement requirements.txt

COPY prepare_assets.py ./prepare_assets.py
RUN python ./prepare_assets.py

COPY handler.py model_assets.py ./

ENV HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1

CMD ["python", "-u", "handler.py"]
