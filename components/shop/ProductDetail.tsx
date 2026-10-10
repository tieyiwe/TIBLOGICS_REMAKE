"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check, ShieldCheck, Download, Infinity as InfinityIcon, Plus, Minus, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { useCart } from "./CartContext";
import type { ShopProduct } from "./types";
import { useLocale, useT } from "@/lib/i18n/client";
import ShopImage from "./ShopImage";
import ProductCard, { CoverStage, priceParts } from "./ProductCard";
import { C, FONT_BODY, FONT_HEAD, STORE_CSS, specChips } from "./theme";

/**
 * Renders a product description as structured copy.
 *
 * This used to be a pre-wrap block, so the description printed exactly as
 * stored. The copy is now plain prose with no markup, and short lines that
 * introduce a block read as headings rather than being lost in the paragraphs.
 */
function ProductCopy({ text }: { text: string }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  // Show enough to know what this is, not the whole document. The full copy
  // runs long enough to push related products off the bottom of the page,
  // which costs more in browsing than the detail wins in persuasion.
  const PREVIEW_BLOCKS = 4;
  // Long lists get clipped too, otherwise the preview is either the whole
  // contents or nothing: showing a few categories is the point.
  const PREVIEW_LIST_ITEMS = 4;
  const hasMore = blocks.length > PREVIEW_BLOCKS;
  const shown = expanded || !hasMore ? blocks : blocks.slice(0, PREVIEW_BLOCKS);
  const clipLists = hasMore && !expanded;

  const render = (block: string, i: number) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

    if (lines.length === 1 && lines[0].length <= 60 && !/[.:!?]$/.test(lines[0])) {
      return (
        <h4
          key={i}
          style={{
            fontFamily: FONT_HEAD, fontWeight: 700, fontSize: "1rem",
            color: C.ink, margin: i === 0 ? "0 0 10px" : "26px 0 10px",
          }}
        >
          {lines[0]}
        </h4>
      );
    }

    if (lines.length > 1 && lines.every((l) => l.length <= 150)) {
      const items = clipLists ? lines.slice(0, PREVIEW_LIST_ITEMS) : lines;
      return (
        <ul key={i} style={{ margin: "0 0 14px", paddingLeft: "18px" }} className="pd-list">
          {items.map((l) => (
            <li key={l} style={{ marginBottom: "6px" }}>{l}</li>
          ))}
        </ul>
      );
    }

    return <p key={i} style={{ margin: "0 0 14px" }}>{block}</p>;
  };

  return (
    <div style={{ color: C.text, fontSize: ".95rem", lineHeight: 1.75 }}>
      <div style={{ position: "relative" }}>
        {shown.map(render)}

        {/* Fade the cut edge so it reads as "continues" rather than "ends" */}
        {hasMore && !expanded && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute", left: 0, right: 0, bottom: 0, height: "48px",
              background: `linear-gradient(to bottom, rgba(10,20,32,0), ${C.bg})`,
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            marginTop: expanded ? "14px" : "4px",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            color: C.orange, fontFamily: FONT_BODY, fontSize: ".9rem", fontWeight: 700,
          }}
        >
          {expanded ? t("pages.store.detail.showLess") : t("pages.store.detail.readMore")}
          <ChevronDown
            size={15}
            style={{ transition: "transform .2s", transform: expanded ? "rotate(180deg)" : undefined }}
          />
        </button>
      )}
    </div>
  );
}

const DETAIL_CSS = `
  .pd-top{padding-top:clamp(116px,14vw,178px)}
  .pd-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,5vw,72px);align-items:start}
  .pd-gallery{position:sticky;top:120px}
  .pd-gallery .st-stage{aspect-ratio:1/1.06;border-radius:22px;border:1px solid ${C.line}}
  .pd-gallery .st-cover{width:62%}
  .pd-list li{margin-bottom:6px}
  .pd-list li::marker{color:${C.orange}}
  .pd-trust{display:grid;gap:14px;border:1px solid ${C.line};border-radius:16px;padding:18px 20px;background:${C.surface}}
  .pd-related{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
  @media(max-width:960px){.pd-related{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}
  @media(max-width:860px){
    .pd-grid{grid-template-columns:1fr}
    .pd-gallery{position:static}
    .pd-gallery .st-cover{width:58%}
  }
  @media(max-width:560px){.pd-related{gap:12px}.pd-related > :nth-child(3){display:none}}
`;

