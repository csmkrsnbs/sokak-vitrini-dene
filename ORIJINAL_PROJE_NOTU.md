# Orijinal Proje Geri Yükleme Notu

Bu paket, **“Sokakta Gör. Kendinde Dene.”** projesinin ilk tam sürümünün
geri yüklenmiş ve tekrar dağıtıma hazır kaynak kodudur.

Hedef arayüz:
https://sokak-vitrini-dene-my7vp86oe-sokak-vitrini.vercel.app/#dene

## Korunan ana özellikler

- Kişisel “Kendimde dene” akışı
- Dijital profil fotoğrafını tarayıcıda saklama
- İşletme ürün/model görsel stüdyosu
- Giyim, takı, ayakkabı, çanta ve aksesuar kategorileri
- Geçmiş, favori, indirme, paylaşma ve silme
- Kuponlu kullanım ve yönetim paneli
- SEO metadata, Open Graph, sitemap, robots ve PWA manifest
- Gizlilik ve kullanım koşulları sayfaları
- Neon PostgreSQL + Drizzle
- FASHN API entegrasyonu

## Altyapı kararı

Bu sürümde RunPod, Docker worker veya sürekli çalışan GPU bulunmaz.
Görsel üretim FASHN API üzerinden kullanım oldukça yapılır.

## Kurulum

1. `.env.example` dosyasını `.env.local` olarak kopyalayın.
2. Neon `DATABASE_URL` ve `FASHN_API_KEY` değerlerini ekleyin.
3. Diğer güvenlik anahtarlarını en az 32 karakter rastgele değerlerle doldurun.
4. `npm install`
5. `npm run db:migrate`
6. `npm run dev`

Vercel dağıtımı için `CANLIYA_ALMA.md` dosyasını izleyin.
