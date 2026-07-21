# SV Prova GPU Servisi

Bu klasör FASHN VTON v1.5 modelini kendi GPU sunucunuzda çalıştırır. Web uygulaması görselleri bu servise yollar; servis bellekte işler ve sonucu JSON/base64 olarak geri döndürür.

## Direct FastAPI

```bash
docker build -t sv-prova-gpu .
docker run --gpus all -p 8000:8000 \
  -e VTON_SHARED_SECRET="uzun-rastgele-deger" \
  -e VTON_FIDELITY_THRESHOLD="0.30" \
  sv-prova-gpu
```

Web `.env`:

```env
VTON_PROVIDER="direct"
VTON_ENDPOINT_URL="https://gpu-servis-adresi"
VTON_SHARED_SECRET="uzun-rastgele-deger"
```

## RunPod Serverless

Aynı Docker imajında varsayılan komutu aşağıdaki şekilde değiştirin:

```text
python -u runpod_handler.py
```

Web `.env`:

```env
VTON_PROVIDER="runpod"
RUNPOD_ENDPOINT_ID="..."
RUNPOD_API_KEY="..."
```

## Notlar

- İlk Docker imajı model ağırlıkları nedeniyle büyüktür.
- Tek worker kullanın; model GPU belleğinde bir kez yüklenir.
- `VTON_RETURN_REJECTED_IMAGE=false` olduğunda düşük sadakatli sonuç kullanıcıya gönderilmez.
- Sadakat skoru renk dağılımı ve görsel yapı üzerinden yapılan otomatik bir ön kontroldür; insan kalite kontrolünün yerine geçmez.
