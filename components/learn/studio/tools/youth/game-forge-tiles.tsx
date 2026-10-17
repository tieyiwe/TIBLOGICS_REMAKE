"use client";

import { useEffect, useRef } from "react";

// Game Forge tile editor: platformer levels and the adventure map. Tap (or
// click, or drag with a mouse) to paint the chosen tile; keyboard users tab
// to a cell and press Enter. The grid scrolls sideways on a phone; taps
// paint, swipes scroll. "P" and "G" are unique: painting one moves it.

export interface PaletteItem {
  /** A tile character, or "@<kind>:<i>" to place a character or item. */
  id: string;
  label: string;
  icon: string;
}

export interface Marker {
  x: number;
  y: number;
  icon: string;
  label: string;
}

const UNIQUE = new Set(["P", "G"]);

export function paintRows(rows: string[], x: number, y: number, ch: string): string[] {
  if (rows[y]?.[x] === undefined || rows[y][x] === ch) return rows;
  const next = rows.map((r) => (UNIQUE.has(ch) ? r.split(ch).join(".") : r));
  next[y] = next[y].slice(0, x) + ch + next[y].slice(x + 1);
  return next;
}

export function TilePalette({ items, value, onPick, testPrefix }: { items: PaletteItem[]; value: string; onPick: (id: string) => void; testPrefix: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup">
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={value === p.id}
          onClick={() => onPick(p.id)}
          className={`inline-flex min-h-[40px] items-center gap-1 rounded-xl border-2 px-2.5 py-1 text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
            value === p.id ? "border-[#F47C20] bg-[#FFF4EB] text-[#8A3B00]" : "border-[#D2DCE8] bg-white text-[var(--ink)] hover:border-[#F47C20]"
          }`}
          data-testid={`${testPrefix}-paint-${p.id.replace(/[^A-Za-z0-9]/g, (c) => ({ ".": "empty", "#": "solid", "~": "water", "@": "at", ":": "-" })[c] ?? "x")}`}
        >
          <span aria-hidden="true" className="text-base leading-none">{p.icon}</span>
          {p.label}
        </button>
      ))}
    </div>
  );
}

export default function TileGrid({
  rows,
  look,
  markers = [],
  onTap,
  label,
  testPrefix,
  cellLabel,
}: {
  rows: string[];
  /** How each tile character is drawn. */
  look: Record<string, { bg: string; icon?: string; name: string }>;
  markers?: Marker[];
  onTap: (x: number, y: number) => void;
  label: string;
  testPrefix: string;
  cellLabel: (x: number, y: number, name: string) => string;
}) {
  const dragging = useRef(false);
  const last = useRef("");
  useEffect(() => {
    const up = () => {
      dragging.current = false;
      last.current = "";
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);
  const at = new Map(markers.map((m) => [`${m.x},${m.y}`, m]));
  const W = rows[0]?.length ?? 0;
  const tap = (x: number, y: number) => {
    const k = `${x},${y}`;
    if (last.current === k) return;
    last.current = k;
    onTap(x, y);
  };
  return (
    <div className="overflow-x-auto rounded-xl border-2 border-[#D2DCE8] bg-[#F4F7FB] p-1" data-testid={`${testPrefix}-grid`}>
      <div role="grid" aria-label={label} className="grid w-max gap-px" style={{ gridTemplateColumns: `repeat(${W}, 30px)` }}>
        {rows.map((r, y) =>
          [...r].map((ch, x) => {
            const l = look[ch] ?? look["."];
            const m = at.get(`${x},${y}`);
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                role="gridcell"
                aria-label={cellLabel(x, y, m ? m.label : l.name)}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px] text-[17px] leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
                style={{ background: l.bg }}
                onClick={() => {
                  last.current = "";
                  tap(x, y);
                  last.current = "";
                }}
                onPointerDown={(e) => {
                  if (e.pointerType !== "mouse") return;
                  dragging.current = true;
                  last.current = `${x},${y}`;
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse" && dragging.current) tap(x, y);
                }}
                data-testid={`${testPrefix}-tile-${x}-${y}`}
                data-tile={ch}
              >
                <span aria-hidden="true">{m ? m.icon : l.icon ?? ""}</span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
