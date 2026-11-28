"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingBag, X, Plus, Minus, Trash2, Loader2, Check } from "lucide-react";
import { useCart } from "./CartContext";
import { formatMoney } from "./types";
import { useLocale, useT } from "@/lib/i18n/client";
import { track } from "@/components/public/AnalyticsTracker";
import PromoCodeField from "@/components/promo/PromoCodeField";
import { getStoredCode } from "@/lib/promotions/client-code";

const EMAIL_KEY = "tiblogics_cart_email";
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function CartDrawer() {
  const t = useT();
  const locale = useLocale();
  const { lines, count, subtotal, open, setOpen, setQty, remove } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Remember the shopper's email across visits
  useEffect(() => {
    try {
      const v = localStorage.getItem(EMAIL_KEY);
      if (v) setEmail(v);
    } catch { /* ignore */ }
  }, []);

  // Auto-save the cart (debounced) once we have an email — powers reminders
  useEffect(() => {
    if (!isEmail(email) || lines.length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(EMAIL_KEY, email); } catch { /* ignore */ }
      fetch("/api/shop/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          subtotal,
          currency: "USD",
          items: lines.map((l) => ({ id: l.id, slug: l.slug, name: l.name, price: l.price, image: l.image, quantity: l.quantity })),
        }),
      }).then((r) => { if (r.ok) setSavedEmail(true); }).catch(() => {});
    }, 900);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [email, lines, subtotal]);

  async function checkout() {
    if (lines.length === 0) return;
    track("store_checkout", { items: lines.length });
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // A promo code applied below is checked again on the server; prices
        // and any automatic sale come from the server only.
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
          ...(getStoredCode() ? { promoCode: getStoredCode() } : {}),
          ...(isEmail(email) ? { email } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error || t("pages.store.cart.checkoutFailed"));
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError(t("pages.store.cart.network"));
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("pages.store.cart.open")}
        style={{
          position: "fixed",
          bottom: "92px",
          right: "20px",
          zIndex: 60,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#F47C20",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(244,124,32,.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0F1E30",
        }}
      >
        <ShoppingBag size={22} strokeWidth={2.4} />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "22px",
              height: "22px",
              padding: "0 5px",
              borderRadius: "11px",
              background: "#0F1E30",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #F47C20",
            }}
          >
            {count}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 70, backdropFilter: "blur(2px)" }}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 92vw)",
          background: "#0F1E30",
          borderLeft: "1px solid rgba(255,255,255,.08)",
          zIndex: 80,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .32s cubic-bezier(.4,0,.2,1)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--font-brand-dm), 'DM Sans', sans-serif",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontFamily: "var(--font-brand-syne), 'Syne', sans-serif", fontWeight: 700, fontSize: "1.15rem" }}>
            {t("pages.store.cart.title")} {count > 0 && <span style={{ color: "#93A3B8", fontWeight: 500 }}>· {count}</span>}
          </div>
          <button onClick={() => setOpen(false)} aria-label={t("pages.store.cart.close")} style={{ background: "none", border: "none", color: "#93A3B8", cursor: "pointer", padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px" }}>
          {lines.length === 0 ? (
            <div style={{ textAlign: "center", color: "#93A3B8", padding: "64px 0" }}>
              <ShoppingBag size={40} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
              <p style={{ fontSize: ".95rem" }}>{t("pages.store.cart.empty")}</p>
            </div>
          ) : (
            lines.map((l) => (
              <div key={l.id} style={{ display: "flex", gap: "14px", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <ShoppingBag size={20} style={{ opacity: 0.4 }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: "4px", lineHeight: 1.3 }}>{l.name}</div>
                  <div style={{ color: "#F47C20", fontWeight: 700, fontSize: ".88rem", marginBottom: "8px" }}>{formatMoney(l.price, "USD", locale)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,.06)", borderRadius: "8px", overflow: "hidden" }}>
                      <button onClick={() => setQty(l.id, l.quantity - 1)} style={{ width: "28px", height: "28px", background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={13} /></button>
                      <span style={{ minWidth: "24px", textAlign: "center", fontSize: ".85rem", fontWeight: 700 }}>{l.quantity}</span>
                      <button onClick={() => setQty(l.id, l.quantity + 1)} style={{ width: "28px", height: "28px", background: "none", border: "none", color: "#F47C20", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={13} /></button>
                    </div>
                    <button onClick={() => remove(l.id)} aria-label={t("pages.store.cart.remove")} style={{ background: "none", border: "none", color: "#93A3B8", cursor: "pointer", padding: 4 }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ color: "#93A3B8" }}>{t("pages.store.cart.subtotal")}</span>
              <span style={{ fontFamily: "var(--font-brand-syne), 'Syne', sans-serif", fontWeight: 700, fontSize: "1.2rem" }}>{formatMoney(subtotal, "USD", locale)}</span>
            </div>

            {/* Save cart / reminder opt-in */}
            <div style={{ position: "relative", marginBottom: "14px" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSavedEmail(false); }}
                placeholder={t("pages.store.cart.reminder")}
                aria-label={t("pages.store.cart.reminder")}
                style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "12px", padding: "11px 40px 11px 14px", color: "#fff", fontSize: ".85rem", fontFamily: "var(--font-brand-dm), 'DM Sans', sans-serif", outline: "none" }}
              />
              {savedEmail && isEmail(email) && (
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#3DD6A6", display: "flex" }}><Check size={16} /></span>
              )}
              <p style={{ color: "#93A3B8", fontSize: ".7rem", marginTop: "6px", lineHeight: 1.4 }}>
                {t("pages.store.cart.reminderNote")}
              </p>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <PromoCodeField
                tone="dark"
                email={isEmail(email) ? email : undefined}
                targets={[{ kind: "store", items: lines.slice(0, 50).map((l) => ({ id: l.id, quantity: Math.min(99, l.quantity) })) }]}
              />
            </div>

            {error && <p role="alert" style={{ color: "#F87171", fontSize: ".82rem", marginBottom: "12px", textAlign: "center" }}>{error}</p>}
            <button
              onClick={checkout}
              data-track="cta-store-checkout"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "50px",
                border: "none",
                background: "#F47C20",
                color: "#0F1E30",
                fontFamily: "var(--font-brand-syne), 'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {loading ? (<><Loader2 size={18} className="animate-spin" /> {t("pages.store.cart.redirecting")}</>) : t("pages.store.cart.checkout")}
            </button>
            <p style={{ textAlign: "center", color: "#93A3B8", fontSize: ".72rem", marginTop: "12px" }}>{t("pages.store.cart.stripe")}</p>
          </div>
        )}
      </aside>
    </>
  );
}
