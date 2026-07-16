"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check } from "lucide-react";
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

function AddButton({ p }: { p: ShopProduct }) {
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

function ProductCard({ p }: { p: ShopProduct }) {
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

export default function StoreFront({ products }: { products: ShopProduct[] }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const filtered = products.filter((p) => {
    if (cat !== "All" && p.category !== cat) return false;
    if (q && !`${p.name} ${p.tagline ?? ""} ${p.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ background: S.darker, color: "#fff", fontFamily: dm, minHeight: "100vh" }}>
      <style>{`
        .shop-card{transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease}
        .shop-card:hover{transform:translateY(-6px);border-color:rgba(244,124,76,.4);box-shadow:0 24px 48px rgba(0,0,0,.4)}
        .shop-card-img{transition:transform .4s ease}
        .shop-card:hover .shop-card-img{transform:scale(1.06)}
        .shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:22px}
        @media(max-width:560px){.shop-grid{grid-template-columns:repeat(2,1fr);gap:12px}}
      `}</style>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden", padding: "132px 24px 56px", textAlign: "center", background: "radial-gradient(120% 80% at 50% -10%, rgba(244,124,76,.16), transparent 60%)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(244,124,76,.1)", border: "1px solid rgba(244,124,76,.3)", borderRadius: "30px", padding: "7px 16px", marginBottom: "24px" }}>
            <ShoppingBag size={15} color={S.amber} />
            <span style={{ fontSize: ".8rem", color: S.amber, fontWeight: 600 }}>The TIBLOGICS Shop</span>
          </div>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: "clamp(2.4rem,5vw,4rem)", lineHeight: 1.08, marginBottom: "18px" }}>
            Premium tools.<br />
            <span style={{ background: "linear-gradient(135deg,#F47C4C,#F9A738)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Instant access.</span>
          </h1>
          <p style={{ color: "#B0C4CC", fontSize: "1.05rem", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto" }}>
            Curated templates, resources, and digital products — built by TIBLOGICS to move you forward faster.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 24px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                border: `1px solid ${cat === c ? S.orange : S.border}`,
                background: cat === c ? "rgba(244,124,76,.12)" : "transparent",
                color: cat === c ? S.orange : S.muted,
                borderRadius: "50px",
                padding: "7px 16px",
                fontSize: ".82rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: dm,
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: "50px", padding: "9px 18px", color: "#fff", fontSize: ".85rem", fontFamily: dm, minWidth: "200px", outline: "none" }}
        />
      </section>

      {/* Grid */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 24px 100px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: S.muted }}>
            <ShoppingBag size={44} style={{ margin: "0 auto 18px", opacity: 0.4 }} />
            <p style={{ fontSize: "1.05rem", fontFamily: syne, fontWeight: 700, marginBottom: "6px", color: "#fff" }}>
              {products.length === 0 ? "The shop is opening soon" : "No products match your search"}
            </p>
            <p style={{ fontSize: ".9rem" }}>
              {products.length === 0 ? "New products are on the way — check back shortly." : "Try a different category or search term."}
            </p>
          </div>
        ) : (
          <div className="shop-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
