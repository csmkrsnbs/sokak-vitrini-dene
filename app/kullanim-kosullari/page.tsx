import type { Metadata } from "next";

import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Sokak Vitrini Dene kullanım koşulları.",
};

export default function TermsPage() {
  return (
    <LegalShell kicker="Son güncelleme: 14 Temmuz 2026" title="Kullanım Koşulları">
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

      <h2>Ürün ve marka hakları</h2>
      <p>
        Fotoğrafladığınız ürünler marka, tasarım veya telif hakkıyla korunabilir. Üretilen
        önizlemeyi ticari amaçla kullanmadan önce gerekli izinleri almak sizin
        sorumluluğunuzdadır.
      </p>

      <h2>Hizmet sınırları</h2>
      <p>
        Yoğunluk, bakım, kullanım sınırı, yapay zekâ sağlayıcısı veya teknik nedenlerle
        önizleme geçici olarak kullanılamayabilir. Güvenli ve adil kullanım için günlük
        işlem sınırı uygulanabilir.
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
