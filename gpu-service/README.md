# SV Prova GPU Servisi

Bu klasör FASHN VTON v1.5 modelini self-hosted GPU üzerinde çalıştırır.

## RunPod Queue — v6-light

RunPod sürümü:

```text
gpu-service/Dockerfile.runpod
gpu-service/requirements.runpod.txt
gpu-service/runpod_handler.py
```

Özellikler:

- RunPod PyTorch tabanı
- Queue handler dışında web sunucusu bağımlılığı yok
- Ana model RunPod Cached Model üzerinden yüklenir
- Health ve warmup teşhis işleri bulunur
- İki parçalı ürün akışı desteklenir
- Düşük sadakatli sonuç engellenebilir

### Health

```json
{"input":{"action":"health"}}
```

### Warmup

```json
{"input":{"action":"warmup"}}
```

### Try-on

```json
{
  "input": {
    "person_image_base64": "...",
    "garment_image_base64": "...",
    "category": "tops",
    "garment_photo_type": "flat-lay"
  }
}
```

RunPod ayarları kökteki `RUNPOD_V6_HAFIF_WORKER.md` dosyasındadır.

## Direct FastAPI

Direct GPU sunucusu için mevcut `gpu-service/Dockerfile`, `requirements.txt` ve `app/main.py` korunmuştur. Bu yapı RunPod Queue imajına dahil edilmez.
