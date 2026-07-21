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

### RunPod Serverless

- Docker imajını registry'ye gönderin.
- RunPod Serverless template oluşturun.
- Container command: `python -u runpod_handler.py`
- Endpoint ID ve API key'i Vercel ortam değişkenlerine girin.
- Minimum worker sayısını `0` tutarsanız boşta GPU çalışmaz; ilk istek soğuk başlatma bekler.

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
