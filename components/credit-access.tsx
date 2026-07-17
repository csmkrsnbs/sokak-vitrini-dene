"use client";

import {
  BadgeCheck,
  Building2,
  Check,
  Clipboard,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  TicketCheck,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import type {
  AccessState,
  ApiErrorBody,
  PaymentRequestView,
} from "@/lib/types";

type Props = {
  access: AccessState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccessChange: (access: AccessState) => void;
};

type PanelMode = "purchase" | "coupon";

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
  const [mode, setMode] = useState<PanelMode>("purchase");
  const [payment, setPayment] = useState<PaymentRequestView | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadPayment = useCallback(async () => {
    if (!access?.paymentConfigured) return;
    setPaymentLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/payments", { cache: "no-store" });
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload = (await response.json()) as { payment: PaymentRequestView | null };
      setPayment(payload.payment);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ödeme durumu alınamadı.");
    } finally {
      setPaymentLoading(false);
    }
  }, [access?.paymentConfigured]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void loadPayment(), 0);
    return () => window.clearTimeout(timer);
  }, [open, loadPayment]);

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

  const createPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, customerEmail }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload = (await response.json()) as { payment: PaymentRequestView };
      setPayment(payload.payment);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ödeme talebi oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  };

  const redeemCoupon = async (code: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload = (await response.json()) as { access: AccessState };
      onAccessChange(payload.access);
      setCouponCode("");
      setMessage("Kupon etkinleştirildi. Kredilerin kullanıma hazır.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kupon etkinleştirilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Kopyalandı.");
    } catch {
      setMessage("Kopyalanamadı. Metni basılı tutarak kopyalayabilirsiniz.");
    }
  };

  const freeRemaining = access?.free.remaining ?? 0;
  const couponRemaining = access?.coupon?.remaining ?? 0;
  const balanceText = access
    ? freeRemaining > 0
      ? `${freeRemaining} ücretsiz hakkın kaldı`
      : couponRemaining > 0
        ? `${couponRemaining} kupon kredin kaldı`
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
            <span>İlk 3 görsel ücretsiz · Standart Paket 10 görsel / 49 TL</span>
          </div>
        </div>
        <button
          type="button"
          className="button button-outline credit-access-button"
          onClick={() => onOpenChange(true)}
        >
          <WalletCards size={17} /> Paket veya kupon
        </button>
      </div>

      {open && (
        <div
          className="package-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) onOpenChange(false);
          }}
        >
          <div
            className="package-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="package-title"
          >
            <button
              type="button"
              className="package-modal-close"
              onClick={() => onOpenChange(false)}
              aria-label="Paket ekranını kapat"
            >
              <X size={19} />
            </button>

            <div className="package-modal-heading">
              <span className="package-modal-icon">
                <TicketCheck size={25} />
              </span>
              <div>
                <span className="section-kicker">Kaldığın yerden devam et</span>
                <h2 id="package-title">Standart Paket</h2>
                <p>Tek ödeme, süresiz 10 görsel kredisi.</p>
              </div>
              <strong className="package-price">49 TL</strong>
            </div>

            <div className="package-tabs" role="tablist" aria-label="Paket işlemleri">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "purchase"}
                className={mode === "purchase" ? "active" : ""}
                onClick={() => {
                  setMode("purchase");
                  setMessage(null);
                }}
              >
                <CreditCard size={16} /> Paketi al
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "coupon"}
                className={mode === "coupon" ? "active" : ""}
                onClick={() => {
                  setMode("coupon");
                  setMessage(null);
                }}
              >
                <TicketCheck size={16} /> Kupon kullan
              </button>
            </div>

            {mode === "coupon" ? (
              <form
                className="coupon-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void redeemCoupon(couponCode);
                }}
              >
                <label>
                  <span>Kupon kodu</span>
                  <input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder="SV-XXXX-XXXX-XXXX-XXXX"
                    autoComplete="off"
                    maxLength={24}
                    required
                  />
                </label>
                <button className="button button-gold" type="submit" disabled={submitting}>
                  {submitting ? <LoaderCircle className="spin" size={17} /> : <TicketCheck size={17} />}
                  Kuponu etkinleştir
                </button>
              </form>
            ) : paymentLoading ? (
              <div className="package-loading">
                <LoaderCircle className="spin" size={22} /> Ödeme durumu yükleniyor…
              </div>
            ) : !access?.paymentConfigured ? (
              <div className="package-config-warning">
                <Building2 size={22} />
                <div>
                  <strong>IBAN bilgileri hazırlanıyor</strong>
                  <p>Şimdilik elinizdeki kuponu “Kupon kullan” bölümünden etkinleştirebilirsiniz.</p>
                </div>
              </div>
            ) : payment ? (
              <div className="payment-instructions">
                <div className={`payment-status payment-status-${payment.status}`}>
                  {payment.status === "approved" ? (
                    <BadgeCheck size={19} />
                  ) : payment.status === "pending" ? (
                    <RefreshCw size={18} />
                  ) : (
                    <X size={18} />
                  )}
                  <div>
                    <strong>
                      {payment.status === "approved"
                        ? "Ödeme onaylandı"
                        : payment.status === "pending"
                          ? "Ödeme onayı bekleniyor"
                          : "Ödeme talebi onaylanmadı"}
                    </strong>
                    <span>
                      {payment.status === "approved"
                        ? "Kuponun hazır. Hemen etkinleştirebilirsin."
                        : payment.status === "pending"
                          ? "Havale açıklamasına ödeme kodunu eksiksiz yaz."
                          : "Yeni bir ödeme talebi oluşturabilirsin."}
                    </span>
                  </div>
                </div>

                {payment.status !== "rejected" && (
                  <div className="bank-details">
                    <div>
                      <span>Banka</span>
                      <strong>{payment.bank.name}</strong>
                    </div>
                    <div>
                      <span>Hesap sahibi</span>
                      <strong>{payment.bank.accountHolder}</strong>
                    </div>
                    <div className="bank-copy-row">
                      <span>IBAN</span>
                      <strong>{payment.bank.iban}</strong>
                      <button type="button" onClick={() => void copy(payment.bank.iban)} aria-label="IBAN'ı kopyala">
                        <Clipboard size={15} />
                      </button>
                    </div>
                    <div className="bank-copy-row bank-reference-row">
                      <span>Havale açıklaması</span>
                      <strong>{payment.referenceCode}</strong>
                      <button
                        type="button"
                        onClick={() => void copy(payment.referenceCode)}
                        aria-label="Havale açıklamasını kopyala"
                      >
                        <Clipboard size={15} />
                      </button>
                    </div>
                    <div>
                      <span>Gönderilecek tutar</span>
                      <strong>{payment.priceLabel}</strong>
                    </div>
                  </div>
                )}

                {payment.status === "approved" && payment.couponCode ? (
                  <div className="approved-coupon">
                    <span>Kupon kodun</span>
                    <strong>{payment.couponCode}</strong>
                    <button
                      type="button"
                      className="button button-gold"
                      disabled={submitting}
                      onClick={() => void redeemCoupon(payment.couponCode ?? "")}
                    >
                      {submitting ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}
                      10 krediyi etkinleştir
                    </button>
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => setPayment(null)}
                    >
                      Yeni 49 TL paket al
                    </button>
                  </div>
                ) : payment.status === "pending" ? (
                  <button
                    type="button"
                    className="button button-outline payment-refresh"
                    onClick={() => void loadPayment()}
                    disabled={paymentLoading}
                  >
                    <RefreshCw size={16} /> Ödeme durumunu yenile
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-outline payment-refresh"
                    onClick={() => setPayment(null)}
                  >
                    Yeni talep oluştur
                  </button>
                )}
              </div>
            ) : (
              <form className="payment-form" onSubmit={createPayment}>
                <div className="payment-info-note">
                  <Building2 size={20} />
                  <p>
                    Talep oluşturduktan sonra IBAN ve sana özel havale açıklaması gösterilir.
                    Ödeme kontrol edilince kuponun bu ekranda açılır.
                  </p>
                </div>
                <label>
                  <span>Ad soyad</span>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    autoComplete="name"
                    maxLength={120}
                    required
                  />
                </label>
                <label>
                  <span>E-posta</span>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </label>
                <button className="button button-gold" type="submit" disabled={submitting}>
                  {submitting ? <LoaderCircle className="spin" size={17} /> : <CreditCard size={17} />}
                  IBAN bilgilerini göster
                </button>
              </form>
            )}

            {message && <div className="package-message" role="status">{message}</div>}
            <p className="package-footnote">
              Kupon tek kullanımlık değildir; 10 kredinin tamamı bitene kadar aynı kodla yeniden etkinleştirilebilir.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
