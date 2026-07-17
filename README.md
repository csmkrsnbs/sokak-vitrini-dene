# Sokak Vitrini Dene

**Sokakta gör. Kendinde dene.**

Vitrinde görülen takı, kıyafet, mobilya veya otomobili iki referans fotoğrafla
kişinin üzerinde ya da hedef mekânda gösteren Next.js uygulamasıdır.

## Özellikler

- Takı, giyim, mobilya ve otomobil için kategoriye özel yerleştirme
- Mobil kameradan veya galeriden fotoğraf seçme, boyutlandırma ve sıkıştırma
- RunPod Serverless üzerinde açık kaynaklı FLUX.2 ile asenkron görsel üretimi
- Aynı GPU worker'ında kaynak ve sonuç için yetişkin, çocuk, siyasi, şiddet,
  silah ve nefret/aşırılık içeriği denetimi
- Neon PostgreSQL ile anonim oturum, sonuç geçmişi ve atomik kullanım hakkı
- Aylık yenilenmeyen toplam 2 ücretsiz önizleme hakkı
- Kampanya, tanıtım ve iş birlikleri için yönetici tarafından oluşturulan kuponlar
- IPQualityScore çalıştığında VPN/proxy/Tor engeli; servis kesintisinde güvenli
  yerel sınırlarla devam eden ücretsiz deneme
- İstanbul saatine göre yapılandırılabilir günlük genel üretim kapasitesi
- Başarısız üretimde ücretsiz veya kupon hakkının otomatik iadesi
- Kaynak fotoğrafları veritabanında saklamayan gizlilik odaklı akış
- Sonuç indirme, cihaz paylaşım menüsü, geçmiş ve kalıcı silme

Uygulama içinde fiyat, paket, IBAN veya ödeme akışı bulunmaz. Kuponlar yalnızca
önceden tanımlanan ek önizleme hakkını temsil eder.

## Teknoloji

- Next.js 16 App Router, React 19 ve TypeScript
- Neon Serverless PostgreSQL ve Drizzle ORM
- Apache 2.0 lisanslı FLUX.2 klein 4B
- RunPod Serverless GPU worker
- Vercel dağıtım ve günlük cron görevi

## Yerelde çalıştırma

Gereksinimler: Node.js 20.9+, Neon PostgreSQL ve yayınlanmış RunPod endpoint'i.

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Tarayıcı adresi: `http://localhost:3000`

En az 32 karakterlik gizli değerleri şu komutla üretebilirsiniz:

```bash
openssl rand -hex 32
```

## Ortam değişkenleri

```env
DATABASE_URL="postgresql://...-pooler.../neondb?sslmode=require&channel_binding=require"
RUNPOD_API_KEY="rpa_..."
RUNPOD_ENDPOINT_ID="endpoint-id"
RUNPOD_TIMEOUT_MS="240000"
RUNPOD_JOB_TTL_MS="900000"
PREVIEW_JOB_MAX_AGE_MS="1200000"
FLUX_IMAGE_MODEL="black-forest-labs/FLUX.2-klein-4B"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
IMAGE_RETENTION_DAYS="30"
IPQS_API_KEY="ipqs-private-key"
IP_RISK_CACHE_HOURS="168"
DAILY_GENERATION_LIMIT="20"
RATE_LIMIT_SALT="en-az-32-karakter-rastgele-deger"
CRON_SECRET="farkli-en-az-32-karakter-rastgele-deger"
ADMIN_ACCESS_KEY="farkli-en-az-32-karakter-yonetim-anahtari"
COUPON_SIGNING_SECRET="farkli-en-az-32-karakter-kupon-anahtari"
```

`IPQS_API_KEY` isteğe bağlıdır. Tanımlı ve erişilebilir olduğunda tespit edilen
VPN, proxy ve Tor bağlantıları ücretsiz denemeden yararlanamaz. Sağlayıcı kota,
zaman aşımı veya bağlantı hatası verirse site kapanmaz; toplam ücretsiz hak,
anonim oturum/bağlantı özeti ve günlük genel kapasite uygulanmaya devam eder.

