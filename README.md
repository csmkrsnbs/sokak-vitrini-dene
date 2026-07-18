# Sokak Vitrini Dene

**Sokakta gör. Kendinde dene.**

Vitrinde görülen takı, kıyafet, mobilya veya otomobili iki referans fotoğrafla
kişinin üzerinde ya da hedef mekânda gösteren Next.js uygulamasıdır.

## Özellikler

- Giyim için self-host FASHN VTON 1.5; takı, mobilya ve otomobil için RunPod FLUX.2
- Gömlek, ceket, elbise, yetişkin iç çamaşırı, mayo, korse, body ve fantezi giyim desteği
- Üst, alt ve tek parça seçimiyle giyime özel sanal deneme
- Mobil kameradan veya galeriden fotoğraf seçme, boyutlandırma ve sıkıştırma
- İki RunPod endpoint'inde asenkron iş başlatma, durum izleme ve başarısızlıkta hak iadesi
- Giyimde yetişkin iç giyimine izin veren; açık çıplaklık ve cinsel eylemi engelleyen yerel denetim
- Tüm kategorilerde worker kaynak ve sonuç güvenlik denetimi
- Neon PostgreSQL ile anonim oturum, sonuç geçmişi ve atomik kullanım hakkı
- Yalnızca yönetici tarafından oluşturulan geçerli kuponla önizleme erişimi
- Kampanya, tanıtım ve iş birlikleri için 1–3 haklı, 7–30 gün süreli kuponlar
- Kuponu ilk etkinleştiren anonim tarayıcı oturumuna atomik bağlama
- İstanbul saatine göre yapılandırılabilir günlük genel üretim kapasitesi
- Başarısız üretimde kupon hakkının otomatik iadesi
- Kaynak fotoğrafları veritabanında saklamayan gizlilik odaklı akış
- Sonuç indirme, cihaz paylaşım menüsü, geçmiş ve kalıcı silme

Uygulama içinde fiyat, paket, IBAN veya ödeme akışı bulunmaz. Kuponlar yalnızca
önceden tanımlanan önizleme hakkını temsil eder; ücretsiz deneme bulunmaz.

## Teknoloji

- Next.js 16 App Router, React 19 ve TypeScript
- Neon Serverless PostgreSQL ve Drizzle ORM
- Apache-2.0 lisanslı FASHN VTON 1.5 modelinin flat-lay/maskless self-host sürümü
- Apache 2.0 lisanslı FLUX.2 klein 4B ve RunPod Serverless GPU worker
- Vercel dağıtım ve günlük cron görevi

## Yerelde çalıştırma

Gereksinimler: Node.js 20.9+, Neon PostgreSQL, yayınlanmış FLUX ve VTON RunPod
endpoint'leri. Ücretli FASHN API anahtarı gerekmez.

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
RUNPOD_VTON_ENDPOINT_ID="vton-endpoint-id"
RUNPOD_TIMEOUT_MS="240000"
RUNPOD_JOB_TTL_MS="900000"
RUNPOD_VTON_EXECUTION_TIMEOUT_MS="300000"
RUNPOD_VTON_JOB_TTL_MS="1200000"
PREVIEW_JOB_MAX_AGE_MS="1200000"
FLUX_IMAGE_MODEL="black-forest-labs/FLUX.2-klein-4B"
VTON_IMAGE_MODEL="fashn-ai/fashn-vton-1.5-flat-lay"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
IMAGE_RETENTION_DAYS="30"
DAILY_GENERATION_LIMIT="20"
RATE_LIMIT_SALT="en-az-32-karakter-rastgele-deger"
CRON_SECRET="farkli-en-az-32-karakter-rastgele-deger"
ADMIN_ACCESS_KEY="farkli-en-az-32-karakter-yonetim-anahtari"
COUPON_SIGNING_SECRET="farkli-en-az-32-karakter-kupon-anahtari"
```

`DAILY_GENERATION_LIMIT` tüm kuponlu isteklerin günlük toplam kapasitesidir.
Sınır dolduğunda sağlayıcı işi oluşturulmaz ve kullanıcının kupon hakkı düşmez.
Giyim önizlemesinde ayrıca FASHN sağlayıcı kredisi yoktur; yalnız RunPod GPU
kullanımı oluşur. Başarısız işte uygulama kupon hakkını iade eder.

## Vercel üzerinden canlıya alma

1. Depoyu GitHub'a gönderin ve Vercel'e aktarın.
2. Neon'un pooled bağlantısını `DATABASE_URL` olarak ekleyin.
3. `runpod-vton-worker` imajından ayrı giyim endpoint'i oluşturun ve kimliğini
   `RUNPOD_VTON_ENDPOINT_ID` olarak ekleyin.
4. `.env.example` içindeki diğer Production değişkenlerini Vercel'e ekleyin.
5. Build komutunu `npm run vercel-build` olarak bırakın; migration otomatik uygulanır.
6. Deploy sonrasında `/api/health` adresinin `ready` döndürdüğünü kontrol edin.

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
    "aiProvider": "runpod-self-hosted",
    "fluxConfigured": true,
    "clothingConfigured": true
  }
}
```

