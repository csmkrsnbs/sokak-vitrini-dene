import type { Metadata } from "next";

import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Sokak Vitrini Dene kullanım koşulları.",
};

export default function TermsPage() {
  return (
    <LegalShell kicker="Son güncelleme: 22 Temmuz 2026" title="Kullanım Koşulları">
      <p>
        Sokak Vitrini Dene’yi kullanarak aşağıdaki koşulları kabul etmiş olursunuz.
        Hizmet, ürünü satın almadan veya ticari içerikte kullanmadan önce fikir vermek
        amacıyla yapay zekâ tabanlı görsel önizleme üretir.
      </p>

      <h2>Önizleme niteliği</h2>
      <p>
        Oluşturulan görseller tahminidir. Gerçek ürünün ölçüsü, rengi, malzemesi, kesimi,
        bedeni, duruşu ve vücutla teması sonuçtan farklı olabilir. Özellikle iç giyim ve
        beden uyumu gerektiren ürünlerde sonuç tıbbi, ergonomik veya doğru beden tavsiyesi
        değildir. Satın alma kararından önce gerçek ürün bilgisini doğrulamak kullanıcıya
        aittir.
      </p>

      <h2>Kimlik ve ten koruma</h2>
      <p>
        Kişisel denemede amaç yalnızca seçilen ürünü uygulamaktır. Ten rengi, yüz, saç,
        yaş görünümü, vücut oranı, poz veya arka plan değişmiş görünüyorsa çıktı hatalı
        kabul edilmeli; indirilmemeli, paylaşılmamalı ve uygulamadaki silme seçeneğiyle
        kaldırılmalıdır. Kullanıcı notları kişiyi değiştirmek için kullanılamaz.
      </p>

      <h2>İzinli kullanım</h2>
      <ul>
        <li>Yalnızca kullanma hakkına sahip olduğunuz fotoğraf ve ürün görsellerini yükleyin.</li>
        <li>Başka bir kişinin fotoğrafını açık izni olmadan kullanmayın.</li>
        <li>Bir kişiyi aldatmak, taklit etmek, küçük düşürmek veya itibarını zedelemek amacıyla görsel üretmeyin.</li>
        <li>Üretilen görseli gerçek çekim, ürün garantisi veya kesin beden sonucu gibi sunmayın.</li>
        <li>Güvenlik, kupon, günlük kapasite veya erişim kontrollerini aşmaya çalışmayın.</li>
      </ul>

      <h2>Yetişkin moda kategorileri</h2>
      <p>
        Bikini, mayo, sütyen, alt iç giyim, korse, body ve fantezi giyim kategorileri
        bulunabilir. Bu kategoriler yalnızca 18 yaş ve üzeri kişilerin açık çıplaklık,
        cinsel eylem veya pornografik bağlam içermeyen moda, katalog ve sanal deneme
        görselleri için kullanılabilir. Kategori adı, yasak içeriğe izin verildiği anlamına
        gelmez.
      </p>

      <h2>Yasak içerik</h2>
      <ul>
        <li>Açık çıplaklık, pornografi, cinsel eylem, mahrem görüntü veya rıza dışı cinselleştirme.</li>
        <li>18 yaş altındaki ya da açıkça yetişkin görünmeyen kişilerin fotoğrafları.</li>
        <li>Şiddet, ağır yaralanma, istismar, kendine zarar verme, silah veya patlayıcı.</li>
        <li>Nefret, terör, aşırılık propagandası, hedef gösterme veya taciz.</li>
        <li>İzinsiz yüz değiştirme, kimliğe bürünme, dolandırıcılık veya yasa dışı kullanım.</li>
      </ul>

      <h2>Otomatik denetim ve reddedilen işlemler</h2>
      <p>
        Yapay zekâ sağlayıcısının güvenlik denetimleri ve uygulamadaki metin kontrolleri
        uygulanır. Denetim hata yapabilir ve güvenli bir içerik de reddedilebilir.
        Sağlayıcı işlemi güvenlik gerekçesiyle reddeder veya teknik olarak tamamlayamazsa
        sonuç kaydedilmez; ayrılan kupon hakkı uygulamadaki iade mekanizmasıyla geri
        yüklenir. Tekrarlayan yasak içerik denemeleri geçici erişim kısıtlamasına neden
        olabilir.
      </p>

      <h2>İşletme stüdyosu</h2>
      <p>
        İşletme stüdyosu, ürün fotoğrafından yeni bir yetişkin model ve katalog kompozisyonu
        oluşturur. Çıktı gerçek bir müşteri, çalışan veya tanınmış kişinin çekimi olarak
        sunulmamalıdır. Ticari yayından önce ürünün doğru göründüğünü, marka ve reklam
        kurallarına uyduğunu kontrol etmek işletmenin sorumluluğundadır.
      </p>

      <h2>Ürün, marka ve telif hakları</h2>
      <p>
        Fotoğrafladığınız ürünler marka, tasarım veya telif hakkıyla korunabilir. Üretilen
        önizlemeyi ticari amaçla kullanmadan önce gerekli lisans ve izinleri almak size
        aittir.
      </p>

      <h2>Kuponla erişim</h2>
      <p>
        Bu sürümde önizleme yalnızca geçerli ve bakiyesi bulunan kuponla başlatılır.
        Kupon ilk etkinleştirildiği anonim tarayıcı oturumuna bağlanabilir ve başka bir
        tarayıcıda kullanılamayabilir. Tarayıcı verilerinin silinmesi kupon ve geçmiş
        erişimini kaybettirebilir. Başarılı işlem bir hak tüketir; uygulama tarafından
        başarısız olarak sonlandırılan işlemde ayrılan hak geri verilir.
      </p>

      <h2>Hizmet sınırları</h2>
      <p>
        Yoğunluk, bakım, günlük kapasite, veritabanı, yapay zekâ sağlayıcısı veya ağ
        sorunları nedeniyle hizmet geçici olarak kullanılamayabilir. Sonuç süresi ve
        kalitesi ürün fotoğrafına, kişi fotoğrafına, seçilen kategoriye ve sağlayıcı
        kapasitesine bağlıdır.
      </p>

      <h2>Silme ve erişim</h2>
      <p>
        Sonuçlarınızı geçmiş bölümünden silebilirsiniz. Anonim oturum çerezinin silinmesi
        geçmişe erişimi kaldırabilir. Yerel dijital profilinizi tarayıcı verilerini
        temizleyerek veya uygulamadaki profil kaldırma işlemiyle silebilirsiniz.
      </p>
    </LegalShell>
  );
}
