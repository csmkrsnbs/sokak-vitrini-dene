# Hızlı Canlıya Alma Listesi

## Neon

- [ ] Pooled bağlantı `DATABASE_URL` olarak tanımlandı.
- [ ] `npm run db:migrate` başarıyla tamamlandı.
- [ ] Mevcut etkin kuponların kalan hakları migration sonrasında korundu.

## RunPod

- [ ] FLUX ve VTON worker imajları GHCR'a gönderildi; iki ayrı endpoint'e bağlandı.
- [ ] FLUX network volume'ları yalnızca FLUX endpoint'inde kaldı.
- [ ] VTON endpoint'inde network volume kaldırıldı ve Cached model alanına `fashn-ai/fashn-vton-1.5` yazıldı.
- [ ] VTON data center kısıtı kaldırıldı; 16 GB GPU'lar birinci, standart 24 GB GPU'lar ikinci öncelikte.
- [ ] VTON için `workersMin=0`, `workersMax=1`, `GPU count=1` ve idle timeout `10` saniye seçildi.
- [ ] VTON container disk en az `10 GB` ve FlashBoot açık.
- [ ] Worker loglarında FLUX ve güvenlik modellerinin önbellekten yüklendiği görüldü.
- [ ] VTON logunda `VTON weights ready` görüldü; çalışma anında Hugging Face indirmesi başlamadı.
- [ ] VTON loglarında FASHN, DWPose ve insan ayrıştırma modellerinin yüklendiği görüldü.
- [ ] `SAFETY_DEVICE=cpu` ayarlandı; güvenlik modelleri 16 GB GPU belleğini tüketmiyor.
- [ ] Uygun test tamamlandı; yasak içerik `UNSAFE_CONTENT` ile reddedildi.
- [ ] Gömlek/ceket `tops`, pantolon/etek `bottoms`, elbise/tulum `one-pieces` ile test edildi.
- [ ] Kırmızı kıyafet gibi güvenli örnekler şiddet filtresinde yanlış pozitif üretmedi.
- [ ] RunPod düşük bakiye bildirimi etkinleştirildi.

## Vercel

- [ ] `.env.example` içindeki Production değişkenleri eklendi.
- [ ] `RUNPOD_VTON_ENDPOINT_ID` ve `VTON_IMAGE_MODEL` Production ortamına eklendi.
- [ ] `IP_RISK_CACHE_HOURS=168` ayarlandı.
- [ ] `DAILY_GENERATION_LIMIT=20` veya seçilen günlük tavan eklendi.
- [ ] `ADMIN_ACCESS_KEY` ve `COUPON_SIGNING_SECRET` birbirinden farklı uzun değerler.
- [ ] Build komutu `npm run vercel-build`.
- [ ] Deploy başarılı; `/api/health` içinde `fluxConfigured`, `clothingConfigured` ve durum `ready`.
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
