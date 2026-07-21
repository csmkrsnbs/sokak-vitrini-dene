# Sokak Vitrini Prova — Final Sürüm

Premium dijital prova vitrini. Dört ayrı deneyimi tek projede birleştirir:

1. **Gerçek 360°:** 24–36 gerçek ürün fotoğrafını sürüklenebilir 360° görünüme dönüştürür.
2. **Gizli Manken:** S/M/L/XL yetişkin manken üzerinde şeffaf ürün PNG hizalama alanı.
3. **Kendi Üstünde Prova:** Kendi GPU sunucunuzdaki FASHN VTON v1.5 modeline bağlanır.
4. **3D / WebAR:** GLB ürünlerini `<model-viewer>` ile döndürür ve desteklenen cihazlarda AR açar.

## Öne çıkan fark

Her AI sonucu **Ürün Gerçeklik Kartı** ile gösterilir. Renk/yapı ön kontrolü eşik altında kalırsa sonuç kullanıcıya verilmez ve gerçek 360° çekime yönlendirilir.

## Web kurulumu

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Tarayıcı: `http://localhost:3000`

## Ortam değişkenleri

```env
NEXT_PUBLIC_APP_URL="https://prova.sokakvitrini.com"
VTON_PROVIDER="direct"
VTON_ENDPOINT_URL="https://gpu-servis-adresi"
VTON_SHARED_SECRET="uzun-rastgele-deger"
VTON_REQUEST_TIMEOUT_MS="180000"
VTON_MAX_UPLOAD_MB="12"
```

RunPod Serverless Queue için önerilen dağıtım GitHub Actions → GHCR → RunPod akışıdır:

```env
VTON_PROVIDER="runpod"
RUNPOD_ENDPOINT_ID="..."
RUNPOD_API_KEY="..."
```

RunPod endpoint ayarında **Cached model** olarak `fashn-ai/fashn-vton-1.5` kullanılmalıdır.

Kurulum: `GHCR_RUNPOD_KURULUM.md`

## GPU servisi

`gpu-service/` klasöründeki Docker projesi, FASHN VTON v1.5 modelini self-hosted olarak çalıştırır. Direct FastAPI ve RunPod Serverless handler birlikte gelir. GitHub Actions workflow'u worker imajını GHCR'ye otomatik yayınlar.

Ayrıntı: `gpu-service/README.md` ve `GHCR_RUNPOD_KURULUM.md`

## Gerçek 360° ürün hazırlığı

- Ürünü sabit ışıkta döner platformda çekin.
- 24 veya 36 kare kullanın.
- Dosyaları `urun-01.jpg`, `urun-02.jpg` şeklinde sıralayın.
- Renk varyantlarını ayrı set olarak hazırlayın.
- Ön, yan, arka ve detay karelerine stüdyo içinden hotspot notu ekleyebilirsiniz.

## Gizli manken hazırlığı

Projede S/M/L/XL için nötr demo manken SVG'leri bulunur. Ticari kullanımda gerçek stüdyo manken fotoğraflarını yükleyin. Her ürün için şeffaf PNG hazırlanmalı ve hizalama ürün bazında kaydedilmelidir.

## Güvenlik

- Kullanıcı fotoğrafları web veritabanına yazılmaz.
- GPU servisinde görseller bellekte işlenir.
- `VTON_SHARED_SECRET` zorunlu tutulmalıdır.
- HTTPS kullanılmalıdır.
- Özel Vitrin yalnız yetişkin kullanıcılar içindir.

## Kontrol

```bash
npm run check
```

## RunPod v6-light Worker

Uzun süre `Initializing` durumunda kalan eski image yerine hafif Queue worker kullanılır. Yeni Dockerfile RunPod PyTorch tabanını kullanır, web sunucusu bağımlılıklarını Queue imajından çıkarır ve `health` / `warmup` teşhis işlerini destekler. Kurulum sırası: `RUNPOD_V6_HAFIF_WORKER.md`.

## v7 — RunPod Flash dağıtımı

Özel Docker/GHCR worker yolu bırakıldı. `runpod/pytorch` tabanının sıkıştırılmış
boyutu çok büyük olduğu için worker initialization aşamasında takılabiliyordu.
Yeni dağıtım `flash-app/` ve `.github/workflows/deploy-vton-flash.yml` üzerinden
RunPod Flash kullanır. Kurulum: `RUNPOD_FLASH_KURULUM.md`.
