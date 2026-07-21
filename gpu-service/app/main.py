from __future__ import annotations

import io
import os

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from PIL import Image

from app.engine import normalize_image, run_try_on

app = FastAPI(title="SV Prova GPU", version="2.0.0")


def check_secret(secret: str | None) -> None:
    expected = os.getenv("VTON_SHARED_SECRET", "").strip()
    if expected and secret != expected:
        raise HTTPException(status_code=401, detail="GPU servisi erişim anahtarı geçersiz.")


async def read_image(upload: UploadFile) -> Image.Image:
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Yalnız görsel dosyaları kabul edilir.")
    max_bytes = int(os.getenv("VTON_MAX_UPLOAD_MB", "12")) * 1024 * 1024
    raw = await upload.read(max_bytes + 1)
    if len(raw) > max_bytes:
        raise HTTPException(status_code=413, detail="Görsel dosyası çok büyük.")
    try:
        return normalize_image(Image.open(io.BytesIO(raw)))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Görsel dosyası açılamadı.") from exc


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": "fashn-vton-1.5-self-hosted"}


@app.post("/v1/try-on")
async def try_on(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    category: str = Form(...),
    garment_photo_type: str = Form("auto"),
    second_garment_image: UploadFile | None = File(None),
    x_sv_secret: str | None = Header(None),
) -> dict:
    check_secret(x_sv_secret)
    if category not in {"tops", "bottoms", "one-pieces", "two-piece"}:
        raise HTTPException(status_code=400, detail="Geçersiz ürün kategorisi.")
    if garment_photo_type not in {"auto", "flat-lay", "model"}:
        raise HTTPException(status_code=400, detail="Geçersiz ürün fotoğraf türü.")

    person = await read_image(person_image)
    garment = await read_image(garment_image)
    second = await read_image(second_garment_image) if second_garment_image else None

    try:
        return run_try_on(
            person=person,
            garment=garment,
            category=category,  # type: ignore[arg-type]
            garment_photo_type=garment_photo_type,  # type: ignore[arg-type]
            second_garment=second,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="GPU üretimi tamamlanamadı.") from exc
