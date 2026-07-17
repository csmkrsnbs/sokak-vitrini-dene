# Sokak Vitrini Dene

**Sokakta gör. Kendinde dene.**

Vitrinde görülen takı, kıyafet, mobilya veya otomobili iki referans fotoğrafla
yapay zekâ destekli olarak kişinin üzerinde ya da hedef mekânda gösteren canlıya
hazır Next.js uygulamasıdır.

## Özellikler

- Takı, giyim, mobilya ve otomobil için kategoriye özel AI komutları
- Mobil kameradan çekim veya galeriden fotoğraf yükleme
- Tarayıcıda otomatik boyutlandırma ve sıkıştırma
- RunPod Serverless üzerinde açık kaynaklı FLUX.2 ile iki referans fotoğraftan önizleme
- GPU kuyruğunu Vercel isteğinden ayıran asenkron iş ve durum takibi
- Neon PostgreSQL ile anonim oturum, sonuç geçmişi ve kullanım sınırı
- Toplam 2 ücretsiz üretim; ardından IBAN ile 10 görsel / 100 TL Standart Paket
- Ücretsiz denemede VPN, proxy ve Tor engeli; ücretli kuponlarda kesintisiz kullanım
- Manuel ödeme onayı, güvenli kupon ve atomik kredi düşümü
- Kaynak fotoğrafları veritabanında saklamayan gizlilik odaklı akış
- Sonuç indirme, cihaz paylaşım menüsü ve kalıcı silme
- Sonuçları belirlenen süreden sonra temizleyen günlük görev
- Mobil, tablet ve masaüstü için responsive siyah–altın–beyaz tasarım
- Sağlık kontrolü, güvenlik başlıkları, kullanım koşulları ve gizlilik sayfası

## Teknoloji

- Next.js 16 App Router
- React 19 + TypeScript
- Neon Serverless PostgreSQL
- Drizzle ORM ve SQL migration
- Apache 2.0 lisanslı FLUX.2 klein 4B
- RunPod Serverless GPU worker
- Vercel dağıtım ve günlük cron yapılandırması

## Yerelde çalıştırma

### 1. Gereksinimler

- Node.js 20.9 veya üzeri
- Neon PostgreSQL projesi
- RunPod hesabı, API anahtarı ve yayınlanmış FLUX.2 worker endpoint'i
- IPQualityScore hesabı ve ücretsiz Proxy & VPN Detection API anahtarı

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Ortam dosyasını hazırlayın

`.env.example` dosyasını `.env.local` adıyla kopyalayın ve gerçek değerleri
girin:

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
IP_RISK_CACHE_HOURS="24"
RATE_LIMIT_SALT="en-az-32-karakter-rastgele-deger"
CRON_SECRET="farkli-en-az-32-karakter-rastgele-deger"
PAYMENT_BANK_NAME="Banka adı"
PAYMENT_ACCOUNT_HOLDER="Hesap sahibi"
PAYMENT_IBAN="TR000000000000000000000000"
ADMIN_ACCESS_KEY="en-az-32-karakter-gizli-yonetim-anahtari"
COUPON_SIGNING_SECRET="farkli-en-az-32-karakter-kupon-anahtari"
```

Rastgele değer üretmek için:

```bash
openssl rand -hex 32
```

### 4. Neon tablolarını oluşturun

```bash
npm run db:migrate
```

### 5. Uygulamayı açın

```bash
npm run dev
```

Tarayıcı adresi: `http://localhost:3000`

## Vercel üzerinden canlıya alma

1. Projeyi GitHub deposuna gönderin.
2. `runpod-worker/README.md` adımlarını uygulayarak GPU worker imajını ve RunPod
   Serverless endpoint'ini hazırlayın.
3. Vercel'de **New Project** ile GitHub deposunu içe aktarın.
4. Neon panelinde **Connect** düğmesinden **pooled** bağlantı adresini alın.
5. Vercel projesinde **Settings → Environment Variables** bölümüne aşağıdaki
   değerleri ekleyin:
   - `DATABASE_URL`
   - `RUNPOD_API_KEY`
   - `RUNPOD_ENDPOINT_ID`
   - `RUNPOD_TIMEOUT_MS=240000`
   - `RUNPOD_JOB_TTL_MS=900000` (isteğe bağlı; varsayılan değer aynıdır)
   - `PREVIEW_JOB_MAX_AGE_MS=1200000` (isteğe bağlı; varsayılan değer aynıdır)
   - `FLUX_IMAGE_MODEL=black-forest-labs/FLUX.2-klein-4B`
   - `NEXT_PUBLIC_APP_URL=https://alan-adiniz.com`
   - `IMAGE_RETENTION_DAYS=30`
   - `IPQS_API_KEY` (IPQualityScore hesabındaki Private Key)
   - `IP_RISK_CACHE_HOURS=24` (isteğe bağlı; API kotasını koruyan önbellek)
   - `RATE_LIMIT_SALT`
   - `CRON_SECRET`
   - `PAYMENT_BANK_NAME`
   - `PAYMENT_ACCOUNT_HOLDER`
   - `PAYMENT_IBAN`
   - `ADMIN_ACCESS_KEY`
   - `COUPON_SIGNING_SECRET`
6. Deploy işlemini başlatın. `vercel-build` komutu migration'ı uygular ve
   üretim derlemesini oluşturur.
7. Yayın bittikten sonra `https://alan-adiniz.com/api/health` adresini açın.
   Aşağıdaki cevap canlı ortamın hazır olduğunu gösterir:

