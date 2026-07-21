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

### RunPod Serverless Queue — GHCR yöntemi

RunPod GitHub builder cache aşamasında takılırsa doğrudan GitHub deposundan build kullanmayın. Projedeki workflow Docker imajını GitHub Container Registry'ye yayınlar:

```text
.github/workflows/publish-vton-worker.yml
```

1. Projeyi `main` branch'ine push edin.
2. GitHub → Actions → **VTON Worker Image** çalışmasının tamamlanmasını bekleyin.
3. `ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton:latest` paketini GitHub Packages ayarından public yapın.
4. RunPod'da **Import from Docker Registry / Container Image** ile yeni Queue endpoint oluşturun.
5. Container image alanına GHCR adresini yazın.
6. **Cached model** alanına `fashn-ai/fashn-vton-1.5` yazın.
7. Active workers `0`, Max workers `1`, GPU count `1`, execution timeout `600` saniye kullanın.
8. Endpoint ID ve API key'i Vercel ortam değişkenlerine girin.

```env
VTON_PROVIDER="runpod"
RUNPOD_ENDPOINT_ID="..."
RUNPOD_API_KEY="..."
```

Ayrıntılı ekran sırası: `GHCR_RUNPOD_KURULUM.md`

Web uygulaması Queue endpoint'in `/runsync` çağrısını kullanır. Active worker `0` olduğunda boşta GPU çalışmaz; ilk istek soğuk başlatma bekleyebilir.

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

## RunPod v6-light Worker

Uzun süre `Initializing` durumunda kalan eski image yerine hafif Queue worker kullanılır. Yeni Dockerfile RunPod PyTorch tabanını kullanır, web sunucusu bağımlılıklarını Queue imajından çıkarır ve `health` / `warmup` teşhis işlerini destekler. Kurulum sırası: `RUNPOD_V6_HAFIF_WORKER.md`.
