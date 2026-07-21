# Sokak Vitrini Dene — Canlıya Alma

## 1. Neon veritabanı oluştur

Neon panelinde yeni PostgreSQL projesi oluşturun. `Pooled connection` bağlantısını kopyalayın ve Vercel ortam değişkenine ekleyin:

```env
DATABASE_URL="postgresql://..."
```

## 2. FASHN API anahtarı oluştur

FASHN hesabınızdan API anahtarı alın ve canlı ortamda yalnız sunucu değişkeni olarak ekleyin:

```env
FASHN_API_KEY="fa_..."
```

Anahtarı kaynak koda, GitHub deposuna veya `NEXT_PUBLIC_` ile başlayan değişkene koymayın.

## 3. Vercel ortam değişkenlerini ekle

Vercel → Project → Settings → Environment Variables bölümünde aşağıdakileri Production, Preview ve gerekiyorsa Development ortamlarına ekleyin:

```env
DATABASE_URL="..."
FASHN_API_KEY="fa_..."
FASHN_CLOTHING_MODEL="tryon-v1.6"
FASHN_WEARABLE_MODEL="tryon-max"
FASHN_STUDIO_MODEL="product-to-model"
FASHN_CLOTHING_MODE="balanced"
FASHN_MAX_MODE="fast"
FASHN_STUDIO_MODE="fast"
FASHN_RESOLUTION="1k"
FASHN_OUTPUT_FORMAT="jpeg"
NEXT_PUBLIC_APP_URL="https://dene.sokakvitrini.com"
IMAGE_RETENTION_DAYS="30"
PREVIEW_JOB_MAX_AGE_MS="900000"
DAILY_GENERATION_LIMIT="20"
RATE_LIMIT_SALT="32-karakterden-uzun-rastgele-deger"
CRON_SECRET="32-karakterden-uzun-farkli-rastgele-deger"
ADMIN_ACCESS_KEY="32-karakterden-uzun-yonetici-anahtari"
COUPON_SIGNING_SECRET="32-karakterden-uzun-farkli-kupon-anahtari"
```

Rastgele anahtarları yerel bilgisayarınızda şu komutla oluşturabilirsiniz:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Her secret için komutu yeniden çalıştırın; aynı değeri tekrar kullanmayın.

## 4. Deploy et

Proje GitHub’a yüklüyse Vercel’de depoyu içe aktarın. Build komutu `vercel.json` ve `package.json` üzerinden otomatik olarak:

```text
npm run vercel-build
```

çalışır. Bu komut önce Drizzle migration’larını uygular, sonra Next.js build alır.

## 5. Domain bağla

Vercel → Project → Settings → Domains bölümüne:

```text
dene.sokakvitrini.com
```

ekleyin. Vercel’in verdiği CNAME hedefini Cloudflare DNS’e girin. DNS kaydı doğrulandıktan sonra `NEXT_PUBLIC_APP_URL` değerinin canlı alan adıyla aynı olduğundan emin olun ve yeniden deploy edin.

## 6. Canlı kontrol

Aşağıdaki adresi açın:

```text
https://dene.sokakvitrini.com/api/health
```

Beklenen sonuç:

```json
{
  "status": "ready"
}
```

`not_ready` dönüyorsa `checks` alanında eksik bölüm görünür. Anahtarların kendisi yanıt içinde gösterilmez.

## 7. İlk kuponu oluştur

```text
https://dene.sokakvitrini.com/yonetim/kuponlar
```

adresine gidin. `ADMIN_ACCESS_KEY` ile giriş yapın ve test için 1 haklık kupon oluşturun. Kod yalnız oluşturulduğu anda görünür; güvenli yere kopyalayın.

## 8. Uçtan uca test

1. Ana sayfadan kuponu etkinleştirin.
2. “Kendimde dene” modunda ürün ve yetişkin kişi fotoğrafı yükleyin.
3. Sonucun geçmişte göründüğünü, indirilebildiğini ve silinebildiğini kontrol edin.
4. Dijital profili kaydedip ikinci üründe yeniden kullanın.
5. “İşletme stüdyosu” modunda yalnız ürün fotoğrafıyla model görseli üretin.
6. Hatalı işlemde kupon hakkının geri geldiğini kontrol edin.

## 9. Cron temizliği

`vercel.json`, `/api/cron/cleanup` rotasını 15 dakikada bir çağırır. Vercel Cron çağrısının `CRON_SECRET` ile yetkilendirildiğini ve Deployment Logs içinde başarılı çalıştığını kontrol edin.

## 10. Son güvenlik kontrolü

- Git deposunda `.env`, `.env.local` veya başka gerçek secret dosyası bulunmamalı.
- `FASHN_API_KEY` yalnız sunucu tarafında kullanılmalı.
- Yönetici anahtarı ve kupon imza anahtarı birbirinden farklı olmalı.
- Gizlilik ve Kullanım Koşulları sayfaları canlı işletmenin gerçek unvan ve iletişim bilgileriyle tamamlanmalı.
- Yetişkin moda denemelerinde yalnız 18+ ve açık olmayan moda/katalog içeriği kabul edilmeli.
