# Flash v10 — Matplotlib bağımlılık düzeltmesi

Warmup sırasında FASHN VTON'un DWPose modülü `matplotlib` paketini içe aktardığı için
`ModuleNotFoundError: No module named 'matplotlib'` hatası oluşuyordu.

Bu sürümde:

- `matplotlib>=3.5,<4` kalıcı RunPod runtime paketlerine eklendi.
- Runtime denetimine `matplotlib`, `scipy`, `huggingface_hub` ve `tqdm` eklendi.
- Eksik olmayan büyük paketlerin her warmup'ta yeniden kurulması engellendi.
- Runtime işaretçisi `v2` olarak yenilendi.
- Worker sürümü `v10-matplotlib` oldu.

Deploy sonrasında aynı endpoint'te önce `health`, ardından bir kez `warmup` çalıştırın.
Mevcut kalıcı volume korunacağı için yalnız eksik paketlerin kurulması beklenir.
