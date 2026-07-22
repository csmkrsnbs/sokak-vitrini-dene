import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <article>
        <Link href="/">← Ana sayfa</Link>
        <h1>Gizlilik</h1>
        <p>Vücut profili ölçüleri, özel ürünler ve kombin tercihleri varsayılan olarak kullanıcının kendi tarayıcısındaki yerel depolama alanında tutulur. Bu sürüm ölçüleri bir sunucuya, GPU servisine veya harici yapay zekâ sağlayıcısına göndermez.</p>
        <p>Kullanıcı kendi ürün görselini eklediğinde görsel tarayıcı içinde saklanır. Ortak veya güvenilmeyen cihazlarda kullanım tamamlandıktan sonra tarayıcı verileri temizlenmelidir.</p>
        <p>Ölçüler sağlık verisi veya tıbbi değerlendirme amacıyla kullanılmaz. Profil, yalnızca ürün ölçüsü karşılaştırması ve görsel ölçekleme için kullanılır.</p>
      </article>
    </main>
  );
}
