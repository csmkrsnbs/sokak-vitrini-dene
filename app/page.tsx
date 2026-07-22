import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronDown,
  Gem,
  Handbag,
  Images,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";

import { TryOnStudio } from "@/components/try-on-studio";

const trustItems = [
  {
    icon: UserRound,
    title: "Dijital profil",
    text: "Profil fotoğrafın kendi cihazında saklanır.",
  },
  {
    icon: ShieldCheck,
    title: "Kimlik koruma",
    text: "Ten, yüz, saç ve vücut görünümü korunur.",
  },
  {
    icon: Images,
    title: "İndir ve paylaş",
    text: "Hazır önizlemeyi kaydet veya paylaş.",
  },
  {
    icon: BriefcaseBusiness,
    title: "İşletme stüdyosu",
    text: "Üründen katalog ve sosyal medya görseli üret.",
  },
];

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Ürünü yükle",
    text: "Vitrinde gördüğün ya da mağazandaki ürünün net fotoğrafını ekle.",
  },
  {
    number: "02",
    icon: UserRound,
    title: "Fotoğrafını seç",
    text: "Boydan ve net bir fotoğraf yükle veya kayıtlı dijital profilini kullan.",
  },
  {
    number: "03",
    icon: WandSparkles,
    title: "Kendinde gör",
    text: "Önizlemeyi incele, favorile, indir ya da arkadaşlarınla paylaş.",
  },
];

const categories = [
  {
    icon: Shirt,
    title: "Giyim",
    text: "Gömlek, bluz, ceket, elbise, pantolon ve etek.",
    tag: "Üst · Alt · Tam vücut",
  },
  {
    icon: Sparkles,
    title: "İç giyim",
    text: "Sütyen, korse, mayo, bikini ve yetişkin iç giyim.",
    tag: "Kimlik korumalı",
  },
  {
    icon: Gem,
    title: "Takı",
    text: "Kolye, küpe, yüzük, bileklik ve saat.",
    tag: "Detay odaklı",
  },
  {
    icon: ShoppingBag,
    title: "Ayakkabı",
    text: "Günlük, klasik, spor ve özel tasarım ayakkabı.",
    tag: "Doğal perspektif",
  },
  {
    icon: Handbag,
    title: "Çanta & aksesuar",
    text: "Çanta, gözlük, şapka ve tamamlayıcı aksesuarlar.",
    tag: "Kombin tamamlayıcı",
  },
];

const protectionRules = [
  "Ten rengi ve cilt alt tonu korunur.",
  "Yüz, saç ve yaş görünümü korunur.",
  "Vücut oranı, poz, el ve kollar korunur.",
  "Arka plan ve temel ışık yapısı korunur.",
  "Yalnızca seçilen ürün uygulanır.",
  "Kritik değişiklik fark edilirse sonuç silinebilir.",
];

const faqs = [
  {
    question: "Sanal ürün deneme nasıl çalışır?",
    answer:
      "Ürün fotoğrafını ve kendi fotoğrafını seçersin. Sistem ürünün türünü, kişi pozunu ve görüntü yapısını analiz ederek dijital bir önizleme hazırlar.",
  },
  {
    question: "Ten rengim veya yüzüm değişir mi?",
    answer:
      "Sistemin temel kuralı ten rengini, yüzü, saçı, vücut oranını ve pozu korumaktır. Üretken yapay zekâ sonuçları ayrıca kullanıcı tarafından kontrol edilebilir ve istenmeyen sonuçlar silinebilir.",
  },
  {
    question: "Fotoğraflarım saklanıyor mu?",
    answer:
      "Dijital profil olarak kaydettiğin fotoğraf tarayıcının yerel veritabanında tutulur. Görseller yalnızca seçtiğin önizlemeyi oluşturmak için işlenir; geçmiş sonuçlarını silebilirsin.",
  },
  {
    question: "Hangi ürünleri deneyebilirim?",
    answer:
      "Giyim, iç giyim, takı, ayakkabı, çanta, gözlük, şapka ve farklı aksesuar kategorileri desteklenir.",
  },
  {
    question: "Telefonumdan kullanabilir miyim?",
    answer:
      "Evet. Sokak Vitrini mobil tarayıcılar için tasarlanmıştır. Kameradan fotoğraf seçebilir, sonucu indirebilir veya desteklenen cihazlarda doğrudan paylaşabilirsin.",
  },
  {
    question: "İşletmeler nasıl kullanır?",
    answer:
      "İşletme stüdyosunda yalnız ürün fotoğrafı kullanılarak katalog ve sosyal medya için model görselleri oluşturulabilir.",
  },
];