```json
{
  "status": "ready",
  "checks": {
    "databaseConfigured": true,
    "databaseReachable": true,
    "schemaReady": true,
    "aiConfigured": true,
    "paymentConfigured": true,
    "vpnDetectionConfigured": true,
    "securityConfigured": true
  }
}
```

## Komutlar

```bash
npm run dev          # geliştirme sunucusu
npm run lint         # kod kalite kontrolü
npm run typecheck    # TypeScript kontrolü
npm run build        # üretim derlemesi
npm run check        # lint + typecheck + build
npm run db:generate  # şemadan yeni migration oluşturur
npm run db:migrate   # bekleyen migration'ları uygular
npm run db:push      # şemayı geliştirme veritabanına doğrudan iter
```

## Veri ve gizlilik davranışı

- Ürün ve hedef fotoğrafları Neon'a yazılmaz. Önizleme tamamlanana veya iş ömrü
  dolana kadar RunPod'un geçici iş kuyruğunda işlenir.
- AI tarafından üretilen tek sonuç görseli, tarayıcıya özel geçmiş için Neon'da
  saklanır.
- Sonuçlar herkese açık değildir; anonim ve `HttpOnly` oturum çerezine bağlıdır.
- Kullanıcı sonucu istediği anda silebilir.
- `/api/cron/cleanup` görevi, `IMAGE_RETENTION_DAYS` süresini aşan kayıtları ve
  süresi dolan ağ kontrolü önbelleğini siler.
- IP adresi uygulama veritabanında saklanmaz. Ücretsiz hakların kötüye kullanımını
  azaltmak için IP + gizli salt değerinin SHA-256 özeti kullanılır. Ham IP yalnızca
  VPN/proxy/Tor kontrolü sırasında IPQualityScore'a anlık iletilir; sonuç 24 saat
  tuzlanmış ağ özetiyle önbelleklenir.
- Ücretsiz hak, ödeme talebi, kupon ve kredi kayıtları sonuç görselinden bağımsız tutulur.

## Paket ve ödeme yönetimi

- İlk 2 başarılı görsel üretimi ücretsizdir.
- VPN, proxy veya Tor algılanırsa ücretsiz hak ayrılmaz ve RunPod işi başlatılmaz.
  Geçerli ücretli kuponu olan kullanıcı aynı bağlantıda kupon kredisiyle devam edebilir.
- Standart Paket tek seferlik 100 TL karşılığında 10 görsel kredisi verir.
- Kullanıcı paket penceresinden ödeme talebi oluşturur ve kendisine verilen havale
  açıklamasını IBAN transferine ekler.
- Yönetici `/yonetim/odemeler` adresinde `ADMIN_ACCESS_KEY` ile giriş yapar, banka
  hareketini kontrol eder ve talebi onaylar.
- Onaylanan kuponun süre sonu yoktur; her başarılı üretimde 1 kredi atomik olarak düşer.
- Başarısız AI üretiminde ücretsiz hak veya kupon kredisi otomatik geri verilir.
- Yönetim ekranında yalnızca reddedilmiş ödeme talepleri kalıcı olarak silinebilir.

> `0004_clean_runtime_data` migration'ı mevcut önizleme, ücretsiz kullanım, kupon,
> ödeme talebi ve ağ kontrolü kayıtlarını temiz kurulum için bir defaya mahsus siler.
> Migration uygulandıktan sonra sonraki deploy'larda yeniden çalışmaz.

## Önemli dosyalar

```text
app/api/previews/            Önizleme, geçmiş, görsel ve silme API'leri
app/api/cron/cleanup/        Süreli kayıt temizliği
app/api/health/              Canlı ortam sağlık kontrolü
app/api/payments/            IBAN ödeme talebi API'si
app/api/coupons/             Kupon etkinleştirme API'si
app/api/admin/               Yönetici girişi ve ödeme onayı API'leri
app/yonetim/odemeler/        Gizli ödeme yönetim ekranı
components/try-on-studio.tsx Kamera, yükleme, sonuç ve geçmiş arayüzü
components/credit-access.tsx Ücretsiz hak, paket, IBAN ve kupon arayüzü
lib/server/runpod-image.ts   RunPod kuyruk, durum ve FLUX.2 entegrasyonu
lib/server/network-risk.ts  Ücretsiz deneme VPN/proxy/Tor kontrolü
lib/server/preview-job-policy.ts Asenkron iş süre sınırı
runpod-worker/               Açık kaynak modelin GPU worker ve Docker dosyaları
lib/db/schema.ts             Neon/Drizzle şeması
drizzle/                     Uygulanabilir SQL migration dosyaları
vercel.json                  Build ve cron ayarları
```

## Doğrulama

Final paket aşağıdaki kontrollerden geçirilmiştir:

```bash
npm run lint
npm run typecheck
npm run build
```

Gerçek AI işlemi ve Neon yazma testi için dağıtım ortamında geçerli
`DATABASE_URL`, `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID` ve `IPQS_API_KEY`
bulunması gerekir.

## Model lisansı

Worker yalnızca ticari kullanıma izin veren Apache 2.0 lisanslı
`black-forest-labs/FLUX.2-klein-4B` modelini kullanır. FLUX.2 klein 9B,
FLUX.2 dev ve araştırma amaçlı sanal deneme modelleri bu ticari akışa dahil
edilmemiştir.
