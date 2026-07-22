# Flash v12b — yeni endpoint düzeltmesi

Önceki v12 paketinde Python endpoint adı `sv-vton-flash-v12` olarak değişmişti; ancak GitHub Actions komutu eski `sokak-vitrini-prova` Flash uygulamasına deploy etmeye devam ediyordu. Bu nedenle RunPod eski endpoint ortamını yeniden kullanabiliyordu.

Bu sürümde GitHub Actions uygulama adı da ayrıldı:

```text
sokak-vitrini-prova-v12
```

Workflow adı:

```text
Deploy VTON Flash v12
```

Deploy sonrası RunPod'da yeni `sv-vton-flash-v12` endpoint'i oluşmalıdır. Health yanıtı aşağıdaki değerleri göstermeden warmup çalıştırılmamalıdır:

```json
{
  "worker_version": "v12-ort-cpu-clean",
  "runtime_dependencies": {
    "path": "/runpod-volume/python-packages-v12"
  }
}
```
