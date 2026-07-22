import Link from "next/link";

export function LegalShell({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page">
      <header className="container legal-header">
        <Link className="brand" href="/" aria-label="Sokak Vitrini ana sayfa">
          <span className="brand-mark">SV</span>
          <span className="brand-copy">
            <strong>SOKAK VİTRİNİ</strong>
            <small>DENE</small>
          </span>
        </Link>
        <Link className="legal-back" href="/">
          Ana sayfaya dön
        </Link>
      </header>
      <article className="container legal-content">
        <span className="section-kicker">{kicker}</span>
        <h1>{title}</h1>
        {children}
      </article>
    </main>
  );
}
