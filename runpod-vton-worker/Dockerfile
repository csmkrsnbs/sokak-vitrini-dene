FROM runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404

ARG FASHN_VTON_COMMIT=7c0f10af3f91ad4048fe9729c470a13ef905d25a

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/runpod-volume/huggingface \
    VTON_WEIGHTS_DIR=/runpod-volume/fashn-vton-1.5-flat-lay \
    VTON_MODEL_REPO_ID=fashn-ai/fashn-vton-1.5 \
    VTON_MODEL_REVISION=7720683168567eb5a2a4c67f15116c6e29c83ded \
    VTON_DWPOSE_REPO_ID=fashn-ai/DWPose \
    VTON_DWPOSE_REVISION=548b5df25b84d9f4aac0611dfa1c2a7a12f15571 \
    VTON_TIMESTEPS=30 \
    VTON_GUIDANCE_SCALE=1.5 \
    SAFETY_DEVICE=cpu \
    SAFETY_NSFW_MODEL_ID=Falconsai/nsfw_image_detection \
    SAFETY_NSFW_MODEL_REVISION=04367978d3474804ab1a00a9bd6548b741764069 \
    SAFETY_CLIP_MODEL_ID=openai/clip-vit-base-patch32 \
    SAFETY_CLIP_MODEL_REVISION=c7244be81152024ce0e99ac8d2e373a8953d9f9a \
    SAFETY_NSFW_THRESHOLD=0.985 \
    SAFETY_EXPLICIT_THRESHOLD=0.980 \
    SAFETY_MINOR_THRESHOLD=0.950 \
    SAFETY_POLITICAL_THRESHOLD=0.990 \
    SAFETY_VIOLENCE_THRESHOLD=0.990 \
    SAFETY_WEAPON_THRESHOLD=0.980 \
    SAFETY_HATE_THRESHOLD=0.980

WORKDIR /app

RUN apt-get update && \
    apt-get install --yes --no-install-recommends git libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/requirements.txt
RUN python -m pip install --upgrade pip && \
    python -m pip install --requirement /tmp/requirements.txt

RUN git clone https://github.com/fashn-AI/fashn-vton-1.5.git /opt/fashn-vton && \
    cd /opt/fashn-vton && \
    git checkout "${FASHN_VTON_COMMIT}"

COPY patches/flat-lay-no-human-parser.patch /tmp/flat-lay-no-human-parser.patch
RUN cd /opt/fashn-vton && \
    git apply --check /tmp/flat-lay-no-human-parser.patch && \
    git apply /tmp/flat-lay-no-human-parser.patch && \
    python -m pip install --no-deps /opt/fashn-vton

COPY handler.py /app/handler.py

CMD ["python", "-u", "/app/handler.py"]
