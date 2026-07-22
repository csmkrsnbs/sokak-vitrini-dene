# Ana Sayfa Yenilemesi

Bu sürümde ana sayfa, mevcut kişisel deneme ve işletme stüdyosu işlevleri korunarak yeniden tasarlanmıştır.

## Yeni sayfa yapısı

1. **Açılış alanı** — “Sokakta Gör. Kendinde Dene.” mesajı, kişisel deneme ve işletme stüdyosu çağrıları.
2. **Güven şeridi** — Dijital profil, kimlik koruma, indirme/paylaşma ve işletme özellikleri.
3. **Deneyim anlatımı** — Ürün fotoğrafı, kullanıcı profili ve sonuç akışının görsel anlatımı.
4. **Kategori vitrini** — Giyim, iç giyim, takı, ayakkabı ve çanta/aksesuar.
5. **Üç adım** — Ürün yükleme, profil seçme ve sonucu kullanma.
6. **Canlı deneme stüdyosu** — Mevcut çalışan TryOnStudio bileşeni ve tüm API akışı korunur.
7. **Kimlik ve ten koruma** — Sabit ürün kurallarının kullanıcıya açık biçimde gösterilmesi.
8. **İşletme alanı** — Butik ve mağazalara yönelik katalog/sosyal medya görsel stüdyosu.
9. **SSS** — Kullanıcı soruları ve SEO için FAQPage yapılandırılmış verisi.
10. **Mobil sabit çağrı** — Küçük ekranlarda sürekli erişilebilir “Kendimde dene” butonu.

## Değişmeyen altyapı

- Neon PostgreSQL ve Drizzle migration'ları
- FASHN API sağlayıcı katmanı
- Kupon, günlük limit ve yönetim paneli
- Dijital profil, geçmiş, favori, indirme, paylaşma ve silme
- Gizlilik ve kullanım koşulları
- Vercel dağıtım ve cron yapılandırması

## Ana dosyalar

- `app/page.tsx`: Yeni ana sayfa düzeni ve SEO yapılandırılmış verileri
- `app/globals.css`: Yeni ana sayfa ve responsive tasarım stilleri
- `app/layout.tsx`: Güncellenmiş SEO açıklaması ve anahtar kelimeler
- `components/try-on-studio.tsx`: Ana sayfayla uyumlu stüdyo başlığı
