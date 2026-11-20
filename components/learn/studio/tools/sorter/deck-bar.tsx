"use client";

// Deck picker for the Studio toolbar, with in-order unlocking: a deck opens
// once the one before it (in the tool's catalog order) is done, on the server
// (progress) or earlier in this session. Free play is always open.
// Shared by Task Sorter and Spot the Risk.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Lock } from "lucide-react";
import { STUDIO_BY_ID, isUnlocked, previousChallenge } from "@/lib/learn/studio/catalog";
import { ACCENT, Btn } from "./kit";

type Progress = Record<string, { done: boolean; perfect: boolean }>;

/** Lock state for a tool's challenges, in catalog order. */
export function useDeckLocks(toolId: string, progress: Progress) {
  const [sessionDone, setSessionDone] = useState<ReadonlySet<string>>(() => new Set());
  const order = useMemo(() => STUDIO_BY_ID.get(toolId)?.challenges.map((c) => c.id) ?? [], [toolId]);
  const isDone = useCallback((id: string) => !!progress[id]?.done || sessionDone.has(id), [progress, sessionDone]);
  const isLocked = useCallback((id: string) => order.includes(id) && !isUnlocked(toolId, id, isDone), [order, toolId, isDone]);
  const prevOf = useCallback((id: string) => previousChallenge(toolId, id), [toolId]);
  /** The first deck that is open and not done yet (or the first deck when all are done). */
  const firstOpen = useMemo(() => order.find((id) => !isLocked(id) && !isDone(id)) ?? order[0] ?? null, [order, isLocked, isDone]);
  /** The deck after this one, if it is open now. */
  const nextOpen = useCallback(
    (id: string) => {
      const i = order.indexOf(id);
      const n = i >= 0 ? order[i + 1] : undefined;
      return n && !isLocked(n) ? n : null;
    },
    [order, isLocked],
  );
  const markDone = useCallback((id: string) => setSessionDone((s) => new Set(s).add(id)), []);
  return { order, isDone, isLocked, prevOf, firstOpen, nextOpen, markDone };
}

export interface DeckBarItem {
  id: string;
  icon: string;
  name: string;
  /** Free play entries are never locked and show no progress. */
  free?: boolean;
}

/** One row of deck chips for the StudioFrame toolbar. */
export function DeckBar({
  items,
  active,
  onPick,
  isLocked,
  lockHint,
  progress,
  label,
  t,
}: {
  items: DeckBarItem[];
  active: string | null;
  onPick: (id: string) => void;
  isLocked: (id: string) => boolean;
  /** The "complete X first" message for a locked deck. */
  lockHint: (id: string) => string;
  progress: Progress;
  label: string;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const [hint, setHint] = useState<string | null>(null);
  const row = useRef<HTMLDivElement>(null);
  // Keep the active deck in view in the scrolling row (without scrolling the page).
  useEffect(() => {
    const el = row.current;
    const chip = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !chip) return;
    const left = chip.offsetLeft - el.offsetLeft;
    if (left < el.scrollLeft || left + chip.offsetWidth > el.scrollLeft + el.clientWidth) el.scrollLeft = Math.max(0, left - 16);
  }, [active]);
  return (
    <div>
      <div ref={row} role="toolbar" aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {items.map((it) => {
          const locked = !it.free && isLocked(it.id);
          const p = progress[it.id];
          const on = active === it.id;
          return (
            <button
              key={it.id}
              type="button"
              aria-pressed={on}
              aria-disabled={locked || undefined}
              data-deck={it.id}
              data-locked={locked ? "true" : undefined}
              title={locked ? lockHint(it.id) : undefined}
              onClick={() => {
                if (locked) {
                  setHint(lockHint(it.id));
                  return;
                }
                setHint(null);
                onPick(it.id);
              }}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C20] motion-reduce:transition-none ${
                locked
                  ? "cursor-not-allowed border-dashed border-[#D2DCE8] bg-[var(--s2)] text-[var(--ink3)] opacity-60"
                  : on
                    ? "border-[#F47C20] bg-[#FEF0E3] text-[var(--ink)]"
                    : "border-[#D2DCE8] bg-white text-[var(--ink2)] hover:border-[#F47C20] hover:text-[var(--ink)]"
              }`}
            >
              <span aria-hidden="true" className={locked ? "grayscale" : ""}>
                {it.icon}
              </span>
              <span className="whitespace-nowrap">{it.name}</span>
              {locked ? (
                <Lock size={14} aria-label={t("studio.locked")} />
              ) : p?.perfect ? (
                <span className="text-xs" style={{ color: ACCENT }} aria-label={t("studio.perfect")}>
                  ★★★
                </span>
              ) : p?.done ? (
                <Check size={15} className="text-emerald-700" aria-label={t("studio.done")} />
              ) : null}
            </button>
          );
        })}
      </div>
      {hint && (
        <p role="status" className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--s2)] px-2.5 py-1 text-xs font-semibold text-[var(--ink2)]">
          <Lock size={12} aria-hidden="true" /> {hint}
        </p>
      )}
    </div>
  );
}

/** Shown in the workspace when a deep link points at a locked deck. */
export function LockedDeck({
  icon,
  name,
  hint,
  goLabel,
  onGo,
  title,
}: {
  icon: string;
  name: string;
  hint: string;
  goLabel: string | null;
  onGo: () => void;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D2DCE8] bg-[var(--s2)] p-6 text-center sm:p-10" data-locked-panel>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl" aria-hidden="true">
        <span className="grayscale">{icon}</span>
      </span>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
        <Lock size={13} aria-hidden="true" /> {title}
      </p>
      <h2 className="mt-1 text-lg font-black text-[var(--ink)]">{name}</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--ink2)]">{hint}</p>
      {goLabel && (
        <Btn className="mt-4" onClick={onGo}>
          {goLabel} →
        </Btn>
      )}
    </div>
  );
}
