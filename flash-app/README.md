# SV VTON — RunPod Flash

Bu klasör özel Docker imajı kullanmadan RunPod Flash ile GPU endpoint'i oluşturur.

## Dağıtım

GitHub deposunda `RUNPOD_API_KEY` adlı Actions secret oluşturun ve
`Deploy VTON with RunPod Flash` workflow'unu çalıştırın.

Workflow tamamlandığında logun sonunda yeni queue endpoint adresi ve ID görünür.
Vercel'deki `RUNPOD_ENDPOINT_ID` değerini bu yeni ID ile değiştirin.

## Test

```json
{
  "input": {
    "action": "health"
  }
}
```

İlk `warmup` çağrısı yaklaşık 2 GB model dosyasını kalıcı 20 GB RunPod volume'a
indirir. Sonraki worker'lar aynı dosyaları tekrar indirmez.
