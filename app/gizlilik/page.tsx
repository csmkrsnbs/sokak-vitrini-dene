import type { Metadata } from "next";

import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Gizlilik",
  description: "Sokak Vitrini Dene gizlilik açıklaması.",
};

export default function PrivacyPage() {
  return (
    <LegalShell kicker="Son güncelleme: 14 Temmuz 2026" title="Gizlilik">
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
        kendi sonuç görselinizi daha önce de kalıcı olarak silebilirsiniz.
      </p>

      <h2>Erişim</h2>
      <p>
        Sonuçlar anonim tarayıcı oturumuna bağlanır ve herkese açık bir galeride
        yayınlanmaz. Tarayıcı çerezlerini silmeniz, aynı tarayıcıdaki geçmiş erişiminizi
        kaybetmenize neden olabilir.
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
