# Canlıya Alma

## 1. Vercel

1. Projeyi GitHub'a gönderin.
2. Vercel'de yeni proje oluşturun.
3. `.env.example` içindeki gerekli değişkenleri Vercel Environment Variables alanına ekleyin.
4. Deploy edin.

## 2. RunPod Flash GPU servisi

1. GitHub → `Settings → Secrets and variables → Actions` altında
   `RUNPOD_API_KEY` secret'ını oluşturun.
2. GitHub → `Actions → Deploy VTON with RunPod Flash → Run workflow`.
3. `Validate Flash application` adımı yeşil olmadan deployment başlamaz.
4. Başarılı workflow özetinden yeni endpoint ID'yi alın.
5. Vercel Environment Variables alanına ekleyin:

```env
VTON_PROVIDER="runpod"
RUNPOD_ENDPOINT_ID="..."
RUNPOD_API_KEY="..."
VTON_REQUEST_TIMEOUT_MS="600000"
VTON_MAX_UPLOAD_MB="12"
```

6. Vercel production redeploy yapın.
7. Önce `health`, sonra `warmup`, ardından gerçek ürün testi çalıştırın.

Kurulum ayrıntıları: `RUNPOD_FLASH_KURULUM.md`. Eski GHCR/Docker worker
yöntemi otomatik çalıştırılmaz ve bu dağıtım için kullanılmaz.

## 3. Domain

Cloudflare'da örnek alt alan adı:

```text
prova.sokakvitrini.com → Vercel CNAME
```

## 4. İlk ürün operasyonu

- 360° için 24–36 kare çekin.
- Manken modu için şeffaf PNG hazırlayın.
- GLB yalnız sert formlu ürünlerde kullanın.
- AI sonucunu gerçek ürün ölçüsü veya beden garantisi olarak sunmayın.

