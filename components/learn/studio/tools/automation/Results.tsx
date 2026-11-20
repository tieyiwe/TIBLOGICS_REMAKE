"use client";

import { AlertTriangle, CheckCircle2, Circle, Lightbulb, ShieldCheck, XCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { minutesSaved, OUTCOME_EMOJI, OUTCOMES, type Risk, type Run, type SampleEvent } from "./engine";
import { P, Stars, type T } from "./ui";

export function RiskList({ t, risks }: { t: T; risks: Risk[] }) {
  return (
    <div>
      <h4 className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
        <AlertTriangle size={15} className="text-[#C45A0A]" aria-hidden="true" /> {t(`${P}.risks`)}
      </h4>
      {risks.length === 0 ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#0F7B45]">
          <ShieldCheck size={15} aria-hidden="true" /> {t(`${P}.noRisks`)}
        </p>
      ) : (
        <ul className="mt-1.5 space-y-1.5">
          {risks.map((r, i) => (
            <li key={i} className="rounded-lg bg-[#FFF6EC] px-2.5 py-1.5 text-xs leading-relaxed text-[#7A3A06]">
              {t(`${P}.risk.${r.key}`, {
                n: "n" in r ? r.n : 0,
                expected: "expected" in r ? t(`${P}.trigger.${r.expected}`) : "",
                field: "field" in r ? t(`${P}.field.${r.field}`) : "",
              })}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CheckList({ t, challengeId, checks }: { t: T; challengeId: string; checks: boolean[] | null }) {
  return (
    <ol className="space-y-1.5">
      {[0, 1, 2].map((i) => {
        const ok = checks?.[i];
        const Icon = checks === null ? Circle : ok ? CheckCircle2 : XCircle;
        return (
          <li key={i} className="flex items-start gap-2 text-sm leading-snug text-[var(--ink2)]">
            <Icon
              size={16}
              className={`mt-0.5 shrink-0 ${checks === null ? "text-[#B8C4D3]" : ok ? "text-[#0F7B45]" : "text-[#E34948]"}`}
              aria-label={checks === null ? t(`${P}.check.pending`) : ok ? t(`${P}.check.pass`) : t(`${P}.check.fail`)}
            />
            <span>
              <Stars n={i + 1} size={11} label={t(`${P}.starsN`, { n: i + 1 })} /> <span className="ml-1">{t(`${P}.ch.${challengeId}.t${i + 1}`)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Results({
  t,
  locale,
  run,
  events,
  manualMin,
  monthly,
  stars,
  improved,
  tipKey,
}: {
  t: T;
  locale: string;
  run: Run;
  events: SampleEvent[];
  manualMin: number;
  monthly: number;
  stars: number | null;
  improved: boolean;
  tipKey: string;
}) {
  const reduce = useReducedMotion();
  const saved = minutesSaved(run, manualMin);
  const perEvent = run.traces.length ? saved / run.traces.length : 0;
  const hoursMonth = Math.round((perEvent * monthly) / 60);
  const humans = run.traces.filter((tr) => tr.humans > 0);
  const silent = run.traces.filter((tr) => tr.outcome === "silent");
  const title = (id: string) => t(`${P}.ev.${id}`);
  const emoji = (id: string) => events.find((e) => e.id === id)?.emoji ?? "";
  const nf = new Intl.NumberFormat(locale);

  return (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white p-4 shadow-sm" aria-live="polite" aria-label={t(`${P}.results`)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-black text-[var(--ink)]">{t(`${P}.results`)}</h3>
        {stars !== null && (
          <motion.div
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            className="flex items-center gap-2 rounded-full bg-[#FFF8E1] px-3 py-1"
          >
            <Stars n={stars} size={20} label={t(`${P}.starsN`, { n: stars })} />
            <span className="text-xs font-bold text-[#8A6100]">{t(`${P}.cheer.${stars}`)}</span>
          </motion.div>
        )}
      </div>
      {improved && <p className="mt-1 text-xs font-semibold text-[#C45A0A]">{t(`${P}.newBest`)}</p>}

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OUTCOMES.filter((o) => o !== "notrun" || run.counts.notrun > 0).map((o) => (
          <li key={o} className={`rounded-xl px-2.5 py-2 ${run.counts[o] > 0 && (o === "silent" || o === "stuck" || o === "notrun") ? "bg-red-50" : "bg-[var(--s2)]"}`}>
            <span className="block text-lg font-black text-[var(--ink)]">
              <span aria-hidden="true">{OUTCOME_EMOJI[o]}</span> {run.counts[o]}
            </span>
            <span className="block text-[11px] font-semibold leading-tight text-[var(--ink2)]">{t(`${P}.out.${o}`)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#EEF7F2] p-3">
          <p className="text-sm font-bold text-[#0F7B45]">
            ⏱️ {saved >= 0 ? t(`${P}.saved`, { n: nf.format(saved) }) : t(`${P}.lost`, { n: nf.format(-saved) })}
          </p>
          {saved > 0 && <p className="mt-0.5 text-xs text-[var(--ink2)]">{t(`${P}.perMonth`, { h: nf.format(hoursMonth), n: nf.format(monthly) })}</p>}
        </div>
        <div className="rounded-xl bg-[var(--s2)] p-3 text-xs leading-relaxed text-[var(--ink2)]">
          <p>
            <strong className="text-[var(--ink)]">🙋 {t(`${P}.reachedHuman`)}</strong>{" "}
            {humans.length ? humans.map((h) => `${emoji(h.eventId)} ${title(h.eventId)}`).join(" · ") : t(`${P}.none`)}
          </p>
          <p className="mt-1">
            <strong className="text-[var(--ink)]">💥 {t(`${P}.failedSilently`)}</strong>{" "}
            {silent.length ? silent.map((h) => `${emoji(h.eventId)} ${title(h.eventId)}`).join(" · ") : t(`${P}.none`)}
          </p>
        </div>
      </div>

      <details className="mt-3 rounded-xl border border-[#D2DCE8] px-3 py-2">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">{t(`${P}.perEvent`)}</summary>
        <ul className="mt-2 space-y-1">
          {run.traces.map((tr) => (
            <li key={tr.eventId} className="flex items-start gap-2 text-xs text-[var(--ink2)]">
              <span aria-hidden="true">{emoji(tr.eventId)}</span>
              <span className="flex-1">{title(tr.eventId)}</span>
              <span className="shrink-0 font-semibold text-[var(--ink)]">
                {OUTCOME_EMOJI[tr.outcome]} {t(`${P}.out.${tr.outcome}`)}
                {tr.retried ? ` · ${t(`${P}.retried`)}` : ""}
                {tr.wrongAi ? ` · ${t(`${P}.wrongAi`)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-3 flex gap-2 rounded-xl bg-[#EBF0FA] p-3">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-[#2251A3]" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-[var(--ink)]">
          <strong>{t(`${P}.whyMatters`)}</strong> {t(tipKey)}
        </p>
      </div>
    </section>
  );
}
