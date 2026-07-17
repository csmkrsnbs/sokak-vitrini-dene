# RunPod FLUX.2 Worker

Bu worker, ürün ve hedef fotoğrafını Apache 2.0 lisanslı
`black-forest-labs/FLUX.2-klein-4B` modeliyle birleştirir. Model takı, giyim,
mobilya ve otomobil kategorilerinin tamamında aynı iki referanslı akışı kullanır.

## 1. Docker imajını oluşturma

Proje `main` dalına gönderildiğinde `.github/workflows/runpod-worker.yml`
çalışır ve aşağıdaki imajı GitHub Container Registry'ye gönderir:

```text
ghcr.io/csmkrsnbs/sokak-vitrini-dene-flux-worker:latest
```

İlk çalışmadan sonra GitHub'da **Packages → Package settings → Change
visibility → Public** seçin. Paket private kalacaksa registry kullanıcı adı ve
token'ını RunPod template ayarlarına ekleyin.

İmajı kendi bilgisayarınızda oluşturmak isterseniz:

```bash
docker build -t sokak-vitrini-flux-worker ./runpod-worker
```

## 2. RunPod endpoint'i

1. RunPod'da en az 30 GB network volume oluşturun.
2. **Serverless → New Endpoint → Import from Registry** ile worker imajını seçin.
3. Başlangıç için 24 GB sınıfından L4, A5000, RTX 3090 veya RTX 4090 seçin.
4. Minimum worker `0`, maksimum worker `1`, idle timeout `5` saniye yapın.
5. Network volume'u `/runpod-volume` yoluna bağlayın.
6. Aşağıdaki worker ortam değişkenlerini tanımlayın:

```env
HF_HOME=/runpod-volume/huggingface
FLUX_MODEL_ID=black-forest-labs/FLUX.2-klein-4B
FLUX_MODEL_REVISION=0eeac0d3d5a1179e84510324ffcac805059a296f
FLUX_INFERENCE_STEPS=4
FLUX_CPU_OFFLOAD=false
```

16 GB GPU seçilirse `FLUX_CPU_OFFLOAD=true` kullanın. Bu seçenek maliyeti
azaltabilir ancak işlemi yavaşlatır.

İlk worker açılışında model network volume'a indirilir. Bu ilk istek normalden
uzun sürebileceği için canlıya almadan önce RunPod panelinin **Requests**
sekmesinden iki test görseliyle bir ısınma isteği tamamlayın.

## 3. Uygulama bağlantısı

RunPod'da bir API anahtarı oluşturun ve endpoint kimliğini kopyalayın. Bunları
Vercel Production ortamına ekleyin:

```env
RUNPOD_API_KEY=rpa_...
RUNPOD_ENDPOINT_ID=...
RUNPOD_TIMEOUT_MS=240000
RUNPOD_POLL_INTERVAL_MS=2000
FLUX_IMAGE_MODEL=black-forest-labs/FLUX.2-klein-4B
```

API anahtarı yalnız sunucu tarafında tutulur; mobil tarayıcıya gönderilmez.

## 4. Doğrulama

Vercel yayını tamamlandıktan sonra:

```text
https://dene.sokakvitrini.com/api/health
```

cevabında `databaseReachable` ve `aiConfigured` değerleri `true` olmalıdır.
Ardından dört kategorinin her birini mobil cihazdan iki gerçek fotoğrafla test
edin.
