"use client";

import { useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { H, W, type Link, type Loop, type Variable } from "./model";

export type Selection = { type: "var" | "link"; id: string } | null;

const BH = 36;
export const bubbleW = (label: string) => Math.max(76, Math.min(176, label.length * 7.1 + 26));

type Pt = { x: number; y: number };

function edge(c: Pt, w: number, h: number, toward: Pt, pad = 0): Pt {
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (!dx && !dy) return c;
  const s = Math.min((w / 2 + pad) / Math.abs(dx || 1e-9), (h / 2 + pad) / Math.abs(dy || 1e-9));
  return { x: c.x + dx * s, y: c.y + dy * s };
}
const at = (s: Pt, c: Pt, e: Pt, t: number): Pt => ({
  x: (1 - t) ** 2 * s.x + 2 * (1 - t) * t * c.x + t ** 2 * e.x,
  y: (1 - t) ** 2 * s.y + 2 * (1 - t) * t * c.y + t ** 2 * e.y,
});
const tangent = (s: Pt, c: Pt, e: Pt, t: number): Pt => {
  const x = 2 * (1 - t) * (c.x - s.x) + 2 * t * (e.x - c.x);
  const y = 2 * (1 - t) * (c.y - s.y) + 2 * t * (e.y - c.y);
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};

export function linkGeometry(a: Variable, b: Variable, la: string, lb: string) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const curv = Math.min(40, 18 + len * 0.08);
  const c = { x: m.x - (dy / len) * curv, y: m.y + (dx / len) * curv };
  const s = edge(a, bubbleW(la), BH, c, 2);
  const e = edge(b, bubbleW(lb), BH, c, 7);
  return { s, c, e, d: `M${s.x.toFixed(1)},${s.y.toFixed(1)} Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${e.x.toFixed(1)},${e.y.toFixed(1)}` };
}

