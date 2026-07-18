# Hızlı Canlıya Alma Listesi

## Neon

- [ ] Pooled bağlantı `DATABASE_URL` olarak tanımlandı.
- [ ] `npm run db:migrate` başarıyla tamamlandı.
- [ ] `coupon_codes.claimed_session_id` kolonu migration ile oluştu.
- [ ] Mevcut etkin kuponların kalan hakları migration sonrasında korundu.

## RunPod

- [ ] Worker imajı GHCR'a gönderildi ve endpoint'e bağlandı.
- [ ] Farklı veri merkezlerindeki network volume seçenekleri endpoint'e eklendi.
- [ ] `workersMin=0`, `workersMax=1` ve uygun idle timeout seçildi.
- [ ] Worker loglarında FLUX ve güvenlik modellerinin önbellekten yüklendiği görüldü.
- [ ] 24 GB GPU için `SAFETY_DEVICE=cpu` ayarlandı; FLUX GPU belleği güvenlik modelleriyle paylaşmıyor.
- [ ] Uygun test tamamlandı; yasak içerik `UNSAFE_CONTENT` ile reddedildi.
- [ ] Kırmızı kıyafet gibi güvenli örnekler şiddet filtresinde yanlış pozitif üretmedi.
- [ ] RunPod düşük bakiye bildirimi etkinleştirildi.

## Vercel

- [ ] `.env.example` içindeki Production değişkenleri eklendi.
- [ ] `DAILY_GENERATION_LIMIT=20` veya seçilen günlük tavan eklendi.
- [ ] `ADMIN_ACCESS_KEY` ve `COUPON_SIGNING_SECRET` birbirinden farklı uzun değerler.
- [ ] Build komutu `npm run vercel-build`.
- [ ] Deploy başarılı ve `/api/health` durumu `ready`.
- [ ] Özel alan adı ile `NEXT_PUBLIC_APP_URL` eşleşiyor.

## Hak ve kupon testi

- [ ] Kullanıcı ekranında fiyat, paket, IBAN veya ödeme ifadesi görünmüyor.
- [ ] Kupon etkinleştirilmeden önizleme isteği `CREDITS_REQUIRED` ile reddediliyor.
- [ ] `/yonetim/kuponlar` adresinde 1 haklı test kuponu oluşturuldu.
- [ ] Açık kod yalnızca oluşturma sonucunda gösterildi ve kopyalandı.
- [ ] Kupon etkinleştirildi; başarılı üretimde hak 1 azaldı.
- [ ] Aynı kupon aynı tarayıcıda kullanılabildi, farklı tarayıcıda `COUPON_ALREADY_CLAIMED` ile reddedildi.
- [ ] Yönetim API'si 3'ten fazla hak ve 7–30 gün dışındaki süreyi reddetti.
- [ ] Başarısız üretimde kupon hakkı geri geldi.
- [ ] Etkin kupon yönetim ekranından kapatıldı.
- [ ] Son kullanım tarihi geçmiş kupon kabul edilmedi.

## Kapasite testi

- [ ] Günlük genel kapasite dolduğunda RunPod işi oluşmadı ve kullanıcı hakkı düşmedi.
- [ ] Günlük sınır İstanbul tarihinde yenilendi.

## Yayın öncesi

```bash
npm run check
```
