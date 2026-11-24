import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Camera, ChevronDown, History, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { TryOnStudio } from "@/components/try-on-studio";

const categories = [
  {
    "title": "Giyim",
    "kind": "shirt",
    "image": "https://images.pexels.com/photos/7671167/pexels-photo-7671167.jpeg?auto=compress&cs=tinysrgb&w=650",
    "text": "Klasik ve günlük giyim"
  },
  {
    "title": "İç giyim",
    "kind": "bra",
    "image": "https://images.pexels.com/photos/15751888/pexels-photo-15751888.jpeg?auto=compress&cs=tinysrgb&w=650",
    "text": "Yetişkin iç giyim ve mayo"
  },
  {
    "title": "Takı",
    "kind": "necklace",
    "image": "https://images.pexels.com/photos/35933227/pexels-photo-35933227.jpeg?auto=compress&cs=tinysrgb&w=650",
    "text": "Kolye, küpe ve bileklik"
  },
  {
    "title": "Ayakkabı",
    "kind": "shoes",
    "image": "https://images.pexels.com/photos/27256448/pexels-photo-27256448.jpeg?auto=compress&cs=tinysrgb&w=650",
    "text": "Günlük ve klasik ayakkabı"
  },
  {
    "title": "Çanta",
    "kind": "bag",
    "image": "https://images.pexels.com/photos/26954381/pexels-photo-26954381.jpeg?auto=compress&cs=tinysrgb&w=650",
    "text": "Çanta ve el çantası"
  },
  {
    "title": "Aksesuar",
    "kind": "glasses",
    "image": "https://images.pexels.com/photos/3892369/pexels-photo-3892369.jpeg?auto=compress&cs=tinysrgb&w=650",
    "text": "Gözlük, şapka ve aksesuar"
  }
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
    {"@context":"https://schema.org","@type":"WebApplication",name:"Sokak Vitrini Dene",applicationCategory:"ShoppingApplication",operatingSystem:"Web",description:"Giyim ve aksesuarları kendi fotoğrafında dijital olarak dene; ürün fotoğrafından katalog görseli oluştur."},
    {"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs.map(item=>({"@type":"Question",name:item.question,acceptedAnswer:{"@type":"Answer",text:item.answer}}))}
  ];
  return (
    <main className="pearl-compact">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}} />
      <header className="site-header home-header">
        <div className="container header-inner">
          <Link className="brand" href="#top" aria-label="Sokak Vitrini Dene ana sayfa"><span className="brand-mark" aria-hidden="true">SV</span><span className="brand-copy"><strong>SOKAK VİTRİNİ</strong><small>DENE</small></span></Link>
          <nav className="desktop-nav home-nav" aria-label="Ana menü">
            <Link href="#kategoriler">Kategoriler</Link><Link href="#dene" data-dene-mode="personal">Kendimde dene</Link><Link href="#dene" data-dene-mode="studio">İşletme stüdyosu</Link>
          </nav>
          <Link className="compact-history-link" href="#gecmis" aria-label="Denemelerim"><History size={19}/><span>Denemelerim</span></Link>
        </div>
      </header>

      <section className="home-hero" id="top">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="eyebrow home-eyebrow"><Sparkles size={14}/> Dijital ürün deneme</span>
            <h1>Sokakta gör.<span>Kendinde dene.</span></h1>
            <p>Beğendiğin ürünü yükle, fotoğrafını seç ve yapay zekâ ile kendi görünümünde önizle.</p>
            <div className="home-hero-actions">
              <Link className="button button-gold home-primary-cta" href="#dene" data-dene-mode="personal"><Camera size={17}/> Kendimde dene</Link>
              <Link className="button button-outline" href="#dene" data-dene-mode="studio"><BriefcaseBusiness size={17}/> İşletmem için</Link>
            </div>
          </div>
          <figure className="compact-hero-flow" id="nasil-calisir">
            <Image src="/pearl-tryon-photo.webp" alt="Açık bej ceket, beyaz üst giyen kişi ve aynı kişinin ceketi giymiş temsili görünümü" width={480} height={270} priority unoptimized className="compact-flow-image"/>
            <div className="compact-flow-labels" aria-hidden="true"><span><b>01</b> Ürünü yükle</span><span><b>02</b> Fotoğrafını seç</span><span><b>03</b> Kendinde gör</span></div>
            <figcaption>Yapay zekâ ile hazırlanmış temsili deneme akışı</figcaption>
          </figure>
        </div>
      </section>

      <section className="home-category-section fashion-category-section" id="kategoriler" aria-labelledby="kategori-baslik">
        <div className="container">
          <div className="fashion-category-heading"><h2 id="kategori-baslik">Tarzını keşfet</h2><span>Bir kategori seç, denemeye başla.</span></div>
          <div className="home-category-grid fashion-category-grid">
            {categories.map(({title,kind,image})=>(
              <Link className="fashion-category-card" href="#dene" data-dene-kind={kind} key={kind}>
                <div className="fashion-category-photo"><Image src={image} alt={title+" moda ürünü"} fill sizes="(max-width: 700px) 46vw, 16vw"/></div>
                <div className="fashion-category-label"><h3>{title}</h3><ArrowRight size={15} aria-hidden="true"/></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TryOnStudio />

      <section className="compact-help" id="sss">
        <div className="container compact-help-inner">
          <div className="compact-trust" id="guven">
            <span><ShieldCheck size={17}/> Kimlik ve ten koruma odaklı</span>
            <span><LockKeyhole size={17}/> Cihazında dijital profil</span>
            <Link href="/gizlilik">Gizlilik politikası <ArrowRight size={13}/></Link>
          </div>
          <details className="compact-faq">
            <summary>Sık sorulan sorular <ChevronDown size={18}/></summary>
            <div className="home-faq-list">{faqs.map(item=>(<details key={item.question}><summary><span>{item.question}</span><ChevronDown size={15}/></summary><p>{item.answer}</p></details>))}</div>
          </details>
        </div>
      </section>
      <footer className="site-footer home-footer">
        <div className="container compact-footer"><Link className="brand" href="#top"><span className="brand-mark">SV</span><span className="brand-copy"><strong>SOKAK VİTRİNİ</strong><small>DENE</small></span></Link><span>© {new Date().getFullYear()} Sokak Vitrini</span><div className="footer-links"><Link href="#nasil-calisir">Nasıl çalışır?</Link><Link href="/gizlilik">Gizlilik</Link><Link href="/kullanim-kosullari">Kullanım Koşulları</Link></div></div>
      </footer>
      <Link className="home-mobile-cta" href="#dene" data-dene-mode="personal"><Camera size={18}/> Kendimde dene</Link>
    </main>
  );
}
