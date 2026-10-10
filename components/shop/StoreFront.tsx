"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Download, Infinity as InfinityIcon, ShieldCheck, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import Spotlight, { SPOTLIGHT_STYLES } from "./Spotlight";
import BrandPromo from "./BrandPromo";
import type { ShopProduct, ShopCollection } from "./types";
import { useT } from "@/lib/i18n/client";
import { C, STORE_CSS } from "./theme";

const LOCAL_CSS = `
  .st-hero{padding-top:clamp(124px,14vw,184px);padding-bottom:clamp(36px,5vw,56px);text-align:center;
    background:radial-gradient(70% 60% at 50% 0%, rgba(27,58,107,.55), transparent 70%)}
  .st-trust{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 28px;margin-top:30px}
  .st-trust-item{display:inline-flex;align-items:center;gap:8px;color:${C.text};font-size:.86rem}
  .st-toolbar{display:flex;flex-wrap:wrap;gap:14px 20px;align-items:flex-end;justify-content:space-between;margin-bottom:26px}
  .st-search{position:relative;flex:0 1 280px;min-width:0}
  .st-search input{width:100%;background:${C.surface};border:1px solid ${C.line};border-radius:999px;padding:11px 16px 11px 40px;
    color:${C.ink};font-size:.88rem;outline:none;font-family:inherit;transition:border-color .2s}
  .st-search input::placeholder{color:${C.muted}}
  .st-search input:focus{border-color:${C.orangeLine}}
  @media(max-width:560px){.st-search{flex:1 1 100%}}
`;

export default function StoreFront({
  products,
  collections,
  spotlightSlug = null,
  rotatesInDays = 0,
  featuredCount = 0,
}: {
  products: ShopProduct[];
  collections: ShopCollection[];
  spotlightSlug?: string | null;
  rotatesInDays?: number;
  featuredCount?: number;
}) {
  const t = useT();
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // The spotlight only sits above the unfiltered store; above search results
  // it would be noise.
  const spotlightProduct =
    spotlightSlug && !cat && !q ? products.find((p) => p.slug === spotlightSlug) ?? null : null;

  // Collections that actually have products in them get a link to their page.
  const collectionLinks = collections.filter((c) => c.featured && products.some((p) => p.collections.includes(c.slug)));

  const needle = q.trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (needle && !`${p.name} ${p.tagline ?? ""} ${p.category} ${p.tags.join(" ")}`.toLowerCase().includes(needle)) return false;
    return true;
  });

  return (
    <div className="st-page">
      <style>{STORE_CSS + SPOTLIGHT_STYLES + LOCAL_CSS}</style>

      {/* Hero */}
      <header className="st-hero">
        <div className="st-wrap" style={{ maxWidth: "820px" }}>
          <div className="st-kicker" style={{ marginBottom: "18px" }}>{t("pages.store.hero.badge")}</div>
          <h1 className="st-h" style={{ fontSize: "clamp(2.2rem,5.4vw,3.8rem)", lineHeight: 1.06 }}>
            {t("pages.store.hero.title")}{" "}<br />
            <span style={{ color: C.orange }}>{t("pages.store.hero.titleAccent")}</span>
          </h1>
          <p style={{ color: C.text, fontSize: "1.05rem", lineHeight: 1.7, maxWidth: "560px", margin: "18px auto 0" }}>
            {t("pages.store.hero.body")}
          </p>
          <ul className="st-trust" style={{ listStyle: "none", padding: 0 }}>
            {[
              { icon: Download, label: t("pages.store.trust.instant"), note: t("pages.store.trust.instantNote") },
              { icon: InfinityIcon, label: t("pages.store.trust.keep"), note: t("pages.store.trust.keepNote") },
              { icon: ShieldCheck, label: t("pages.store.trust.secure"), note: t("pages.store.trust.secureNote") },
            ].map(({ icon: Icon, label, note }) => (
              <li key={label} className="st-trust-item" title={note}>
                <Icon size={16} color={C.orange} aria-hidden="true" />
                <span><strong style={{ color: C.ink, fontWeight: 600 }}>{label}</strong><span className="st-muted"> · {note}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {spotlightProduct && (
        <Spotlight product={spotlightProduct} rotatesInDays={rotatesInDays} featuredCount={featuredCount} />
      )}

      {/* Catalogue */}
      <section className="st-wrap" style={{ paddingTop: "clamp(48px,7vw,80px)", paddingBottom: "clamp(56px,8vw,96px)" }} aria-labelledby="st-all">
        <div className="st-toolbar">
          <div>
            <h2 id="st-all" className="st-h" style={{ fontSize: "clamp(1.4rem,2.6vw,1.9rem)" }}>{t("pages.store.grid.title")}</h2>
            <p className="st-muted" style={{ margin: "6px 0 0", fontSize: ".9rem" }}>
              {filtered.length === 1 ? t("pages.store.grid.countOne") : t("pages.store.grid.count", { n: filtered.length })}
            </p>
          </div>
          {products.length > 0 && (
            <label className="st-search">
              <Search size={16} color={C.muted} aria-hidden="true" style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)" }} />
              <input type="search" aria-label={t("pages.store.searchLabel")} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("pages.store.search")} maxLength={80} />
            </label>
          )}
        </div>

        {(categories.length > 1 || collectionLinks.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "28px" }}>
            {categories.length > 1 && (
              <>
                <button type="button" className="st-chip" aria-pressed={cat === null} onClick={() => setCat(null)}>
                  {t("pages.store.category.all")}
                </button>
                {categories.map((c) => (
                  <button key={c} type="button" className="st-chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>
                    {c}
                  </button>
                ))}
              </>
            )}
            {collectionLinks.map((c) => (
              <Link key={c.slug} href={`/store/collections/${c.slug}`} className="st-chip">
                {t("pages.store.collections.link", { name: c.name })} <ArrowRight size={13} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 16px", border: `1px dashed ${C.line}`, borderRadius: "18px" }}>
            <ShoppingBag size={36} color={C.muted} style={{ margin: "0 auto 16px", opacity: 0.6 }} aria-hidden="true" />
            <p className="st-h" style={{ fontSize: "1.08rem", marginBottom: "6px" }}>
              {products.length === 0 ? t("pages.store.empty.soon") : t("pages.store.empty.noMatch")}
            </p>
            <p className="st-muted" style={{ fontSize: ".9rem", margin: 0 }}>
              {products.length === 0 ? t("pages.store.empty.soonBody") : t("pages.store.empty.noMatchBody")}
            </p>
          </div>
        ) : (
          <div className="st-grid">
            {filtered.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 3 && !spotlightProduct} />)}
          </div>
        )}
      </section>

      <BrandPromo />
      <div style={{ height: "clamp(56px,8vw,96px)" }} />
    </div>
  );
}
