# Sokak Vitrini Dijital Beden — Final v3

GPU veya RunPod kullanmadan çalışan ölçü tabanlı dijital vücut profili, beden uyum analizi ve kombin önizleme uygulaması.

## Çalışma mantığı

1. İlk açılışta kullanıcı 11 vücut ölçüsünü girer.
2. Sistem bu ölçülerden orantılı bir dijital beden profili oluşturur.
3. Katalogdaki her ürünün gerçek beden ölçüleri kullanıcı profiliyle karşılaştırılır.
4. Sistem en uygun bedeni, dar/uygun/bol bölgeleri ve uyum puanını gösterir.
5. Üst, alt, dış giyim, takı, çanta ve ayakkabı aynı profil üzerinde kombinlenebilir.
6. Kullanıcı gerçek ölçülere sahip kendi ürününü ve ürün görselini ekleyebilir.

## Maliyet

- RunPod yok
- GPU yok
- Harici yapay zekâ API anahtarı yok
- Boşta çalışan servis ücreti yok

Tüm profil ve özel ürün verileri varsayılan olarak tarayıcıdaki `localStorage` alanında tutulur.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcı: `http://localhost:3000`

## Kontrol

```bash
npm run check
```

Bu komut TypeScript ve production build kontrollerini çalıştırır.

## Vercel

Projeyi GitHub'a gönderip Vercel'e bağlayın. İsteğe bağlı tek ortam değişkeni:

```env
NEXT_PUBLIC_APP_URL="https://alan-adresiniz.com"
```

## Önemli

Beden analizi, gerçek ürün ölçü tablosunu temel alan bir karar desteğidir. Fiziksel prova garantisi değildir.
