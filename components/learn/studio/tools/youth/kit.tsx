"use client";

// Shared pieces for the AI-Empowered Youth Studio tools (Teach the Machine,
// Feed Simulator, Fake or Real?, System Mapper): challenge flow with
// in-order unlocks and best stars, the mission checklist that turns into
// stars, a quick "check your understanding" question, and the "Why it
// matters" box shown after each action.

import { useCallback, useState, type ReactNode } from "react";
import { CheckCircle2, Circle, Lightbulb, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ChallengeBar, LockedNotice, useUnlocks } from "../automation/kit";
import { Stars, type T } from "../automation/ui";

export type { T };
export const SANDBOX = "sandbox";
export const Y = "studio.youth";

export function loadLS<V>(key: string, fallback: V): V {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as V) : fallback;
  } catch {
    return fallback;
  }
}
export function saveLS(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: only the convenience is lost */
  }
}

type Progress = Record<string, { done: boolean; perfect: boolean }>;

/**
 * Which challenge is open, whether it is locked, the best stars per
 * challenge, and `claim` to report a result (points are saved by the host
 * only when the result beats the best, or the server doesn't know it yet).
 */
export function useChallengeFlow({
  tool,
  ids,
  challengeId,
  progress,
  onComplete,
}: {
  tool: string;
  ids: string[];
  challengeId: string | null;
  progress: Progress;
  onComplete: (r: { challengeId: string; stars: 1 | 2 | 3 }) => void;
}) {
  const unlocks = useUnlocks(tool, progress);
  const bestKey = `tib.studio.${tool}.best`;
  const [best, setBest] = useState<Record<string, number>>(() => loadLS(bestKey, {}));
  const bestFor = useCallback(
    (id: string) => Math.max(best[id] ?? 0, progress[id]?.perfect ? 3 : progress[id]?.done ? 1 : 0),
    [best, progress],
  );
  const [mode, setMode] = useState<string>(() => {
    if (challengeId && (ids.includes(challengeId) || challengeId === SANDBOX)) return challengeId;
    return unlocks.firstOpen() ?? ids[0];
  });
  const claim = useCallback(
    (id: string, stars: number): boolean => {
      const improved = stars > bestFor(id);
      if (stars > 0 && (improved || !unlocks.done(id))) {
        if (improved) {
          const nb = { ...best, [id]: stars };
          setBest(nb);
          saveLS(bestKey, nb);
        }
        unlocks.markDone(id);
        onComplete({ challengeId: id, stars: Math.min(3, stars) as 1 | 2 | 3 });
      }
      return improved;
    },
    [best, bestFor, bestKey, onComplete, unlocks],
  );
  const isChallenge = ids.includes(mode);
  const lockedBy = isChallenge ? unlocks.lockedBy(mode) : null;
  /** The next challenge after `id`, when it is open now (after claiming). */
  const nextOf = (id: string) => {
    const i = ids.indexOf(id);
    return i >= 0 && i + 1 < ids.length ? ids[i + 1] : null;
  };
  return { unlocks, bestFor, mode, setMode, claim, isChallenge, lockedBy, nextOf };
}

/** The challenge bar for a youth tool (the frame's toolbar). */
export function YouthBar({
  t,
  ns,
  ids,
  icons,
  flow,
  onPick,
}: {
  t: T;
  ns: string;
  ids: string[];
  icons: Record<string, string>;
  flow: ReturnType<typeof useChallengeFlow>;
  onPick: (id: string) => void;
}) {
  const titleOf = (id: string) => t(`${ns}.ch.${id}.title`);
  return (
    <ChallengeBar
      t={t}
      label={t("studio.challenges")}
      items={ids.map((id, i) => ({ id, title: titleOf(id), icon: icons[id], difficulty: (Math.min(3, i + 1) as 1 | 2 | 3), stars: flow.bestFor(id) }))}
      current={flow.mode}
      onPick={onPick}
      lockedBy={flow.unlocks.lockedBy}
      titleOf={titleOf}
      levelLabel={(n) => t(`${Y}.level`, { n })}
      free={{ id: SANDBOX, label: t("studio.sandbox") }}
    />
  );
}

