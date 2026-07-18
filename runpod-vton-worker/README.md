# RunPod FASHN VTON 1.5 flat-lay worker

Bu worker, açık kaynak FASHN VTON 1.5 modelini kendi RunPod RTX 3090
endpoint'inizde çalıştırır. `FASHN_API_KEY` veya FASHN sağlayıcı kredisi gerekmez;
yalnızca mevcut RunPod GPU kullanımınız ücretlenir.

## Lisans sınırı

FASHN VTON 1.5 modeli, DWPose ve YOLOX Apache-2.0 lisanslıdır. Resmî pipeline'ın
insan ayrıştırıcısı SegFormer tabanlıdır ve NVIDIA lisansı ticari kullanımı yalnız
araştırma/değerlendirmeyle sınırlar. Bu imajdaki yama insan ayrıştırıcıyı ve onun
paket/ağırlıklarını tamamen çıkarır. Bu nedenle worker yalnızca:

- sade fonda, askıda veya düz serilmiş ürün fotoğrafını (`flat-lay`),
- maskesiz (`segmentation_free`) çalışmayı,
- `tops`, `bottoms` ve `one-pieces` kategorilerini kabul eder.

Başka bir kişinin üzerinde çekilmiş ürün fotoğrafı bu worker'a gönderilmez.

## Kurulum

1. GitHub Actions tamamlandığında şu imaj oluşur:

   `ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton-worker:latest`

2. GHCR paketini public yapın veya RunPod'a registry kimlik doğrulaması ekleyin.
3. RunPod'da yeni bir **Serverless endpoint** oluşturun. Mevcut FLUX endpoint'ini
   değiştirmeyin; giyim için ayrı endpoint kullanın.
4. GPU olarak 24 GB RTX 3090 seçin. Model yaklaşık 8 GB VRAM ister.
5. `sokak-vitrini-flux` ve `sokak-vitrini-flux-cz` volume'larını seçebilirsiniz.
   RunPod her worker'a bulunduğu veri merkezindeki tek volume'u bağlar; volume'lar
   birbirleriyle eşitlenmez. Her volume ilk kullanımda ağırlıkları ayrı indirir.
6. Başlangıç ayarı: minimum worker `0`, maksimum worker `1`, idle timeout `60` saniye.
7. Vercel'e yeni endpoint kimliğini `RUNPOD_VTON_ENDPOINT_ID` olarak ekleyin.

Önerilen worker ortamı:

```env
HF_HOME=/runpod-volume/huggingface
VTON_WEIGHTS_DIR=/runpod-volume/fashn-vton-1.5-flat-lay
VTON_TIMESTEPS=30
VTON_GUIDANCE_SCALE=1.5
SAFETY_DEVICE=cpu
SAFETY_NSFW_THRESHOLD=0.985
SAFETY_EXPLICIT_THRESHOLD=0.980
SAFETY_MINOR_THRESHOLD=0.950
SAFETY_POLITICAL_THRESHOLD=0.990
SAFETY_VIOLENCE_THRESHOLD=0.990
SAFETY_WEAPON_THRESHOLD=0.980
SAFETY_HATE_THRESHOLD=0.980
```

Yetişkin iç çamaşırı, mayo ve kostüm katalog görüntüleri izinlidir. Açık çıplaklık,
cinsel eylem, çocuk/yaşı belirsiz kişi, grafik şiddet, silah, nefret ve siyasi içerik
denetimi kapatılmaz. Otomatik denetim hatasız değildir; yayın öncesi izinli ve yasak
örneklerden oluşan kontrollü bir test setiyle doğrulayın.

İlk istekte model ve güvenlik ağırlıkları volume'a indirildiği için soğuk açılış
uzayabilir. Canlıya almadan önce RunPod Requests ekranından bir ısınma isteği yapın.
