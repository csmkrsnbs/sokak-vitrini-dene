# RunPod Flash ile kesin kurulum

Önce eski Serverless endpoint'teki bekleyen işleri iptal edin ve endpoint'i silin.
Bu sürüm özel GHCR Docker imajını kullanmaz.

## 1. GitHub Secret

Repository → Settings → Secrets and variables → Actions → New repository secret

```text
Name: RUNPOD_API_KEY
Value: RunPod API anahtarınız
```

## 2. Workflow

GitHub → Actions → Deploy VTON with RunPod Flash → Run workflow

Flash, RunPod'un hazır GPU worker imajını kullanır. Bu nedenle 10 GB özel Docker
imajı çekilmez. Endpoint ve 20 GB kalıcı model volume otomatik oluşturulur.

## 3. Endpoint ID

Workflow logunun sonunda queue endpoint URL'si görünür:

```text
https://api.runpod.ai/v2/ENDPOINT_ID
```

Vercel ortam değişkenini değiştirin:

```env
VTON_PROVIDER="runpod"
RUNPOD_ENDPOINT_ID="YENI_ENDPOINT_ID"
RUNPOD_API_KEY="mevcut_runpod_api_key"
VTON_REQUEST_TIMEOUT_MS="600000"
```

Vercel'i yeniden deploy edin.

## 4. Test sırası

Önce health:

```json
{"input":{"action":"health"}}
```

Sonra warmup:

```json
{"input":{"action":"warmup"}}
```

Warmup ilk seferde model dosyalarını 20 GB kalıcı volume'a indirir. Sonraki
başlatmalarda aynı dosyalar kullanılır.
