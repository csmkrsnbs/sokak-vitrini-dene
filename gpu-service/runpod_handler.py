from __future__ import annotations

import runpod

from app.engine import decode_base64_image, run_try_on


def handler(job: dict) -> dict:
    payload = job.get("input") or {}
    try:
        person = decode_base64_image(payload["person_image_base64"])
        garment = decode_base64_image(payload["garment_image_base64"])
        second_payload = payload.get("second_garment_image_base64")
        second = decode_base64_image(second_payload) if second_payload else None
        return run_try_on(
            person=person,
            garment=garment,
            category=payload.get("category", "one-pieces"),
            garment_photo_type=payload.get("garment_photo_type", "auto"),
            second_garment=second,
        )
    except Exception as exc:
        return {"error": str(exc)}


runpod.serverless.start({"handler": handler})
