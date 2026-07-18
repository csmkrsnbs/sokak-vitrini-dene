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
        oturum kimliği kullanılabilir. Ham IP adresi uygulama veritabanında saklanmaz;
        yalnızca tuzlanmış bağlantı özeti tutulabilir.
      </p>

      <h2>Kupon verileri</h2>
      <p>
        Bir kupon etkinleştirildiğinde kuponun açık metni yerine tek yönlü güvenli özeti,
        toplam ve kalan önizleme hakkı, etkinleştirme zamanı, kampanya etiketi, son
        kullanım tarihi ve kuponun bağlandığı anonim oturum kimliği saklanır. Bunun
        dışında kullanıcıdan finansal bilgi istenmez ve işlenmez.
      </p>

      <h2>Fotoğrafların kullanımı</h2>
      <p>
        Yüklediğiniz ürün ve hedef fotoğrafları yalnızca talep ettiğiniz önizlemeyi
        oluşturmak amacıyla kategoriye göre yapay zekâ hizmet sağlayıcısına iletilir.
        Fotoğraflar kategoriye göre kendi RunPod Serverless FLUX veya VTON worker’ımıza
        Base64 veri olarak gönderilir. Bu iki kaynak fotoğraf Sokak Vitrini Dene
        veritabanında kalıcı olarak saklanmaz. Girdiler RunPod işinin işlenmesi ve iş
        yaşam süresi boyunca geçici olarak bulunabilir; sonuç üçüncü taraf CDN adresi
        yerine Base64 olarak alınır. Oluşturulan sonuç görseli, size geçmişte
        gösterilebilmesi için Sokak Vitrini Dene veritabanında sınırlı süreyle saklanır.
      </p>

      <h2>İçerik güvenliği denetimi</h2>
      <p>
        Giyim worker’ındaki yerel güvenlik denetimi yetişkinlere ait iç çamaşırı, mayo ve
        kostüm katalog görüntülerini kabul ederken açık çıplaklığı ve cinsel eylemi
        engellemeyi amaçlar; denetim tamamen kapatılmaz. Diğer kategorilerde de kaynak ve
        sonuç görselleri RunPod GPU worker’ındaki güvenlik sınıflandırmasından geçirilir.
        Sınıflandırma puanları uygulama veritabanında saklanmaz.
        Reddedilen denemede yalnızca genel güvenlik hata kodu, anonim oturum veya
        tuzlanmış bağlantı özeti ve işlem zamanı; tekrar eden kötüye kullanımı sınırlamak
        için normal önizleme saklama süresi boyunca tutulabilir. Otomatik denetim hata
        yapabilir ve tek başına içeriğin hukuka uygun olduğuna dair garanti oluşturmaz.
      </p>

      <h2>Saklama süresi ve silme</h2>
      <p>
        Sonuç görselleri varsayılan olarak 30 gün sonra otomatik olarak silinir. Uygulama
        yöneticisi bu süreyi daha kısa belirleyebilir. Geçmiş bölümündeki silme düğmesiyle
        kendi sonuç görselinizi daha önce de kalıcı olarak silebilirsiniz. Kupon ve hak
        hareketleri; kötüye kullanımı önlemek ve erişim avantajını işletmek için sonuç
        görselinden daha uzun süre saklanabilir.
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
        kullanılır. Kupon çerezi ve anonim oturum çerezi birlikte, kalan önizleme
        haklarının yalnızca kuponu ilk etkinleştiren tarayıcıda kullanılabilmesini sağlar.
      </p>

      <h2>Üçüncü taraf hizmet</h2>
      <p>
        Tüm önizlemeler kategoriye göre iki ayrı self-host RunPod Serverless endpoint’i
        üzerinden gerçekleştirilir. Model ağırlıkları ilk kurulumda Hugging Face’den
        indirilebilir; kullanıcı fotoğrafları model indirme hizmetine gönderilmez.
        RunPod’ın güvenlik ve veri işleme koşulları geçerlidir. API anahtarı kullanıcıya
        veya tarayıcıya gönderilmez.
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
