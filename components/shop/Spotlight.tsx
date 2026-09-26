"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import type { ShopProduct } from "./types";

const S = {
  card: "#1A2223",
  orange: "#F47C4C",
  amber: "#F9A738",
  muted: "#8A9BA0",
  border: "rgba(255,255,255,0.08)",
};
const syne = "'Syne', sans-serif";

export const SPOTLIGHT_STYLES = `
  .spot{
    display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);
    gap:44px;align-items:center;
  }
  @media(max-width:900px){ .spot{grid-template-columns:1fr;gap:28px} }
  .spot-cover{
    position:relative;border-radius:16px;overflow:hidden;
    box-shadow:0 30px 60px -20px rgba(0,0,0,.75);
    transform:perspective(1200px) rotateY(-6deg);
    transition:transform .5s cubic-bezier(.16,1,.3,1);
  }
  .spot-cover:hover{ transform:perspective(1200px) rotateY(0deg) translateY(-6px); }
  @media(max-width:900px){ .spot-cover{transform:none;max-width:320px;margin:0 auto} }
  @media(prefers-reduced-motion:reduce){
    .spot-cover,.spot-cover:hover{transform:none;transition:none}
  }
  .spot-cta{ transition:transform .2s,box-shadow .2s }
  .spot-cta:hover{ transform:translateY(-2px);box-shadow:0 10px 26px -8px rgba(244,124,76,.6) }
`;

/**
 * The rotating hero. `rotatesInDays` is shown as a soft scarcity cue that
 * happens to be true, rather than a fake countdown.
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
  const cover = product.images?.[0];
  const price = (product.price / 100).toFixed(0);
  const compare =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? (product.compareAtPrice / 100).toFixed(0)
      : null;

  // "PDF · 46 pages · 100 prompts" → chips, when the field is set that way.
  const specs = (product.fileFormat ?? "").split("·").map((s) => s.trim()).filter(Boolean);

  return (
    <section
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px 24px 8px",
      }}
    >
      <div
        style={{
          position: "relative",
          background: `linear-gradient(135deg, ${S.card} 0%, #0F1617 100%)`,
          border: `1px solid ${S.border}`,
          borderRadius: "24px",
          padding: "40px",
          overflow: "hidden",
        }}
      >
        {/* warm wash behind the cover */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(70% 90% at 22% 50%, rgba(244,124,76,.18), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="spot" style={{ position: "relative" }}>
          {/* Cover */}
          <Link href={`/store/${product.slug}`} className="spot-cover" style={{ display: "block" }}>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={product.name}
                style={{ width: "100%", display: "block", aspectRatio: "17/22", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  aspectRatio: "17/22",
                  background: "linear-gradient(135deg,#1C2526,#0C1112)",
                }}
              />
            )}
          </Link>

          {/* Detail */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(249,167,56,.12)",
                border: "1px solid rgba(249,167,56,.35)",
                borderRadius: "30px",
                padding: "6px 14px",
                marginBottom: "18px",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: S.amber,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: ".76rem", color: S.amber, fontWeight: 700, letterSpacing: ".04em" }}>
                THIS WEEK'S SPOTLIGHT
              </span>
            </div>

            <h2
              style={{
                fontFamily: syne,
                fontWeight: 800,
                fontSize: "clamp(1.7rem,3.2vw,2.5rem)",
                lineHeight: 1.12,
                marginBottom: "10px",
                color: "#fff",
              }}
            >
              {product.name}
            </h2>

            {product.tagline && (
              <p style={{ color: S.amber, fontSize: "1rem", fontWeight: 600, marginBottom: "16px" }}>
                {product.tagline}
              </p>
            )}

            {/* Short hook — first paragraph of the description, plain text */}
            <p
              style={{
                color: "#B0C4CC",
                fontSize: ".95rem",
                lineHeight: 1.7,
                marginBottom: "20px",
                maxWidth: "52ch",
              }}
            >
              {firstParagraph(product.description)}
            </p>

            {specs.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "22px" }}>
                {specs.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      border: `1px solid ${S.border}`,
                      borderRadius: "8px",
                      padding: "5px 11px",
                      fontSize: ".78rem",
                      color: "#C8D8E0",
                    }}
                  >
                    <Check size={12} color={S.orange} />
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
              <Link
                href={`/store/${product.slug}`}
                className="spot-cta"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "9px",
                  background: `linear-gradient(135deg,${S.orange},${S.amber})`,
                  color: "#12191A",
                  fontWeight: 800,
                  fontSize: ".95rem",
                  textDecoration: "none",
                  padding: "13px 26px",
                  borderRadius: "40px",
                }}
              >
                Get it for ${price}
                <ArrowRight size={17} />
              </Link>

              {compare && (
                <span style={{ color: S.muted, fontSize: ".9rem" }}>
                  <s>${compare}</s>
                </span>
              )}

              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: S.muted, fontSize: ".82rem" }}>
                <Check size={14} color="#22A387" />
                Instant download
              </span>
            </div>

            {featuredCount > 1 && (
              <p
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: S.muted,
                  fontSize: ".78rem",
                  marginTop: "18px",
                }}
              >
                <Clock size={12} />
                A different pack takes the spotlight in {rotatesInDays} day
                {rotatesInDays === 1 ? "" : "s"}
              </p>
            )}
          </div>
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
