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
- [ ] IPQualityScore Private Key, `IPQS_API_KEY` adıyla Production ortamına eklendi.
- [ ] `IP_RISK_CACHE_HOURS=24` eklendi.
- [ ] `PAYMENT_BANK_NAME`, `PAYMENT_ACCOUNT_HOLDER` ve `PAYMENT_IBAN` eklendi.
- [ ] Birbirinden farklı uzun değerlerle `ADMIN_ACCESS_KEY` ve `COUPON_SIGNING_SECRET` eklendi.
- [ ] Build komutu `npm run vercel-build`.
- [ ] `0002_clear_deadpool` asenkron iş migration'ı deploy sırasında uygulandı.
- [ ] `0003_neat_wallow` VPN kontrol önbelleği migration'ı deploy sırasında uygulandı.
- [ ] `0004_clean_runtime_data` tek seferlik temiz veri migration'ı deploy sırasında uygulandı.
- [ ] Deploy başarılı.
- [ ] `/api/health` cevabındaki bütün kontroller `true`.
- [ ] Özel alan adı bağlandı ve `NEXT_PUBLIC_APP_URL` bu adresle güncellendi.
- [ ] Mobil cihazdan bir ürün ve hedef fotoğrafla gerçek deneme tamamlandı.
- [ ] Sonuç indirildi, paylaşıldı ve geçmişten silme kontrol edildi.

## IBAN ve kupon testi

- [ ] İlk 2 başarılı üretimden sonra paket penceresi otomatik açıldı.
- [ ] Standart Paket ekranında 10 görsel / 100 TL ve doğru IBAN göründü.
- [ ] Test ödeme talebindeki havale açıklaması banka hareketiyle eşleşti.
- [ ] `/yonetim/odemeler` adresinde yönetim anahtarıyla giriş yapıldı.
- [ ] Bekleyen ödeme onaylandı ve kullanıcı ekranında kupon göründü.
- [ ] Kupon etkinleştirildi; başarılı üretimde bakiye 10'dan 9'a düştü.
- [ ] Başarısız üretimde kredi geri geldi.
- [ ] VPN açıkken ücretsiz deneme engellendi ve RunPod işi oluşmadı.
- [ ] VPN açıkken geçerli ücretli kuponla üretim tamamlandı.
- [ ] Reddedilmiş bir ödeme talebi yönetim ekranından kalıcı olarak silindi.

## Yayın öncesi son kontrol

```bash
npm run check
```
