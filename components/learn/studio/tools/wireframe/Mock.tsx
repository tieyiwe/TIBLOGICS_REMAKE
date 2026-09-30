"use client";

// How each wireframe component looks on the phone canvas (edit and preview).

import { tabItems, type Comp } from "./model";

export function Mock({
  c,
  label,
  targetName,
  preview,
  activeTab,
  onTab,
}: {
  c: Comp;
  label: string;
  targetName?: string;
  preview?: boolean;
  activeTab?: string;
  onTab?: (name: string) => void;
}) {
  const linkHint = targetName && !preview ? <span className="ml-1 text-[10px] font-semibold text-[var(--blue2)]">→ {targetName}</span> : null;
  switch (c.type) {
    case "header":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-[#0D1B2A] px-3 py-2.5 text-white">
          {c.link && <span aria-hidden="true" className="text-lg leading-none">‹</span>}
          <span className="truncate text-sm font-bold">{label}</span>
          {linkHint && <span className="ml-auto rounded bg-white/90 px-1">{linkHint}</span>}
        </div>
      );
    case "text":
      return (
        <div className="px-1 py-1">
          <p className="text-sm text-[var(--ink)]">
            {label}
            {linkHint}
          </p>
        </div>
      );
    case "input":
      return (
        <div className="px-1">
          <span className="block text-xs font-semibold text-[var(--ink2)]">{label}</span>
          <span className="mt-1 block rounded-lg border-2 border-[#D2DCE8] bg-white px-2 py-2 text-xs text-[var(--ink3)]">{c.note.trim() || "…"}</span>
        </div>
      );
    case "button":
      return (
        <span className="block rounded-xl bg-[#F47C20] px-3 py-2.5 text-center text-sm font-bold text-white shadow-sm">
          {label}
          {linkHint && <span className="ml-1 rounded bg-white/90 px-1">{linkHint}</span>}
        </span>
      );
    case "list":
      return (
        <div className="rounded-lg border border-[#D2DCE8] bg-white p-2">
          <p className="mb-1 text-xs font-bold text-[var(--ink)]">
            {label}
            {linkHint}
          </p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 border-t border-[#D2DCE8] py-1.5 first:border-t-0">
              <span className="h-3 w-3 rounded-full bg-[var(--s2)]" />
              <span className="h-2 flex-1 rounded bg-[var(--s2)]" style={{ maxWidth: `${80 - i * 15}%` }} />
              {c.link && <span className="text-xs text-[var(--ink3)]">›</span>}
            </div>
          ))}
        </div>
      );
    case "card":
      return (
        <div className="rounded-xl border-2 border-[#D2DCE8] bg-white p-2.5 shadow-sm">
          <p className="text-sm font-bold text-[var(--ink)]">
            {label}
            {linkHint}
          </p>
          <span className="mt-1.5 block h-2 w-4/5 rounded bg-[var(--s2)]" />
          <span className="mt-1 block h-2 w-3/5 rounded bg-[var(--s2)]" />
        </div>
      );
    case "image":
      return (
        <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-lg bg-[repeating-linear-gradient(45deg,var(--s2),var(--s2)_8px,#fff_8px,#fff_16px)] text-xs text-[var(--ink2)]">
          <span aria-hidden="true" className="text-xl">🖼️</span>
          <span>
            {label}
            {linkHint}
          </span>
        </div>
      );
    case "error":
      return (
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-700">
          <span aria-hidden="true">⚠</span> {label}
        </p>
      );
    case "empty":
      return (
        <div className="rounded-lg border-2 border-dashed border-[#D2DCE8] px-2 py-3 text-center text-xs text-[var(--ink2)]">
          <span aria-hidden="true" className="block text-xl">📭</span>
          {label}
        </div>
      );
    case "tabs": {
      const items = tabItems(label);
      return (
        <div className="flex rounded-lg border border-[#D2DCE8] bg-white">
          {items.map((it) => {
            const on = activeTab && it.toLowerCase() === activeTab.toLowerCase();
            const cls = `flex-1 truncate px-1 py-2 text-center text-[11px] font-semibold ${on ? "border-b-2 border-[#F47C20] text-[#F47C20]" : "text-[var(--ink2)]"}`;
            return preview && onTab ? (
              <button key={it} type="button" className={cls} onClick={() => onTab(it)}>
                {it}
              </button>
            ) : (
              <span key={it} className={cls}>
                {it}
              </span>
            );
          })}
        </div>
      );
    }
  }
}
