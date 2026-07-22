import type { Metadata } from "next";

import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Gizlilik",
  description: "Sokak Vitrini Dene gizlilik açıklaması.",
};

export default function PrivacyPage() {
  return (
    <LegalShell kicker="Son güncelleme: 22 Temmuz 2026" title="Gizlilik">
      <p>
        Sokak Vitrini Dene; giyim ve giyilebilir ürünleri kendi fotoğrafınızda
        önizlemenizi, ayrıca ürün fotoğrafından işletme kullanımına yönelik model görseli
        oluşturmanızı sağlayan yapay zekâ destekli bir hizmettir.
      </p>

      <h2>İşlenen veriler</h2>
      <ul>
        <li>Yüklediğiniz ürün ve kişi fotoğrafları.</li>
        <li>Seçtiğiniz kategori, ürün türü, çalışma modu ve yerleşim notu.</li>
        <li>Oluşturulan sonuç görseli ve işlemin teknik durum bilgileri.</li>
        <li>Anonim oturum, kupon, kullanım ve kötüye kullanım önleme kayıtları.</li>
      </ul>

      <h2>Dijital profil</h2>
      <p>
        “Dijital profilimi kaydet” seçeneğiyle kaydettiğiniz kişi fotoğrafı sunucudaki
        kullanıcı hesabına yüklenmez. Fotoğraf, kullandığınız tarayıcının IndexedDB adlı
        yerel veri alanında saklanır. Tarayıcı verilerini temizlediğinizde veya farklı
        cihaz kullandığınızda bu profile erişemeyebilirsiniz.
      </p>

      <h2>Yapay zekâ işlemi</h2>
      <p>
        Önizleme başlatıldığında gerekli ürün ve kişi görselleri, görsel üretimini
        gerçekleştiren FASHN API’ye sunucu üzerinden aktarılır. API anahtarı tarayıcıya
        gönderilmez. Uygulama, sonuçları doğrudan veritabanına kaydedebilmek ve dış görsel
        bağlantısına bağımlı kalmamak için mümkün olduğunda base64 çıktı kullanır.
      </p>

      <h2>Kimlik ve ten koruma</h2>
      <p>
        Kişisel deneme isteklerinde sistem yalnızca seçilen ürünü değiştirmeyi hedefleyen
        koruma talimatları kullanır. Ten rengi, cilt alt tonu, yüz, saç, yaş görünümü,
        vücut oranı, poz, eller, arka plan ve temel ışığı değiştirmeye yönelik kullanıcı
        notları kabul edilmez. Üretken yapay zekâ çıktıları kesin değildir; kişi veya ten
        tonu değişmiş görünüyorsa sonuç kullanılmamalı ve uygulamadan silinmelidir.
      </p>

      <h2>Saklama ve silme</h2>
      <p>
        Tamamlanan sonuç görselleri varsayılan olarak 30 gün saklanır; bu süre
        <code>IMAGE_RETENTION_DAYS</code> ayarıyla değiştirilebilir. Sonucunuzu geçmiş
        bölümünden daha önce silebilirsiniz. Süresi dolan sonuçlar zamanlanmış temizlik
        işlemiyle kaldırılır. Başarısız işlem kayıtları, güvenlik ve kupon iadesini
        doğrulamak için sınırlı teknik bilgi içerebilir.
      </p>

      <h2>Kupon ve kullanım kayıtları</h2>
      <p>
        Kupon kodu doğrudan saklanmaz; doğrulama için özet değer kullanılır. Etkin kupon,
        anonim tarayıcı oturumuna bağlanabilir. Kullanım hakkı, günlük kapasite, güvenlik
        denemeleri ve hatalı işlemlerdeki iade hareketleri hizmetin çalışması ve kötüye
        kullanımın önlenmesi amacıyla tutulur.
      </p>

      <h2>Çerezler</h2>
      <p>
        Anonim oturum, etkin kupon ve yönetici oturumu için güvenli HttpOnly çerezler
        kullanılır. Tarayıcı çerezlerini silmek kupona ve geçmiş sonuçlara erişiminizi
        kaybettirebilir.
      </p>

      <h2>Fotoğraftaki kişiler ve yaş sınırı</h2>
      <p>
        Başka bir kişiye ait fotoğrafı yalnızca açık izniyle yükleyebilirsiniz. İç giyim,
        bikini, mayo, korse, body ve fantezi giyim kategorileri yalnızca açıkça yetişkin
        kişilerin, çıplaklık ve cinsel eylem içermeyen moda veya katalog görsellerinde
        kullanılabilir. 18 yaş altındaki kişilere ait fotoğraflar kabul edilmez.
      </p>

      <h2>Hizmet sağlayıcıları</h2>
      <p>
        Veritabanı, barındırma ve yapay zekâ hizmeti için farklı teknik sağlayıcılar
        kullanılabilir. Bu sağlayıcılar yalnızca hizmeti sunmak için gerekli veriyi işler.
        Canlı ortamı kuran işletme, kendi alan adı, veri sorumlusu bilgileri ve hizmet
        sağlayıcı sözleşmelerini ayrıca güncel tutmalıdır.
      </p>
    </LegalShell>
  );
}
