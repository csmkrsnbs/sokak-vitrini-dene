# Flash v14 — TorchVision yerinde düzeltme

Bu sürüm yeni endpoint ve yeni volume oluşturmaz. Mevcut `sv-vton-flash-v13` endpoint'ini ve `/runpod-volume/python-packages-v13` paket alanını kullanır.

Düzeltmeler:

- FASHN VTON tarafından zorunlu kullanılan `torchvision` runtime kontrolüne eklendi.
- Worker'daki mevcut PyTorch sürümü okunur ve resmî PyTorch/TorchVision eşleşmesine göre uygun TorchVision wheel'i seçilir.
- TorchVision `--no-deps` ile kurulur; mevcut büyük PyTorch paketi yeniden indirilmez veya değiştirilmez.
- TorchVision importu ve `to_pil_image` fonksiyonu model yüklenmeden önce doğrulanır.
- Health çıktısı `torch` ve `torchvision` sürümlerini gösterir.
- Worker sürümü `v14-torchvision-inplace` olarak güncellendi.

Deploy sonrası health sonucunda aynı runtime yolu ve yeni worker sürümü görülmelidir. İlk warmup mevcut paketleri korur ve yalnız eksik TorchVision paketini kurar.
