"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, ExternalLink, Lock, RotateCcw, Star } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { isUnlocked, previousChallenge } from "@/lib/learn/studio/catalog";
import type { StudioChallengeMeta, StudioResult } from "@/lib/learn/studio/types";

// Shared building blocks for the four prompt-engineering Studio tools
// (prompt-builder, prompt-arena, critic-mode, test-bench). Shared text lives in
// lib/i18n/messages/studio-prompt-builder.ts under "studio.prompt-builder.ui.*".

export const ACCENT = "#F47C20";
const UI = "studio.prompt-builder.ui";

export type Progress = Record<string, { done: boolean; perfect: boolean }>;

export function Stars({ n, size = 18, label }: { n: number; size?: number; label?: string }) {
  const t = useT();
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ?? t(`${UI}.stars`, { n })}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          style={{ width: size, height: size }}
          className={i <= n ? "fill-[#F47C20] text-[#F47C20]" : "text-[var(--border)]"}
        />
      ))}
    </span>
  );
}

export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("ok");
    } catch {
      setState("fail");
    }
    setTimeout(() => setState("idle"), 2200);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${className}`}
    >
      {state === "ok" ? <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      <span aria-live="polite">{state === "ok" ? t(`${UI}.copied`) : state === "fail" ? t(`${UI}.copyFail`) : t(`${UI}.copy`)}</span>
    </button>
  );
}

/** "Try it for real": a copyable prompt and a note about free AI accounts. */
export function TryForReal({ prompt, intro }: { prompt: string; intro?: string }) {
  const t = useT();
  return (
    <section aria-label={t(`${UI}.real.title`)} className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--s2)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-[var(--ink)]">
          <span aria-hidden="true">🚀</span> {t(`${UI}.real.title`)}
        </h3>
        <CopyButton text={prompt} />
      </div>
      <p className="mt-1 text-xs text-[var(--ink2)]">{intro ?? t(`${UI}.real.body`)}</p>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs leading-relaxed text-[var(--ink)]">{prompt}</pre>
      <p className="mt-2 text-xs text-[var(--ink3)]">
        {t(`${UI}.real.note`)}{" "}
        <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-[var(--blue2)] underline">
          Claude <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>{" "}
        ·{" "}
        <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-[var(--blue2)] underline">
          ChatGPT <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </p>
    </section>
  );
}

/** A value that settles `ms` after its last change (the live panels use it). Pass stable values (state or memoised). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/** Ids that just appeared in `ids` (not on first render). Cleared after `ms`. Drives the "new" highlights. */
export function useFresh(ids: string[], ms = 2600): string[] {
  const sig = ids.join("|");
  const prev = useRef<string[] | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);
  useEffect(() => {
    const now = sig ? sig.split("|") : [];
    const before = prev.current;
    prev.current = now;
    if (!before) return;
    const added = now.filter((x) => !before.includes(x));
    setFresh(added);
    if (!added.length) return;
    const id = setTimeout(() => setFresh([]), ms);
    return () => clearTimeout(id);
  }, [sig, ms]);
  return fresh;
}

export interface ChallengeFlow {
  toolId: string;
  challenges: StudioChallengeMeta[];
  /** The challenge on screen, or null for free play. */
  current: string | null;
  pick: (id: string | null) => void;
  isDone: (id: string) => boolean;
  isPerfect: (id: string) => boolean;
  isLocked: (id: string) => boolean;
  prevOf: (id: string) => string | null;
  /** The first challenge not done yet (always unlocked). */
  frontier: string | null;
  freePlay: boolean;
  /** Wraps the host's onComplete and unlocks the next challenge for this session. */
  complete: (r: StudioResult) => void;
}

/**
 * Challenge order for a tool: challenges unlock one after the other (the
 * server refuses to save a locked one), free play is always open. Without a
 * deep link the tool opens on the first challenge not done yet.
 */
export function useChallengeFlow({
  toolId,
  challenges,
  challengeId,
  progress,
  freePlay,
  onComplete,
}: {
  toolId: string;
  challenges: StudioChallengeMeta[];
  challengeId: string | null;
  progress: Progress;
  freePlay: boolean;
  onComplete: (r: StudioResult) => void;
}): ChallengeFlow {
  const [session, setSession] = useState<Record<string, { perfect: boolean }>>({});
  const isDone = useCallback((id: string) => !!progress[id]?.done || !!session[id], [progress, session]);
  const isPerfect = useCallback((id: string) => !!progress[id]?.perfect || !!session[id]?.perfect, [progress, session]);
  const firstOpen = challenges.find((c) => !isDone(c.id))?.id ?? null;
  const frontier = firstOpen ?? (freePlay ? null : challenges[0]?.id ?? null);
  const valid = challengeId && challenges.some((c) => c.id === challengeId) ? challengeId : null;
  // Chosen once, so finishing a challenge does not jump away from its result.
  const [current, setCurrent] = useState<string | null>(() => valid ?? frontier);
  const complete = useCallback(
    (r: StudioResult) => {
      setSession((s) => ({ ...s, [r.challengeId]: { perfect: (s[r.challengeId]?.perfect ?? false) || r.stars === 3 } }));
      onComplete(r);
    },
    [onComplete],
  );
  return {
    toolId,
    challenges,
    current,
    pick: setCurrent,
    isDone,
    isPerfect,
    isLocked: (id) => !isUnlocked(toolId, id, isDone),
    prevOf: (id) => previousChallenge(toolId, id),
    frontier: firstOpen ?? challenges[0]?.id ?? null,
    freePlay,
    complete,
  };
}

/** The toolbar: challenges in order (locked ones dimmed with a lock), plus free play. */
export function ChallengeBar({ ns, flow, compact }: { ns: string; flow: ChallengeFlow; compact?: boolean }) {
  const t = useT();
  const [hint, setHint] = useState<string | null>(null);
  const cur = flow.challenges.find((c) => c.id === flow.current) ?? null;
  // On phones the pills scroll sideways: keep the current one in view (without scrolling the page).
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const ul = listRef.current;
    const el = ul?.querySelector<HTMLElement>('[aria-current="step"]');
    if (ul && el && ul.scrollWidth > ul.clientWidth) ul.scrollLeft = Math.max(0, el.offsetLeft - ul.offsetLeft - 8);
  }, [flow.current]);
  const pill =
    "inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] motion-reduce:transition-none";
  return (
    <div className="rounded-2xl border border-[#D2DCE8] bg-white p-2.5 sm:p-3">
      <nav aria-label={t(`${UI}.challengeNav`)}>
        <ul ref={listRef} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {flow.challenges.map((c, i) => {
            const locked = flow.isLocked(c.id);
            const on = c.id === flow.current;
            const done = flow.isDone(c.id);
            const prev = flow.prevOf(c.id);
            const title = t(`${ns}.ch.${c.id}.title`);
            return (
              <li key={c.id} className="shrink-0">
                <button
                  type="button"
                  aria-current={on ? "step" : undefined}
                  aria-disabled={locked || undefined}
                  aria-label={locked ? `${title}: ${t("studio.locked")}` : undefined}
                  title={locked && prev ? t("studio.lockedHint", { prev: t(`${ns}.ch.${prev}.title`) }) : t(`studio.difficulty.${c.difficulty}`)}
                  onClick={() => {
                    if (locked) {
                      setHint(c.id);
                      return;
                    }
                    setHint(null);
                    flow.pick(c.id);
                  }}
                  className={`${pill} ${
                    locked
                      ? "cursor-not-allowed border-dashed border-[#D2DCE8] bg-[var(--s2)] text-[var(--ink3)] opacity-60"
                      : on
                        ? "border-[#1B3A6B] bg-[#1B3A6B] text-white"
                        : "border-[#D2DCE8] bg-white text-[var(--ink)] hover:border-[#F47C20]"
                  }`}
                >
                  {locked ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="tabular-nums opacity-70">{i + 1}.</span>}
                  <span className={compact ? "max-w-[9rem] truncate" : ""}>{title}</span>
                  {!locked && done && (flow.isPerfect(c.id) ? (
                    <span aria-label={t("studio.perfect")} className={on ? "text-[#F9A738]" : "text-[#F47C20]"}>★★★</span>
                  ) : (
                    <Check className={`h-3.5 w-3.5 ${on ? "text-green-300" : "text-green-600"}`} aria-label={t("studio.done")} />
                  ))}
                </button>
              </li>
            );
          })}
          {flow.freePlay && (
            <li className="shrink-0">
              <button
                type="button"
                aria-current={flow.current === null ? "step" : undefined}
                onClick={() => {
                  setHint(null);
                  flow.pick(null);
                }}
                className={`${pill} ${flow.current === null ? "border-[#1B3A6B] bg-[#1B3A6B] text-white" : "border-dashed border-[#D2DCE8] bg-white text-[var(--ink)] hover:border-[#F47C20]"}`}
              >
                <span aria-hidden="true">🎨</span> {t("studio.sandbox")}
              </button>
            </li>
          )}
        </ul>
      </nav>
      {hint && flow.prevOf(hint) && (
        <p role="status" className="mt-2 flex items-center gap-1.5 rounded-xl bg-[var(--s2)] px-3 py-2 text-xs font-semibold text-[var(--ink2)]">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t("studio.lockedHint", { prev: t(`${ns}.ch.${flow.prevOf(hint)}.title`) })}
        </p>
      )}
      <p className="mt-2 text-sm text-[var(--ink2)]">
        {cur ? (
          <>
            <span className="mr-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
              <span aria-hidden="true">{"●".repeat(cur.difficulty)}{"○".repeat(3 - cur.difficulty)}</span> {t(`studio.difficulty.${cur.difficulty}`)}
            </span>
            {t(`${ns}.ch.${cur.id}.brief`)}
          </>
        ) : (
          t(`${ns}.freePlayBody`)
        )}
      </p>
    </div>
  );
}

/** Shown instead of the workspace when a deep link points at a locked challenge. */
export function LockedNotice({ ns, flow, id }: { ns: string; flow: ChallengeFlow; id: string }) {
  const t = useT();
  const prev = flow.prevOf(id);
  const target = flow.frontier;
  return (
    <div role="status" className="rounded-2xl border-2 border-dashed border-[#D2DCE8] bg-white p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--s2)] text-[var(--ink3)]">
        <Lock className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("studio.locked")}</p>
      <p className="mt-1 text-lg font-black text-[var(--ink)]">{t(`${ns}.ch.${id}.title`)}</p>
      {prev && <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink2)]">{t("studio.lockedHint", { prev: t(`${ns}.ch.${prev}.title`) })}</p>}
      {target && target !== id && (
        <button type="button" onClick={() => flow.pick(target)} className={`${BTN_PRIMARY} mt-4`}>
          {t(`${UI}.goTo`, { title: t(`${ns}.ch.${target}.title`) })} →
        </button>
      )}
    </div>
  );
}

/** A small "new" badge for things that just appeared in a live panel. */
export function NewBadge() {
  const t = useT();
  return <span className="ml-1 inline-block rounded-full bg-[#22C55E] px-1.5 py-px align-middle text-[9px] font-black uppercase tracking-wide text-white">{t(`${UI}.new`)}</span>;
}
/** The end-of-challenge card. */
export function ResultCard({
  stars,
  title,
  body,
  onRetry,
  onNext,
  children,
}: {
  stars: number;
  title?: string;
  body?: ReactNode;
  onRetry: () => void;
  onNext?: () => void;
  children?: ReactNode;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="status"
      initial={reduce ? false : { scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-2xl border-2 border-[#F47C20] bg-[#FFF6EE] p-4 text-center"
    >
      <p className="text-3xl" aria-hidden="true">{stars >= 3 ? "🏆" : stars === 2 ? "🎉" : "✅"}</p>
      <p className="mt-1 text-lg font-black text-[var(--ink)]">{title ?? t(`${UI}.complete`)}</p>
      <div className="mt-1 flex justify-center">
        <Stars n={stars} size={26} />
      </div>
      {body && <div className="mx-auto mt-2 max-w-xl text-sm text-[var(--ink2)]">{body}</div>}
      {children}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onRetry} className={BTN_SECONDARY}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> {t(`${UI}.retry`)}
        </button>
        {onNext && (
          <button type="button" onClick={onNext} className={BTN_PRIMARY}>
            {t(`${UI}.next`)} →
          </button>
        )}
      </div>
    </motion.div>
  );
}

export const BTN_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#F47C20] px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[var(--border)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] disabled:cursor-not-allowed disabled:opacity-50";
export const CHIP =
  "inline-flex min-h-[36px] items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] motion-reduce:transition-none";

/** A small "pre-written example" disclaimer. */
export function Illustrative() {
  const t = useT();
  return <p className="text-[11px] italic text-[var(--ink3)]">{t(`${UI}.illustrative`)}</p>;
}

/** Next challenge id after `id`, or null when it is the last. */
export function nextChallenge(challenges: StudioChallengeMeta[], id: string | null): string | null {
  if (!id) return null;
  const i = challenges.findIndex((c) => c.id === id);
  return i >= 0 && i < challenges.length - 1 ? challenges[i + 1].id : null;
}

/** A labelled AI reply bubble. */
export function ReplyBubble({ label, children, tone = "neutral" }: { label: string; children: ReactNode; tone?: "neutral" | "good" | "bad" }) {
  const ring = tone === "good" ? "border-green-300 bg-green-50" : tone === "bad" ? "border-red-200 bg-red-50" : "border-[var(--border)] bg-white";
  return (
    <div className={`rounded-2xl border-2 p-3 ${ring}`}>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
        <span aria-hidden="true">🤖</span> {label}
      </p>
      <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--ink)]">{children}</div>
    </div>
  );
}
