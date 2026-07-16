"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingBag, X, Plus, Minus, Trash2, Loader2, Check } from "lucide-react";
import { useCart } from "./CartContext";
import { formatMoney } from "./types";

const EMAIL_KEY = "tiblogics_cart_email";
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function CartDrawer() {
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
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map((l) => ({ id: l.id, quantity: l.quantity })) }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error || "Checkout failed. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open cart"
        style={{
          position: "fixed",
          bottom: "92px",
          right: "20px",
          zIndex: 60,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#F47C4C,#F9A738)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(244,124,76,.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#131A1B",
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
              background: "#131A1B",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #F9A738",
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
          background: "#131A1B",
          borderLeft: "1px solid rgba(255,255,255,.08)",
          zIndex: 80,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .32s cubic-bezier(.4,0,.2,1)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Sans',sans-serif",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.15rem" }}>
            Your Cart {count > 0 && <span style={{ color: "#8A9BA0", fontWeight: 500 }}>· {count}</span>}
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close cart" style={{ background: "none", border: "none", color: "#8A9BA0", cursor: "pointer", padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px" }}>
          {lines.length === 0 ? (
            <div style={{ textAlign: "center", color: "#8A9BA0", padding: "64px 0" }}>
              <ShoppingBag size={40} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
              <p style={{ fontSize: ".95rem" }}>Your cart is empty.</p>
            </div>
          ) : (
            lines.map((l) => (
              <div key={l.id} style={{ display: "flex", gap: "14px", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <ShoppingBag size={20} style={{ opacity: 0.4 }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: "4px", lineHeight: 1.3 }}>{l.name}</div>
                  <div style={{ color: "#F47C4C", fontWeight: 700, fontSize: ".88rem", marginBottom: "8px" }}>{formatMoney(l.price, "USD")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,.06)", borderRadius: "8px", overflow: "hidden" }}>
                      <button onClick={() => setQty(l.id, l.quantity - 1)} style={{ width: "28px", height: "28px", background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={13} /></button>
                      <span style={{ minWidth: "24px", textAlign: "center", fontSize: ".85rem", fontWeight: 700 }}>{l.quantity}</span>
                      <button onClick={() => setQty(l.id, l.quantity + 1)} style={{ width: "28px", height: "28px", background: "none", border: "none", color: "#F47C4C", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={13} /></button>
                    </div>
                    <button onClick={() => remove(l.id)} aria-label="Remove" style={{ background: "none", border: "none", color: "#8A9BA0", cursor: "pointer", padding: 4 }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ color: "#8A9BA0" }}>Subtotal</span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.2rem" }}>{formatMoney(subtotal, "USD")}</span>
            </div>

            {/* Save cart / reminder opt-in */}
            <div style={{ position: "relative", marginBottom: "14px" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSavedEmail(false); }}
                placeholder="Email me a reminder (optional)"
                style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "12px", padding: "11px 40px 11px 14px", color: "#fff", fontSize: ".85rem", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
              />
              {savedEmail && isEmail(email) && (
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#22A387", display: "flex" }}><Check size={16} /></span>
              )}
              <p style={{ color: "#8A9BA0", fontSize: ".7rem", marginTop: "6px", lineHeight: 1.4 }}>
                We&apos;ll save your cart and remind you if you don&apos;t check out.
              </p>
            </div>

            {error && <p style={{ color: "#F87171", fontSize: ".82rem", marginBottom: "12px", textAlign: "center" }}>{error}</p>}
            <button
              onClick={checkout}
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "50px",
                border: "none",
                background: "linear-gradient(135deg,#F47C4C,#F9A738)",
                color: "#131A1B",
                fontFamily: "'Syne',sans-serif",
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
              {loading ? (<><Loader2 size={18} className="animate-spin" /> Redirecting…</>) : "Checkout Securely →"}
            </button>
            <p style={{ textAlign: "center", color: "#8A9BA0", fontSize: ".72rem", marginTop: "12px" }}>🔒 Secure payment via Stripe</p>
          </div>
        )}
      </aside>
    </>
  );
}
