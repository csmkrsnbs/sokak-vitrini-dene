"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="status-page">
      <div className="status-card">
        <span className="brand-mark">SV</span>
        <span className="section-kicker">Bir şey ters gitti</span>
        <h1>Vitrini yeniden açalım.</h1>
        <p>Sayfa hazırlanırken geçici bir sorun oluştu.</p>
        <button className="button button-gold" onClick={reset} type="button">
          Yeniden dene
        </button>
      </div>
    </main>
  );
}
