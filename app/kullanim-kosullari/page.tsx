import type { Metadata } from "next";

import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Sokak Vitrini Dene kullanım koşulları.",
};

export default function TermsPage() {
  return (
    <LegalShell kicker="Son güncelleme: 18 Temmuz 2026" title="Kullanım Koşulları">
      <p>
        Sokak Vitrini Dene’yi kullanarak aşağıdaki koşulları kabul etmiş olursunuz.
        Hizmet, fiziksel bir ürünü satın almadan önce fikir vermek amacıyla görsel
        önizleme oluşturur.
      </p>

      <h2>Önizleme niteliği</h2>
      <p>
        Oluşturulan görseller yapay zekâ tahminidir. Gerçek ürünün ölçüsü, rengi,
        malzemesi, kesimi, duruşu veya mekâna uyumu önizlemeden farklı olabilir. Satın
        alma kararından önce ürünü ve satıcı bilgilerini doğrulamak kullanıcının
        sorumluluğundadır.
      </p>

      <h2>İzinli kullanım</h2>
      <p>Uygulamaya yalnızca kullanma hakkına sahip olduğunuz fotoğrafları yükleyin.</p>
      <ul>
        <li>Başka bir kişinin fotoğrafını açık izni olmadan yüklemeyin.</li>
        <li>Yasa dışı, yanıltıcı, taciz edici veya mahremiyeti ihlal eden içerik kullanmayın.</li>
        <li>Bir kişiyi küçük düşürmek, taklit etmek veya zarar vermek amacıyla görsel üretmeyin.</li>
        <li>Hizmet sınırlarını aşmaya veya güvenlik önlemlerini devre dışı bırakmaya çalışmayın.</li>
      </ul>

      <h2>Yasak içerik</h2>
      <p>
        Hizmet yalnızca takı, giyim, mobilya ve otomobil önizlemesi içindir. Aşağıdaki
        içerikler kaynak fotoğraf, arka plan, yerleşim notu veya oluşturulacak sonuç
        içinde kullanılamaz:
      </p>
      <ul>
        <li>Çıplaklık, pornografi, cinsel veya fetiş içerik ve mahrem görüntüler.</li>
        <li>18 yaş altındaki veya yaşı açıkça yetişkin görünmeyen kişilerin fotoğrafları.</li>
        <li>Şiddet, kan, yaralanma, istismar, kendine zarar verme, silah veya patlayıcı.</li>
        <li>Nefret sembolleri, terör veya aşırılık propagandası ve hedef gösterme.</li>
        <li>
          Siyasi kişiler, seçim veya parti çalışmaları, miting, protesto, propaganda ve
          siyasi semboller.
        </li>
        <li>
          İzin dışı yüz değiştirme, kimliğe bürünme, itibar zedeleme veya yasa dışı bir
          amaç taşıyan içerikler.
        </li>
      </ul>

      <h2>Otomatik güvenlik denetimi</h2>
      <p>
        Kaynak fotoğraflar görsel üretimden önce, oluşturulan sonuç ise kullanıcıya
        sunulmadan önce aynı güvenli GPU ortamında otomatik olarak denetlenir. Denetim
        tamamlanamazsa işlem güvenlik amacıyla durdurulur. Reddedilen işlemde görsel
        sonucu saklanmaz ve kullanılan ücretsiz hak veya kupon kredisi iade edilir.
        Otomatik sınıflandırma hata yapabilir; güvenli olduğu düşünülen bir içerik de
        reddedilebilir. Güvenlik önlemlerini aşmaya çalışmak veya tekrar eden yasak içerik
        denemeleri, tarayıcı, bağlantı ya da kupon için geçici erişim kısıtlamasına neden
        olur.
      </p>

      <h2>Ürün ve marka hakları</h2>
      <p>
        Fotoğrafladığınız ürünler marka, tasarım veya telif hakkıyla korunabilir. Üretilen
        önizlemeyi ticari amaçla kullanmadan önce gerekli izinleri almak sizin
        sorumluluğunuzdadır.
      </p>

      <h2>Hizmet sınırları</h2>
      <p>
        Yoğunluk, bakım, kullanım sınırı, yapay zekâ sağlayıcısı veya teknik nedenlerle
        önizleme geçici olarak kullanılamayabilir. Güvenli ve adil kullanım için oturum ve
        cihaz bazlı kontroller uygulanabilir.
      </p>

      <h2>Ücretsiz hak ve kupon</h2>
      <p>
        Her kullanıcıya aylık yenilenmeyen toplam 2 ücretsiz görsel üretim hakkı verilir.
        Dönemsel kampanya, tanıtım veya iş birliklerinde ek önizleme hakkı sağlayan
        kuponlar sunulabilir. Kuponların nakit karşılığı yoktur ve uygulama içinde satışa
        sunulmaz. Bir kuponun hak adedi ve varsa son kullanım tarihi kupon oluşturulurken
        belirlenir. Başarılı her önizleme bir hak kullanır; tamamlanamayan işlemde ayrılan
        hak otomatik olarak geri verilir.
      </p>

      <h2>Adil kullanım ve günlük kapasite</h2>
      <p>
        Kötüye kullanımı azaltmak için anonim oturum, bağlantı özeti, VPN/proxy/Tor risk
        kontrolü ve günlük genel üretim kapasitesi uygulanabilir. Risk sağlayıcısı geçici
        olarak yanıt vermezse diğer sınırlar yürürlükte kalır; açıkça VPN, proxy veya Tor
        olarak belirlenen bağlantılarda ücretsiz deneme engellenebilir. Günlük kapasite
        dolduğunda yeni işlem başlatılmaz ve kullanıcının hakkı düşürülmez. Kupon kodunu
        güvenli saklamak kullanıcının sorumluluğundadır.
      </p>

      <h2>Silme ve erişim</h2>
      <p>
        Sonuçlarınızı geçmiş bölümünden silebilirsiniz. Anonim oturum çerezinin silinmesi
        geçmişe erişimi kaldırabilir; bu durumda sonuçlar saklama süresi sonunda otomatik
        olarak temizlenir.
      </p>
    </LegalShell>
  );
}
