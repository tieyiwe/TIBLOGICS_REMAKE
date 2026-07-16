"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "./CartContext";
import { formatMoney, type ShopProduct } from "./types";

const S = {
  card: "#1A2223",
  orange: "#F47C4C",
  muted: "#8A9BA0",
  border: "rgba(255,255,255,0.08)",
};
const syne = "'Syne', sans-serif";

export function AddButton({ p }: { p: ShopProduct }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = p.stock != null && p.stock <= 0;

  function onAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    add({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null, maxStock: p.stock });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      onClick={onAdd}
      disabled={soldOut}
      style={{
        border: "none",
        borderRadius: "50px",
        padding: "10px 18px",
        fontFamily: syne,
        fontWeight: 700,
        fontSize: ".85rem",
        cursor: soldOut ? "not-allowed" : "pointer",
        background: soldOut ? "rgba(255,255,255,.08)" : added ? "#22A387" : "linear-gradient(135deg,#F47C4C,#F9A738)",
        color: soldOut ? S.muted : "#131A1B",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
        transition: "opacity .2s",
      }}
    >
      {soldOut ? "Sold Out" : added ? (<><Check size={15} /> Added</>) : (<><ShoppingBag size={15} /> Add</>)}
    </button>
  );
}

export default function ProductCard({ p }: { p: ShopProduct }) {
  const onSale = p.onSale && p.compareAtPrice && p.compareAtPrice > p.price;
  const pct = onSale ? Math.round(((p.compareAtPrice! - p.price) / p.compareAtPrice!) * 100) : 0;

  return (
    <Link
      href={`/shop/${p.slug}`}
      className="shop-card"
      style={{
        display: "flex",
        flexDirection: "column",
        background: S.card,
        border: `1px solid ${S.border}`,
        borderRadius: "20px",
        overflow: "hidden",
        textDecoration: "none",
        color: "#fff",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "1/1", background: "linear-gradient(135deg,#1C2526,#0C1112)", overflow: "hidden" }}>
        {p.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt={p.name} className="shop-card-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: S.muted }}>
            <ShoppingBag size={40} style={{ opacity: 0.3 }} />
          </div>
        )}
        {onSale && (
          <span style={{ position: "absolute", top: "12px", left: "12px", background: "linear-gradient(135deg,#F47C4C,#F9A738)", color: "#131A1B", fontFamily: syne, fontWeight: 800, fontSize: ".72rem", padding: "4px 10px", borderRadius: "20px" }}>
            −{pct}%
          </span>
        )}
        {p.featured && !onSale && (
          <span style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(19,26,27,.8)", color: "#F9A738", fontFamily: syne, fontWeight: 700, fontSize: ".7rem", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(249,167,56,.4)" }}>
            ★ Featured
          </span>
        )}
      </div>
      <div style={{ padding: "18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: ".7rem", color: S.muted, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "6px" }}>{p.category}</div>
        <div style={{ fontFamily: syne, fontWeight: 700, fontSize: "1rem", lineHeight: 1.3, marginBottom: "6px" }}>{p.name}</div>
        {p.tagline && <div style={{ color: S.muted, fontSize: ".82rem", lineHeight: 1.5, marginBottom: "14px" }}>{p.tagline}</div>}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.25rem", color: "#fff" }}>{p.price === 0 ? "Free" : formatMoney(p.price, p.currency)}</span>
            {onSale && <span style={{ color: S.muted, fontSize: ".85rem", textDecoration: "line-through" }}>{formatMoney(p.compareAtPrice!, p.currency)}</span>}
          </div>
          <AddButton p={p} />
        </div>
      </div>
    </Link>
  );
}

// Shared card grid + hover styles (injected once per page)
export const SHOP_CARD_STYLES = `
  .shop-card{transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease}
  .shop-card:hover{transform:translateY(-6px);border-color:rgba(244,124,76,.4);box-shadow:0 24px 48px rgba(0,0,0,.4)}
  .shop-card-img{transition:transform .4s ease}
  .shop-card:hover .shop-card-img{transform:scale(1.06)}
  .shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:22px}
  @media(max-width:560px){.shop-grid{grid-template-columns:repeat(2,1fr);gap:12px}}
`;
