"use client";

// Shared pieces for the Automation Builder, Loop Mapper and Wireframe Builder
// inside the Studio frame: the challenge bar with sequential unlocks, the
// locked-challenge notice, and small hooks for the live panels.

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Lock } from "lucide-react";
import { isUnlocked, STUDIO_BY_ID } from "@/lib/learn/studio/catalog";
import { Difficulty, Stars, type T } from "./ui";

/** The value, but only after it has stopped changing for `ms`. */
export function useDebounced<V>(value: V, ms = 300): V {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

/** Size of an element, kept up to date (0 while hidden). */
export function useElementSize(ref: RefObject<HTMLElement | null>): { w: number; h: number } {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/**
 * Renders children with the element's own size, so a workspace can pick its
 * layout from the space it really has (the Studio frame gives it a cell of
 * varying size: page, full-screen overlay, lesson embed, phone). With
 * className "h-full" the height is the cell's height in full screen.
 */
export function Measure({ className, children }: { className?: string; children: (width: number, height: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { w, h } = useElementSize(ref);
  return (
    <div ref={ref} className={className}>
      {children(w, h)}
    </div>
  );
}

/** Numbered keys "<prefix>1", "<prefix>2"... that exist in the dictionary. */
export function keyList(t: T, prefix: string, max = 8): string[] {
  const out: string[] = [];
  for (let i = 1; i <= max; i++) {
    const k = `${prefix}${i}`;
    const v = t(k);
    if (v === k) break;
    out.push(v);
  }
  return out;
}

/**
 * Challenge order for one tool: a challenge opens once the one before it is
 * done (on the server, or completed in this session).
 */
export function useUnlocks(toolId: string, progress: Record<string, { done: boolean }>) {
  const [session, setSession] = useState<Set<string>>(() => new Set());
  return useMemo(() => {
    const done = (id: string) => !!progress[id]?.done || session.has(id);
    const list = STUDIO_BY_ID.get(toolId)?.challenges ?? [];
    // A challenge already done stays open (progress from before challenges
    // were ordered), even if the one before it isn't done.
    const open = (id: string) => done(id) || isUnlocked(toolId, id, done);
    return {
      done,
      locked: (id: string) => list.some((c) => c.id === id) && !open(id),
      /** The previous challenge id when `id` is locked, else null. */
      lockedBy: (id: string) => {
        const i = list.findIndex((c) => c.id === id);
        return i > 0 && !open(id) ? list[i - 1].id : null;
      },
      /** The first challenge not done yet (always open), or the last one. */
      firstOpen: () => list.find((c) => !done(c.id))?.id ?? list[list.length - 1]?.id ?? null,
      markDone: (id: string) => setSession((s) => (s.has(id) ? s : new Set(s).add(id))),
    };
  }, [toolId, progress, session]);
}

export interface BarItem {
  id: string;
  title: string;
  difficulty?: 1 | 2 | 3;
  stars: number;
  icon?: string;
}

/** Horizontal challenge picker for the frame's toolbar. Locked challenges are dimmed and can't be opened. */
export function ChallengeBar({
  t,
  label,
  items,
  current,
  onPick,
  lockedBy,
  titleOf,
  levelLabel,
  free,
}: {
  t: T;
  label: string;
  items: BarItem[];
  current: string;
  onPick: (id: string) => void;
  /** Previous challenge id when this one is locked. */
  lockedBy: (id: string) => string | null;
  titleOf: (id: string) => string;
  levelLabel: (n: number) => string;
  free: { id: string; label: string };
}) {
  const [notice, setNotice] = useState("");
  return (
    <div>
      <nav aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {items.map((c, i) => {
          const active = current === c.id;
          const prev = lockedBy(c.id);
          const hint = prev ? t("studio.lockedHint", { prev: titleOf(prev) }) : "";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (prev) {
                  setNotice(hint);
                  return;
                }
                setNotice("");
                onPick(c.id);
              }}
              aria-current={active ? "true" : undefined}
              aria-disabled={prev ? true : undefined}
              title={hint || undefined}
              data-locked={prev ? "true" : undefined}
              className={`flex min-w-[150px] max-w-[210px] shrink-0 flex-col items-start rounded-2xl border-2 px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
                prev
                  ? "cursor-not-allowed border-[#D2DCE8] bg-[var(--s2)] opacity-60"
                  : active
                    ? "border-[#F47C20] bg-[#FEF0E3]"
                    : "border-[#D2DCE8] bg-white hover:border-[#F47C20]"
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2 text-[11px] font-bold text-[var(--ink3)]">
                <span className="inline-flex items-center gap-1">
                  {prev && <Lock size={12} aria-hidden="true" />}
                  {levelLabel(i + 1)}
                </span>
                {c.difficulty && <Difficulty d={c.difficulty} label={t(`studio.difficulty.${c.difficulty}`)} />}
              </span>
              <span className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-[var(--ink)]">
                {c.icon && <span aria-hidden="true">{c.icon} </span>}
                {c.title}
              </span>
              <span className="mt-1">
                {prev ? (
                  <span className="text-[11px] font-semibold text-[var(--ink3)]">{t("studio.locked")}</span>
                ) : (
                  <Stars n={c.stars} size={13} label={`${c.stars}/3`} />
                )}
              </span>
              {prev && <span className="sr-only">{hint}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setNotice("");
            onPick(free.id);
          }}
          aria-current={current === free.id ? "true" : undefined}
          className={`flex min-w-[120px] shrink-0 flex-col items-start justify-center rounded-2xl border-2 border-dashed px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
            current === free.id ? "border-[#2251A3] bg-[#EBF0FA]" : "border-[#B8C4D3] bg-white hover:border-[#2251A3]"
          }`}
        >
          <span className="text-lg" aria-hidden="true">🧪</span>
          <span className="text-sm font-bold text-[var(--ink)]">{free.label}</span>
        </button>
      </nav>
      <p role="status" aria-live="polite" className={notice ? "mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[var(--s2)] px-2.5 py-1 text-xs font-semibold text-[var(--ink2)]" : "sr-only"}>
        {notice && <Lock size={12} aria-hidden="true" />}
        {notice}
      </p>
    </div>
  );
}

/** Shown instead of the workspace when a deep link opens a locked challenge. */
export function LockedNotice({ t, title, prevTitle, goLabel, onGo }: { t: T; title: string; prevTitle: string; goLabel: string; onGo: () => void }) {
  return (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white p-6 text-center shadow-sm sm:p-10" aria-live="polite">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--s2)] text-[var(--ink2)]">
        <Lock size={22} aria-hidden="true" />
      </span>
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("studio.locked")}</p>
      <h2 className="mt-1 text-lg font-black text-[var(--ink)]">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink2)]">{t("studio.lockedHint", { prev: prevTitle })}</p>
      <button
        type="button"
        onClick={onGo}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F47C20] px-5 py-2.5 text-sm font-black text-white shadow hover:bg-[#E05F00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
      >
        {goLabel}
      </button>
    </section>
  );
}

/** Small uppercase heading used inside live panels. */
export function LiveHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{children}</h3>
      {aside}
    </div>
  );
}

/** Re-render every `ms` while `on` (for looping live animations). */
export function useTicker(on: boolean, ms: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setN((x) => x + 1), ms);
    return () => window.clearInterval(id);
  }, [on, ms]);
  return n;
}
