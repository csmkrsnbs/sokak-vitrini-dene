# Hızlı Canlıya Alma Listesi

## Neon

- [ ] Neon'da yeni proje oluşturuldu.
- [ ] **Pooled connection** adresi `DATABASE_URL` olarak kopyalandı.
- [ ] `npm run db:migrate` migration'ı başarıyla tamamladı.

## RunPod ve açık kaynak model

- [ ] GitHub Actions, `runpod-worker` Docker imajını GHCR'a gönderdi.
- [ ] GHCR paketi public yapıldı veya RunPod'a registry bilgileri eklendi.
- [ ] RunPod Serverless endpoint'i 16–24 GB NVIDIA GPU ile oluşturuldu.
- [ ] `workersMin=0`, `workersMax=1` ve kısa idle timeout seçildi.
- [ ] Kalıcı Hugging Face önbelleği için network volume bağlandı.
- [ ] `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID` ve FLUX.2 ayarları Vercel'e eklendi.
- [ ] İlk model indirme/ısınma isteği RunPod panelinden tamamlandı.

## Vercel

- [ ] README'deki ortam değişkenleri Production ortamına eklendi.
- [ ] Build komutu `npm run vercel-build`.
- [ ] Deploy başarılı.
- [ ] `/api/health` cevabındaki bütün kontroller `true`.
- [ ] Özel alan adı bağlandı ve `NEXT_PUBLIC_APP_URL` bu adresle güncellendi.
- [ ] Mobil cihazdan bir ürün ve hedef fotoğrafla gerçek deneme tamamlandı.
- [ ] Sonuç indirildi, paylaşıldı ve geçmişten silme kontrol edildi.

## Yayın öncesi son kontrol

```bash
npm run check
```
