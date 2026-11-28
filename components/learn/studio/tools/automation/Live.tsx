"use client";

// Automation Builder live panel: the sample events stream through the current
// flow on a loop, with a live outcome tally and warnings that appear and
// disappear as the flow changes. The flow it gets is already debounced.

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { findNode, type FlowNode } from "./model";
import { findRisks, OUTCOME_EMOJI, runAll, type Outcome, type Risk } from "./engine";
import type { AutomationChallenge } from "./challenges";
import { fieldValueText, KIND_STYLE, nodeSummary, P, type T } from "./ui";
import { LiveHeading } from "./kit";

const TICK = 420;
const HOLD = 4; // ticks an event rests on its outcome before the next one starts
const TALLY: Outcome[] = ["done", "escalated", "dropped", "alerted", "silent", "stuck"];
const BAD: Outcome[] = ["silent", "stuck", "notrun"];

type Warning = { id: string; text: string };

function riskText(t: T, r: Risk): string {
  return t(`${P}.risk.${r.key}`, {
    n: "n" in r ? r.n : 0,
    expected: "expected" in r ? t(`${P}.trigger.${r.expected}`) : "",
    field: "field" in r ? t(`${P}.field.${r.field}`) : "",
  });
}

export default function AutomationLive({ t, flow, ch, reduceMotion }: { t: T; flow: FlowNode | null; ch: AutomationChallenge; reduceMotion: boolean }) {
  // A normal day (each AI step's own failure rate applies, like Play) and a
  // bad day (the AI and one API fail) for the silent-failure warning.
  const run = useMemo(() => runAll(flow, ch.events, ch.fields, { trigger: ch.trigger, injectAi: false, injectApi: false, useRates: true }), [flow, ch]);
  const stress = useMemo(() => runAll(flow, ch.events, ch.fields, { trigger: ch.trigger, injectAi: true, injectApi: true, useRates: false }), [flow, ch]);

  const warnings: Warning[] = useMemo(() => {
    const w: Warning[] = findRisks(flow, ch.trigger, ch.fields).map((r) => ({ id: `${r.key}${"field" in r ? r.field : ""}`, text: riskText(t, r) }));
    const badDay = stress.counts.silent + stress.counts.stuck;
    const normal = run.counts.silent + run.counts.stuck;
    if (flow && badDay > normal) w.push({ id: "stress", text: t(`${P}.live.warnStress`, { n: badDay }) });
    return w;
  }, [flow, ch, stress, run, t]);

  // ── The looping stream ────────────────────────────────────────────────────
  const [pos, setPos] = useState({ ev: 0, step: 0, hold: 0 });
  const n = ch.events.length;

  // Restart the pass whenever the flow (or the challenge) changes.
  useEffect(() => {
    setPos({ ev: 0, step: 0, hold: 0 });
  }, [run]);

  useEffect(() => {
    if (reduceMotion || !flow || n === 0) return;
    const id = window.setInterval(() => {
      setPos((p) => {
        const len = run.traces[p.ev]?.path.length ?? 0;
        if (p.step < len) return { ...p, step: p.step + 1 };
        if (p.hold < HOLD) return { ...p, hold: p.hold + 1 };
        return { ev: (p.ev + 1) % n, step: 0, hold: 0 };
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [reduceMotion, flow, n, run]);

  const cur = Math.min(pos.ev, n - 1);
  const trace = run.traces[cur];
  const ev = ch.events[cur];
  const arrived = reduceMotion || (trace ? pos.step >= trace.path.length : false);
  const shown = trace ? (reduceMotion ? trace.path : trace.path.slice(0, pos.step)) : [];

  return (
    <div className="space-y-4 text-sm">
      {/* Tally */}
      <div>
        <LiveHeading aside={<span className="text-[11px] text-[var(--ink3)]">{t(`${P}.live.batch`, { n })}</span>}>{t(`${P}.live.tally`)}</LiveHeading>
        <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {[...TALLY, ...(run.counts.notrun > 0 ? (["notrun"] as Outcome[]) : [])].map((o) => {
            const v = run.counts[o];
            const bad = BAD.includes(o) && v > 0;
            return (
              <li key={o} data-outcome={o} className={`rounded-xl px-2.5 py-2 transition-colors ${bad ? "bg-red-50 ring-1 ring-red-200" : "bg-[var(--s2)]"}`}>
                <span className="flex items-baseline gap-1.5">
                  <span aria-hidden="true">{OUTCOME_EMOJI[o]}</span>
                  <motion.span
                    key={v}
                    initial={reduceMotion ? false : { scale: 1.4, color: "#F47C20" }}
                    animate={{ scale: 1, color: bad ? "#B91C1C" : "#0D1B2A" }}
                    className="text-lg font-black tabular-nums"
                  >
                    {v}
                  </motion.span>
                </span>
                <span className="block text-[11px] font-semibold leading-tight text-[var(--ink2)]">{t(`${P}.out.${o}`)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Stream */}
      <div>
        <LiveHeading>{t(`${P}.live.stream`)}</LiveHeading>
        {!flow ? (
          <p className="mt-2 rounded-xl bg-[var(--s2)] p-3 text-xs text-[var(--ink3)]">{t(`${P}.live.noFlow`)}</p>
        ) : (
          <>
            {!reduceMotion && trace && ev && (
              <div className="mt-2 rounded-xl border border-[#D2DCE8] p-3" aria-hidden="true">
                <p className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                  <span className="text-lg">{ev.emoji}</span>
                  <span className="min-w-0 flex-1 truncate">{t(`${P}.ev.${ev.id}`)}</span>
                  <span className="shrink-0 text-[11px] font-semibold text-[var(--ink3)]">
                    {cur + 1}/{n}
                  </span>
                </p>
                <ol className="mt-2 flex flex-wrap items-center gap-1">
                  {shown.map((id, i) => {
                    const node = findNode(flow, id);
                    if (!node) return null;
                    const s = KIND_STYLE[node.kind];
                    const Icon = s.icon;
                    const last = i === shown.length - 1 && !arrived;
                    return (
                      <li key={`${id}-${i}`} className="flex items-center gap-1">
                        {i > 0 && <span className="text-[var(--ink3)]">→</span>}
                        <span
                          className={`ab-token inline-flex max-w-[150px] items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold ${last ? "ring-2 ring-[#F47C20]" : ""}`}
                          style={{ background: s.bg, color: s.color }}
                          title={nodeSummary(t, node, ch.fields)}
                        >
                          <Icon size={12} aria-hidden="true" />
                          <span className="truncate">{t(`${P}.kind.${node.kind}`)}</span>
                        </span>
                      </li>
                    );
                  })}
                  {arrived && (
                    <li className="flex items-center gap-1">
                      <span className="text-[var(--ink3)]">→</span>
                      <span className={`ab-token rounded-lg px-2 py-1 text-[11px] font-bold ${BAD.includes(trace.outcome) ? "bg-red-100 text-red-700" : "bg-[#E8F7EF] text-[#0F7B45]"}`}>
                        {OUTCOME_EMOJI[trace.outcome]} {t(`${P}.out.${trace.outcome}`)}
                      </span>
                    </li>
                  )}
                </ol>
              </div>
            )}
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t(`${P}.live.stream`)}>
              {run.traces.map((tr, i) => {
                const done = reduceMotion || i < cur || (i === cur && arrived);
                const now = !reduceMotion && i === cur;
                return (
                  <li
                    key={tr.eventId}
                    title={`${t(`${P}.ev.${tr.eventId}`)}: ${t(`${P}.out.${tr.outcome}`)}`}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                      now ? "bg-[#FEF0E3] ring-2 ring-[#F47C20]" : done ? (BAD.includes(tr.outcome) ? "bg-red-50" : "bg-[#EEF7F2]") : "bg-[var(--s2)] opacity-60"
                    }`}
                  >
                    <span aria-hidden="true">{ch.events[i]?.emoji}</span>
                    <span className="sr-only">{t(`${P}.ev.${tr.eventId}`)}:</span>
                    {done ? (
                      <>
                        <span aria-hidden="true">{OUTCOME_EMOJI[tr.outcome]}</span>
                        <span className="sr-only">{t(`${P}.out.${tr.outcome}`)}</span>
                      </>
                    ) : (
                      <span aria-hidden="true" className="text-[var(--ink3)]">
                        …
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Warnings */}
      <div>
        <LiveHeading>{t(`${P}.live.warnings`)}</LiveHeading>
        <ul className="mt-2 space-y-1.5" aria-live="polite">
          <AnimatePresence initial={false}>
            {warnings.map((w) => (
              <motion.li
                key={w.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                data-warning={w.id}
                className="flex gap-2 rounded-lg bg-[#FFF6EC] px-2.5 py-1.5 text-xs leading-relaxed text-[#7A3A06]"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#C45A0A]" aria-hidden="true" />
                <span>{w.text}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {warnings.length === 0 && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#EEF7F2] px-2.5 py-1.5 text-xs font-semibold text-[#0F7B45]">
            <ShieldCheck size={14} aria-hidden="true" /> {t(`${P}.live.noWarnings`)}
          </p>
        )}
      </div>

      {/* The sample events */}
      <details className="rounded-xl border border-[#D2DCE8] px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-[var(--ink)]">
          {t(`${P}.sampleEvents`, { n: ch.events.length, trigger: t(`${P}.trigger.${ch.trigger}`) })}
        </summary>
        <ul className="mt-2 space-y-1.5">
          {ch.events.map((e) => (
            <li key={e.id} className="text-xs text-[var(--ink2)]">
              <span aria-hidden="true">{e.emoji}</span> <strong className="text-[var(--ink)]">{t(`${P}.ev.${e.id}`)}</strong>
              <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
                {ch.fields.map((f) => (
                  <span key={f.name} className="rounded-full bg-[var(--s2)] px-1.5 py-0.5 text-[10px]">
                    {t(`${P}.field.${f.name}`)}: {f.fromAi ? "🤖 ?" : fieldValueText(t, f, e.fields[f.name])}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </details>
      <p className="text-[11px] leading-snug text-[var(--ink3)]">{t(`${P}.live.note`)}</p>
    </div>
  );
}
