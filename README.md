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

## RunPod Flash kurulumu

Aktif dağıtım yolu özel Docker/GHCR imajı değil, RunPod Flash'tır.

GitHub Actions secret:

```text
RUNPOD_API_KEY=<gizli anahtar>
```

Çalıştırılacak workflow:

```text
Actions → Deploy VTON with RunPod Flash → Run workflow
```

Workflow başarılı olduktan sonra üretilen yeni endpoint ID, Vercel'e eklenir:

```env
NEXT_PUBLIC_APP_URL="https://prova.sokakvitrini.com"
VTON_PROVIDER="runpod"
RUNPOD_ENDPOINT_ID="..."
RUNPOD_API_KEY="..."
VTON_REQUEST_TIMEOUT_MS="600000"
VTON_MAX_UPLOAD_MB="12"
```

Ayrıntılı sıra: `RUNPOD_FLASH_KURULUM.md`.

`gpu-service/` ve GHCR belgeleri yalnız eski/alternatif direct GPU yöntemi için
korunmuştur. Yeni RunPod endpoint'i için kullanılmamalıdır.

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
- RunPod API anahtarı yalnız Vercel sunucu ortamında tutulmalı; tarayıcıya gönderilmemelidir.
- HTTPS kullanılmalıdır.
- Özel Vitrin yalnız yetişkin kullanıcılar içindir.

## Kontrol

```bash
npm run check
```

## V8 — doğrulanmış Flash dağıtımı

V8, GitHub Actions logunda görülen `numpy` keşif hatasını ve RunPod Flash
1.18.0 ile uyumsuz `python_version` dekoratör parametresini düzeltir. Workflow,
deploy başlamadan önce SDK imzasını ve tüm Flash modüllerini doğrular.


## v9 runtime dependency cache

RunPod Flash 1.5 GB arşiv sınırını aşan ağır ML paketleri ilk warmup sırasında kalıcı Network Volume içine kurulur. Ayrıntılar `FLASH_V9_RUNTIME_KURULUM.md` dosyasındadır.

## v11 — ONNX Runtime düzeltmesi

RunPod Flash CUDA 12 worker'ında `libcudart.so.13` hatasını önlemek için
`onnxruntime-gpu==1.20.2` sabitlenmiş ve kalıcı volume'daki uyumsuz ORT kurulumu
otomatik temizlenecek şekilde güncellenmiştir.
