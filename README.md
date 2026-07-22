# Sokak Vitrini Dene

“Sokakta Gör, Kendinde Dene” için canlıya hazır Next.js uygulaması.

Bu sürüm iki ayrı kullanım sunar:

1. **Kendimde dene:** Kullanıcı ürün fotoğrafını, kendi fotoğrafı veya tarayıcıda kayıtlı dijital profiliyle birleştirir.
2. **İşletme stüdyosu:** İşletme yalnız ürün fotoğrafı yükleyerek katalog ve sosyal medya için yetişkin model üzerinde ürün görseli oluşturur.


## Yenilenen ana sayfa

Bu sürümde ana sayfa, doğrudan kişisel denemeye yönlendiren yeni bir ürün deneyimi olarak tasarlandı:

- Mobil ve masaüstü için yeni “Sokakta Gör. Kendinde Dene.” açılış alanı
- Ürün → dijital profil → önizleme akışını anlatan görsel deneyim bölümü
- Giyim, iç giyim, takı, ayakkabı ve çanta/aksesuar kategori vitrini
- Üç adımda kullanım anlatımı
- Kimlik, ten rengi, yüz, saç, vücut ve poz koruma bölümü
- Butikler ve mağazalar için işletme stüdyosu çağrısı
- Arama motorları için FAQPage yapılandırılmış verisi ve SSS bölümü
- Mobilde sabit “Kendimde dene” butonu

## Kapsam

- Giyim: tişört, gömlek, bluz, ceket, elbise, pantolon, etek
- Yetişkin moda: bikini, mayo, sütyen, alt iç giyim, korse, body, fantezi giyim
- Takı: kolye, küpe, bileklik, saat
- Ayakkabı
- Çanta
- Gözlük, şapka ve diğer giyilebilir aksesuarlar
- Dijital profilin tarayıcı IndexedDB alanında yerel saklanması
- Sonuç geçmişi, favoriler, indirme, paylaşma ve silme
- Kuponla kullanım ve yönetici kupon ekranı
- Günlük genel üretim limiti
- Başarısız işlemde kupon hakkı iadesi
- Süresi dolan sonuçlar için Vercel Cron temizliği
- Neon PostgreSQL + Drizzle ORM
- FASHN API sağlayıcı katmanı
- Ten rengi, yüz, saç, vücut oranı, poz ve arka plan koruma talimatları
- Kişiyi değiştirmeye yönelik kullanıcı notlarını sunucu tarafında engelleme
- Sonuç ekranında kullanıcı kalite kontrolü ve hatalı sonucu silme

## Kullanılan yapay zekâ akışı

| İşlem | Varsayılan model |
|---|---|
| Giyim ve yetişkin moda sanal denemesi | `tryon-max` (`fast` + `1k`) |
| Takı, ayakkabı, çanta ve aksesuar denemesi | `tryon-max` |
| Ürün fotoğrafından işletme model görseli | `product-to-model` |

Model adları ve kalite seçenekleri `.env` üzerinden değiştirilebilir. Kişisel denemelerde `tryon-max`, kimlik ve görünüm koruma talimatlarını desteklediği için varsayılan seçilmiştir. Uygulama RunPod worker, Docker veya sürekli çalışan GPU gerektirmez.

## Gereksinimler

- Node.js 20.9 veya üzeri
- Neon PostgreSQL veritabanı
- FASHN API anahtarı ve yeterli API kredisi
- Vercel hesabı veya Node.js destekleyen eşdeğer barındırma

## Yerel kurulum

```bash
npm install
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

`.env.local` içindeki değişkenleri gerçek değerlerle doldurun. Ardından:

```bash
npm run db:migrate
npm run dev
```

Uygulama varsayılan olarak:

```text
http://localhost:3000
```

adresinde açılır.

## Zorunlu ortam değişkenleri

```env
DATABASE_URL="..."
FASHN_API_KEY="fa_..."
NEXT_PUBLIC_APP_URL="https://sokak-vitrini-dene-my7vp86oe-sokak-vitrini.vercel.app"
RATE_LIMIT_SALT="en-az-32-karakter-rastgele-deger"
CRON_SECRET="en-az-32-karakter-rastgele-deger"
ADMIN_ACCESS_KEY="en-az-32-karakter-rastgele-deger"
COUPON_SIGNING_SECRET="en-az-32-karakter-rastgele-deger"
```

Diğer model ve limit ayarları `.env.example` içinde hazırdır.

## Veritabanı

Yeni veritabanında:

```bash
npm run db:migrate
```

Şema değişikliğinden sonra yeni migration üretmek için:

```bash
npm run db:generate
```

Migration dosyaları `drizzle/` klasöründe tutulur. Vercel build komutu önce migration, sonra Next.js build çalıştırır:

```text
npm run vercel-build
```

## Kupon yönetimi

Yönetici ekranı:

```text
/yonetim/kuponlar
```

Girişte `.env` içindeki `ADMIN_ACCESS_KEY` kullanılır. Yeni kuponlar panelden 1–3 hak ve 7–30 gün geçerlilikle oluşturulabilir. Kod yalnız oluşturulduğu anda gösterilir; veritabanında özet değeri tutulur.

## Dijital profil ve favoriler

Dijital profil fotoğrafı sunucu hesabına kaydedilmez; tarayıcının IndexedDB alanında tutulur. Favori işaretleri de aynı tarayıcıdaki localStorage alanında saklanır. Tarayıcı verileri temizlenirse bu yerel kayıtlar kaybolur.

Önizleme sonuçları ise anonim oturuma bağlı biçimde veritabanında saklanır. Varsayılan saklama süresi 30 gündür.

## Sağlık kontrolü

Canlı kurulumdan sonra:

```text
/api/health
```

adresini açın. Tüm zorunlu servisler hazırsa `status: "ready"` döner. Bu uç nokta API anahtarlarını veya bağlantı şifrelerini göstermez.

## Kontrol komutları

```bash
npm run lint
npm run typecheck
npm run build
```

Tüm kontrolleri tek komutta çalıştırmak için:

```bash
npm run check
```

## Güvenlik notları

- Gerçek `.env` dosyalarını Git’e eklemeyin.
- API anahtarını istemci tarafı değişkenine dönüştürmeyin.
- Yetişkin moda kategorileri yalnız 18+ kişilerin açık çıplaklık ve cinsel eylem içermeyen moda/katalog görselleri içindir.
- Başka bir kişiye ait fotoğrafı yalnız açık izinle kullanın.
- Canlı yayından önce Gizlilik ve Kullanım Koşulları sayfalarındaki veri sorumlusu bilgilerini kendi gerçek bilgilerinizle tamamlayın.

## Git komutları

```bash
git add .
git commit -m "feat: yeni ana sayfa ve canlıya hazır Sokak Vitrini"
git push
```

## Kimlik ve ten koruma ilkesi

Kişisel denemede sistem yalnızca ürünü değiştirmeyi hedefler. Sunucu, FASHN Try-On Max isteğine ten rengi, cilt alt tonu, etnik görünüm, yüz, saç, yaş görünümü, vücut oranı, poz, eller, arka plan ve ışığı koruyan zorunlu talimatları ekler. Kullanıcının bunları değiştirmesini isteyen serbest metin yönlendirmeleri reddedilir.

Üretken yapay zekâ çıktıları yüzde yüz garanti edilemez. Sonuç ekranında giriş fotoğrafıyla karşılaştırma kontrolü bulunur; kişi veya ten tonu değişmiş görünüyorsa sonuç tek tuşla silinebilir. Ayrıntılı kurallar `KIMLIK_VE_TEN_KORUMA.md` dosyasındadır.
