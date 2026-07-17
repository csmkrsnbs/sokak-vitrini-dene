# Hızlı Canlıya Alma Listesi

## Neon

- [ ] Pooled bağlantı `DATABASE_URL` olarak tanımlandı.
- [ ] `npm run db:migrate` başarıyla tamamlandı.
- [ ] Mevcut etkin kuponların kalan hakları migration sonrasında korundu.

## RunPod

- [ ] Worker imajı GHCR'a gönderildi ve endpoint'e bağlandı.
- [ ] Farklı veri merkezlerindeki network volume seçenekleri endpoint'e eklendi.
- [ ] `workersMin=0`, `workersMax=1` ve uygun idle timeout seçildi.
- [ ] Worker loglarında FLUX ve güvenlik modellerinin önbellekten yüklendiği görüldü.
- [ ] Uygun test tamamlandı; yasak içerik `UNSAFE_CONTENT` ile reddedildi.
- [ ] RunPod düşük bakiye bildirimi etkinleştirildi.

## Vercel

- [ ] `.env.example` içindeki Production değişkenleri eklendi.
- [ ] `IP_RISK_CACHE_HOURS=168` ayarlandı.
- [ ] `DAILY_GENERATION_LIMIT=20` veya seçilen günlük tavan eklendi.
- [ ] `ADMIN_ACCESS_KEY` ve `COUPON_SIGNING_SECRET` birbirinden farklı uzun değerler.
- [ ] Build komutu `npm run vercel-build`.
- [ ] Deploy başarılı ve `/api/health` durumu `ready`.
- [ ] Özel alan adı ile `NEXT_PUBLIC_APP_URL` eşleşiyor.

## Hak ve kupon testi

- [ ] Kullanıcı ekranında fiyat, paket, IBAN veya ödeme ifadesi görünmüyor.
- [ ] İlk 2 başarılı üretimden sonra yalnızca “Kupon ekle” ekranı açılıyor.
- [ ] `/yonetim/kuponlar` adresinde 1 haklı test kuponu oluşturuldu.
- [ ] Açık kod yalnızca oluşturma sonucunda gösterildi ve kopyalandı.
- [ ] Kupon etkinleştirildi; başarılı üretimde hak 1 azaldı.
- [ ] Başarısız üretimde ücretsiz veya kupon hakkı geri geldi.
- [ ] Etkin kupon yönetim ekranından kapatıldı.
- [ ] Son kullanım tarihi geçmiş kupon kabul edilmedi.

## Ağ ve kapasite testi

- [ ] IPQualityScore çalışırken tespit edilen VPN/proxy/Tor ücretsiz denemede engellendi.
- [ ] IPQualityScore kota veya zaman aşımı verirken site diğer sınırlarla üretime devam etti.
- [ ] Günlük genel kapasite dolduğunda RunPod işi oluşmadı ve kullanıcı hakkı düşmedi.
- [ ] Günlük sınır İstanbul tarihinde yenilendi.

## Yayın öncesi

```bash
npm run check
```
