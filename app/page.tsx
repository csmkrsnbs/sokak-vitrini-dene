import Link from "next/link";
import { ArrowDown, Check, ShieldCheck, Sparkles } from "lucide-react";

import { ProvaStudio } from "@/components/prova-studio";

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="#top" aria-label="Sokak Vitrini Prova">
            <span className="brand-mark">SV</span>
            <span className="brand-copy">
              <strong>SOKAK VİTRİNİ</strong>
              <small>PROVA</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Ana menü">
            <Link href="#deneyim">Deneyim</Link>
            <Link href="#gerceklik">Ürün Gerçekliği</Link>
            <Link href="#gizlilik">Gizlilik</Link>
          </nav>
          <Link className="button button-small button-gold" href="#studio">
            Prova alanını aç
          </Link>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} /> Gerçek ürün + kontrollü dijital prova
            </div>
            <h1>
              Ürünü değiştirmeden
              <span>deneyimi büyüt.</span>
            </h1>
            <p>
              360° gerçek çekim, beden bazlı hazır manken, kendi GPU sunucunda çalışan sanal prova
              ve 3D ürünler için WebAR tek bir premium vitrinde birleşir.
            </p>
            <div className="hero-actions">
              <Link className="button button-gold" href="#studio">
                Prova stüdyosuna gir
              </Link>
              <Link className="text-link" href="#deneyim">
                Sistem nasıl çalışıyor? <ArrowDown size={17} />
              </Link>
            </div>
            <div className="trust-row">
              <span><Check size={15} /> Harici görsel üretim API&apos;si zorunlu değil</span>
              <span><Check size={15} /> Fotoğraflar kalıcı olarak saklanmaz</span>
            </div>
          </div>

          <div className="hero-stage" aria-label="Sokak Vitrini Prova deneyim kartları">
            <div className="hero-device">
              <div className="device-topline"><span /><strong>SV PROVA</strong><span /></div>
              <div className="device-scene">
                <div className="scene-halo" />
                <div className="scene-mannequin">
                  <span className="head" />
                  <span className="torso" />
                  <span className="waist" />
                  <span className="legs" />
                </div>
                <div className="scene-garment"><span>GERÇEK ÜRÜN</span></div>
              </div>
              <div className="device-tabs">
                <span className="active">360°</span><span>Manken</span><span>Kendinde</span><span>AR</span>
              </div>
            </div>
            <div className="float-proof proof-one">
              <small>ÜRÜN SADAKATİ</small><strong>Yüksek</strong><span>%88</span>
            </div>
            <div className="float-proof proof-two">
              <ShieldCheck size={19} /><span><small>GİZLİ PROVA</small><strong>Cihaz + özel GPU</strong></span>
            </div>
          </div>
        </div>
      </section>

      <section className="experience-strip" id="deneyim">
        <div className="container experience-grid">
          {[
            ["01", "Gerçek 360°", "24–36 gerçek ürün karesiyle kumaş, dikiş ve arka görünüm."],
            ["02", "Gizli manken", "S, M, L ve XL bedenlerde hızlı, fotoğraf yüklemeden önizleme."],
            ["03", "Kişisel prova", "Kendi GPU sunucunda FASHN VTON v1.5 ile kontrollü üretim."],
            ["04", "WebAR", "GLB modeli olan sert formlu ürünleri gerçek ölçekte ortamda görme."],
          ].map(([number, title, text]) => (
            <article className="experience-card" key={number}>
              <span>{number}</span><h2>{title}</h2><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <ProvaStudio />

      <section className="reality-section" id="gerceklik">
        <div className="container reality-grid">
          <div>
            <span className="section-kicker">Ürün Gerçeklik Kartı</span>
            <h2>Simülasyon ile gerçek çekim birbirine karışmaz.</h2>
            <p>
              Kullanıcıya hangi görüntünün gerçek stüdyo çekimi, hangisinin dijital prova olduğu
              açıkça gösterilir. Düşük sadakatli sonuçlar satış ekranına çıkarılmaz.
            </p>
          </div>
          <div className="reality-card">
            <div className="reality-row"><span>GERÇEK ÜRÜN</span><strong>360° stüdyo çekimi</strong></div>
            <div className="reality-row"><span>DİJİTAL PROVA</span><strong>Yaklaşık görünüm</strong></div>
            <div className="score-bars">
              <label>Renk <i style={{ width: "91%" }} /></label>
              <label>Desen <i style={{ width: "86%" }} /></label>
              <label>Kesim <i style={{ width: "74%" }} /></label>
            </div>
            <div className="reality-verdict">Yayınlanabilir ürün sadakati</div>
          </div>
        </div>
      </section>

      <section className="privacy-section" id="gizlilik">
        <div className="container privacy-inner">
          <div className="privacy-icon"><ShieldCheck size={30} /></div>
          <div>
            <span className="section-kicker">Gizlilik odaklı</span>
            <h2>Kullanıcı fotoğrafı ürün değildir.</h2>
            <p>
              Web katmanı fotoğrafları veritabanına yazmaz. GPU servisi görselleri bellekte işler,
              sonucu döndürür ve geçici veriyi siler. Özel koleksiyonlarda hazır manken seçeneği öne çıkar.
            </p>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>© 2026 Sokak Vitrini</span>
          <div><Link href="/gizlilik">Gizlilik</Link><Link href="/kullanim-kosullari">Kullanım Koşulları</Link></div>
          <span>SV Signature</span>
        </div>
      </footer>
    </main>
  );
}
