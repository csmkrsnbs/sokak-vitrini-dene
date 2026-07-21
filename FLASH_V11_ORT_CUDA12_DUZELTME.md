# Flash v11 — ONNX Runtime CUDA 12 uyumluluğu

Warmup sırasında kalıcı volume'a kurulan güncel `onnxruntime-gpu` paketi CUDA 13
kütüphanesi (`libcudart.so.13`) istiyordu. RunPod Flash worker ise CUDA 12 ortamında
çalıştığı için import başarısız oluyordu.

Bu sürümde:

- `onnxruntime-gpu` sürümü `1.20.2` olarak sabitlendi.
- Kalıcı volume'daki eski/bozuk ONNX Runtime dosyaları otomatik temizleniyor.
- ORT importu, sürümü ve `CUDAExecutionProvider` kullanılabilirliği doğrulanıyor.
- Eski runtime işaretçisi `v3` olarak yenilendi; mevcut paketler korunurken yalnız
  uyumsuz ONNX Runtime yeniden kuruluyor.
- Worker sürümü `v11-ort-cuda12` oldu.

Deploy sonrasında aynı endpoint'te yeniden `warmup` çalıştırın. Model ağırlıkları ve
diğer paketler volume'da korunur; yalnız ONNX Runtime paketi değiştirilir.
