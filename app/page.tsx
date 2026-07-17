import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  Camera,
  CarFront,
  Check,
  Gem,
  ScanLine,
  Shirt,
  Sofa,
  Sparkles,
} from "lucide-react";

import { TryOnStudio } from "@/components/try-on-studio";

const categories = [
  {
    icon: Gem,
    title: "Takı",
    text: "Kolyeyi, bileziği veya saati doğal ölçüsüyle üzerinde gör.",
  },
  {
    icon: Shirt,
    title: "Giyim",
    text: "Gömleği, ceketi veya elbiseyi kendi fotoğrafında dene.",
  },
  {
    icon: Sofa,
    title: "Mobilya",
    text: "Beğendiğin ürünü evindeki gerçek boşluğa yerleştir.",
  },
  {
    icon: CarFront,
    title: "Otomobil",
    text: "Aracı evinin önünde, garajında veya seçtiğin sokakta gör.",
  },
];

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Vitrinde çek",
    text: "Beğendiğin ürünü net bir açıdan fotoğrafla.",
  },
  {
    number: "02",
    icon: ScanLine,
    title: "Yerini göster",
    text: "Kendi fotoğrafını veya ürünü görmek istediğin mekânı ekle.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Hayatında gör",
    text: "Yapay zekâ ürünü ışık, açı ve perspektife uyarlasın.",
  },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="#top" aria-label="Sokak Vitrini ana sayfa">
            <span className="brand-mark" aria-hidden="true">
              SV
            </span>
            <span className="brand-copy">
              <strong>SOKAK VİTRİNİ</strong>
              <small>DENE</small>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Ana menü">
            <Link href="#nasil-calisir">Nasıl çalışır?</Link>
            <Link href="#gecmis">Geçmişim</Link>
          </nav>

          <Link className="button button-small button-gold" href="#dene">
            Hemen dene
          </Link>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} strokeWidth={1.8} />
              Yapay zekâ destekli vitrin deneyimi
            </div>
            <h1>
              Sokakta gör.
              <span>Kendinde dene.</span>
            </h1>
            <p>
              Vitrinde beğendiğin takıyı, kıyafeti, mobilyayı veya otomobili
              fotoğrafla. Satın almadan önce kendi üzerinde ya da yaşam alanında gör.
            </p>
            <div className="hero-actions">
              <Link className="button button-gold" href="#dene">
                <Camera size={19} />
                Fotoğrafla ve dene
              </Link>
              <Link className="text-link" href="#nasil-calisir">
                Nasıl çalışır?
                <ArrowDown size={17} />
              </Link>
            </div>
            <div className="trust-row" aria-label="Öne çıkan özellikler">
              <span>
                <Check size={15} /> İki fotoğraf yeter
              </span>
              <span>
                <Check size={15} /> Sonuçlar sana özel
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Sokak Vitrini Dene konsepti">
            <div className="poster-frame">
              <Image
                src="/concept-poster.png"
                alt="Vitrindeki kolyeyi fotoğraflayıp üzerinde deneyen kullanıcı"
                width={1003}
                height={1568}
                priority
                sizes="(max-width: 900px) 90vw, 460px"
              />
              <div className="poster-shine" />
            </div>
            <div className="floating-card floating-card-top">
              <span className="floating-icon">
                <Gem size={18} />
              </span>
              <span>
                <small>Ürün tanındı</small>
                <strong>Altın kolye</strong>
              </span>
              <Check size={18} className="floating-check" />
            </div>
            <div className="floating-card floating-card-bottom">
              <Sparkles size={18} className="gold-icon" />
              <span>
                <small>Önizleme</small>
                <strong>Hazır</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="category-strip" aria-label="Desteklenen ürün türleri">
        <div className="container category-strip-grid">
          {categories.map(({ icon: Icon, title, text }) => (
            <article className="category-intro" key={title}>
              <span className="category-intro-icon">
                <Icon size={24} strokeWidth={1.6} />
              </span>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <TryOnStudio />

      <section className="how-section" id="nasil-calisir">
        <div className="container">
          <div className="section-heading centered">
            <span className="section-kicker">Üç basit adım</span>
            <h2>Vitrinden hayatına</h2>
            <p>Ürünü tekrar hayal etmene gerek yok. Gör, çek ve kendi dünyanda dene.</p>
          </div>

          <div className="steps-grid">
            {steps.map(({ number, icon: Icon, title, text }) => (
              <article className="step-card" key={number}>
                <span className="step-number">{number}</span>
                <span className="step-icon">
                  <Icon size={28} strokeWidth={1.5} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="privacy-banner">
        <div className="container privacy-banner-inner">
          <div>
            <span className="section-kicker">Sana özel</span>
            <h2>Fotoğrafların vitrine çıkmaz.</h2>
            <p>
              Ürün ve hedef fotoğrafları yalnızca önizlemeyi oluşturmak için işlenir;
              uygulamada kalıcı olarak saklanmaz. Oluşturduğun sonuçlara sadece bu
              tarayıcıdan erişebilirsin.
            </p>
          </div>
          <div className="privacy-seal" aria-hidden="true">
            <span>SV</span>
            <small>ÖZEL DENEYİM</small>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <Link className="brand" href="#top">
            <span className="brand-mark">SV</span>
            <span className="brand-copy">
              <strong>SOKAK VİTRİNİ</strong>
              <small>DENE</small>
            </span>
          </Link>
          <p>Vitrinde gördüğünü, hayatında gör.</p>
          <div className="footer-links">
            <Link href="/gizlilik">Gizlilik</Link>
            <Link href="/kullanim-kosullari">Kullanım Koşulları</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Sokak Vitrini</span>
          <span>Vitrinde gördüğünü, hayatında gör.</span>
        </div>
      </footer>
    </main>
  );
}
