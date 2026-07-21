# RunPod Flash V8 Kurulumu

Bu sürüm, RunPod Flash `1.18.0` ile doğrulanmış parametreleri kullanır.

## Düzeltilen iki hata

- `Endpoint.__init__() got an unexpected keyword argument 'python_version'`:
  `python_version` dekoratörden kaldırıldı. Python 3.12, workflow içindeki
  `flash deploy --python-version 3.12` seçeneğiyle sabitlenir.
- `ModuleNotFoundError: No module named 'numpy'`:
  NumPy ve Pillow hem GitHub Actions keşif ortamına hem de uzak worker
  bağımlılıklarına eklendi.

## GitHub

`Settings → Secrets and variables → Actions` altında:

```text
RUNPOD_API_KEY=<gizli RunPod API anahtarı>
```

Sonra:

```text
Actions → Deploy VTON with RunPod Flash → Run workflow
```

Workflow önce uygulama modüllerini ve SDK imzasını doğrular; doğrulama geçmeden
deploy başlamaz. Başarılı çalışmanın özetinde endpoint bilgisi yer alır.

## Vercel

```env
VTON_PROVIDER=runpod
RUNPOD_ENDPOINT_ID=<yeni endpoint id>
RUNPOD_API_KEY=<gizli RunPod API anahtarı>
VTON_REQUEST_TIMEOUT_MS=600000
```

Vercel ortam değişkenlerini kaydettikten sonra production redeploy yapılır.