`DAILY_GENERATION_LIMIT` tüm ücretsiz ve kuponlu isteklerin günlük toplam
kapasitesidir. Sınır dolduğunda RunPod işi oluşturulmaz ve kullanıcı hakkı düşmez.

## Vercel üzerinden canlıya alma

1. Depoyu GitHub'a gönderin ve Vercel'e aktarın.
2. Neon'un pooled bağlantısını `DATABASE_URL` olarak ekleyin.
3. `.env.example` içindeki Production değişkenlerini Vercel'e ekleyin.
4. Build komutunu `npm run vercel-build` olarak bırakın; migration otomatik uygulanır.
5. Deploy sonrasında `/api/health` adresinin `ready` döndürdüğünü kontrol edin.

Hazır sağlık yanıtındaki temel alanlar:

```json
{
  "status": "ready",
  "checks": {
    "databaseConfigured": true,
    "databaseReachable": true,
    "schemaReady": true,
    "aiConfigured": true,
    "couponConfigured": true,
    "securityConfigured": true,
    "aiProvider": "runpod"
  }
}
```

## Kupon yönetimi

- Yönetici `/yonetim/kuponlar` adresinde `ADMIN_ACCESS_KEY` ile giriş yapar.
- Kampanya adı, 1–100 arası önizleme hakkı ve isteğe bağlı son kullanım tarihi seçilir.
- Açık kupon kodu yalnızca oluşturulduğu anda gösterilir; veritabanında HMAC özeti tutulur.
- Her başarılı üretim bir hak düşürür; başarısız veya güvenlik nedeniyle durdurulan
  üretimde hak otomatik iade edilir.
- Etkin kupon yönetim ekranından kullanıma kapatılabilir.
- Önceki sürümden kalan etkin kuponların kod özetleri ve kalan hakları korunur.

## Veri davranışı

- Ürün ve hedef fotoğrafları Neon'a yazılmaz; yalnızca RunPod iş kuyruğunda geçici işlenir.
- Sonuç görseli tarayıcıya özel geçmiş için sınırlı süre saklanır.
- Ham IP veritabanında tutulmaz; kötüye kullanım kontrolü için tuzlanmış SHA-256 özeti kullanılır.
- IPQualityScore sonucu varsayılan 168 saat önbelleklenir.
- `/api/cron/cleanup`, süre aşımına uğrayan işleri iade eder ve eski sonuçları temizler.

## Komutlar

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check
npm run db:generate
npm run db:migrate
```

## Önemli dosyalar

```text
app/api/previews/                 Önizleme, geçmiş ve silme API'leri
app/api/coupons/redeem/           Kupon etkinleştirme API'si
app/api/admin/coupons/            Güvenli kupon yönetimi API'si
app/yonetim/kuponlar/             Gizli kupon yönetim ekranı
components/credit-access.tsx      Ücretsiz hak ve kupon arayüzü
lib/server/access.ts              Atomik hak ve günlük kapasite yönetimi
lib/server/network-risk.ts        En iyi çabayla VPN/proxy/Tor kontrolü
lib/server/runpod-image.ts        RunPod ve FLUX.2 entegrasyonu
runpod-worker/                    GPU worker ve Docker dosyaları
lib/db/schema.ts                  Neon/Drizzle şeması
```

## Model lisansı

Worker üretimde Apache 2.0 lisanslı `black-forest-labs/FLUX.2-klein-4B`, yetişkin
içerik sınıflandırmasında Apache 2.0 lisanslı `Falconsai/nsfw_image_detection`
ve diğer sabit güvenlik sınıflarında MIT lisanslı OpenAI CLIP modelini kullanır.
Buradaki OpenAI CLIP yerel açık kaynak modelidir; OpenAI API veya OpenAI üretim
kotası kullanılmaz.
