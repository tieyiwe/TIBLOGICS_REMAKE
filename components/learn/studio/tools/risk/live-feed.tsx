"use client";

// Spot the Risk live panel: an "incident feed" showing what each call would
// lead to in the real world, a dashboard (accuracy, lives, streak, score) and
// a heat strip of the risk types the player tends to miss.

import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { useStudioLayout } from "../../StudioFrame";
import { tx } from "../sorter/l3";
import { KIND_ICON, RISK_ICON, RISK_TYPES, type RiskCard, type RiskType } from "./decks";

export interface FeedAnswer {
  choice: "safe" | "risky" | "timeout";
  type?: RiskType;
  correct: boolean;
  typeOk: boolean;
}

type Outcome = "caught" | "missed" | "ok" | "falseAlarm" | "stalled";

function outcomeOf(c: RiskCard, a: FeedAnswer): Outcome {
  if (c.safe) return a.choice === "safe" ? "ok" : a.choice === "timeout" ? "stalled" : "falseAlarm";
  return a.correct ? "caught" : "missed";
}

const STYLE: Record<Outcome, { icon: string; box: string; tag: string }> = {
  caught: { icon: "🛡️", box: "border-emerald-200 bg-emerald-50", tag: "bg-emerald-600" },
  ok: { icon: "✅", box: "border-emerald-100 bg-white", tag: "bg-emerald-600" },
  missed: { icon: "💥", box: "border-rose-300 bg-rose-50", tag: "bg-rose-600" },
  falseAlarm: { icon: "⚠️", box: "border-amber-300 bg-amber-50", tag: "bg-amber-500" },
  stalled: { icon: "⏳", box: "border-amber-300 bg-amber-50", tag: "bg-amber-500" },
};