export default function MapCanvas({
  vars,
  links,
  loops,
  labelOf,
  selection,
  linkSource,
  highlight,
  loopTag,
  reduceMotion,
  ariaLabel,
  varAria,
  linkAria,
  onTapVar,
  onTapLink,
  onTapEmpty,
  onMoveVar,
  fill = false,
}: {
  vars: Variable[];
  links: Link[];
  loops: Loop[];
  labelOf: (v: Variable) => string;
  selection: Selection;
  linkSource: string | null;
  highlight: Loop | null;
  loopTag: (l: Loop) => string;
  reduceMotion: boolean;
  ariaLabel: string;
  varAria: (v: Variable) => string;
  linkAria: (l: Link) => string;
  onTapVar: (id: string) => void;
  onTapLink: (id: string) => void;
  onTapEmpty: () => void;
  onMoveVar: (id: string, x: number, y: number) => void;
  /** Fill the parent's height (keeps the aspect ratio, centred). */
  fill?: boolean;
}) {
  // Unique ids: the Studio frame can mount the workspace twice (one copy hidden).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = (name: string) => `${name}-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number; moved: boolean; pointer: number } | null>(null);
  const byId = new Map(vars.map((v) => [v.id, v]));
  const hlLinks = new Set(highlight?.links.map((l) => l.id) ?? []);

  const toSvg = (e: { clientX: number; clientY: number }): Pt => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const down = (e: PointerEvent, v: Variable) => {
    e.stopPropagation();
    const p = toSvg(e);
    drag.current = { id: v.id, ox: v.x - p.x, oy: v.y - p.y, sx: p.x, sy: p.y, moved: false, pointer: e.pointerId };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const p = toSvg(e);
    if (!d.moved && Math.hypot(p.x - d.sx, p.y - d.sy) < 6) return;
    d.moved = true;
    const v = byId.get(d.id);
    const w = v ? bubbleW(labelOf(v)) : 80;
    onMoveVar(d.id, Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, p.x + d.ox)), Math.max(BH / 2 + 4, Math.min(H - BH / 2 - 4, p.y + d.oy)));
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) onTapVar(d.id);
  };
  const keyVar = (e: KeyboardEvent, v: Variable) => {
    const step = e.shiftKey ? 30 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTapVar(v.id);
    } else if (moves[e.key]) {
      e.preventDefault();
      const w = bubbleW(labelOf(v));
      onMoveVar(v.id, Math.max(w / 2, Math.min(W - w / 2, v.x + moves[e.key][0])), Math.max(BH / 2, Math.min(H - BH / 2, v.y + moves[e.key][1])));
    }
  };

  // Path for the pulse that travels around the highlighted loop.
  let loopPath = "";
  if (highlight) {
    for (const l of highlight.links) {
      const a = byId.get(l.from);
      const b = byId.get(l.to);
      if (!a || !b) continue;
      const g = linkGeometry(a, b, labelOf(a), labelOf(b));
      loopPath += loopPath ? ` L${g.s.x.toFixed(1)},${g.s.y.toFixed(1)} Q${g.c.x.toFixed(1)},${g.c.y.toFixed(1)} ${g.e.x.toFixed(1)},${g.e.y.toFixed(1)}` : g.d;
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className={`block w-full min-w-[460px] select-none rounded-xl bg-white ${fill ? "h-full" : "h-auto"}`}
      style={{ touchAction: "pan-x pan-y" }}
      role="group"
      aria-label={ariaLabel}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => (drag.current = null)}
      onClick={(e) => {
        if (e.target === svgRef.current || (e.target as Element).getAttribute("data-bg")) onTapEmpty();
      }}
    >
      <defs>
        <pattern id={ref("lm-dots")} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#D2DCE8" />
        </pattern>
        {[
          ["lm-arrow", "#7A8FA6"],
          ["lm-arrow-hl", "#F47C20"],
          ["lm-arrow-sel", "#0D1B2A"],
        ].map(([id, fill]) => (
          <marker key={id} id={ref(id)} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={fill} />
          </marker>
        ))}
      </defs>
      <rect data-bg="1" x="0" y="0" width={W} height={H} fill={`url(#${ref("lm-dots")})`} />

      {/* Loop markers */}
      {loops.map((lp) => {
        const pts = lp.nodes.map((id) => byId.get(id)!).filter(Boolean);
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const on = highlight?.sig === lp.sig;
        const tag = loopTag(lp);
        const color = tag.startsWith("R") ? "#C45A0A" : tag.startsWith("B") ? "#2251A3" : "#7A8FA6";
        return (
          <g key={lp.sig} aria-hidden="true" opacity={highlight && !on ? 0.35 : 1}>
            <circle cx={cx} cy={cy} r={on ? 20 : 17} fill="white" stroke={color} strokeWidth={on ? 2.5 : 1.5} strokeDasharray="70 12" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={color}>
              {tag}
            </text>
          </g>
        );
      })}

      {/* Links */}
      {links.map((l) => {
        const a = byId.get(l.from);
        const b = byId.get(l.to);
        if (!a || !b) return null;
        const g = linkGeometry(a, b, labelOf(a), labelOf(b));
        const sel = selection?.type === "link" && selection.id === l.id;
        const hl = hlLinks.has(l.id);
        const stroke = sel ? "#0D1B2A" : hl ? "#F47C20" : "#7A8FA6";
        const pb = at(g.s, g.c, g.e, 0.8);
        const mid = at(g.s, g.c, g.e, 0.5);
        const tg = tangent(g.s, g.c, g.e, 0.5);
        const nx = -tg.y;
        const ny = tg.x;
        return (
          <g
            key={l.id}
            role="button"
            tabIndex={0}
            aria-label={linkAria(l)}
            aria-pressed={sel}
            className="cursor-pointer focus:outline-none [&:focus-visible>path.lm-focus]:stroke-[#F47C20]/40"
            onClick={(e) => {
              e.stopPropagation();
              onTapLink(l.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTapLink(l.id);
              }
            }}
          >
            <path className="lm-focus" d={g.d} fill="none" stroke="transparent" strokeWidth="16" />
            <path
              d={g.d}
              fill="none"
              stroke={stroke}
              strokeWidth={sel || hl ? 3 : 2}
              markerEnd={`url(#${ref(sel ? "lm-arrow-sel" : hl ? "lm-arrow-hl" : "lm-arrow")})`}
            />
            {l.delay && (
              <g stroke={stroke} strokeWidth="2.5" strokeLinecap="round">
                {[-3.5, 3.5].map((o) => (
                  <line key={o} x1={mid.x + tg.x * o - nx * 8} y1={mid.y + tg.y * o - ny * 8} x2={mid.x + tg.x * o + nx * 8} y2={mid.y + tg.y * o + ny * 8} />
                ))}
              </g>
            )}
            <circle cx={pb.x} cy={pb.y} r="10" fill={l.pol === 1 ? "#2251A3" : "#D9480F"} stroke="white" strokeWidth="2" />
            <text x={pb.x} y={pb.y + 4.5} textAnchor="middle" fontSize="14" fontWeight="900" fill="white">
              {l.pol === 1 ? "+" : "−"}
            </text>
          </g>
        );
      })}

      {/* Pulse around the selected loop */}
      {highlight && loopPath && !reduceMotion && (
        <circle r="7" fill="#F47C20" stroke="white" strokeWidth="2" aria-hidden="true">
          <animateMotion dur={`${Math.max(1.6, highlight.links.length * 0.7)}s`} repeatCount="indefinite" path={loopPath} />
        </circle>
      )}

      {/* Variables */}
      {vars.map((v) => {
        const label = labelOf(v);
        const w = bubbleW(label);
        const sel = selection?.type === "var" && selection.id === v.id;
        const src = linkSource === v.id;
        const inLoop = highlight?.nodes.includes(v.id);
        return (
          <g
            key={v.id}
            role="button"
            tabIndex={0}
            aria-label={varAria(v)}
            aria-pressed={sel}
            transform={`translate(${v.x},${v.y})`}
            style={{ touchAction: "none" }}
            className="cursor-grab focus:outline-none [&:focus-visible>rect]:stroke-[#F47C20]"
            onPointerDown={(e) => down(e, v)}
            onKeyDown={(e) => keyVar(e, v)}
          >
            {src && !reduceMotion && (
              <rect x={-w / 2 - 5} y={-BH / 2 - 5} width={w + 10} height={BH + 10} rx={(BH + 10) / 2} fill="none" stroke="#F47C20" strokeWidth="2" opacity="0.6">
                <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.4s" repeatCount="indefinite" />
              </rect>
            )}
            <rect
              x={-w / 2}
              y={-BH / 2}
              width={w}
              height={BH}
              rx={BH / 2}
              fill={sel || src ? "#FEF0E3" : inLoop ? "#FFF8F1" : "#FFFFFF"}
              stroke={sel || src ? "#F47C20" : inLoop ? "#F47C20" : "#9AAABC"}
              strokeWidth={sel || src ? 2.5 : 1.5}
              filter="drop-shadow(0 1px 1.5px rgba(13,27,42,.12))"
            />
            <text textAnchor="middle" y="4.5" fontSize="12.5" fontWeight="700" fill="#0D1B2A" style={{ pointerEvents: "none" }}>
              {label.length > 24 ? `${label.slice(0, 23)}…` : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