## Kupon yönetimi

- Yönetici `/yonetim/kuponlar` adresinde `ADMIN_ACCESS_KEY` ile giriş yapar.
- Kampanya adı, 1–3 arası önizleme hakkı ve 7–30 gün son kullanım tarihi seçilir.
- Açık kupon kodu yalnızca oluşturulduğu anda gösterilir; veritabanında HMAC özeti tutulur.
- İlk başarılı etkinleştirme kuponu anonim tarayıcı oturumuna bağlar; başka bir
  tarayıcı aynı kodu etkinleştiremez veya kupon hakkını harcayamaz.
- Her başarılı üretim bir hak düşürür; başarısız veya güvenlik nedeniyle durdurulan
  üretimde hak otomatik iade edilir.
- Etkin kupon yönetim ekranından kullanıma kapatılabilir.
- Önceki sürümden kalan etkin kuponların kod özetleri ve kalan hakları korunur.

## Veri davranışı

- Ürün ve hedef fotoğrafları Neon'a yazılmaz. Her iki RunPod endpoint'ine de iş
  kuyruğunda geçici Base64 giriş olarak iletilir.
- Sonuç Base64 olarak alınır; üçüncü taraf CDN bağlantısı kullanılmaz.
- Sonuç görseli tarayıcıya özel geçmiş için sınırlı süre saklanır.
- Ham IP veritabanında tutulmaz; kötüye kullanım kontrolü için tuzlanmış SHA-256 özeti kullanılır.
- Kuponun bağlandığı anonim oturum kimliği saklanır; tarayıcı verilerinin silinmesi
  kupona erişimi kaybettirebilir.
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
components/credit-access.tsx      Kupon bakiyesi ve etkinleştirme arayüzü
lib/server/access.ts              Atomik hak ve günlük kapasite yönetimi
lib/server/runpod-image.ts        RunPod ve FLUX.2 entegrasyonu
lib/server/runpod-vton-image.ts   Self-host giyim endpoint entegrasyonu
runpod-worker/                    FLUX GPU worker ve Docker dosyaları
runpod-vton-worker/               FASHN VTON 1.5 flat-lay worker ve lisans yaması
lib/db/schema.ts                  Neon/Drizzle şeması
```

## Sağlayıcı ve lisans notu

Takı, mobilya ve otomobil worker'ı Apache 2.0 lisanslı
`black-forest-labs/FLUX.2-klein-4B`, yetişkin
içerik sınıflandırmasında Apache 2.0 lisanslı `Falconsai/nsfw_image_detection`
ve diğer sabit güvenlik sınıflarında MIT lisanslı OpenAI CLIP modelini kullanır.
Buradaki OpenAI CLIP yerel açık kaynak modelidir; OpenAI API veya OpenAI üretim
kotası kullanılmaz. Giyim worker'ı Apache-2.0 lisanslı FASHN VTON 1.5, DWPose ve
YOLOX bileşenlerini kullanır. Resmî pipeline'ın ticari kullanımı sınırlı SegFormer
insan ayrıştırıcısı imajdan çıkarılmıştır. Bu nedenle giyim girdisi yalnız sade
fonda, askıda veya düz serilmiş ürün fotoğrafı olabilir; başka bir kişinin üzerinde
çekilmiş ürün fotoğrafı desteklenmez. Ayrıntılar `runpod-vton-worker/README.md`
dosyasındadır.
