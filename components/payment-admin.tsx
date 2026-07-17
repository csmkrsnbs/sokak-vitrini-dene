"use client";

import {
  BadgeCheck,
  Clock3,
  KeyRound,
  LoaderCircle,
  LogOut,
  RefreshCw,
  TicketCheck,
  XCircle,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import type { AdminPaymentRequestView, ApiErrorBody } from "@/lib/types";

async function responseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return payload?.error?.message || "İşlem tamamlanamadı.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const statusLabels = {
  pending: "Onay bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
} as const;

export function PaymentAdmin() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [payments, setPayments] = useState<AdminPaymentRequestView[]>([]);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/payments", { cache: "no-store" });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as {
        payments: AdminPaymentRequestView[];
      };
      setPayments(payload.payments);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ödemeler alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/auth", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return (await response.json()) as { authenticated: boolean };
      })
      .then((payload) => {
        if (active) setAuthenticated(payload.authenticated);
      })
      .catch((error: unknown) => {
        if (active) {
          setAuthenticated(false);
          setMessage(error instanceof Error ? error.message : "Yönetim erişimi doğrulanamadı.");
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => void loadPayments(), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, loadPayments]);

  const counts = useMemo(
    () => ({
      pending: payments.filter((payment) => payment.status === "pending").length,
      approved: payments.filter((payment) => payment.status === "approved").length,
      rejected: payments.filter((payment) => payment.status === "rejected").length,
    }),
    [payments],
  );

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setAccessKey("");
      setAuthenticated(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" }).catch(() => null);
    setAuthenticated(false);
    setPayments([]);
  };

  const updatePayment = async (id: string, action: "approve" | "reject") => {
    if (action === "reject" && !window.confirm("Bu ödeme talebini reddetmek istiyor musunuz?")) {
      return;
    }

    setWorkingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as { payment: AdminPaymentRequestView };
      setPayments((current) =>
        current.map((payment) => (payment.id === payload.payment.id ? payload.payment : payment)),
      );
      setMessage(action === "approve" ? "Ödeme onaylandı ve kupon hazırlandı." : "Ödeme reddedildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ödeme güncellenemedi.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div className="admin-brand">
            <span className="brand-mark">SV</span>
            <div>
              <span className="section-kicker">Sokak Vitrini</span>
              <h1>Ödeme Yönetimi</h1>
            </div>
          </div>
          {authenticated && (
            <div className="admin-header-actions">
              <button className="button button-outline" type="button" onClick={() => void loadPayments()}>
                <RefreshCw size={16} /> Yenile
              </button>
              <button className="button button-ghost" type="button" onClick={() => void logout()}>
                <LogOut size={16} /> Çıkış
              </button>
            </div>
          )}
        </header>

        {checking ? (
          <div className="admin-loading">
            <LoaderCircle className="spin" size={24} /> Erişim doğrulanıyor…
          </div>
        ) : !authenticated ? (
          <section className="admin-login-card">
            <span className="admin-login-icon"><KeyRound size={25} /></span>
            <h2>Yönetici girişi</h2>
            <p>Vercel’de tanımladığınız yönetim anahtarını girin.</p>
            <form onSubmit={login}>
              <label>
                <span>Yönetim anahtarı</span>
                <input
                  type="password"
                  value={accessKey}
                  onChange={(event) => setAccessKey(event.target.value)}
                  minLength={16}
                  autoComplete="current-password"
                  required
                />
              </label>
              <button className="button button-gold" type="submit" disabled={loading}>
                {loading ? <LoaderCircle className="spin" size={17} /> : <KeyRound size={17} />}
                Giriş yap
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="admin-summary" aria-label="Ödeme özeti">
              <article>
                <Clock3 size={20} />
                <span>Bekleyen</span>
                <strong>{counts.pending}</strong>
              </article>
              <article>
                <BadgeCheck size={20} />
                <span>Onaylanan</span>
                <strong>{counts.approved}</strong>
              </article>
              <article>
                <XCircle size={20} />
                <span>Reddedilen</span>
                <strong>{counts.rejected}</strong>
              </article>
            </section>

            <section className="admin-payments-card">
              <div className="admin-card-heading">
                <div>
                  <span className="section-kicker">IBAN kontrolleri</span>
                  <h2>Ödeme talepleri</h2>
                </div>
                <small>Havale açıklamasını banka hareketiyle eşleştirin.</small>
              </div>

              {loading ? (
                <div className="admin-loading">
                  <LoaderCircle className="spin" size={22} /> Talepler yükleniyor…
                </div>
              ) : payments.length === 0 ? (
                <div className="admin-empty">
                  <TicketCheck size={28} />
                  <strong>Henüz ödeme talebi yok</strong>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Durum</th>
                        <th>Havale açıklaması</th>
                        <th>Müşteri</th>
                        <th>Paket</th>
                        <th>Tarih</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            <span className={`admin-status admin-status-${payment.status}`}>
                              {statusLabels[payment.status]}
                            </span>
                          </td>
                          <td><strong className="admin-reference">{payment.referenceCode}</strong></td>
                          <td>
                            <strong>{payment.customerName}</strong>
                            <small>{payment.customerEmail}</small>
                          </td>
                          <td>
                            <strong>{payment.priceLabel}</strong>
                            <small>{payment.credits} görsel</small>
                          </td>
                          <td><span>{formatDate(payment.createdAt)}</span></td>
                          <td>
                            {payment.status === "pending" ? (
                              <div className="admin-row-actions">
                                <button
                                  type="button"
                                  className="admin-approve"
                                  onClick={() => void updatePayment(payment.id, "approve")}
                                  disabled={workingId === payment.id}
                                >
                                  {workingId === payment.id ? <LoaderCircle className="spin" size={15} /> : <BadgeCheck size={15} />}
                                  Onayla
                                </button>
                                <button
                                  type="button"
                                  className="admin-reject"
                                  onClick={() => void updatePayment(payment.id, "reject")}
                                  disabled={workingId === payment.id}
                                >
                                  <XCircle size={15} /> Reddet
                                </button>
                              </div>
                            ) : (
                              <span className="admin-reviewed">{payment.reviewedAt ? formatDate(payment.reviewedAt) : "—"}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {message && <div className="admin-message" role="status">{message}</div>}
      </div>
    </main>
  );
}
