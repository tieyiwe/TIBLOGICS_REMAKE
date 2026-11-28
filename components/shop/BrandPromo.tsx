"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/**
 * An animated TIBLOGICS unit for the store.
 *
 * Everything moves in CSS — no JS, no state, nothing to hydrate — so it costs
 * nothing at runtime and cannot cause a server/client mismatch. The whole
 * thing stills under prefers-reduced-motion rather than being hidden, so the
 * message survives for people who turn animation off.
 */

const NODES = [
  { cx: 46, cy: 96, r: 13, d: "0s" },
  { cx: 96, cy: 52, r: 9, d: ".35s" },
  { cx: 104, cy: 132, r: 8, d: ".7s" },
  { cx: 158, cy: 74, r: 11, d: "1.05s" },
  { cx: 168, cy: 142, r: 7, d: "1.4s" },
  { cx: 214, cy: 104, r: 10, d: "1.75s" },
  { cx: 24, cy: 46, r: 6, d: "2.1s" },
  { cx: 30, cy: 148, r: 5, d: "2.45s" },
];

const LINKS = [
  "M46 96 L96 52", "M46 96 L104 132", "M96 52 L158 74", "M104 132 L168 142",
  "M158 74 L214 104", "M168 142 L214 104", "M46 96 L24 46", "M46 96 L30 148",
  "M158 74 L104 132",
];

export default function BrandPromo() {
  const t = useT();
  return (
    <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 clamp(16px,4vw,24px)" }}>
      <style>{`
        @keyframes tb-pulse {
          0%,100% { transform: scale(1);    opacity: .55 }
          50%     { transform: scale(1.35); opacity: 1 }
        }
        @keyframes tb-draw   { to { stroke-dashoffset: 0 } }
        @keyframes tb-drift  {
          0%,100% { transform: translate3d(0,0,0) }
          50%     { transform: translate3d(0,-7px,0) }
        }
        @keyframes tb-rotate {
          0%, 26%  { opacity: 1; transform: translateY(0) }
          33%, 93% { opacity: 0; transform: translateY(-10px) }
          100%     { opacity: 1; transform: translateY(0) }
        }
        .tb-node   { transform-box: fill-box; transform-origin: center;
                     animation: tb-pulse 3.4s ease-in-out infinite }
        .tb-link   { stroke-dasharray: 150; stroke-dashoffset: 150;
                     animation: tb-draw 1.6s ease-out forwards }
        .tb-mark   { animation: tb-drift 7s ease-in-out infinite }
        .tb-line   { animation: tb-rotate 10.5s ease-in-out infinite; opacity: 0 }
        .tb-promo  { display:grid; grid-template-columns: 260px minmax(0,1fr);
                     gap: 34px; align-items:center }
        @media (max-width: 760px) {
          .tb-promo { grid-template-columns: 1fr; gap: 20px; text-align:center }
          .tb-mark  { margin: 0 auto }
        }
        @media (prefers-reduced-motion: reduce) {
          .tb-node, .tb-link, .tb-mark, .tb-line { animation: none }
          .tb-link { stroke-dashoffset: 0 }
          .tb-line { opacity: 1; position: static !important }
          .tb-line:not(:first-child) { display: none }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(120deg,#0F1E30 0%,#0D1B2A 60%,#14273F 100%)",
          padding: "34px 32px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(60% 120% at 12% 50%, rgba(244,124,32,.16), transparent 70%)",
          }}
        />

        <div className="tb-promo" style={{ position: "relative" }}>
          <svg className="tb-mark" viewBox="0 0 240 190" width="240" height="190" role="img"
               aria-label={t("pages.store.promo.markLabel")}>
            <defs>
              <linearGradient id="tbg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFA25C" />
                <stop offset="55%" stopColor="#F47C20" />
                <stop offset="100%" stopColor="#D9600A" />
              </linearGradient>
            </defs>
            {LINKS.map((d, i) => (
              <path key={d} className="tb-link" d={d} stroke="url(#tbg)" strokeWidth="2"
                    fill="none" strokeLinecap="round"
                    style={{ animationDelay: `${i * 0.11}s`, opacity: 0.55 }} />
            ))}
            {NODES.map((n) => (
              <circle key={`${n.cx}-${n.cy}`} className="tb-node" cx={n.cx} cy={n.cy} r={n.r}
                      fill="url(#tbg)" style={{ animationDelay: n.d }} />
            ))}
          </svg>

          <div style={{ minWidth: 0 }}>
            <span style={{
              display: "inline-block", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".14em",
              color: "#F47C20", marginBottom: "12px",
            }}>
              {t("pages.store.promo.kicker")}
            </span>

            {/* All lines share one grid cell, so the box is as tall as the
                longest line (French and Swahili wrap further than English) and
                the rotation never shifts the layout. */}
            <div style={{ display: "grid", marginBottom: "10px" }}>
              {[
                t("pages.store.promo.line1"),
                t("pages.store.promo.line2"),
                t("pages.store.promo.line3"),
              ].map((line, i) => (
                <h2
                  key={line}
                  className="tb-line"
                  style={{
                    gridArea: "1 / 1", margin: 0,
                    fontFamily: "var(--font-brand-syne), 'Syne', sans-serif",
                    fontWeight: 700, fontSize: "clamp(1.25rem,2.3vw,1.7rem)",
                    lineHeight: 1.25, color: "#fff",
                    animationDelay: `${i * 3.5}s`,
                  }}
                >
                  {line}
                </h2>
              ))}
            </div>

            <p style={{ color: "#93A3B8", fontSize: ".92rem", lineHeight: 1.65, maxWidth: "52ch", margin: "0 0 18px" }}>
              {t("pages.store.promo.body")}
            </p>

            <Link
              href="/services"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                border: "1px solid rgba(244,124,32,.4)", background: "rgba(244,124,32,.1)",
                color: "#F47C20", borderRadius: "40px", padding: "10px 20px",
                fontSize: ".86rem", fontWeight: 700, textDecoration: "none",
              }}
            >
              {t("pages.store.promo.cta")} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
