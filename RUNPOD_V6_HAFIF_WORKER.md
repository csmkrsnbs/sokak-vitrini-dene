# RunPod v6 Hafif Worker Kurulumu

Bu sürüm, uzun süre `Initializing` durumunda kalan eski worker imajını değiştirir.

## Neler değişti?

- Docker tabanı `runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404` oldu.
- Queue worker'dan FastAPI, Uvicorn ve multipart bağımlılıkları çıkarıldı.
- FASHN kaynak deposu imajda bırakılmıyor; paket kurulduktan sonra build artıkları siliniyor.
- Ana `model.safetensors` imaja gömülmüyor; RunPod Cached Model üzerinden kullanılıyor.
- `health` ve `warmup` teşhis komutları eklendi.
- GitHub Actions artık `latest`, `v6-light` ve commit SHA etiketlerini üretir.

## 1. GitHub'a gönder

```bash
git add .
git commit -m "fix: RunPod VTON worker imajını hafiflet"
git push
```

## 2. GitHub Actions sonucunu bekle

```text
GitHub → Actions → VTON Worker Image
```

Çalışma yeşil olduğunda workflow özetindeki commit SHA imajını kopyala:

```text
ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton:<YENI_COMMIT_SHA>
```

`latest` yerine SHA etiketi kullan.

## 3. RunPod endpoint'i güncelle

Önce:

```text
Active workers: 0
```

Sonra **Manage → Edit Endpoint**:

```text
Container image: ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton:<YENI_COMMIT_SHA>
Container start command: boş
Cached model: fashn-ai/fashn-vton-1.5
Container disk: 20 GB
Max workers: 1
Active workers: 0
GPU count: 1
Execution timeout: 600 sec
HTTP/TCP ports: boş
Network volume: yok
```

Kaydet.

## 4. Önce health testi yap

RunPod → Requests ekranında `/runsync` seç ve gönder:

```json
{
  "input": {
    "action": "health"
  }
}
```

Beklenen çıktı:

```json
{
  "status": "COMPLETED",
  "output": {
    "ok": true,
    "worker_version": "v6-light",
    "cuda_available": true,
    "cached_model_present": true
  }
}
```

Bu test model pipeline'ını yüklemez; yalnız container, Queue handler, CUDA ve cached model bağlantısını doğrular.

## 5. Warmup testi

Health başarılıysa:

```json
{
  "input": {
    "action": "warmup"
  }
}
```

Beklenen çıktı `pipeline_ready: true` içerir. Bu aşama FASHN pipeline'ını ve gerekli yardımcı modelleri yüklediği için ilk health testinden uzun sürebilir.

## 6. Web uygulaması testi

Warmup başarılı olduktan sonra Vercel uygulamasından tek ürünle prova oluştur.

## Maliyet koruması

Test dışında `Active workers: 0` bırak. Worker 7–10 dakikadan uzun süre `Initializing` kalırsa yeni istek gönderme; worker'ı sil ve logları incele.
