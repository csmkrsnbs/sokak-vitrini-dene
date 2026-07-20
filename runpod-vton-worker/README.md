# RunPod FASHN VTON Worker

Bu worker yalnızca giyim kategorisini işler. Kişi fotoğrafı ile ürün fotoğrafını
`fashn-ai/fashn-vton-1.5` modeline verir ve üç açık kategori kullanır:

- `tops`: gömlek, tişört, bluz, ceket
- `bottoms`: pantolon, etek, şort
- `one-pieces`: elbise, tulum

Takı, mobilya ve otomobil mevcut `runpod-worker/` FLUX endpoint'inde kalır.
Kaynak ve sonuç görselleri mevcut worker ile aynı yerel güvenlik katmanından
geçirilir; güvenlik modeli yüklenemezse üretim güvenli biçimde durur.

## Docker imajı

`main` dalına gönderildiğinde `.github/workflows/runpod-vton-worker.yml`
aşağıdaki imajı oluşturur:

```text
ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton-worker:latest
```

İmaj private kalırsa RunPod registry doğrulaması ekleyin; aksi halde GitHub
Packages ayarından public yapın.

## RunPod endpoint ayarı

1. **Serverless → New endpoint → Import from Registry** yolunu açın.
2. Yukarıdaki `-vton-worker:latest` imajını seçin.
3. **Model / Cached model** alanına `fashn-ai/fashn-vton-1.5` yazın.
4. GPU önceliğinde önce 16 GB A4000, A4500 veya RTX 4000; ikinci sırada
   standart 24 GB L4, A5000 veya RTX 3090 seçin. 24 GB PRO gerekli değildir.
5. Minimum/Active worker `0`, maksimum worker `1`, GPU count `1`, idle timeout
   `10` saniye olsun; FlashBoot'u etkinleştirin.
6. Data centers alanında tüm uygun merkezlere izin verin.
7. **VTON endpoint'inden** `sokak-vitrini-flux` ve `sokak-vitrini-flux-cz`
   network volume'larını kaldırın. FLUX endpoint'inin volume ayarına dokunmayın.
   Cached model `/runpod-volume/huggingface-cache` altında ayrı olarak bağlanır.
8. Container disk için en az `10 GB` ayırın.
9. Eski endpoint değerlerini aşağıdakilerle değiştirin:

```env
HF_HOME=/opt/huggingface
VTON_WEIGHTS_DIR=/tmp/fashn-vton-1.5
VTON_STATIC_ASSETS_DIR=/opt/vton-assets
RUNPOD_MODEL_CACHE_ROOT=/runpod-volume/huggingface-cache/hub
VTON_ALLOW_DOWNLOAD_FALLBACK=false
VTON_MODEL_REPO_ID=fashn-ai/fashn-vton-1.5
VTON_MODEL_REVISION=7720683168567eb5a2a4c67f15116c6e29c83ded
VTON_DWPOSE_REPO_ID=fashn-ai/DWPose
VTON_DWPOSE_REVISION=548b5df25b84d9f4aac0611dfa1c2a7a12f15571
VTON_TIMESTEPS=30
VTON_GUIDANCE_SCALE=1.5
VTON_SEGMENTATION_FREE=true
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

Ana 2 GB giyim ağırlığı RunPod Cached Models alanından salt okunur olarak
bağlanır. DWPose, insan ayrıştırma ve güvenlik modelleri Docker imajında hazırdır;
worker açılırken Hugging Face indirmesi yapılmaz. Bu sayede network volume veri
merkezi kısıtı olmadan 16 GB havuzu kullanılabilir.

Yeni imaj yayınlanmadan ve Cached model alanı doldurulmadan VTON volume'larını
kaldırmayın. Geçişten sonra eski worker'ı silin, endpoint `Ready` olunca RunPod
**Requests** ekranında bir `tops` testi çalıştırın. Dengeli kalite için
`VTON_TIMESTEPS=30` kullanın; `20` daha hızlı, `50` daha yavaş ve daha kaliteli
seçenektir.

### Ağırlık çözümleme sırası

Worker ana `model.safetensors` dosyasını şu sırayla arar:

1. `VTON_CACHED_MODEL_PATH` ile verilen açık dosya yolu,
2. RunPod standart cached-model dizinindeki sabit revision,
3. Aynı model için bulunan en yeni cached snapshot.

Cache bulunamazsa worker hızlıca `MODEL_LOAD_FAILED` döndürür. Üretimde önerilmez
ama teşhis için `VTON_ALLOW_DOWNLOAD_FALLBACK=true` verilerek doğrudan indirme
geçici olarak açılabilir.

## Vercel bağlantısı

Yeni endpoint kimliğini Vercel Production ortamına ekleyin:

```env
RUNPOD_VTON_ENDPOINT_ID=vton-endpoint-id
VTON_IMAGE_MODEL=fashn-ai/fashn-vton-1.5
```

Varsayılan olarak mevcut `RUNPOD_API_KEY` kullanılır. Ayrı anahtar kullanmak
isterseniz `RUNPOD_VTON_API_KEY` de ekleyebilirsiniz.

## Lisans notu

FASHN VTON çekirdeği Apache 2.0'dır. Worker'ın insan ayrıştırma bileşeni,
SegFormer'dan türeyen `fashn-human-parser` paketini kullanır ve bu bileşen
NVIDIA Source Code License koşullarını devralır. Bu lisans kullanımı araştırma
ve değerlendirme ile sınırlar; hizmetin ücretsiz olması tek başına uygunluk
sağlamaz. Bu worker'ı herkese açık üretim hizmetine almadan önce kullanımın
değerlendirme kapsamı ve gerekli izin hukuk uzmanıyla doğrulanmalıdır. Ücretli
veya ticari kullanım için ticari lisans, lisansı uygun bir parser alternatifi
ya da FASHN'ın ticari API seçeneği gerekir.
