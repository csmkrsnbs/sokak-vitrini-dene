# RunPod FLUX.2 Worker

Bu worker, ürün ve hedef fotoğrafını Apache 2.0 lisanslı
`black-forest-labs/FLUX.2-klein-4B` modeliyle birleştirir. Bu endpoint takı,
mobilya ve otomobil kategorilerinde kullanılır. Giyim için ayrı
`runpod-vton-worker` endpoint'i vardır.
Kaynak görseller FLUX çalışmadan önce, üretilen sonuç da kullanıcıya dönmeden önce
aynı worker içinde iki açık kaynaklı güvenlik modeliyle denetlenir. Ayrı moderasyon
API çağrısı yapılmadığı için ikinci bir ağ gecikmesi oluşmaz.

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

1. RunPod'da en az 30 GB network volume oluşturun. Kapasiteyi artırmak için
   mümkünse farklı veri merkezlerinde iki volume kullanın.
2. **Serverless → New Endpoint → Import from Registry** ile worker imajını seçin.
3. Başlangıç için 24 GB sınıfından L4, A5000, RTX 3090 veya RTX 4090 seçin.
4. Minimum worker `0`, maksimum worker `1`, idle timeout `60` saniye yapın ve
   FlashBoot'u etkinleştirin.
5. Network volume'ları `/runpod-volume` yoluna bağlayın. Birden fazla volume
   seçildiğinde her worker kendi veri merkezindeki volume'u kullanır.
6. Aşağıdaki worker ortam değişkenlerini tanımlayın:

```env
HF_HOME=/runpod-volume/huggingface
FLUX_MODEL_ID=black-forest-labs/FLUX.2-klein-4B
FLUX_MODEL_REVISION=0eeac0d3d5a1179e84510324ffcac805059a296f
FLUX_INFERENCE_STEPS=4
FLUX_CPU_OFFLOAD=false
SAFETY_DEVICE=cpu
SAFETY_NSFW_MODEL_ID=Falconsai/nsfw_image_detection
SAFETY_NSFW_MODEL_REVISION=04367978d3474804ab1a00a9bd6548b741764069
SAFETY_CLIP_MODEL_ID=openai/clip-vit-base-patch32
SAFETY_CLIP_MODEL_REVISION=c7244be81152024ce0e99ac8d2e373a8953d9f9a
SAFETY_NSFW_THRESHOLD=0.72
SAFETY_MINOR_THRESHOLD=0.84
SAFETY_POLITICAL_THRESHOLD=0.82
SAFETY_VIOLENCE_THRESHOLD=0.98
SAFETY_WEAPON_THRESHOLD=0.84
SAFETY_HATE_THRESHOLD=0.82
```

Güvenlik modellerini `SAFETY_DEVICE=cpu` ile çalıştırın. Böylece 24 GB GPU
belleği FLUX'a ayrılır ve güvenlik modelleriyle birlikte oluşabilecek CUDA
bellek taşması önlenir. 16 GB GPU seçilirse ayrıca `FLUX_CPU_OFFLOAD=true`
kullanın. Bu seçenek maliyeti azaltabilir ancak işlemi yavaşlatır.

İlk worker açılışında FLUX ve güvenlik modelleri network volume'a indirilir. Bu
ilk istek normalden uzun sürebileceği için canlıya almadan önce RunPod panelinin
**Requests** sekmesinden iki uygun test görseliyle bir ısınma isteği tamamlayın.
Modeller worker belleğinde önbelleğe alınır; sıcak worker'da iki kaynak görselin
toplu güvenlik kontrolü ayrı bir sunucu turu oluşturmaz. Güvenlik modelleri
yüklenemezse worker güvenli varsayım yapmaz ve üretimi durdurur.

Varsayılan eşikler açık ihlalleri engellerken sıradan moda, takı ve ürün
fotoğraflarındaki yanlış pozitifleri azaltacak şekilde dengelenmiştir. Eşikleri
değiştirmeden önce kontrollü bir doğrulama setiyle yanlış kabul ve yanlış ret
oranlarını ölçün. Worker güvenlik nedenini ve sınıflandırma puanını yalnızca
yönetici loguna yazar; istemciye göndermez.

## 3. Uygulama bağlantısı

RunPod'da bir API anahtarı oluşturun ve endpoint kimliğini kopyalayın. Bunları
Vercel Production ortamına ekleyin:

```env
RUNPOD_API_KEY=rpa_...
RUNPOD_ENDPOINT_ID=...
RUNPOD_TIMEOUT_MS=240000
RUNPOD_JOB_TTL_MS=900000
PREVIEW_JOB_MAX_AGE_MS=1200000
FLUX_IMAGE_MODEL=black-forest-labs/FLUX.2-klein-4B
```

API anahtarı yalnız sunucu tarafında tutulur; mobil tarayıcıya gönderilmez.
Uygulama işi kısa bir istekle kuyruğa verir ve sonucu ayrı durum istekleriyle
izler; GPU kuyruğu Vercel bağlantısının süre aşımına yol açmaz.

## 4. Doğrulama

Vercel yayını tamamlandıktan sonra:

```text
https://dene.sokakvitrini.com/api/health
```

cevabında `databaseReachable` ve `aiConfigured` değerleri `true` olmalıdır.
Ardından takı, mobilya ve otomobil kategorilerini mobil cihazdan iki gerçek
fotoğrafla test edin. Uygun bir isteğin tamamlandığını, kurala aykırı kontrollü bir test
örneğinin `UNSAFE_CONTENT` ile reddedildiğini ve reddedilen işlemde kullanım
hakkının iade edildiğini ayrıca doğrulayın.
