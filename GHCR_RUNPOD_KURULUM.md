# GitHub Container Registry → RunPod Kurulumu

Bu yöntem RunPod'un GitHub builder aşamasını kullanmaz. Docker imajı GitHub Actions tarafından oluşturulur, GitHub Container Registry'ye (GHCR) gönderilir ve RunPod imajı doğrudan registry'den çeker.

## 1. Dosyaları GitHub'a gönder

```bash
git add .
git commit -m "ci: VTON worker imajını GHCR üzerinden yayınla"
git push
```

Push sonrasında GitHub deposunda:

```text
Actions → VTON Worker Image
```

workflow'u otomatik başlar. Gerekirse **Run workflow** ile elle de başlatılabilir.

## 2. Workflow sonucunu kontrol et

Bütün adımlar yeşil olduğunda imaj adresi:

```text
ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton:latest
```

Aynı adres workflow özetinde de yazdırılır.

## 3. GHCR paketini public yap

GitHub profilinde:

```text
Profile → Packages → sokak-vitrini-dene-vton
→ Package settings
→ Change visibility
→ Public
```

Paket public yapılırsa RunPod registry kullanıcı adı/parolası istemeden imajı çekebilir.

Paket private bırakılırsa RunPod'da GHCR registry kimlik bilgisi oluşturulmalıdır. Public yöntem bu proje için daha basittir.

## 4. Eski başarısız endpoint'i kaldır

RunPod'da GitHub builder ile oluşturulan, build'i başarısız olan endpoint'i silin. Çalışan worker olmadığı için silme sırasında GPU işlemi kesilmez.

## 5. Registry imajından yeni endpoint oluştur

RunPod panelinde:

```text
Serverless → New Endpoint
→ Import from Docker Registry / Container Image
```

Container Image:

```text
ghcr.io/csmkrsnbs/sokak-vitrini-dene-vton:latest
```

Endpoint ayarları:

```text
Endpoint name: sokak-vitrini-dene
Endpoint type: Queue
GPU: 24 GB normal seçenek
Max workers: 1
Active workers: 0
GPU count: 1
Idle timeout: 5 sec
Execution timeout: 600 sec
FlashBoot: açık
Network volume: yok
Auto scaling: Queue delay
Queue delay: 4 sec
```

## 6. Vercel değişkenleri

Yeni endpoint oluşturulduktan sonra Endpoint ID ve RunPod API key'i Vercel'e ekleyin:

```env
VTON_PROVIDER="runpod"
RUNPOD_ENDPOINT_ID="..."
RUNPOD_API_KEY="..."
VTON_REQUEST_TIMEOUT_MS="180000"
VTON_MAX_UPLOAD_MB="12"
```

Ardından Vercel'de redeploy yapın.

## Güvenlik

- RunPod API anahtarını GitHub'a veya proje dosyalarına yazmayın.
- GHCR imajında kullanıcı fotoğrafı veya işletme verisi bulunmaz.
- Her kod değişikliğinde `gpu-service/**` değişirse yeni `latest` imajı otomatik yayınlanır.
