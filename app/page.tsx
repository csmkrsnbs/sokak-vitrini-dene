import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  Camera,
  Check,
  Gem,
  Images,
  ScanLine,
  Shirt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { TryOnStudio } from "@/components/try-on-studio";

const categories = [
  {
    icon: ShieldCheck,
    title: "Kimlik korumalı deneme",
    text: "Ten rengi, yüz, saç, vücut oranı ve poz korunarak yalnızca ürün uygulanır.",
  },
  {
    icon: Shirt,
    title: "Giyim & iç giyim",
    text: "Günlük giyimden bikini, mayo ve yetişkin iç giyime kadar kendinde dene.",
  },
  {
    icon: Gem,
    title: "Takı & aksesuar",
    text: "Takı, saat, gözlük, şapka, ayakkabı ve çantayı kendi görünümünde incele.",
  },
  {
    icon: Images,
    title: "İşletme stüdyosu",
    text: "Yalnız ürün fotoğrafından katalog ve sosyal medya için model görseli üret.",
  },
];

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Ürünü ekle",
    text: "Vitrindeki ya da işletmendeki ürünü net bir açıdan yükle.",
  },
  {
    number: "02",
    icon: ScanLine,
    title: "Modu seç",
    text: "Dijital profilinde dene veya ürün için model görseli oluştur.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Sonucu kullan",
    text: "Önizlemeyi karşılaştır, favorile, indir veya paylaş.",
  },
];

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Sokak Vitrini Dene",
    applicationCategory: "ShoppingApplication",
    operatingSystem: "Web",
    description: "Ten rengi ve kimlik koruma odaklı sanal giyim ve aksesuar deneme platformu.",
    featureList: [
      "Dijital profil",
      "Kimlik ve ten koruma odaklı sanal deneme",
      "Giyim, takı, ayakkabı, çanta ve aksesuar desteği",
      "İşletme ürün görsel stüdyosu",
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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
              Kişisel deneme ve işletme görsel stüdyosu
            </div>
            <h1>
              Sokakta gör.
              <span>Kendinde dene.</span>
            </h1>
            <p>
              Beğendiğin giyim ve aksesuar ürününü, ten rengin ve kişisel görünümün
              korunarak kendi dijital profilinde gör. İşletmensen tek ürün fotoğrafından
              model üzerinde katalog görseli oluştur.
            </p>
            <div className="hero-actions">
              <Link className="button button-gold" href="#dene">
                <Camera size={19} />
                Ürünü şimdi dene
              </Link>
              <Link className="text-link" href="#nasil-calisir">
                Nasıl çalışır?
                <ArrowDown size={17} />
              </Link>
            </div>
            <div className="trust-row" aria-label="Öne çıkan özellikler">
              <span>
                <Check size={15} /> Dijital profil tarayıcında kalır
              </span>
              <span>
                <Check size={15} /> Ten rengi ve kimlik koruma odaklı
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

      <section className="category-strip" aria-label="Platform özellikleri">
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
            <h2>Üründen gerçek bir önizlemeye</h2>
            <p>
              Tek panelden kişisel sanal deneme yap veya işletmen için ürün görseli üret.
            </p>
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
            <h2>Dijital profilin cihazında, kimliğin sende kalır.</h2>
            <p>
              Kaydettiğin dijital profil, bu tarayıcının yerel veritabanında tutulur.
              Ürün ve kişi görselleri yalnızca seçtiğin önizlemeyi oluşturmak için işlenir;
              sonuçlarını geçmişten silebilirsin.
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
          <p>Vitrinde gördüğünü, kendinde gör.</p>
          <div className="footer-links">
            <Link href="/gizlilik">Gizlilik</Link>
            <Link href="/kullanim-kosullari">Kullanım Koşulları</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Sokak Vitrini</span>
          <span>Vitrinde gördüğünü, kendinde gör.</span>
        </div>
      </footer>
    </main>
  );
}
