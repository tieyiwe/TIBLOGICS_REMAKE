"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { formatMoney, type ShopProduct } from "./types";
import { useLocale, useT } from "@/lib/i18n/client";
import ShopImage from "./ShopImage";
import { C, specChips } from "./theme";

/**
 * A product's cover, shown whole at the book's own proportions (17:22, the
 * size every toolkit cover is rendered at) on a navy stage. `contain`, so an
 * image of any other shape is letterboxed rather than cropped.
 */
export function CoverStage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  coverWidth,
  style,
}: {
  src: string | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Width of the cover inside the stage, e.g. "64%". Defaults to the CSS. */
  coverWidth?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`st-stage${className ? ` ${className}` : ""}`} style={style}>
      {src ? (
        <div className="st-cover" style={coverWidth ? { width: coverWidth } : undefined}>
          <ShopImage src={src} alt={alt} sizes={sizes} priority={priority} fit="contain" />
        </div>
      ) : (
        <ShoppingBag size={40} color={C.muted} style={{ opacity: 0.4 }} aria-hidden="true" />
      )}
    </div>
  );
}

/** Whole amounts without cents ("$79"), others as usual ("$79.50"). */
function money(cents: number, currency: string, locale: string): string {
  if (cents % 100 === 0) {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: currency || "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);
    } catch {
      /* unknown currency: fall through */
    }
  }
  return formatMoney(cents, currency, locale);
}

/** Price as shown on cards and the detail page, with the sale price if any. */
export function priceParts(p: ShopProduct, locale: string, freeLabel: string) {
  const onSale = !!(p.onSale && p.compareAtPrice && p.compareAtPrice > p.price);
  return {
    now: p.price === 0 ? freeLabel : money(p.price, p.currency, locale),
    was: onSale ? money(p.compareAtPrice!, p.currency, locale) : null,
    pct: onSale ? Math.round(((p.compareAtPrice! - p.price) / p.compareAtPrice!) * 100) : 0,
  };
}

/**
 * One product in a grid. The whole card is the single call to action: it
 * opens the product page, where the buying happens.
 * `priority` for the first cards, which are above the fold (LCP).
 */
export default function ProductCard({ p, priority = false }: { p: ShopProduct; priority?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const price = priceParts(p, locale, t("pages.store.card.free"));
  const soldOut = p.stock != null && p.stock <= 0;
  const specs = specChips(p.fileFormat, t);

  return (
    <Link href={`/store/${p.slug}`} className="st-card" aria-label={t("pages.store.card.viewLabel", { name: p.name })}>
      <div style={{ position: "relative" }}>
        <CoverStage
          src={p.images[0]}
          alt={p.name}
          sizes="(max-width: 560px) 45vw, (max-width: 960px) 30vw, 250px"
          priority={priority}
        />
        {(price.was || (p.featured && !soldOut) || soldOut) && (
          <span
            className="st-badge"
            style={{
              position: "absolute", top: "12px", left: "12px", zIndex: 2,
              background: price.was ? C.orange : "rgba(10,20,32,.78)",
              color: price.was ? "#0A1420" : C.ink,
              border: price.was ? "none" : `1px solid ${C.lineStrong}`,
              backdropFilter: "blur(6px)",
              fontSize: ".68rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
              padding: "5px 10px", borderRadius: "999px",
            }}
          >
            {soldOut ? t("pages.store.card.soldOut") : price.was ? `−${price.pct}%` : t("pages.store.card.featured")}
          </span>
        )}
      </div>
      <div className="st-card-body">
        <div className="st-kicker" style={{ fontSize: ".66rem", color: C.muted }}>{p.category}</div>
        <div className="st-card-name">{p.name}</div>
        {p.tagline && <div className="st-card-tag">{p.tagline}</div>}
        {specs.length > 0 && (
          <div className="st-card-spec" style={{ color: C.muted, fontSize: ".78rem", marginTop: "2px" }}>
            {specs.join(" · ")}
          </div>
        )}
        <div className="st-card-foot">
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <span className="st-price" style={{ fontSize: "1.12rem" }}>{price.now}</span>
            {price.was && <s style={{ color: C.muted, fontSize: ".82rem" }}>{price.was}</s>}
          </span>
          <span className="st-view" aria-hidden="true">
            <span className="st-view-label">{t("pages.store.card.view")}</span>
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
