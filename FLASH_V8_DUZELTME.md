# Flash V8 Düzeltmesi

GitHub Actions logundaki iki hata doğrudan giderildi:

1. RunPod Flash 1.18.0 `Endpoint` sınıfı dekoratörde `python_version` kabul etmiyor.
   Bu alan kaldırıldı; CLI seçeneği korunuyor.
2. Flash modül keşfi uzak bağımlılıklar kurulmadan önce yerel dosyaları yüklüyor.
   Bu nedenle NumPy ve Pillow workflow ortamına da eklendi.

Eski GHCR Docker workflow'u artık push sırasında otomatik çalışmaz; yalnız elle
çalıştırılabilir. Aktif dağıtım yolu `Deploy VTON with RunPod Flash` workflow'udur.