/** Shown instead of the workspace when a link opens a locked challenge. */
export function YouthLocked({ t, ns, flow, onGo }: { t: T; ns: string; flow: ReturnType<typeof useChallengeFlow>; onGo: (id: string) => void }) {
  const open = flow.unlocks.firstOpen() ?? flow.mode;
  return (
    <LockedNotice
      t={t}
      title={t(`${ns}.ch.${flow.mode}.title`)}
      prevTitle={t(`${ns}.ch.${flow.lockedBy ?? ""}.title`)}
      goLabel={t(`${Y}.goTo`, { name: t(`${ns}.ch.${open}.title`) })}
      onGo={() => onGo(open)}
    />
  );
}

export interface Mission {
  id: string;
  label: string;
  done: boolean;
}

/** Stars earned: missions count in order, so star 2 needs mission 1 too. */
export function missionStars(missions: Mission[]): number {
  let n = 0;
  for (const m of missions) {
    if (!m.done) break;
    n++;
  }
  return n;
}

/**
 * The mission checklist and the "Collect stars" button. After collecting,
 * shows the stars, a cheer and the challenge's big idea.
 */
export function MissionBoard({
  t,
  missions,
  onClaim,
  claimed,
  insight,
  nextLabel,
  onNext,
}: {
  t: T;
  missions: Mission[];
  onClaim: () => void;
  claimed: { stars: number; improved: boolean } | null;
  insight: string;
  nextLabel?: string | null;
  onNext?: () => void;
}) {
  const reduce = !!useReducedMotion();
  const stars = missionStars(missions);
  return (
    <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3" aria-label={t(`${Y}.missions`)} data-testid="youth-missions">
      <h3 className="flex items-center justify-between gap-2 text-sm font-black text-[var(--ink)]">
        <span>🎯 {t(`${Y}.missions`)}</span>
        <Stars n={stars} size={16} label={t(`${Y}.starsNow`, { n: stars })} />
      </h3>
      <ol className="mt-2 space-y-1.5">
        {missions.map((m, i) => (
          <li key={m.id} className="flex items-start gap-2 text-sm" data-mission={m.id} data-done={m.done ? "true" : "false"}>
            {m.done ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#0F7B45]" aria-hidden="true" />
            ) : (
              <Circle size={18} className="mt-0.5 shrink-0 text-[#9AAABC]" aria-hidden="true" />
            )}
            <span className={m.done ? "text-[var(--ink)]" : "text-[var(--ink2)]"}>
              <span className="sr-only">{m.done ? t(`${Y}.missionDone`) : t(`${Y}.missionTodo`)}: </span>
              <strong className="text-[var(--ink3)]">★{i + 1}</strong> {m.label}
            </span>
          </li>
        ))}
      </ol>
      {claimed ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl bg-[#FFF8E1] p-3"
          role="status"
          aria-live="polite"
          data-testid="youth-claimed"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Stars n={claimed.stars} size={22} label={t(`${Y}.starsN`, { n: claimed.stars })} />
            <span className="text-sm font-bold text-[#8A6100]">{t(`${Y}.cheer.${claimed.stars}`)}</span>
            {claimed.improved && <span className="text-xs font-semibold text-[#C45A0A]">{t(`${Y}.newBest`)}</span>}
          </div>
          <p className="mt-2 text-sm text-[var(--ink)]">🎉 {insight}</p>
          {claimed.stars < 3 && <p className="mt-1 text-xs text-[var(--ink3)]">{t(`${Y}.moreStars`)}</p>}
          {nextLabel && onNext && (
            <button
              type="button"
              onClick={onNext}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0D1B2A] px-4 py-2 text-sm font-bold text-white hover:bg-[#1B3A6B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
              data-testid="youth-next"
            >
              {nextLabel} →
            </button>
          )}
        </motion.div>
      ) : null}
      <button
        type="button"
        onClick={onClaim}
        disabled={stars === 0}
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#F47C20] px-4 py-2 text-sm font-black text-white shadow hover:bg-[#E05F00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="youth-claim"
      >
        <Sparkles size={16} aria-hidden="true" /> {stars === 0 ? t(`${Y}.claimNone`) : t(`${Y}.claim`, { n: stars })}
      </button>
    </section>
  );
}

