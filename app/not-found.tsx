import Link from "next/link";

export default function NotFound() {
  return (
    <main className="status-page">
      <div className="status-card">
        <span className="brand-mark">SV</span>
        <span className="section-kicker">404</span>
        <h1>Bu vitrin bulunamadı.</h1>
        <p>Aradığın sayfa taşınmış veya artık burada olmayabilir.</p>
        <Link className="button button-gold" href="/">
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
