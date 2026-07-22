# Flash v12 — temiz runtime ve CPU ONNX Runtime

Bu sürüm ücretli tekrar denemeleri durdurmak için iki temel değişiklik yapar:

- Yeni endpoint adı: `sv-vton-flash-v12`. Eski sıcak worker yeniden kullanılmaz.
- Yeni runtime dizini: `/runpod-volume/python-packages-v12`. Eski CUDA 13 isteyen
  ONNX Runtime kurulumu tamamen izole edilir.
- DWPose için `onnxruntime==1.20.1` CPU paketi kullanılır. Ana FASHN VTON modeli
  PyTorch/CUDA ile GPU üzerinde çalışmaya devam eder.
- Endpoint idle timeout 5 saniyedir; iş bittikten sonra boşta GPU ücretini minimumda tutar.

Deploy sonrası eski endpointte hiçbir test çalıştırmayın. Yeni endpointte önce yalnız
`health`, ardından tek bir `warmup` çalıştırın.
