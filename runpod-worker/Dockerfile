FROM runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/runpod-volume/huggingface \
    FLUX_MODEL_ID=black-forest-labs/FLUX.2-klein-4B \
    FLUX_MODEL_REVISION=0eeac0d3d5a1179e84510324ffcac805059a296f

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip && \
    python -m pip install --requirement requirements.txt

COPY handler.py ./handler.py

CMD ["python", "-u", "handler.py"]
