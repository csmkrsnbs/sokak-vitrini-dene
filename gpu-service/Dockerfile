FROM pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    FASHN_WEIGHTS_DIR=/opt/fashn-vton/weights \
    HF_HOME=/opt/huggingface

RUN apt-get update && apt-get install -y --no-install-recommends git curl && rm -rf /var/lib/apt/lists/*

WORKDIR /opt
RUN git clone https://github.com/fashn-AI/fashn-vton-1.5.git /opt/fashn-vton \
    && cd /opt/fashn-vton \
    && git checkout 38aafe2185df40a3e8a5442e950c422c3d9dcb5a \
    && pip install -e . \
    && python scripts/download_weights.py --weights-dir /opt/fashn-vton/weights

WORKDIR /srv
COPY requirements.txt ./requirements.txt
RUN pip install -r requirements.txt
COPY app ./app
COPY runpod_handler.py ./runpod_handler.py

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