export default function ProductDetail({ product: p, related }: { product: ShopProduct; related: ShopProduct[] }) {
  const t = useT();
  const locale = useLocale();
  const { add, setOpen } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const price = priceParts(p, locale, t("pages.store.card.free"));
  const soldOut = p.stock != null && p.stock <= 0;
  const cap = p.stock ?? 99;
  // A digital product is bought once; a quantity picker only adds doubt.
  const showQty = !p.digital && !soldOut;
  const specs = specChips(p.fileFormat, t);

  function addToCart(openDrawer: boolean) {
    if (soldOut) return;
    add({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null, maxStock: p.stock }, showQty ? qty : 1);
    if (openDrawer) setOpen(true);
    else {
      setOpen(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    }
  }

  const trust = [
    { icon: ShieldCheck, label: t("pages.store.detail.secure"), note: t("pages.store.trust.secureNote") },
    ...(p.digital
      ? [
          { icon: Download, label: t("pages.store.detail.instant"), note: t("pages.store.trust.instantNote") },
          { icon: InfinityIcon, label: t("pages.store.trust.keep"), note: t("pages.store.trust.keepNote") },
        ]
      : []),
  ];

  return (
    <div className="st-page">
      <style>{STORE_CSS + DETAIL_CSS}</style>

      <div className="st-wrap pd-top" style={{ paddingBottom: "clamp(64px,9vw,110px)" }}>
        {/* Breadcrumb */}
        <nav aria-label={t("pages.store.detail.breadcrumb")} style={{ marginBottom: "28px" }}>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", fontSize: ".85rem" }}>
            <li><Link href="/store" className="st-link">{t("pages.store.meta.title")}</Link></li>
            <li aria-hidden="true" style={{ color: C.muted, display: "inline-flex" }}><ChevronRight size={14} /></li>
            {p.collections[0] ? (
              <li><Link href={`/store/collections/${p.collections[0]}`} className="st-link">{p.category}</Link></li>
            ) : (
              <li className="st-muted">{p.category}</li>
            )}
          </ol>
        </nav>

        <div className="pd-grid">
          {/* Gallery */}
          <div className="pd-gallery">
            <CoverStage src={p.images[activeImg]} alt={p.name} sizes="(max-width: 860px) 60vw, 340px" priority={activeImg === 0} />
            {p.images.length > 1 && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                {p.images.map((img, i) => (
                  <button key={i} type="button" onClick={() => setActiveImg(i)} aria-label={t("pages.store.detail.image", { n: i + 1 })} aria-pressed={i === activeImg}
                    style={{ position: "relative", width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", border: `2px solid ${i === activeImg ? C.orange : C.line}`, cursor: "pointer", padding: 0, background: C.surface }}>
                    <ShopImage src={img} alt="" sizes="64px" fit="contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ minWidth: 0 }}>
            <div className="st-kicker" style={{ marginBottom: "14px" }}>{p.category}</div>
            <h1 className="st-h" style={{ fontSize: "clamp(2rem,3.8vw,2.9rem)", lineHeight: 1.08, marginBottom: "14px" }}>{p.name}</h1>
            {p.tagline && <p style={{ color: C.text, fontSize: "1.08rem", lineHeight: 1.6, margin: "0 0 22px" }}>{p.tagline}</p>}

            {specs.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "26px" }}>
                {specs.map((s) => (
                  <span key={s} className="st-spec"><Check size={12} color={C.orange} aria-hidden="true" />{s}</span>
                ))}
              </div>
            )}

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
              <span className="st-price" style={{ fontSize: "clamp(2rem,3.4vw,2.5rem)", letterSpacing: "-.02em" }}>{price.now}</span>
              {price.was && (
                <>
                  <s style={{ color: C.muted, fontSize: "1.1rem" }}>{price.was}</s>
                  <span style={{ background: C.orange, color: "#0A1420", fontWeight: 700, fontSize: ".75rem", padding: "4px 10px", borderRadius: "999px" }}>
                    {t("pages.store.detail.save", { pct: price.pct })}
                  </span>
                </>
              )}
            </div>
            <p className="st-muted" style={{ fontSize: ".86rem", margin: "0 0 22px" }}>
              {p.digital ? t("pages.store.detail.oneTime") : null}
            </p>

            {/* Stock, for products that track it */}
            {p.stock != null && (
              <div style={{ fontSize: ".86rem", color: soldOut ? "#F87171" : p.stock <= 5 ? C.orange : C.ok, marginBottom: "18px", fontWeight: 600 }}>
                {soldOut ? t("pages.store.detail.outOfStock") : p.stock <= 5 ? t("pages.store.detail.onlyLeft", { n: p.stock }) : t("pages.store.detail.inStock")}
              </div>
            )}

            {showQty && (
              <div style={{ display: "inline-flex", alignItems: "center", background: C.surface, border: `1px solid ${C.line}`, borderRadius: "999px", overflow: "hidden", marginBottom: "14px" }}>
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t("pages.store.detail.decrease")} style={{ width: "44px", height: "44px", background: "none", border: "none", color: C.ink, cursor: "pointer" }}><Minus size={16} style={{ margin: "0 auto" }} /></button>
                <span style={{ minWidth: "32px", textAlign: "center", fontWeight: 700 }} aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(cap, q + 1))} aria-label={t("pages.store.detail.increase")} style={{ width: "44px", height: "44px", background: "none", border: "none", color: C.orange, cursor: "pointer" }}><Plus size={16} style={{ margin: "0 auto" }} /></button>
              </div>
            )}

            {/* The one call to action */}
            <button type="button" className="st-btn st-btn-primary" onClick={() => addToCart(true)} disabled={soldOut} style={{ width: "100%", padding: "17px 24px", fontSize: "1.05rem" }}>
              {soldOut ? t("pages.store.card.soldOut") : (<>{t("pages.store.detail.buyFor", { price: price.now })} <ArrowRight size={18} aria-hidden="true" /></>)}
            </button>
            {!soldOut && (
              <button type="button" onClick={() => addToCart(false)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", marginTop: "10px", padding: "10px", background: "none", border: "none", color: added ? C.ok : C.muted, fontFamily: FONT_BODY, fontWeight: 600, fontSize: ".9rem", cursor: "pointer" }}>
                {added ? (<><Check size={16} aria-hidden="true" /> {t("pages.store.detail.addedToCart")}</>) : (<><ShoppingBag size={16} aria-hidden="true" /> {t("pages.store.detail.addToCartInstead")}</>)}
              </button>
            )}

            {/* Trust */}
            <ul className="pd-trust" style={{ listStyle: "none", margin: "22px 0 36px" }}>
              {trust.map(({ icon: Icon, label, note }) => (
                <li key={label} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "10px", background: C.orangeSoft, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color={C.orange} aria-hidden="true" />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600, fontSize: ".9rem", color: C.ink }}>{label}</span>
                    <span style={{ display: "block", fontSize: ".82rem", color: C.muted, marginTop: "1px" }}>{note}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Description */}
            {p.description && (
              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: "28px" }}>
                <h2 className="st-h" style={{ fontSize: "1.25rem", marginBottom: "16px" }}>{t("pages.store.detail.details")}</h2>
                <ProductCopy text={p.description} />
              </div>
            )}

            {p.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "26px" }}>
                {p.tags.map((tag) => (
                  <span key={tag} className="st-spec" style={{ borderRadius: "999px", color: C.muted }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section style={{ marginTop: "clamp(64px,9vw,104px)", borderTop: `1px solid ${C.line}`, paddingTop: "clamp(40px,6vw,64px)" }} aria-labelledby="pd-related">
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "26px" }}>
              <h2 id="pd-related" className="st-h" style={{ fontSize: "clamp(1.35rem,2.4vw,1.8rem)" }}>{t("pages.store.detail.related")}</h2>
              <Link href="/store" className="st-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: ".88rem", fontWeight: 600 }}>
                {t("pages.store.detail.seeAll")} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="pd-related">
              {related.slice(0, 3).map((r) => <ProductCard key={r.id} p={r} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
