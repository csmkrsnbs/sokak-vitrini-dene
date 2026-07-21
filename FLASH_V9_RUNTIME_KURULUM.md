# RunPod Flash v9 — Runtime Dependency Cache

Bu sürüm, RunPod Flash deployment arşivinin 1500 MB sınırını aşmasını önler.

- FASHN VTON, human parser, Transformers, SciPy, ONNX Runtime ve OpenCV deployment arşivine gömülmez.
- Bu paketler ilk `warmup` isteğinde `/runpod-volume/python-packages` dizinine bir kez kurulur.
- Network Volume sonraki worker'larda aynı paketleri yeniden kullanır.
- Model ağırlıkları `/runpod-volume/fashn-vton/weights` altında kalır.

## Dağıtım

GitHub Actions içindeki `Deploy VTON with RunPod Flash` workflow'unu çalıştırın.
Önce `Build and verify Flash archive`, ardından `Deploy production endpoint` adımı yeşil olmalıdır.

## Test sırası

1. `health`: endpoint ve volume erişimini kontrol eder.
2. `warmup`: runtime paketlerini ve model ağırlıklarını ilk kez kurup pipeline'ı yükler. İlk çağrı uzun sürebilir.
3. `try-on`: gerçek prova çağrısı.

İlk `warmup` sırasında paketler ve model ağırlıkları indirildiği için işlem süresi normal çağrılardan uzundur.
