"use client";

// Task Sorter live panel: "your week" builds up as each card is placed.
// Hours are the deck's illustrative example hours (see decks.ts), not a
// measurement. The risk meter rises when a sensitive task (one that needs a
// person, or at least a person checking) is put in Automate.

import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { BUCKETS, SAVE_FACTOR, type Bucket, type SortCard } from "./decks";
import { tx } from "./l3";

const EDGE: Record<Bucket, string> = { automate: "#2251A3", augment: "#F47C20", human: "#1F8A55" };
const ICON: Record<Bucket, string> = { automate: "⚙️", augment: "🤝", human: "💛" };

/** Risk points when a card goes to Automate, by how much it needs a person. */
export function autoRisk(c: SortCard): number {
  if (c.bucket === "automate") return 0;
  if (c.bucket === "human") return c.alt === "automate" ? 20 : 40;
  return c.alt === "automate" ? 8 : 20;
}

export default function LiveWeek({
  cards,
  answers,
  active,
  locale,
  k,
  reduce,
}: {
  cards: SortCard[];
  answers: Record<string, Bucket>;
  /** False before a deck starts. */
  active: boolean;
  locale: Locale;
  k: (s: string, v?: Record<string, string | number>) => string;
  reduce: boolean;
}) {
  const hrs = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 });
  const placed = cards.filter((c) => answers[c.id]);
  const total = cards.reduce((s, c) => s + c.hrs, 0) || 1;
  const byBucket = BUCKETS.map((b) => placed.filter((c) => answers[c.id] === b).reduce((s, c) => s + c.hrs, 0));
  const sortedHrs = byBucket.reduce((a, b) => a + b, 0);
  const freed = placed.reduce((s, c) => s + c.hrs * SAVE_FACTOR[answers[c.id]], 0);
  const risky = placed.filter((c) => answers[c.id] === "automate" && autoRisk(c) > 0);
  const risk = Math.min(100, risky.reduce((s, c) => s + autoRisk(c), 0));
  const level = risk >= 60 ? "high" : risk >= 25 ? "med" : "low";
  const levelColor = level === "high" ? "#E11D48" : level === "med" ? "#F47C20" : "#1F8A55";
  const dur = reduce ? 0 : 0.45;
  // Localised Mon..Fri (1 Jan 2024 was a Monday).
  const days = Array.from({ length: 5 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  // A day of these tasks, and how much of it is freed.
  const perDay = total / 5;
  const freedDay = freed / 5;

  if (!active) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-sm text-[var(--ink3)]" data-live="week-empty">
        <span className="text-4xl" aria-hidden="true">📅</span>
        <p className="max-w-xs">{k("live.empty")}</p>
        <div className="flex gap-2" aria-hidden="true">
          {BUCKETS.map((b) => (
            <span key={b} className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: EDGE[b] }}>
              {ICON[b]} {k(`bucket.${b}`)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const columns: Array<[Bucket, string]> = [
    ["automate", k("live.ai")],
    ["augment", k("live.both")],
    ["human", k("live.you")],
  ];

  return (
    <div className="space-y-4 text-sm" data-live="week">
      {/* Headline: time freed */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("live.freed")}</p>
          <motion.p key={Math.round(freed * 10)} initial={reduce ? false : { scale: 1.25, color: "#15803D" }} animate={{ scale: 1, color: "#0D1B2A" }} transition={{ duration: dur }} className="origin-left text-3xl font-black" data-live-freed>
            {k("live.freedVal", { n: hrs(freed) })}
          </motion.p>
        </div>
        <p className="text-xs text-[var(--ink3)]">{k("live.ofTotal", { done: hrs(sortedHrs), total: hrs(total) })}</p>
      </div>

      {/* Hours bar */}
      <div>
        <div className="flex h-5 overflow-hidden rounded-full bg-[var(--s2)]" aria-hidden="true">
          {BUCKETS.map((b, i) => (
            <motion.div key={b} initial={false} animate={{ width: `${(byBucket[i] / total) * 100}%` }} transition={{ duration: dur }} style={{ background: EDGE[b] }} />
          ))}
        </div>
        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--ink2)]">
          {BUCKETS.map((b, i) => (
            <li key={b}>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: EDGE[b] }} />
              {k(`bucket.${b}`)}: {hrs(byBucket[i])} h
            </li>
          ))}
        </ul>
      </div>

      {/* Week timeline: freed time per day */}
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("live.days")}</p>
        <div className="grid grid-cols-5 gap-2" aria-label={k("live.perDay", { n: hrs(freedDay) })} role="img">
          {days.map((d) => (
            <div key={d} className="text-center">
              <div className="relative mx-auto flex h-24 w-full max-w-[56px] flex-col justify-end overflow-hidden rounded-lg border border-[#D2DCE8] bg-[var(--s2)]">
                <motion.div
                  initial={false}
                  animate={{ height: `${Math.min(100, (freedDay / perDay) * 100)}%` }}
                  transition={{ duration: dur }}
                  className="w-full bg-[repeating-linear-gradient(135deg,#22C55E_0_6px,#16A34A_6px_12px)]"
                />
              </div>
              <span className="mt-1 block text-[11px] font-semibold capitalize text-[var(--ink3)]">{d}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-center text-xs font-semibold text-[#15803D]">{k("live.perDay", { n: hrs(freedDay) })}</p>
      </div>

      {/* Who does what */}
      <div className="grid grid-cols-3 gap-2">
        {columns.map(([b, title]) => {
          const list = placed.filter((c) => answers[c.id] === b);
          return (
            <div key={b} className="min-w-0 rounded-xl border-2 p-2" style={{ borderColor: `${EDGE[b]}55` }} data-live-col={b}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: EDGE[b] }}>
                <span aria-hidden="true">{ICON[b]}</span> {title} <span className="text-[var(--ink3)]">({list.length})</span>
              </p>
              <ul className="space-y-1">
                <AnimatePresence initial={false}>
                  {list.map((c) => (
                    <motion.li
                      key={c.id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, y: -8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: reduce ? 0 : 0.25 }}
                      className="rounded-md bg-[var(--s2)] px-1.5 py-1 text-[11px] leading-snug text-[var(--ink)]"
                    >
                      {tx(c.task, locale)}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          );
        })}
      </div>

      {/* Risk meter */}
      <div className="rounded-xl border-2 p-3" style={{ borderColor: `${levelColor}66` }} data-live-risk={risk}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("live.risk")}</p>
          <span className="rounded-full px-2 py-0.5 text-xs font-black text-white" style={{ background: levelColor }}>
            {k(`live.risk.${level}`)}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[linear-gradient(90deg,#DCFCE7,#FEF3C7,#FFE4E6)]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={risk} aria-label={k("live.risk")}>
          <motion.div initial={false} animate={{ width: `${risk}%` }} transition={{ duration: dur }} className="h-full rounded-full" style={{ background: levelColor }} />
        </div>
        <p className="mt-1.5 text-xs text-[var(--ink3)]">{k("live.riskHint")}</p>
        <ul className="mt-2 space-y-1.5" aria-live="polite">
          <AnimatePresence initial={false}>
            {risky
              .slice(-3)
              .reverse()
              .map((c) => (
                <motion.li
                  key={c.id}
                  initial={reduce ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-900"
                >
                  <span aria-hidden="true">⚠️ </span>
                  {k("live.riskWarn", { task: tx(c.task, locale), risk: tx(c.risk, locale) })}
                </motion.li>
              ))}
          </AnimatePresence>
        </ul>
      </div>

      <p className="text-[11px] italic text-[var(--ink3)]">{k("live.note")}</p>
    </div>
  );
}
