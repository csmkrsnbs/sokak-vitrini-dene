import type { Metadata } from "next";

import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Gizlilik",
  description: "Sokak Vitrini Dene gizlilik açıklaması.",
};

export default function PrivacyPage() {
  return (
    <LegalShell kicker="Son güncelleme: 17 Temmuz 2026" title="Gizlilik">
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
        oturum kimliği kullanılabilir.
      </p>

      <h2>Paket ve ödeme verileri</h2>
      <p>
        Standart Paket talebi oluşturduğunuzda ad soyad, e-posta adresi, size özel
        havale açıklaması, talep durumu ve kupon kredi hareketleri saklanır. IBAN
        ödemesi banka hareketiyle yönetici tarafından elle eşleştirilir; uygulama banka
        parolanızı, kart bilginizi veya kripto cüzdan anahtarınızı istemez ve işlemez.
      </p>

      <h2>Fotoğrafların kullanımı</h2>
      <p>
        Yüklediğiniz ürün ve hedef fotoğrafları yalnızca talep ettiğiniz önizlemeyi
        oluşturmak amacıyla yapay zekâ hizmet sağlayıcısına iletilir. Bu iki kaynak
        fotoğraf Sokak Vitrini Dene veritabanında kalıcı olarak saklanmaz. Oluşturulan
        sonuç görseli, geçmişinizde gösterilebilmesi için sınırlı süreyle saklanır.
      </p>

      <h2>Saklama süresi ve silme</h2>
      <p>
        Sonuç görselleri varsayılan olarak 30 gün sonra otomatik olarak silinir. Uygulama
        yöneticisi bu süreyi daha kısa belirleyebilir. Geçmiş bölümündeki silme düğmesiyle
        kendi sonuç görselinizi daha önce de kalıcı olarak silebilirsiniz. Ücretsiz kullanım
        hakkı kayıtları ile ödeme, kupon ve kredi kayıtları; kötüye kullanımı önlemek,
        paketi işletmek ve mali yükümlülükleri yerine getirmek için sonuç görselinden daha
        uzun süre saklanabilir.
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
        kullanılır. Kupon çerezi, kalan kredilerin bu tarayıcıda kullanılabilmesini sağlar.
      </p>

      <h2>Üçüncü taraf hizmet</h2>
      <p>
        Yapay zekâ işlemi, sunucuda yapılandırılmış görsel üretim sağlayıcısı üzerinden
        gerçekleştirilir. Hizmet sağlayıcısının kendi güvenlik ve veri işleme koşulları
        geçerlidir. API anahtarları kullanıcıya veya tarayıcıya gönderilmez.
      </p>

      <h2>Fotoğraftaki kişiler</h2>
      <p>
        Başka bir kişiye ait fotoğrafı yalnızca o kişinin açık izniyle yüklemelisiniz.
        Çocuklara ait fotoğraflar ebeveyn veya yasal temsilci izni olmadan yüklenmemelidir.
      </p>
    </LegalShell>
  );
}