export default function HomePage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Sokak Vitrini Dene",
      applicationCategory: "ShoppingApplication",
      operatingSystem: "Web",
      description:
        "Giyim, iç giyim, takı, ayakkabı, çanta ve aksesuarları kendi fotoğrafında dijital olarak deneme platformu.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
      featureList: [
        "Dijital profil",
        "Kimlik ve ten rengi koruma odaklı sanal deneme",
        "Giyim ve aksesuar kategorileri",
        "Sonuç indirme ve paylaşma",
        "İşletme ürün görsel stüdyosu",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="site-header home-header">
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

          <nav className="desktop-nav home-nav" aria-label="Ana menü">
            <Link href="#deneyim">Deneyim</Link>
            <Link href="#nasil-calisir">Nasıl çalışır?</Link>
            <Link href="#guven">Güven</Link>
            <Link href="#isletmeler">İşletmeler</Link>
            <Link href="#sss">SSS</Link>
          </nav>

          <Link className="button button-small button-gold" href="#dene">
            Kendimde dene
          </Link>
        </div>
      </header>

      <section className="home-hero" id="top">
        <div className="home-hero-orb home-hero-orb-one" aria-hidden="true" />
        <div className="home-hero-orb home-hero-orb-two" aria-hidden="true" />
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <div className="eyebrow home-eyebrow">
              <Sparkles size={15} strokeWidth={1.8} />
              Dijital ürün deneme deneyimi
            </div>
            <h1>
              Sokakta gör.
              <span>Kendinde dene.</span>
            </h1>
            <p>
              Vitrinde, mağazada veya sosyal medyada beğendiğin ürünü kendi
              fotoğrafında önizle. Ten rengin ve kişisel görünümün korunurken yalnızca
              seçtiğin ürün uygulansın.
            </p>

            <div className="home-hero-actions">
              <Link className="button button-gold home-primary-cta" href="#dene">
                <Camera size={19} />
                Kendimde dene
              </Link>
              <Link className="button button-outline" href="#isletmeler">
                <BriefcaseBusiness size={18} />
                İşletmem için
              </Link>
            </div>

            <div className="home-hero-proof" aria-label="Güven özellikleri">
              <span>
                <ShieldCheck size={16} /> Kimlik koruma kuralları
              </span>
              <span>
                <LockKeyhole size={16} /> Cihazda dijital profil
              </span>
              <span>
                <Check size={16} /> Mobil uyumlu
              </span>
            </div>
          </div>

          <div className="home-hero-visual" aria-label="Sokak Vitrini deneyimi">
            <div className="home-phone-shell">
              <div className="home-phone-topbar" aria-hidden="true">
                <span />
                <strong>Sokak Vitrini</strong>
                <i />
              </div>
              <div className="home-phone-poster">
                <Image
                  src="/concept-poster.png"
                  alt="Sokakta görülen ürünleri kendi görünümünde deneme konsepti"
                  fill
                  priority
                  sizes="(max-width: 900px) 86vw, 430px"
                />
              </div>
              <div className="home-phone-action" aria-hidden="true">
                <span>
                  <Sparkles size={15} /> Önizleme hazır
                </span>
                <strong>Kendinde gör</strong>
              </div>
            </div>

            <div className="home-floating-card home-floating-security">
              <span className="home-floating-icon">
                <ShieldCheck size={19} />
              </span>
              <div>
                <small>Koruma aktif</small>
                <strong>Ten ve kimlik</strong>
              </div>
              <Check size={17} />
            </div>

            <div className="home-floating-card home-floating-category">
              <Gem size={18} />
              <div>
                <small>Seçilen kategori</small>
                <strong>Takı & aksesuar</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-trust-strip" aria-label="Platform özellikleri">
        <div className="container home-trust-grid">
          {trustItems.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <span>
                <Icon size={20} strokeWidth={1.7} />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-experience-section" id="deneyim">
        <div className="container home-experience-grid">
          <div className="home-experience-copy">
            <span className="section-kicker">Ürünle arandaki mesafeyi kaldır</span>
            <h2>Beğendiğin ürünü satın almadan önce kendi görünümünde incele.</h2>
            <p>
              Ürün fotoğrafını, dijital profilini ve kategori bilgisini tek akışta
              birleştir. Sonuçta yalnızca ürünü değil, oluşturduğu genel görünümü de gör.
            </p>
            <ul>
              <li>
                <Check size={17} /> Giyim ve aksesuar için kategoriye özel ayarlar
              </li>
              <li>
                <Check size={17} /> Aynı dijital profili tekrar kullanma
              </li>
              <li>
                <Check size={17} /> Önizlemeyi favorileme, indirme ve paylaşma
              </li>
            </ul>
            <Link className="text-link home-arrow-link" href="#dene">
              Deneme alanını aç <ArrowRight size={17} />
            </Link>
          </div>

          <div className="home-preview-flow" aria-label="Ürün deneme adımları">
            <article className="home-preview-tile home-preview-product">
              <span className="home-preview-index">1</span>
              <div className="home-preview-image-wrap">
                <Image
                  src="/concept-poster.png"
                  alt="Vitrindeki ürün fotoğrafı"
                  fill
                  sizes="(max-width: 760px) 44vw, 210px"
                />
              </div>
              <div>
                <small>Ürün</small>
                <strong>Vitrinde gördüğün</strong>
              </div>
            </article>

            <span className="home-preview-connector" aria-hidden="true">
              <ArrowRight size={18} />
            </span>

            <article className="home-preview-tile home-preview-profile">
              <span className="home-preview-index">2</span>
              <div className="home-preview-image-wrap">
                <Image
                  src="/concept-poster.png"
                  alt="Kullanıcının dijital profili"
                  fill
                  sizes="(max-width: 760px) 44vw, 210px"
                />
              </div>
              <div>
                <small>Profil</small>
                <strong>Kendi fotoğrafın</strong>
              </div>
            </article>

            <span className="home-preview-connector" aria-hidden="true">
              <ArrowRight size={18} />
            </span>

            <article className="home-preview-tile home-preview-result">
              <span className="home-preview-index">3</span>
              <div className="home-preview-image-wrap">
                <Image
                  src="/concept-poster.png"
                  alt="Dijital ürün önizleme sonucu"
                  fill
                  sizes="(max-width: 760px) 90vw, 250px"
                />
                <span className="home-preview-ready">
                  <Check size={13} /> Hazır
                </span>
              </div>
              <div>
                <small>Önizleme</small>
                <strong>Kendinde gördüğün</strong>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="home-category-section" aria-labelledby="kategori-baslik">
        <div className="container">
          <div className="section-heading home-section-heading">
            <div>
              <span className="section-kicker">Tek panel, farklı kategoriler</span>
              <h2 id="kategori-baslik">Tarzını oluşturan ürünleri kendinde dene.</h2>
            </div>
            <p>
              Her kategori kendi yerleşim ve görünüm kurallarıyla işlenir. Ürün türünü
              seç, fotoğrafları yükle ve önizlemeyi oluştur.
            </p>
          </div>

          <div className="home-category-grid">
            {categories.map(({ icon: Icon, title, text, tag }) => (
              <Link className="home-category-card" href="#dene" key={title}>
                <span className="home-category-icon">
                  <Icon size={27} strokeWidth={1.5} />
                </span>
                <span className="home-category-tag">{tag}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="home-category-link">
                  Denemeyi aç <ArrowRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-how-section" id="nasil-calisir">
        <div className="container">
          <div className="section-heading centered home-centered-heading">
            <span className="section-kicker">Üç basit adım</span>
            <h2>Fotoğraftan kişisel önizlemeye.</h2>
            <p>
              Uygulama indirmeden, doğrudan telefon veya bilgisayarındaki tarayıcıdan
              başlayabilirsin.
            </p>
          </div>

          <div className="home-steps-grid">
            {steps.map(({ number, icon: Icon, title, text }, index) => (
              <article className="home-step-card" key={number}>
                <span className="home-step-number">{number}</span>
                <span className="home-step-icon">
                  <Icon size={27} strokeWidth={1.5} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                {index < steps.length - 1 && (
                  <span className="home-step-arrow" aria-hidden="true">
                    <ArrowRight size={19} />
                  </span>
                )}
              </article>
            ))}
          </div>

          <div className="home-how-cta">
            <Link className="button button-gold" href="#dene">
              <Camera size={18} /> İlk önizlemeyi oluştur
            </Link>
            <span>Fotoğraflarını yüklemeden önce kullanım ve gizlilik koşullarını inceleyebilirsin.</span>
          </div>
        </div>
      </section>

      <TryOnStudio />

      <section className="home-protection-section" id="guven">
        <div className="container home-protection-grid">
          <div className="home-protection-visual" aria-hidden="true">
            <div className="home-security-ring home-security-ring-one" />
            <div className="home-security-ring home-security-ring-two" />
            <div className="home-security-core">
              <ShieldCheck size={54} strokeWidth={1.25} />
              <span>SV</span>
              <strong>KİMLİK KORUMA</strong>
            </div>
            <div className="home-security-chip home-security-chip-one">
              <Check size={14} /> Ten rengi
            </div>
            <div className="home-security-chip home-security-chip-two">
              <Check size={14} /> Yüz & saç
            </div>
            <div className="home-security-chip home-security-chip-three">
              <Check size={14} /> Vücut & poz
            </div>
          </div>

          <div className="home-protection-copy">
            <span className="section-kicker">Kişi aynı kalır, yalnız ürün değişir</span>
            <h2>Ten rengin ve kişisel görünümün sistemin temel kuralıdır.</h2>
            <p>
              Deneme motoru kullanıcıyı yeniden tasarlamak için değil, seçilen ürünü
              mevcut fotoğrafa uygulamak için yönlendirilir. Sonuç üzerinde kontrol her
              zaman kullanıcıdadır.
            </p>
            <div className="home-protection-list">
              {protectionRules.map((rule) => (
                <span key={rule}>
                  <Check size={15} /> {rule}
                </span>
              ))}
            </div>
            <div className="home-protection-note">
              <LockKeyhole size={19} />
              <p>
                Dijital profil fotoğrafı, kullanıcı açıkça kaydettiğinde kendi cihazının
                yerel veritabanında tutulur.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-business-section" id="isletmeler">
        <div className="container home-business-card">
          <div className="home-business-copy">
            <span className="section-kicker">Butikler ve mağazalar için</span>
            <h2>Ürünü yalnız sergileme. Müşterinin kendinde görmesini sağla.</h2>
            <p>
              İşletme stüdyosunda ürün fotoğrafından katalog ve sosyal medya görseli
              oluştur. Aynı platform üzerinden müşterilerine kişisel deneme deneyimi sun.
            </p>
            <div className="home-business-features">
              <span>
                <Check size={15} /> Ürün odaklı katalog görseli
              </span>
              <span>
                <Check size={15} /> 4:5 sosyal medya oranı
              </span>
              <span>
                <Check size={15} /> Giyim ve aksesuar kategorileri
              </span>
            </div>
            <Link className="button button-light" href="#dene">
              <BriefcaseBusiness size={18} /> İşletme stüdyosunu aç
            </Link>
          </div>

          <div className="home-business-visual" aria-label="İşletme ürün görsel stüdyosu">
            <div className="home-business-window">
              <div className="home-business-window-top">
                <span />
                <span />
                <span />
                <strong>İşletme stüdyosu</strong>
              </div>
              <div className="home-business-window-body">
                <div className="home-business-upload">
                  <Images size={31} />
                  <strong>Ürün fotoğrafı</strong>
                  <small>Tek başına veya askıda</small>
                </div>
                <span className="home-business-process">
                  <ScanLine size={20} />
                </span>
                <div className="home-business-result">
                  <Image
                    src="/concept-poster.png"
                    alt="Üründen oluşturulan katalog görseli örneği"
                    fill
                    sizes="260px"
                  />
                  <span>
                    <Check size={12} /> Görsel hazır
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-faq-section" id="sss">
        <div className="container home-faq-grid">
          <div className="home-faq-intro">
            <span className="section-kicker">Sık sorulan sorular</span>
            <h2>Denemeye başlamadan önce bilmen gerekenler.</h2>
            <p>
              Fotoğraf kullanımı, desteklenen ürünler ve kişisel görünüm koruması
              hakkındaki temel yanıtlar.
            </p>
            <Link className="text-link home-arrow-link" href="/gizlilik">
              Gizlilik politikasını incele <ArrowRight size={17} />
            </Link>
          </div>

          <div className="home-faq-list">
            {faqs.map((item) => (
              <details key={item.question}>
                <summary>
                  <span>{item.question}</span>
                  <ChevronDown size={19} />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="home-final-cta">
        <div className="container home-final-cta-inner">
          <div>
            <span className="section-kicker">Hazırsan başla</span>
            <h2>Vitrinde gördüğünü, kendinde gör.</h2>
            <p>Ürün fotoğrafını ve kendi fotoğrafını seçerek ilk önizlemeni oluştur.</p>
          </div>
          <Link className="button button-gold" href="#dene">
            <Camera size={19} /> Kendimde dene
          </Link>
        </div>
      </section>

      <footer className="site-footer home-footer">
        <div className="container footer-inner">
          <Link className="brand" href="#top">
            <span className="brand-mark">SV</span>
            <span className="brand-copy">
              <strong>SOKAK VİTRİNİ</strong>
              <small>DENE</small>
            </span>
          </Link>
          <p>Sokakta gör. Kendinde dene.</p>
          <div className="footer-links">
            <Link href="#nasil-calisir">Nasıl çalışır?</Link>
            <Link href="/gizlilik">Gizlilik</Link>
            <Link href="/kullanim-kosullari">Kullanım Koşulları</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Sokak Vitrini</span>
          <span>Dijital ürün önizleme platformu</span>
        </div>
      </footer>

      <Link className="home-mobile-cta" href="#dene">
        <Camera size={18} /> Kendimde dene
      </Link>

      <Link className="home-scroll-cue" href="#deneyim" aria-label="Deneyim bölümüne git">
        <ArrowDown size={17} />
      </Link>
    </main>
  );
}
