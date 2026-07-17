"use client";

import { LoaderCircle, TicketCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { AccessState, ApiErrorBody } from "@/lib/types";

type Props = {
  access: AccessState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccessChange: (access: AccessState) => void;
};

async function errorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return payload?.error?.message || "İşlem tamamlanamadı.";
}

export function CreditAccess({
  access,
  open,
  onOpenChange,
  onAccessChange,
}: Props) {
  const [couponCode, setCouponCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [open, onOpenChange]);

  const redeemCoupon = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload = (await response.json()) as { access: AccessState };
      onAccessChange(payload.access);
      setCouponCode("");
      setMessage("Kupon etkinleştirildi. Ek önizleme hakların kullanıma hazır.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kupon etkinleştirilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const freeRemaining = access?.free.remaining ?? 0;
  const couponRemaining = access?.coupon?.remaining ?? 0;
  const totalRemaining = freeRemaining + couponRemaining;
  const balanceText = access
    ? freeRemaining > 0 && couponRemaining > 0
      ? `${freeRemaining} ücretsiz + ${couponRemaining} kupon hakkı · Toplam ${totalRemaining}`
      : freeRemaining > 0
        ? `${freeRemaining} ücretsiz hakkın kaldı`
        : couponRemaining > 0
          ? `${couponRemaining} kupon hakkın kaldı`
          : "Ücretsiz hakların tamamlandı"
    : "Kullanım hakların yükleniyor";

  return (
    <>
      <div className="credit-access-bar">
        <div className="credit-access-copy">
          <span className="credit-access-icon">
            <TicketCheck size={21} />
          </span>
          <div>
            <strong>{balanceText}</strong>
            <span>Toplam 2 ücretsiz deneme · Varsa kuponunu ekleyebilirsin</span>
          </div>
        </div>
        <button
          type="button"
          className="button button-outline credit-access-button"
          onClick={() => {
            setMessage(null);
            onOpenChange(true);
          }}
        >
          <TicketCheck size={17} /> Kupon ekle
        </button>
      </div>

      {open && (
        <div
          className="coupon-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) onOpenChange(false);
          }}
        >
          <div
            className="coupon-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-title"
          >
            <button
              type="button"
              className="coupon-modal-close"
              onClick={() => onOpenChange(false)}
              aria-label="Kupon ekranını kapat"
            >
              <X size={19} />
            </button>

            <div className="coupon-modal-heading">
              <span className="coupon-modal-icon">
                <TicketCheck size={25} />
              </span>
              <div>
                <span className="section-kicker">Ek önizleme hakkı</span>
                <h2 id="coupon-title">Kupon ekle</h2>
                <p>Kampanya, tanıtım veya iş birliği kapsamında aldığın kodu kullan.</p>
              </div>
            </div>

            <form
              className="coupon-form coupon-only-form"
              onSubmit={(event) => {
                event.preventDefault();
                void redeemCoupon();
              }}
            >
              <label>
                <span>Kupon kodu</span>
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="SV-XXXX-XXXX-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  maxLength={32}
                  required
                />
              </label>
              <button className="button button-gold" type="submit" disabled={submitting}>
                {submitting ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <TicketCheck size={17} />
                )}
                Kuponu etkinleştir
              </button>
            </form>

            {message && <div className="coupon-message" role="status">{message}</div>}
            <p className="coupon-footnote">
              Kuponlar yalnızca tanımlanan önizleme hakkını sağlar; nakit karşılığı yoktur.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
