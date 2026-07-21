import Link from "next/link";

export default function PrivacyPage() {
  return <main className="legal-page"><article><Link href="/">← Ana sayfa</Link><h1>Gizlilik</h1><p>Yüklenen kişi ve ürün fotoğrafları yalnızca talep edilen önizleme için işlenir. Web uygulaması bu görselleri kalıcı veritabanına kaydetmez.</p><p>Self-hosted GPU servisinin geçici dosya veya log tutmaması gerekir. Üretim ortamında erişim anahtarı, HTTPS, kısa zaman aşımı ve otomatik bellek temizliği kullanılmalıdır.</p><p>Özel koleksiyonlar yalnız yetişkin kullanıcılar içindir. Açık çıplaklık içeren görseller işlenmemelidir.</p></article></main>;
}
