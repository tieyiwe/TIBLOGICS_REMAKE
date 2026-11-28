"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import type { ShopProduct } from "./types";
import { useLocale, useT } from "@/lib/i18n/client";
import { CoverStage, priceParts } from "./ProductCard";
import { C, specChips } from "./theme";

export const SPOTLIGHT_STYLES = `
  .spot{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);border:1px solid ${C.line};border-radius:24px;overflow:hidden;background:${C.surface}}
  .spot .st-stage{min-height:100%;padding:48px 0}
  .spot .st-cover{width:min(62%,300px)}
  .spot-body{padding:clamp(28px,4.5vw,56px);display:flex;flex-direction:column;justify-content:center;min-width:0}
  .spot:hover .st-cover{transform:translateY(-6px)}
  @media(max-width:860px){
    .spot{grid-template-columns:1fr}
    .spot .st-stage{padding:36px 0 40px}
    .spot .st-cover{width:min(56%,240px)}
  }
  @media(prefers-reduced-motion:reduce){.spot:hover .st-cover{transform:none}}
`;

/**
 * The featured product at the top of the store. `rotatesInDays` is shown only
 * when several products share the spotlight, and only because it is true.
 */
export default function Spotlight({
  product,
  rotatesInDays,
  featuredCount,
}: {
  product: ShopProduct;
  rotatesInDays: number;
  featuredCount: number;
}) {
  const t = useT();
  const locale = useLocale();
  const price = priceParts(product, locale, t("pages.store.card.free"));
  const specs = specChips(product.fileFormat, t);

  return (
    <section className="st-wrap" style={{ paddingTop: "8px", paddingBottom: "8px" }} aria-labelledby="spot-title">
      <div className="spot">
        <Link href={`/store/${product.slug}`} tabIndex={-1} aria-hidden="true" style={{ display: "block" }}>
          {/* The store's largest paint: resized, modern format, fetched first. */}
          <CoverStage src={product.images?.[0]} alt={product.name} sizes="(max-width: 860px) 60vw, 300px" priority />
        </Link>

        <div className="spot-body">
          <div className="st-kicker" style={{ marginBottom: "16px" }}>{t("pages.store.spot.badge")}</div>
          <h2 id="spot-title" className="st-h" style={{ fontSize: "clamp(1.7rem,3.4vw,2.6rem)", lineHeight: 1.1, marginBottom: "12px" }}>
            {product.name}
          </h2>
          {product.tagline && (
            <p style={{ color: C.text, fontSize: "1.02rem", lineHeight: 1.55, margin: "0 0 16px" }}>{product.tagline}</p>
          )}
          <p style={{ color: C.muted, fontSize: ".95rem", lineHeight: 1.75, margin: "0 0 22px", maxWidth: "54ch" }}>
            {firstParagraph(product.description)}
          </p>

          {specs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "26px" }}>
              {specs.map((s) => (
                <span key={s} className="st-spec"><Check size={12} color={C.orange} aria-hidden="true" />{s}</span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "16px 20px", flexWrap: "wrap" }}>
            <Link href={`/store/${product.slug}`} className="st-btn st-btn-primary">
              {t("pages.store.spot.cta", { price: price.now })}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            {price.was && <s style={{ color: C.muted, fontSize: ".95rem" }}>{price.was}</s>}
            {product.digital && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: C.muted, fontSize: ".84rem" }}>
                <Check size={14} color={C.ok} aria-hidden="true" />
                {t("pages.store.spot.instant")}
              </span>
            )}
          </div>

          {featuredCount > 1 && (
            <p style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: C.muted, fontSize: ".8rem", margin: "20px 0 0" }}>
              <Clock size={12} aria-hidden="true" />
              {rotatesInDays === 1
                ? t("pages.store.spot.rotatesOne")
                : t("pages.store.spot.rotatesMany", { n: rotatesInDays })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Strip markdown and take the opening paragraph for the hero blurb. */
function firstParagraph(md: string): string {
  const plain = md
    .split("\n")
    .filter((l) => !l.trim().startsWith("#"))
    .join("\n")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .trim();
  const para = plain.split(/\n\s*\n/)[0] ?? "";
  return para.length > 260 ? para.slice(0, 257).trimEnd() + "…" : para;
}
