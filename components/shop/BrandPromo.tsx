"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  return (
    <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 8px" }}>
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
          background: "linear-gradient(120deg,#10191A 0%,#0B1112 60%,#141E26 100%)",
          padding: "34px 32px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(60% 120% at 12% 50%, rgba(244,124,76,.16), transparent 70%)",
          }}
        />

        <div className="tb-promo" style={{ position: "relative" }}>
          <svg className="tb-mark" viewBox="0 0 240 190" width="240" height="190" role="img"
               aria-label="The TIBLOGICS network mark">
            <defs>
              <linearGradient id="tbg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F9A738" />
                <stop offset="55%" stopColor="#F47C4C" />
                <stop offset="100%" stopColor="#E05020" />
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
              color: "#F9A738", marginBottom: "12px",
            }}>
              BUILT BY TIBLOGICS
            </span>

            {/* Fixed height so the rotating lines never shift the layout */}
            <div style={{ position: "relative", height: "2.6em", marginBottom: "10px" }}>
              {[
                "The prompts we actually use on client work.",
                "Written by people who ship this for a living.",
                "No fluff, no filler — just what works.",
              ].map((line, i) => (
                <h2
                  key={line}
                  className="tb-line"
                  style={{
                    position: "absolute", inset: 0, margin: 0,
                    fontFamily: "var(--font-syne), sans-serif",
                    fontWeight: 800, fontSize: "clamp(1.25rem,2.3vw,1.7rem)",
                    lineHeight: 1.25, color: "#fff",
                    animationDelay: `${i * 3.5}s`,
                  }}
                >
                  {line}
                </h2>
              ))}
            </div>

            <p style={{ color: "#8A9BA0", fontSize: ".92rem", lineHeight: 1.65, maxWidth: "52ch", margin: "0 0 18px" }}>
              TIBLOGICS builds AI systems for real businesses. Everything in this store
              came out of that work — not a content farm.
            </p>

            <Link
              href="/services"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                border: "1px solid rgba(244,124,76,.4)", background: "rgba(244,124,76,.1)",
                color: "#F9A738", borderRadius: "40px", padding: "10px 20px",
                fontSize: ".86rem", fontWeight: 700, textDecoration: "none",
              }}
            >
              See what we build <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
