# Kimlik ve Ten Koruma Kuralları

## Değişmez alanlar

- Ten rengi, cilt alt tonu ve etnik görünüm
- Yüz, ifade, yaş görünümü, saç rengi ve saç modeli
- Boy, omuz, göğüs, bel, basen, kol ve bacak oranları
- El ve parmak yapısı
- Poz, kamera açısı, arka plan, temel ışık ve gölgeler

## Değişebilecek alan

Yalnızca seçilen ürünün kapladığı giyim veya aksesuar alanı değişebilir. Ürünün renk, desen, logo, baskı, düğme, fermuar, yaka, kol, uzunluk ve kesim ayrıntıları korunmalıdır.

## Teknik uygulama

- Kişisel denemede varsayılan model `tryon-max`tır.
- Varsayılan maliyet ayarı `fast` + `1k`dır.
- Girdiler base64 gönderilir; çıktılar `return_base64: true` ile alınır.
- Sunucu zorunlu kimlik ve ten koruma promptu ekler.
- Ten, yüz, saç veya vücut değiştirme isteyen notlar reddedilir.
- Sonuç ekranı kullanıcıya giriş fotoğrafıyla karşılaştırma kontrolü gösterir.
- Hatalı sonuç, geçmiş ve veritabanı kaydıyla birlikte silinebilir.

## Sınır

Üretken yapay zekâ çıktısı yüzde yüz deterministik değildir. Kimlik veya ten tonu değişmiş görünüyorsa sonuç kullanılmamalı, silinmeli ve daha net/önden çekilmiş fotoğrafla yeniden denenmelidir.
