# Hızlı Canlıya Alma Listesi

## Neon

- [ ] Neon'da yeni proje oluşturuldu.
- [ ] **Pooled connection** adresi `DATABASE_URL` olarak kopyalandı.
- [ ] `npm run db:migrate` migration'ı başarıyla tamamladı.

## RunPod ve açık kaynak model

- [ ] GitHub Actions, `runpod-worker` Docker imajını GHCR'a gönderdi.
- [ ] GHCR paketi public yapıldı veya RunPod'a registry bilgileri eklendi.
- [ ] RunPod Serverless endpoint'i 16–24 GB NVIDIA GPU ile oluşturuldu.
- [ ] `workersMin=0`, `workersMax=1`, idle timeout `60` saniye ve FlashBoot seçildi.
- [ ] Kalıcı Hugging Face önbelleği için mümkünse farklı veri merkezlerinden iki network volume bağlandı.
- [ ] `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID` ve FLUX.2 ayarları Vercel'e eklendi.
- [ ] İlk model indirme/ısınma isteği RunPod panelinden tamamlandı.

## Vercel

- [ ] README'deki ortam değişkenleri Production ortamına eklendi.
- [ ] `PAYMENT_BANK_NAME`, `PAYMENT_ACCOUNT_HOLDER` ve `PAYMENT_IBAN` eklendi.
- [ ] Birbirinden farklı uzun değerlerle `ADMIN_ACCESS_KEY` ve `COUPON_SIGNING_SECRET` eklendi.
- [ ] Build komutu `npm run vercel-build`.
- [ ] `0002_clear_deadpool` asenkron iş migration'ı deploy sırasında uygulandı.
- [ ] Deploy başarılı.
- [ ] `/api/health` cevabındaki bütün kontroller `true`.
- [ ] Özel alan adı bağlandı ve `NEXT_PUBLIC_APP_URL` bu adresle güncellendi.
- [ ] Mobil cihazdan bir ürün ve hedef fotoğrafla gerçek deneme tamamlandı.
- [ ] Sonuç indirildi, paylaşıldı ve geçmişten silme kontrol edildi.

## IBAN ve kupon testi

- [ ] İlk 3 başarılı üretimden sonra paket penceresi otomatik açıldı.
- [ ] Standart Paket ekranında 10 görsel / 49 TL ve doğru IBAN göründü.
- [ ] Test ödeme talebindeki havale açıklaması banka hareketiyle eşleşti.
- [ ] `/yonetim/odemeler` adresinde yönetim anahtarıyla giriş yapıldı.
- [ ] Bekleyen ödeme onaylandı ve kullanıcı ekranında kupon göründü.
- [ ] Kupon etkinleştirildi; başarılı üretimde bakiye 10'dan 9'a düştü.
- [ ] Başarısız üretimde kredi geri geldi.

## Yayın öncesi son kontrol

```bash
npm run check
```
