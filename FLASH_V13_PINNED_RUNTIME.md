# Flash v13 — Sabitlenmiş AI çalışma ortamı

Bu sürüm yeni `sv-vton-flash-v13` endpointini oluşturur.

Düzeltmeler:
- Transformers `4.50.3` olarak sabitlendi.
- Tokenizers `0.21.x` olarak sabitlendi.
- NumPy `1.26.4` ve SciPy `1.12.0` birlikte sabitlendi.
- OpenCV headless `4.10.0.84` olarak sabitlendi.
- CPU ONNX Runtime `1.20.1` korunur.
- Warmup, `SegformerForSemanticSegmentation` importunu doğrulamadan runtime'ı hazır saymaz.
- Yeni paket yolu: `/runpod-volume/python-packages-v13`.

İlk health sonucunda `worker_version: v13-pinned-runtime` görülmelidir. Ardından yalnız bir warmup gönderilir.
