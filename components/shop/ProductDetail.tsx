"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check, ArrowLeft, ShieldCheck, Zap, Plus, Minus } from "lucide-react";
import { useCart } from "./CartContext";
import { formatMoney, type ShopProduct } from "./types";

const S = {
  darker: "#0C1112",
  dark: "#131A1B",
  card: "#1A2223",
  orange: "#F47C4C",
  amber: "#F9A738",
  muted: "#8A9BA0",
  border: "rgba(255,255,255,0.08)",
};
const syne = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

export default function ProductDetail({ product: p, related }: { product: ShopProduct; related: ShopProduct[] }) {
  const { add, setOpen } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const onSale = p.onSale && p.compareAtPrice && p.compareAtPrice > p.price;
  const pct = onSale ? Math.round(((p.compareAtPrice! - p.price) / p.compareAtPrice!) * 100) : 0;
  const soldOut = p.stock != null && p.stock <= 0;
  const cap = p.stock ?? 99;

  function addToCart(openDrawer: boolean) {
    if (soldOut) return;
    add({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null, maxStock: p.stock }, qty);
    if (openDrawer) setOpen(true);
    else {
      setOpen(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    }
  }

  return (
    <div style={{ background: S.darker, color: "#fff", fontFamily: dm, minHeight: "100vh" }}>
      <style>{`
        .pd-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}
        @media(max-width:840px){.pd-grid{grid-template-columns:1fr;gap:28px}}
        .rel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px}
        @media(max-width:560px){.rel-grid{grid-template-columns:repeat(2,1fr);gap:12px}}
        .rel-card{transition:transform .3s,border-color .3s}
        .rel-card:hover{transform:translateY(-4px);border-color:rgba(244,124,76,.4)}
      `}</style>

      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "120px 24px 100px" }}>
        <Link href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: S.muted, textDecoration: "none", fontSize: ".88rem", marginBottom: "32px" }}>
          <ArrowLeft size={16} /> Back to shop
        </Link>

        <div className="pd-grid">
          {/* Gallery */}
          <div>
            <div style={{ aspectRatio: "1/1", borderRadius: "22px", overflow: "hidden", background: "linear-gradient(135deg,#1C2526,#0C1112)", border: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
              {p.images[activeImg] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[activeImg]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ShoppingBag size={56} style={{ opacity: 0.3 }} />
              )}
            </div>
            {p.images.length > 1 && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {p.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{ width: "68px", height: "68px", borderRadius: "12px", overflow: "hidden", border: `2px solid ${i === activeImg ? S.orange : S.border}`, cursor: "pointer", padding: 0, background: "none" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{ fontSize: ".72rem", color: S.orange, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "12px", fontWeight: 600 }}>{p.category}</div>
            <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: "clamp(1.8rem,3.5vw,2.6rem)", lineHeight: 1.12, marginBottom: "14px" }}>{p.name}</h1>
            {p.tagline && <p style={{ color: "#B0C4CC", fontSize: "1.02rem", lineHeight: 1.6, marginBottom: "22px" }}>{p.tagline}</p>}

            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: syne, fontWeight: 800, fontSize: "2.4rem" }}>{p.price === 0 ? "Free" : formatMoney(p.price, p.currency)}</span>
              {onSale && (
                <>
                  <span style={{ color: S.muted, fontSize: "1.1rem", textDecoration: "line-through" }}>{formatMoney(p.compareAtPrice!, p.currency)}</span>
                  <span style={{ background: "linear-gradient(135deg,#F47C4C,#F9A738)", color: "#131A1B", fontFamily: syne, fontWeight: 800, fontSize: ".78rem", padding: "4px 12px", borderRadius: "20px" }}>Save {pct}%</span>
                </>
              )}
            </div>

            {/* Stock */}
            {p.stock != null && (
              <div style={{ fontSize: ".85rem", color: soldOut ? "#F87171" : p.stock <= 5 ? S.amber : "#4ade80", marginBottom: "20px", fontWeight: 600 }}>
                {soldOut ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left in stock` : "In stock"}
              </div>
            )}

            {/* Quantity + Add */}
            {!soldOut && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", background: S.card, border: `1px solid ${S.border}`, borderRadius: "50px", overflow: "hidden" }}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: "42px", height: "44px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}><Minus size={16} style={{ margin: "0 auto" }} /></button>
                  <span style={{ minWidth: "32px", textAlign: "center", fontWeight: 700 }}>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(cap, q + 1))} style={{ width: "42px", height: "44px", background: "none", border: "none", color: S.orange, cursor: "pointer" }}><Plus size={16} style={{ margin: "0 auto" }} /></button>
                </div>
                <button
                  onClick={() => addToCart(false)}
                  style={{ flex: 1, minWidth: "160px", padding: "14px 24px", borderRadius: "50px", border: `1px solid ${S.border}`, background: added ? "#22A387" : "rgba(255,255,255,.06)", color: "#fff", fontFamily: syne, fontWeight: 700, fontSize: ".95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {added ? (<><Check size={17} /> Added to cart</>) : (<><ShoppingBag size={17} /> Add to Cart</>)}
                </button>
              </div>
            )}
            <button
              onClick={() => addToCart(true)}
              disabled={soldOut}
              style={{ width: "100%", padding: "16px 24px", borderRadius: "50px", border: "none", background: soldOut ? "rgba(255,255,255,.08)" : "linear-gradient(135deg,#F47C4C,#F9A738)", color: soldOut ? S.muted : "#131A1B", fontFamily: syne, fontWeight: 800, fontSize: "1.05rem", cursor: soldOut ? "not-allowed" : "pointer", marginBottom: "28px" }}
            >
              {soldOut ? "Sold Out" : "Buy Now →"}
            </button>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "28px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "7px", color: S.muted, fontSize: ".82rem" }}><ShieldCheck size={16} color={S.amber} /> Secure Stripe checkout</span>
              {p.digital && <span style={{ display: "flex", alignItems: "center", gap: "7px", color: S.muted, fontSize: ".82rem" }}><Zap size={16} color={S.amber} /> Instant digital access</span>}
            </div>

            {/* Description */}
            {p.description && (
              <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: "24px" }}>
                <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: "1rem", marginBottom: "12px" }}>Details</h3>
                <div style={{ color: "#B0C4CC", fontSize: ".92rem", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{p.description}</div>
              </div>
            )}

            {p.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "22px" }}>
                {p.tags.map((t) => (
                  <span key={t} style={{ background: "rgba(255,255,255,.05)", border: `1px solid ${S.border}`, borderRadius: "20px", padding: "5px 12px", fontSize: ".76rem", color: S.muted }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: "72px" }}>
            <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.5rem", marginBottom: "24px" }}>You might also like</h2>
            <div className="rel-grid">
              {related.map((r) => {
                const rSale = r.onSale && r.compareAtPrice && r.compareAtPrice > r.price;
                return (
                  <Link key={r.id} href={`/shop/${r.slug}`} className="rel-card" style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: "16px", overflow: "hidden", textDecoration: "none", color: "#fff" }}>
                    <div style={{ aspectRatio: "1/1", background: "linear-gradient(135deg,#1C2526,#0C1112)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {r.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.images[0]} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <ShoppingBag size={30} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                    <div style={{ padding: "14px" }}>
                      <div style={{ fontFamily: syne, fontWeight: 700, fontSize: ".9rem", marginBottom: "6px", lineHeight: 1.3 }}>{r.name}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontFamily: syne, fontWeight: 800, color: S.orange }}>{r.price === 0 ? "Free" : formatMoney(r.price, r.currency)}</span>
                        {rSale && <span style={{ color: S.muted, fontSize: ".78rem", textDecoration: "line-through" }}>{formatMoney(r.compareAtPrice!, r.currency)}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
