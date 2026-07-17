"use client";

import {
  Ban,
  Clipboard,
  Gift,
  KeyRound,
  LoaderCircle,
  LogOut,
  RefreshCw,
  TicketCheck,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import type { AdminCouponView, ApiErrorBody } from "@/lib/types";

async function responseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return payload?.error?.message || "İşlem tamamlanamadı.";
}

function formatDate(value: string | null) {
  if (!value) return "Süresiz";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const statusLabels = {
  active: "Etkin",
  exhausted: "Tükendi",
  expired: "Süresi doldu",
  revoked: "İptal edildi",
} as const;

export function CouponAdmin() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [coupons, setCoupons] = useState<AdminCouponView[]>([]);
  const [label, setLabel] = useState("Tanıtım kuponu");
  const [credits, setCredits] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/coupons", { cache: "no-store" });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as { coupons: AdminCouponView[] };
      setCoupons(payload.coupons);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kuponlar alınamadı.");
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
    const timer = window.setTimeout(() => void loadCoupons(), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, loadCoupons]);

  const summary = useMemo(
    () => ({
      active: coupons.filter((coupon) => coupon.status === "active").length,
      remaining: coupons
        .filter((coupon) => coupon.status === "active")
        .reduce((total, coupon) => total + coupon.remainingCredits, 0),
      inactive: coupons.filter((coupon) => coupon.status !== "active").length,
    }),
    [coupons],
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
    setCoupons([]);
    setCreatedCode(null);
  };

  const createCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setCreatedCode(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          credits,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as {
        coupon: AdminCouponView;
        code: string;
      };
      setCoupons((current) => [payload.coupon, ...current]);
      setCreatedCode(payload.code);
      setCredits(1);
      setExpiresAt("");
      setMessage("Kupon oluşturuldu. Kodu şimdi güvenli bir yere kopyalayın.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kupon oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  };

  const revokeCoupon = async (coupon: AdminCouponView) => {
    if (!window.confirm(`“${coupon.label}” kuponu kullanıma kapatılsın mı?`)) return;
    setWorkingId(coupon.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as { coupon: AdminCouponView };
      setCoupons((current) =>
        current.map((item) => (item.id === payload.coupon.id ? payload.coupon : item)),
      );
      setMessage("Kupon kullanıma kapatıldı.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kupon güncellenemedi.");
    } finally {
      setWorkingId(null);
    }
  };

  const copyCode = async () => {
    if (!createdCode) return;
    try {
      await navigator.clipboard.writeText(createdCode);
      setMessage("Kupon kodu kopyalandı.");
    } catch {
      setMessage("Kod kopyalanamadı; basılı tutarak kopyalayabilirsiniz.");
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
              <h1>Kupon Yönetimi</h1>
            </div>
          </div>
          {authenticated && (
            <div className="admin-header-actions">
              <button className="button button-outline" type="button" onClick={() => void loadCoupons()}>
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
            <section className="admin-summary" aria-label="Kupon özeti">
              <article>
                <TicketCheck size={20} />
                <span>Etkin kupon</span>
                <strong>{summary.active}</strong>
              </article>
              <article>
                <Gift size={20} />
                <span>Kalan toplam hak</span>
                <strong>{summary.remaining}</strong>
              </article>
              <article>
                <Ban size={20} />
                <span>Etkin olmayan</span>
                <strong>{summary.inactive}</strong>
              </article>
            </section>

            <section className="admin-coupon-create">
              <div className="admin-card-heading">
                <div>
                  <span className="section-kicker">Kampanya ve eşantiyon</span>
                  <h2>Yeni kupon oluştur</h2>
                </div>
                <small>Kod yalnızca oluşturulduğu anda gösterilir.</small>
              </div>
              <form onSubmit={createCoupon}>
                <label>
                  <span>Kampanya adı</span>
                  <input
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    maxLength={120}
                    required
                  />
                </label>
                <label>
                  <span>Önizleme hakkı</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={credits}
                    onChange={(event) => setCredits(Number(event.target.value))}
                    required
                  />
                </label>
                <label>
                  <span>Son kullanım (isteğe bağlı)</span>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                  />
                </label>
                <button className="button button-gold" type="submit" disabled={loading}>
                  {loading ? <LoaderCircle className="spin" size={17} /> : <Gift size={17} />}
                  Kupon oluştur
                </button>
              </form>

              {createdCode && (
                <div className="admin-created-coupon">
                  <div>
                    <span>Yeni kupon kodu</span>
                    <strong>{createdCode}</strong>
                  </div>
                  <button type="button" className="button button-outline" onClick={() => void copyCode()}>
                    <Clipboard size={16} /> Kopyala
                  </button>
                </div>
              )}
            </section>

            <section className="admin-coupons-card">
              <div className="admin-card-heading">
                <div>
                  <span className="section-kicker">Erişim avantajları</span>
                  <h2>Oluşturulan kuponlar</h2>
                </div>
                <small>Açık kodlar güvenlik nedeniyle sonradan görüntülenemez.</small>
              </div>

              {loading && coupons.length === 0 ? (
                <div className="admin-loading">
                  <LoaderCircle className="spin" size={22} /> Kuponlar yükleniyor…
                </div>
              ) : coupons.length === 0 ? (
                <div className="admin-empty">
                  <TicketCheck size={28} />
                  <strong>Henüz kupon oluşturulmadı</strong>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Durum</th>
                        <th>Kampanya</th>
                        <th>Hak</th>
                        <th>Oluşturma</th>
                        <th>Son kullanım</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <tr key={coupon.id}>
                          <td>
                            <span className={`admin-status admin-status-${coupon.status}`}>
                              {statusLabels[coupon.status]}
                            </span>
                          </td>
                          <td>
                            <strong>{coupon.label}</strong>
                            <small>{coupon.activatedAt ? `Etkinleştirildi: ${formatDate(coupon.activatedAt)}` : "Henüz kullanılmadı"}</small>
                          </td>
                          <td>
                            <strong>{coupon.remainingCredits} / {coupon.totalCredits}</strong>
                            <small>Kalan / toplam</small>
                          </td>
                          <td><span>{formatDate(coupon.createdAt)}</span></td>
                          <td><span>{formatDate(coupon.expiresAt)}</span></td>
                          <td>
                            {coupon.status === "active" ? (
                              <div className="admin-row-actions">
                                <button
                                  type="button"
                                  className="admin-reject"
                                  onClick={() => void revokeCoupon(coupon)}
                                  disabled={workingId === coupon.id}
                                >
                                  {workingId === coupon.id ? (
                                    <LoaderCircle className="spin" size={15} />
                                  ) : (
                                    <Ban size={15} />
                                  )}
                                  Kapat
                                </button>
                              </div>
                            ) : (
                              <span className="admin-reviewed">İşlem yok</span>
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
