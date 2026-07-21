# Canlıya Alma

## 1. Vercel

1. Projeyi GitHub'a gönderin.
2. Vercel'de yeni proje oluşturun.
3. `.env.example` içindeki gerekli değişkenleri Vercel Environment Variables alanına ekleyin.
4. Deploy edin.

## 2. GPU servisi

### Direct Pod / GPU VPS

`gpu-service` klasöründe:

```bash
docker build -t sv-prova-gpu .
docker run --gpus all -p 8000:8000 \
  -e VTON_SHARED_SECRET="uzun-rastgele-deger" \
  sv-prova-gpu
```

Servis kontrolü:

```bash
curl https://GPU-ADRESI/health
```

### RunPod Serverless Queue

1. RunPod panelinde **Serverless → New Endpoint → Import Git Repository** yolunu açın.
2. GitHub deposunu ve `main` branch'ini seçin.
3. Dockerfile Path alanına `gpu-service/Dockerfile.runpod` yazın.
4. Endpoint Type olarak `Queue` seçin.
5. Minimum Worker değerini `0`, Maximum Worker değerini `1` yapın.
6. Endpoint oluşturulduktan sonra Endpoint ID ve API key'i Vercel ortam değişkenlerine girin.

```env
VTON_PROVIDER="runpod"
RUNPOD_ENDPOINT_ID="..."
RUNPOD_API_KEY="..."
```

Web uygulaması Queue endpoint'in `/runsync` çağrısını kullanır. Minimum worker `0` olduğunda boşta GPU çalışmaz; ilk istek soğuk başlatma bekleyebilir.

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
