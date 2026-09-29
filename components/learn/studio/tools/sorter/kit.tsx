"use client";

// Small shared pieces for the Task Sorter, Spot the Risk and Wireframe
// Builder Studio tools: per-locale text, stars and the challenge picker.

import type { Locale } from "@/lib/i18n/config";

/** Game content in the three site languages. */
export type L3 = { en: string; fr: string; sw: string };

export const tx = (l: L3, locale: Locale): string => l[locale] || l.en;

/** Build an L3 from a [en, fr, sw] tuple (keeps data files compact). */
export const l3 = (t: readonly [string, string, string]): L3 => ({ en: t[0], fr: t[1], sw: t[2] });

export const ACCENT = "#F47C20";

/** Fisher-Yates shuffle, returns a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Stars from an accuracy ratio; 0 means not passed. */
export function starsFor(ratio: number, cut: [number, number, number]): 0 | 1 | 2 | 3 {
  if (ratio >= cut[2]) return 3;
  if (ratio >= cut[1]) return 2;
  if (ratio >= cut[0]) return 1;
  return 0;
}

export function Stars({ n, size = "text-base", label }: { n: number; size?: string; label?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${size}`} role="img" aria-label={label ?? `${n}/3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} aria-hidden="true" style={{ color: i <= n ? ACCENT : "var(--border)" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export interface PickerItem {
  id: string;
  icon: string;
  name: string;
  sub?: string;
  difficulty?: 1 | 2 | 3;
}

/** Grid of challenge cards with done / 3-star markers. */
export function ChallengePicker({
  items,
  progress,
  onPick,
  t,
  heading,
}: {
  items: PickerItem[];
  progress: Record<string, { done: boolean; perfect: boolean }>;
  onPick: (id: string) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
  heading?: string;
}) {
  return (
    <div>
      {heading && <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--ink3)]">{heading}</h2>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const p = progress[it.id];
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onPick(it.id)}
                className="group flex h-full w-full items-start gap-3 rounded-2xl border-2 border-[var(--border)] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#F47C20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C20] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--s2)] text-2xl">
                  {it.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-[var(--ink)]">{it.name}</span>
                  {it.sub && <span className="mt-0.5 block text-xs text-[var(--ink2)]">{it.sub}</span>}
                  <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    {it.difficulty && (
                      <span className="rounded-full bg-[var(--s2)] px-2 py-0.5 font-semibold text-[var(--ink2)]">
                        {t(`studio.difficulty.${it.difficulty}`)}
                      </span>
                    )}
                    {p?.perfect ? (
                      <Stars n={3} size="text-sm" label={t("studio.perfect")} />
                    ) : p?.done ? (
                      <span className="font-semibold text-emerald-700">✓ {t("studio.done")}</span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Plain pill button in the tools' style. */
export function Btn({
  children,
  onClick,
  kind = "primary",
  disabled,
  className = "",
  ariaLabel,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  kind?: "primary" | "ghost" | "soft";
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C20] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
  const look =
    kind === "primary"
      ? "bg-[#F47C20] text-white shadow-sm hover:brightness-105"
      : kind === "soft"
        ? "bg-[var(--s2)] text-[var(--ink)] hover:bg-[#FDE7D5]"
        : "border-2 border-[var(--border)] bg-white text-[var(--ink)] hover:border-[#F47C20]";
  return (
    <button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={`${base} ${look} ${className}`}>
      {children}
    </button>
  );
}