const snippet = (s: string, n = 110) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export default function LiveFeed({
  cards,
  answers,
  reached,
  lives,
  maxLives,
  streak,
  mult,
  score,
  active,
  locale,
  k,
  reduce,
}: {
  cards: RiskCard[];
  answers: Record<string, FeedAnswer>;
  /** How many cards have been shown so far (answered ones come first). */
  reached: number;
  lives: number;
  maxLives: number;
  streak: number;
  mult: number;
  score: number;
  active: boolean;
  locale: Locale;
  k: (s: string, v?: Record<string, string | number>) => string;
  reduce: boolean;
}) {
  // The side-by-side page view gives the live column less room than the overlay.
  const narrow = useStudioLayout() === "page";
  if (!active) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center text-sm text-[var(--ink3)]" data-live="feed-empty">
        <span className="text-4xl" aria-hidden="true">📡</span>
        <p className="max-w-xs">{k("live.empty")}</p>
      </div>
    );
  }

  const done = cards.slice(0, reached).filter((c) => answers[c.id]);
  const right = done.filter((c) => answers[c.id].correct).length;
  const acc = done.length ? Math.round((right / done.length) * 100) : 0;
  const falseAlarms = done.filter((c) => outcomeOf(c, answers[c.id]) === "falseAlarm").length;
  const heat = RISK_TYPES.map((r) => {
    const seen = done.filter((c) => !c.safe && c.types.includes(r));
    const missed = seen.filter((c) => !answers[c.id].correct).length;
    return { r, seen: seen.length, missed };
  });

  const line = (c: RiskCard, o: Outcome) => {
    const main = c.types[0];
    const went = k(`live.went.${c.kind}`);
    const held = k(`live.held.${c.kind}`);
    switch (o) {
      case "caught":
        return k("live.caught", { held, type: k(`type.${main}`) });
      case "missed":
        return `${answers[c.id].choice === "timeout" ? `${k("live.noDecision")} ` : ""}${k("live.missed", { went, harm: k(`live.harm.${main}`) })}`;
      case "ok":
        return k("live.ok", { went });
      case "falseAlarm":
        return k("live.falseAlarm", { held });
      case "stalled":
        return k("live.stalled");
    }
  };

  const stats: Array<[string, React.ReactNode, string]> = [
    [k("accuracy"), `${acc}%`, "acc"],
    [
      k("live.lives"),
      <span key="h" aria-label={k("livesLabel", { n: lives })}>
        {Array.from({ length: maxLives }, (_, i) => (
          <span key={i} aria-hidden="true" className={`text-sm ${i < lives ? "" : "opacity-25 grayscale"}`}>
            ❤️
          </span>
        ))}
      </span>,
      "lives",
    ],
    [k("live.streak"), `${streak}${mult > 1 ? ` · x${mult}` : ""}`, "streak"],
    [k("score"), String(score), "score"],
  ];

  return (
    <div className="space-y-4 text-sm" data-live="feed">
      {/* Dashboard */}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map(([label, value, id]) => (
          <div key={id} className="rounded-xl bg-[var(--s2)] px-1 py-1.5 text-center" data-live-stat={id}>
            <dt className="text-[11px] text-[var(--ink3)]">{label}</dt>
            <dd className="whitespace-nowrap text-base font-black text-[var(--ink)]">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Heat strip */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("live.heat")}</p>
          {falseAlarms > 0 && <p className="text-[11px] text-amber-700">{k("live.falseAlarms", { n: falseAlarms })}</p>}
        </div>
        <ul className={`grid grid-cols-3 gap-1.5 sm:grid-cols-6 ${narrow ? "lg:grid-cols-3" : ""}`} data-live-heat>
          {heat.map(({ r, seen, missed }) => {
            const rate = seen ? missed / seen : -1;
            const bg = rate < 0 ? "#EEF2F7" : rate === 0 ? "#BBF7D0" : rate < 0.34 ? "#FDE68A" : rate < 0.67 ? "#FDBA74" : "#FCA5A5";
            return (
              <li
                key={r}
                className="rounded-lg px-1 py-1.5 text-center transition-colors motion-reduce:transition-none"
                style={{ background: bg }}
                title={k("live.heatCell", { missed, seen })}
                data-heat={r}
                data-missed={missed}
              >
                <span className="block text-base" aria-hidden="true">{RISK_ICON[r]}</span>
                <span className="block text-[10px] font-semibold leading-tight text-[var(--ink)]">{k(`type.${r}`)}</span>
                <span className="block text-[10px] text-[var(--ink2)]">{seen ? k("live.heatCell", { missed, seen }) : "·"}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-1 text-[11px] text-[var(--ink3)]">{k("live.heatHint")}</p>
      </div>

      {/* Incident feed */}
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("live.feed")}</p>
        {done.length === 0 ? (
          <p className="rounded-xl bg-[var(--s2)] p-3 text-xs text-[var(--ink3)]">{k("live.waiting")}</p>
        ) : (
          <ul className="space-y-2" aria-live="polite" data-live-feed>
            <AnimatePresence initial={false}>
              {[...done].reverse().map((c) => {
                const o = outcomeOf(c, answers[c.id]);
                const st = STYLE[o];
                return (
                  <motion.li
                    key={c.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: -12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: reduce ? 0 : 0.25 }}
                    className={`rounded-xl border-2 p-2.5 ${st.box}`}
                    data-outcome={o}
                  >
                    <p className="flex items-start gap-2 font-semibold leading-snug text-[var(--ink)]">
                      <span aria-hidden="true" className="text-base leading-none">{st.icon}</span>
                      <span className="min-w-0 flex-1">{line(c, o)}</span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-black uppercase text-white ${st.tag}`}>{k(`live.tag.${o}`)}</span>
                    </p>
                    <p className="mt-1 pl-6 text-xs text-[var(--ink2)]">
                      <span aria-hidden="true">{KIND_ICON[c.kind]} </span>
                      {snippet(tx(c.text, locale))}
                      {answers[c.id].typeOk && <span className="ml-1 font-semibold text-emerald-700">🎯 {k("live.named")}</span>}
                    </p>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
