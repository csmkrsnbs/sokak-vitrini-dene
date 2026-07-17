import type { Metadata } from "next";

import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Gizlilik",
  description: "Sokak Vitrini Dene gizlilik açıklaması.",
};

export default function PrivacyPage() {
  return (
    <LegalShell kicker="Son güncelleme: 18 Temmuz 2026" title="Gizlilik">
      <p>
        Sokak Vitrini Dene, ürünleri üzerinizde veya yaşam alanınızda görmenizi sağlayan
        yapay zekâ destekli bir önizleme hizmetidir. Bu açıklama, uygulama içinde işlenen
        verilerin kapsamını anlatır.
      </p>

      <h2>İşlenen veriler</h2>
      <p>
        Önizleme oluşturduğunuzda ürün fotoğrafı, hedef kişi veya mekân fotoğrafı, seçilen
        ürün türü ve isteğe bağlı yerleşim notu işlenir. Kötüye kullanımı sınırlamak için
        IP adresinizin tek yönlü ve geri döndürülemez bir özeti ile tarayıcınıza ait anonim
        oturum kimliği kullanılabilir. Ücretsiz deneme sırasında IP adresi, VPN, proxy veya
        Tor bağlantısı kontrolü için güvenlik sağlayıcısına anlık olarak iletilir. Ham IP
        adresi uygulama veritabanında saklanmaz; yalnızca tuzlanmış ağ özeti, kontrol sonucu
        ve kısa süreli önbellek tarihi tutulur.
      </p>

      <h2>Kupon verileri</h2>
      <p>
        Bir kupon etkinleştirildiğinde kuponun açık metni yerine tek yönlü güvenli özeti,
        toplam ve kalan önizleme hakkı, etkinleştirme zamanı, kampanya etiketi ve varsa
        son kullanım tarihi saklanır. Bunun dışında kullanıcıdan finansal bilgi
        istenmez ve işlenmez.
      </p>

      <h2>Fotoğrafların kullanımı</h2>
      <p>
        Yüklediğiniz ürün ve hedef fotoğrafları yalnızca talep ettiğiniz önizlemeyi
        oluşturmak amacıyla yapay zekâ hizmet sağlayıcısına iletilir. Bu iki kaynak
        fotoğraf Sokak Vitrini Dene veritabanında kalıcı olarak saklanmaz; işlem
        tamamlanana veya geçici iş süresi dolana kadar sağlayıcının iş kuyruğunda
        bulunabilir. Oluşturulan sonuç görseli, geçmişinizde gösterilebilmesi için
        sınırlı süreyle saklanır.
      </p>

      <h2>İçerik güvenliği denetimi</h2>
      <p>
        Kaynak fotoğraflar ve oluşturulan sonuç; çıplaklık veya cinsel içerik, 18 yaş
        altındaki kişiler, şiddet, silah, nefret veya aşırılık sembolleri ve siyasi içerik
        riskini belirlemek amacıyla aynı RunPod GPU worker’ında otomatik sınıflandırmadan
        geçirilir. Bu denetim için ayrı bir üçüncü taraf moderasyon servisine ikinci kez
        gönderim yapılmaz. Sınıflandırma puanları uygulama veritabanında saklanmaz.
        Reddedilen denemede yalnızca genel güvenlik hata kodu, anonim oturum veya
        tuzlanmış bağlantı özeti ve işlem zamanı; tekrar eden kötüye kullanımı sınırlamak
        için normal önizleme saklama süresi boyunca tutulabilir. Otomatik denetim hata
        yapabilir ve tek başına içeriğin hukuka uygun olduğuna dair garanti oluşturmaz.
      </p>

      <h2>Saklama süresi ve silme</h2>
      <p>
        Sonuç görselleri varsayılan olarak 30 gün sonra otomatik olarak silinir. Uygulama
        yöneticisi bu süreyi daha kısa belirleyebilir. Geçmiş bölümündeki silme düğmesiyle
        kendi sonuç görselinizi daha önce de kalıcı olarak silebilirsiniz. Ücretsiz kullanım
        hakkı kayıtları ile kupon ve hak hareketleri; kötüye kullanımı önlemek ve erişim
        avantajını işletmek için sonuç görselinden daha uzun süre saklanabilir.
      </p>

      <h2>Erişim</h2>
      <p>
        Sonuçlar anonim tarayıcı oturumuna bağlanır ve herkese açık bir galeride
        yayınlanmaz. Tarayıcı çerezlerini silmeniz, aynı tarayıcıdaki geçmiş erişiminizi
        kaybetmenize neden olabilir.
      </p>

      <h2>Çerezler</h2>
      <p>
        Anonim oturum, etkin kupon ve yönetici oturumu için güvenli, HttpOnly çerezler
        kullanılır. Kupon çerezi, kalan önizleme haklarının bu tarayıcıda kullanılabilmesini sağlar.
      </p>

      <h2>Üçüncü taraf hizmet</h2>
      <p>
        Yapay zekâ işlemi, sunucuda yapılandırılmış görsel üretim sağlayıcısı üzerinden
        gerçekleştirilir. Ücretsiz denemenin kötüye kullanımını azaltmak için bağlantı riski
        IPQualityScore üzerinden en iyi çabayla kontrol edilir. Sağlayıcı yanıt vermezse
        oturum, bağlantı özeti ve günlük kapasite sınırları uygulanmaya devam eder. Bu
        sağlayıcıların kendi güvenlik ve veri işleme koşulları geçerlidir. API anahtarları
        kullanıcıya veya tarayıcıya gönderilmez.
      </p>

      <h2>Fotoğraftaki kişiler</h2>
      <p>
        Başka bir kişiye ait fotoğrafı yalnızca o kişinin açık izniyle yüklemelisiniz.
        Bu hizmette 18 yaş altındaki kişilere ait fotoğraflar, ebeveyn veya yasal temsilci
        izni bulunsa dahi kabul edilmez.
      </p>
    </LegalShell>
  );
}
