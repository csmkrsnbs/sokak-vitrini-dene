FROM runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/runpod-volume/huggingface \
    FLUX_MODEL_ID=black-forest-labs/FLUX.2-klein-4B \
    FLUX_MODEL_REVISION=0eeac0d3d5a1179e84510324ffcac805059a296f \
    SAFETY_DEVICE=cpu \
    SAFETY_NSFW_MODEL_ID=Falconsai/nsfw_image_detection \
    SAFETY_NSFW_MODEL_REVISION=04367978d3474804ab1a00a9bd6548b741764069 \
    SAFETY_CLIP_MODEL_ID=openai/clip-vit-base-patch32 \
    SAFETY_CLIP_MODEL_REVISION=c7244be81152024ce0e99ac8d2e373a8953d9f9a \
    SAFETY_NSFW_THRESHOLD=0.72

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip && \
    python -m pip install --requirement requirements.txt

COPY handler.py ./handler.py

CMD ["python", "-u", "handler.py"]
