import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="legal-page">
      <article>
        <Link href="/">← Ana sayfa</Link>
        <h1>Kullanım Koşulları</h1>
        <p>Dijital vücut profili, beden önerisi ve kombin görünümü yaklaşık bir önizlemedir. Kumaş davranışı, üretim toleransı, kişisel duruş ve marka kalıbı fiziksel sonucu değiştirebilir.</p>
        <p>Satın alma kararında işletmenin yayımladığı gerçek ürün ölçü tablosu, iade koşulları ve ürün açıklaması esas alınmalıdır. Uygulama fiziksel prova veya kesin beden garantisi vermez.</p>
        <p>Kullanıcı yalnızca kullanma hakkına sahip olduğu ürün görsellerini sisteme eklemelidir.</p>
      </article>
    </main>
  );
}
