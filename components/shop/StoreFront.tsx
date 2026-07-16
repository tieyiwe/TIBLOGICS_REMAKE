"use client";

import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import ProductCard, { SHOP_CARD_STYLES } from "./ProductCard";
import type { ShopProduct, ShopCollection } from "./types";

const S = {
  darker: "#0C1112",
  card: "#1A2223",
  orange: "#F47C4C",
  amber: "#F9A738",
  muted: "#8A9BA0",
  border: "rgba(255,255,255,0.08)",
};
const syne = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

export default function StoreFront({ products, collections }: { products: ShopProduct[]; collections: ShopCollection[] }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const [cat, setCat] = useState("All");
  const [collection, setCollection] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const featuredCollections = collections.filter((c) => c.featured);
  const activeCollection = collection ? collections.find((c) => c.slug === collection) ?? null : null;

  const filtered = products.filter((p) => {
    if (collection && !p.collections.includes(collection)) return false;
    if (cat !== "All" && p.category !== cat) return false;
    if (q && !`${p.name} ${p.tagline ?? ""} ${p.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ background: S.darker, color: "#fff", fontFamily: dm, minHeight: "100vh" }}>
      <style>{SHOP_CARD_STYLES + `
        .col-strip{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
        @media(max-width:560px){.col-strip{grid-template-columns:repeat(2,1fr);gap:12px}}
        .col-card{transition:transform .3s,border-color .3s}
        .col-card:hover{transform:translateY(-4px);border-color:rgba(244,124,76,.5)}
      `}</style>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden", padding: "132px 24px 48px", textAlign: "center", background: "radial-gradient(120% 80% at 50% -10%, rgba(244,124,76,.16), transparent 60%)" }}>
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

      {/* Featured collections */}
      {featuredCollections.length > 0 && !collection && (
        <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "8px 24px 8px" }}>
          <div style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.15rem", marginBottom: "16px" }}>Shop by Collection</div>
          <div className="col-strip">
            {featuredCollections.map((c) => (
              <button key={c.slug} onClick={() => { setCollection(c.slug); setCat("All"); }} className="col-card"
                style={{ position: "relative", textAlign: "left", border: `1px solid ${S.border}`, borderRadius: "18px", overflow: "hidden", cursor: "pointer", padding: 0, background: S.card, aspectRatio: "16/10", color: "#fff" }}>
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={c.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#1C2526,#0C1112)" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent,rgba(12,17,18,.85))" }} />
                <div style={{ position: "absolute", left: "16px", bottom: "14px", right: "16px" }}>
                  <div style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.05rem" }}>{c.name}</div>
                  {c.description && <div style={{ color: "#C8D8E0", fontSize: ".78rem", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</div>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Active collection header */}
      {activeCollection && (
        <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 0" }}>
          <button onClick={() => setCollection(null)} style={{ background: "none", border: "none", color: S.muted, cursor: "pointer", fontSize: ".85rem", marginBottom: "10px", padding: 0 }}>← All products</button>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.8rem" }}>{activeCollection.name}</h2>
          {activeCollection.description && <p style={{ color: S.muted, fontSize: ".92rem", marginTop: "6px", maxWidth: "560px" }}>{activeCollection.description}</p>}
        </section>
      )}

      {/* Filters */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 24px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              style={{ border: `1px solid ${cat === c ? S.orange : S.border}`, background: cat === c ? "rgba(244,124,76,.12)" : "transparent", color: cat === c ? S.orange : S.muted, borderRadius: "50px", padding: "7px 16px", fontSize: ".82rem", fontWeight: 600, cursor: "pointer", fontFamily: dm }}>
              {c}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…"
          style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: "50px", padding: "9px 18px", color: "#fff", fontSize: ".85rem", fontFamily: dm, minWidth: "200px", outline: "none" }} />
      </section>

      {/* Grid */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 100px" }}>
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
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
