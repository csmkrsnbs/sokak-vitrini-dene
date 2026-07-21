> [!WARNING]
> ARŞİV: Bu yöntem aktif v8 dağıtımında kullanılmıyor. RunPod için `RUNPOD_FLASH_KURULUM.md` dosyasını izleyin.

# GitHub Container Registry → RunPod Kurulumu

Bu yöntem RunPod'un GitHub builder aşamasını kullanmaz. Docker imajı GitHub Actions tarafından oluşturulur, GitHub Container Registry'ye gönderilir ve RunPod imajı doğrudan registry'den çeker.

## 1. Dosyaları GitHub'a gönder

```bash
git add .
git commit -m "fix: RunPod VTON worker imajını hafiflet"
git push
```

Push sonrasında:

```text
GitHub → Actions → VTON Worker Image
```

## 2. Workflow sonucunu kontrol et

Workflow üç etiket üretir:

```text
ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton:latest
ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton:v6-light
ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton:<COMMIT_SHA>
```

RunPod'da değişmeyen commit SHA etiketini kullan. `latest` kullanma.

## 3. GHCR paketini public yap

```text
Profile → Packages → sokak-vitrini-dene-vton
→ Package settings → Change visibility → Public
```

## 4. Endpoint ayarları

```text
Endpoint type: Queue
GPU: 24 GB
Container image: ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton:<COMMIT_SHA>
Container start command: boş
Cached model: fashn-ai/fashn-vton-1.5
Container disk: 20 GB
Max workers: 1
Active workers: 0
GPU count: 1
Idle timeout: 5 sec
Execution timeout: 600 sec
FlashBoot: açık
Network volume: yok
HTTP/TCP ports: boş
Auto scaling: Queue delay
Queue delay: 4 sec
```

## 5. Health testi

Requests ekranında `/runsync`:

```json
{
  "input": {
    "action": "health"
  }
}
```

`worker_version: v6-light`, `cuda_available: true` ve `cached_model_present: true` görülmeli.

## 6. Pipeline warmup

```json
{
  "input": {
    "action": "warmup"
  }
}
```

`pipeline_ready: true` görülmeden web prova testine geçme.

## 7. Vercel değişkenleri

```env
VTON_PROVIDER="runpod"
RUNPOD_ENDPOINT_ID="..."
RUNPOD_API_KEY="..."
VTON_REQUEST_TIMEOUT_MS="300000"
VTON_MAX_UPLOAD_MB="12"
```

## Güvenlik

- RunPod API anahtarını dosyalara veya GitHub'a yazma.
- GHCR imajında kullanıcı fotoğrafı bulunmaz.
- Test dışında Active workers değerini `0` bırak.

Daha ayrıntılı sıra: `RUNPOD_V6_HAFIF_WORKER.md`.
