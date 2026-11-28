"use client";

import { useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { Loop } from "../loops/model";
import { H, W, capOf, type SLink, type SNode } from "./system-model";

// The System Mapper diagram: stocks are boxes, flows are pills, arrows carry
// a + or - badge. Drag a part to move it (or focus it and use the arrow
// keys); tap one part then another to connect them when connecting is on.

export type Selection = { type: "node" | "link"; id: string } | null;

const NW = 132;
const SH = 54;
const FH = 46;
type Pt = { x: number; y: number };

const heightOf = (n: SNode) => (n.kind === "stock" ? SH : FH);

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

function geometry(a: SNode, b: SNode) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const curv = Math.min(42, 20 + len * 0.08);
  const c = { x: m.x - (dy / len) * curv, y: m.y + (dx / len) * curv };
  const s = edge(a, NW, heightOf(a), c, 2);
  const e = edge(b, NW, heightOf(b), c, 8);
  return { s, c, e, d: `M${s.x.toFixed(1)},${s.y.toFixed(1)} Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${e.x.toFixed(1)},${e.y.toFixed(1)}` };
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));

export default function SystemCanvas({
  nodes,
  links,
  loops,
  labelOf,
  valueOf,
  fullOf,
  selection,
  linkSource,
  highlight,
  loopTag,
  reduceMotion,
  ariaLabel,
  nodeAria,
  linkAria,
  fullLabel,
  maxLabel,
  onTapNode,
  onTapLink,
  onTapEmpty,
  onMoveNode,
}: {
  nodes: SNode[];
  links: SLink[];
  loops: Loop[];
  labelOf: (n: SNode) => string;
  valueOf: (id: string) => number | null;
  /** A flow running at its capacity right now (a bottleneck sign). */
  fullOf: (id: string) => boolean;
  selection: Selection;
  linkSource: string | null;
  highlight: Loop | null;
  loopTag: (l: Loop) => string;
  reduceMotion: boolean;
  ariaLabel: string;
  nodeAria: (n: SNode) => string;
  linkAria: (l: SLink) => string;
  fullLabel: string;
  maxLabel: (n: number) => string;
  onTapNode: (id: string) => void;
  onTapLink: (id: string) => void;
  onTapEmpty: () => void;
  onMoveNode: (id: string, x: number, y: number) => void;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = (name: string) => `${name}-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number; moved: boolean; pointer: number } | null>(null);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const hlLinks = new Set(highlight?.links.map((l) => l.id) ?? []);

  const toSvg = (e: { clientX: number; clientY: number }): Pt => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const clamp = (n: SNode, x: number, y: number): [number, number] => [
    Math.max(NW / 2 + 4, Math.min(W - NW / 2 - 4, x)),
    Math.max(heightOf(n) / 2 + 4, Math.min(H - heightOf(n) / 2 - 4, y)),
  ];

  const down = (e: PointerEvent, n: SNode) => {
    e.stopPropagation();
    const p = toSvg(e);
    drag.current = { id: n.id, ox: n.x - p.x, oy: n.y - p.y, sx: p.x, sy: p.y, moved: false, pointer: e.pointerId };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const p = toSvg(e);
    if (!d.moved && Math.hypot(p.x - d.sx, p.y - d.sy) < 6) return;
    d.moved = true;
    const n = byId.get(d.id);
    if (!n) return;
    const [x, y] = clamp(n, p.x + d.ox, p.y + d.oy);
    onMoveNode(d.id, Math.round(x), Math.round(y));
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) onTapNode(d.id);
  };
  const keyNode = (e: KeyboardEvent, n: SNode) => {
    const step = e.shiftKey ? 30 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTapNode(n.id);
    } else if (moves[e.key]) {
      e.preventDefault();
      const [x, y] = clamp(n, n.x + moves[e.key][0], n.y + moves[e.key][1]);
      onMoveNode(n.id, x, y);
    }
  };

  let loopPath = "";
  if (highlight) {
    for (const l of highlight.links) {
      const a = byId.get(l.from);
      const b = byId.get(l.to);
      if (!a || !b) continue;
      const g = geometry(a, b);
      loopPath += loopPath ? ` L${g.s.x.toFixed(1)},${g.s.y.toFixed(1)} Q${g.c.x.toFixed(1)},${g.c.y.toFixed(1)} ${g.e.x.toFixed(1)},${g.e.y.toFixed(1)}` : g.d;
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full min-w-[520px] select-none rounded-xl bg-white"
      style={{ touchAction: "pan-x pan-y" }}
      role="group"
      aria-label={ariaLabel}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => (drag.current = null)}
      onClick={(e) => {
        if (e.target === svgRef.current || (e.target as Element).getAttribute("data-bg")) onTapEmpty();
      }}
      data-testid="sm-canvas"
    >
      <defs>
        <pattern id={ref("sm-dots")} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#D2DCE8" />
        </pattern>
        {[
          ["sm-arrow", "#7A8FA6"],
          ["sm-arrow-hl", "#F47C20"],
          ["sm-arrow-sel", "#0D1B2A"],
        ].map(([id, fill]) => (
          <marker key={id} id={ref(id)} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={fill} />
          </marker>
        ))}
      </defs>
      <rect data-bg="1" x="0" y="0" width={W} height={H} fill={`url(#${ref("sm-dots")})`} />

      {loops.map((lp) => {
        const pts = lp.nodes.map((id) => byId.get(id)).filter((p): p is SNode => !!p);
        if (!pts.length) return null;
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length + (pts.length === 2 ? 34 : 0);
        const on = highlight?.sig === lp.sig;
        const tag = loopTag(lp);
        const color = tag.startsWith("R") ? "#C45A0A" : tag.startsWith("B") ? "#2251A3" : "#7A8FA6";
        return (
          <g key={lp.sig} aria-hidden="true" opacity={highlight && !on ? 0.35 : 1}>
            <circle cx={cx} cy={cy} r={on ? 19 : 16} fill="white" stroke={color} strokeWidth={on ? 2.5 : 1.5} strokeDasharray="70 12" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={color}>
              {tag}
            </text>
          </g>
        );
      })}

      {links.map((l) => {
        const a = byId.get(l.from);
        const b = byId.get(l.to);
        if (!a || !b) return null;
        const g = geometry(a, b);
        const sel = selection?.type === "link" && selection.id === l.id;
        const hl = hlLinks.has(l.id);
        const stroke = sel ? "#0D1B2A" : hl ? "#F47C20" : "#7A8FA6";
        const pb = at(g.s, g.c, g.e, 0.78);
        const mid = at(g.s, g.c, g.e, 0.5);
        return (
          <g
            key={l.id}
            role="button"
            tabIndex={0}
            aria-label={linkAria(l)}
            aria-pressed={sel}
            className="cursor-pointer focus:outline-none [&:focus-visible>path.sm-focus]:stroke-[#F47C20]/40"
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
            data-link={l.id}
          >
            <path className="sm-focus" d={g.d} fill="none" stroke="transparent" strokeWidth="16" />
            <path d={g.d} fill="none" stroke={stroke} strokeWidth={sel || hl ? 3 : 2} markerEnd={`url(#${ref(sel ? "sm-arrow-sel" : hl ? "sm-arrow-hl" : "sm-arrow")})`} />
            {l.delay && (
              <text x={mid.x} y={mid.y - 8} textAnchor="middle" fontSize="13" aria-hidden="true">
                ⏳
              </text>
            )}
            <circle cx={pb.x} cy={pb.y} r="10" fill={l.pol === 1 ? "#2251A3" : "#D9480F"} stroke="white" strokeWidth="2" />
            <text x={pb.x} y={pb.y + 4.5} textAnchor="middle" fontSize="14" fontWeight="900" fill="white">
              {l.pol === 1 ? "+" : "−"}
            </text>
          </g>
        );
      })}

      {highlight && loopPath && !reduceMotion && (
        <circle r="7" fill="#F47C20" stroke="white" strokeWidth="2" aria-hidden="true">
          <animateMotion dur={`${Math.max(1.6, highlight.links.length * 0.7)}s`} repeatCount="indefinite" path={loopPath} />
        </circle>
      )}

      {nodes.map((n) => {
        const label = labelOf(n);
        const h = heightOf(n);
        const sel = selection?.type === "node" && selection.id === n.id;
        const src = linkSource === n.id;
        const inLoop = highlight?.nodes.includes(n.id);
        const v = valueOf(n.id);
        const full = n.kind === "flow" && fullOf(n.id);
        const cap = capOf(n);
        const stroke = sel || src ? "#F47C20" : inLoop ? "#F47C20" : n.kind === "stock" ? "#1B3A6B" : "#7A8FA6";
        return (
          <g
            key={n.id}
            role="button"
            tabIndex={0}
            aria-label={nodeAria(n)}
            aria-pressed={sel}
            transform={`translate(${n.x},${n.y})`}
            style={{ touchAction: "none" }}
            className="cursor-grab focus:outline-none [&:focus-visible>rect.sm-body]:stroke-[#F47C20] [&:focus-visible>rect.sm-body]:[stroke-width:3]"
            onPointerDown={(e) => down(e, n)}
            onKeyDown={(e) => keyNode(e, n)}
            data-node={n.id}
          >
            {src && !reduceMotion && (
              <rect x={-NW / 2 - 5} y={-h / 2 - 5} width={NW + 10} height={h + 10} rx={n.kind === "stock" ? 12 : (h + 10) / 2} fill="none" stroke="#F47C20" strokeWidth="2" opacity="0.6">
                <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.4s" repeatCount="indefinite" />
              </rect>
            )}
            <rect
              className="sm-body"
              x={-NW / 2}
              y={-h / 2}
              width={NW}
              height={h}
              rx={n.kind === "stock" ? 8 : h / 2}
              fill={sel || src ? "#FEF0E3" : n.kind === "stock" ? "#EBF0FA" : "#FFFFFF"}
              stroke={full ? "#D9480F" : stroke}
              strokeWidth={sel || src || full ? 2.5 : 1.5}
              strokeDasharray={n.kind === "flow" ? "5 3" : undefined}
              filter="drop-shadow(0 1px 1.5px rgba(13,27,42,.12))"
            />
            <text textAnchor="middle" y={v === null ? 4.5 : -4} fontSize="12" fontWeight="700" fill="#0D1B2A" style={{ pointerEvents: "none" }}>
              {n.kind === "flow" ? "⇢ " : "▦ "}
              {label.length > 17 ? `${label.slice(0, 16)}…` : label}
            </text>
            {v !== null && (
              <text textAnchor="middle" y="13" fontSize="12" fontWeight="800" fill={full ? "#B3380A" : "#2251A3"} style={{ pointerEvents: "none" }}>
                {fmt(v)}
                {cap !== undefined ? ` / ${maxLabel(cap)}` : ""}
                {full ? ` ⚠ ${fullLabel}` : ""}
              </text>
            )}
            {(n.helpers ?? 0) > 0 && (
              <text x={NW / 2 - 4} y={-h / 2 - 4} textAnchor="end" fontSize="12" style={{ pointerEvents: "none" }} aria-hidden="true">
                {"👷".repeat(n.helpers ?? 0)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