export interface QuizOption {
  id: string;
  label: string;
}

/**
 * A one-question check. A wrong pick explains why and lets the learner try
 * again; the right pick shows the explanation. `answer` is the id picked
 * last (kept by the tool so it can count as a mission).
 */
export function Quiz({
  t,
  question,
  options,
  correct,
  answer,
  onAnswer,
  explain,
  wrongHint,
  testId,
}: {
  t: T;
  question: string;
  options: QuizOption[];
  correct: string;
  answer: string | null;
  onAnswer: (id: string) => void;
  explain: string;
  wrongHint: string;
  testId?: string;
}) {
  const right = answer === correct;
  return (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white p-3" aria-label={t(`${Y}.quiz`)} data-testid={testId}>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">🤔 {t(`${Y}.quiz`)}</p>
      <p className="mt-1 text-sm font-bold text-[var(--ink)]">{question}</p>
      <div className="mt-2 grid gap-1.5" role="group" aria-label={question}>
        {options.map((o) => {
          const picked = answer === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={picked}
              data-option={o.id}
              onClick={() => onAnswer(o.id)}
              className={`min-h-[44px] rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
                picked
                  ? o.id === correct
                    ? "border-[#0F7B45] bg-[#E8F7EF] text-[#0B5A33]"
                    : "border-[#D9480F] bg-[#FFF1EA] text-[#8A2E07]"
                  : "border-[#D2DCE8] bg-white text-[var(--ink)] hover:border-[#F47C20]"
              }`}
            >
              {picked && <span aria-hidden="true">{o.id === correct ? "✅ " : "❌ "}</span>}
              {o.label}
            </button>
          );
        })}
      </div>
      {answer && (
        <p role="status" aria-live="polite" className={`mt-2 rounded-lg px-3 py-2 text-sm ${right ? "bg-[#E8F7EF] text-[#0B5A33]" : "bg-[#FFF1EA] text-[#8A2E07]"}`}>
          <strong>{right ? t(`${Y}.quizRight`) : t(`${Y}.quizWrong`)}</strong> {right ? explain : wrongHint}
        </p>
      )}
    </section>
  );
}

/** "Why it matters": a short explanation of what just happened. */
export function WhyBox({ t, children, title, testId }: { t: T; children: ReactNode; title?: string; testId?: string }) {
  return (
    <div className="rounded-xl border border-[#F9D3B0] bg-[#FFF8F1] p-3 text-sm leading-relaxed text-[#5C2E07]" role="status" aria-live="polite" data-testid={testId}>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#B8500A]">
        <Lightbulb size={14} aria-hidden="true" /> {title ?? t(`${Y}.why`)}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** A labelled bar (confidence, accuracy, interest). Text always shows the value. */
export function Meter({
  label,
  value,
  max = 1,
  color = "#2251A3",
  text,
  testId,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  text?: string;
  testId?: string;
}) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div data-testid={testId}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-[var(--ink)]">{label}</span>
        <span className="tabular-nums font-bold text-[var(--ink2)]">{text ?? `${Math.round(pct * 100)}%`}</span>
      </div>
      <div
        className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#E8EFF8]"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value * 100) / 100}
        aria-valuetext={text ?? `${Math.round(pct * 100)}%`}
      >
        <div className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

/** Numbered keys "<prefix>1", "<prefix>2"... that exist in the dictionary. */
export function keys(t: T, prefix: string, max = 8): string[] {
  const out: string[] = [];
  for (let i = 1; i <= max; i++) {
    const k = `${prefix}${i}`;
    const v = t(k);
    if (v === k) break;
    out.push(v);
  }
  return out;
}

/** A small seeded random generator (mulberry32), for repeatable shuffles and doodles. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<V>(arr: readonly V[], rand: () => number = Math.random): V[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
