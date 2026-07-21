> [!WARNING]
> ARŞİV: Bu yöntem aktif v8 dağıtımında kullanılmıyor. RunPod için `RUNPOD_FLASH_KURULUM.md` dosyasını izleyin.

# GHCR Build Hatası Düzeltmesi

Önceki Dockerfile, yaklaşık 1.94 GB ana model ağırlığını GitHub Actions Docker build'i sırasında indiriyordu. Bu indirme adımı başarısız olduğunda tüm `RUN` zinciri `exit code: 1` ile kapanıyordu.

Bu sürümde:

- Docker imajı yalnız uygulama kodunu ve Python bağımlılıklarını içerir.
- Ana model Docker build sırasında indirilmez.
- RunPod endpoint ayarındaki **Cached model** alanına aşağıdaki değer yazılır:

```text
fashn-ai/fashn-vton-1.5
```

- Worker, cached model dosyasını `/runpod-volume/huggingface-cache/hub/` altında bulur.
- DWPose yardımcı dosyaları ilk worker açılışında indirilir.

## Yeniden yayınlama

```bash
git add .
git commit -m "fix: VTON modelini RunPod cached model ile yükle"
git push
```

GitHub'da:

```text
Actions → VTON Worker Image
```

Yeni workflow tamamlandıktan sonra GHCR paketini public yapın ve RunPod endpoint'i registry imajından oluşturun.
