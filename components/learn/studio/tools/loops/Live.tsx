"use client";

// Loop Mapper live panel: the simulation redraws as links, signs and delays
// change, with the loops found so far and a one-line reading of what the
// system will do. The map it gets is already debounced.

import { useMemo, useState } from "react";
import { CheckCircle2, LineChart, TrendingDown, TrendingUp, Waves, Minus, MoveRight } from "lucide-react";
import Chart from "./Chart";
import { behaviour, findLoops, simulate, type Behaviour, type Link, type Loop, type Variable } from "./model";
import { LiveHeading } from "../automation/kit";
import type { T } from "../automation/ui";

const P = "studio.loop-mapper";

const READ_ICON: Record<Behaviour, typeof TrendingUp> = {
  grows: TrendingUp,
  collapses: TrendingDown,
  oscillates: Waves,
  settles: MoveRight,
  steady: Minus,
};

export default function LoopLive({
  t,
  vars,
  links,
  labelOf,
  loopTag,
  isSandbox,
  nudge,
  onNudge,
  simulated,
  onSimulate,
  tall,
}: {
  t: T;
  vars: Variable[];
  links: Link[];
  labelOf: (v: Variable) => string;
  loopTag: (l: Loop) => string;
  isSandbox: boolean;
  nudge: string | null;
  onNudge: (id: string) => void;
  simulated: boolean;
  onSimulate: () => void;
  tall: boolean;
}) {
  const [replay, setReplay] = useState(0);
  const loops = useMemo(() => findLoops(vars, links), [vars, links]);
  const byId = useMemo(() => new Map(vars.map((v) => [v.id, v])), [vars]);
  const name = (id: string) => {
    const v = byId.get(id);
    return v ? labelOf(v) : "?";
  };
  const nudgeId = nudge && byId.has(nudge) ? nudge : loops[0]?.nodes[0] ?? vars[0]?.id ?? null;
  const series = useMemo(() => (vars.length ? simulate(vars, links, nudgeId) : []), [vars, links, nudgeId]);
  // Redraw the lines whenever the model changes (signs, delays, links, push).
  const sig = useMemo(() => `${nudgeId}|${links.map((l) => `${l.from}>${l.to}${l.pol}${l.delay ? "d" : ""}`).join(",")}|${replay}`, [links, nudgeId, replay]);

  const idx = nudgeId ? vars.findIndex((v) => v.id === nudgeId) : -1;
  const beh: Behaviour | null = links.length > 0 && idx >= 0 ? behaviour(series[idx]) : null;
  const Icon = beh ? READ_ICON[beh] : LineChart;
  const note = loops.length === 0 ? "none" : loops.every((l) => l.kind === "R") ? "r" : loops.every((l) => l.kind === "B") ? (loops.some((l) => l.hasDelay) ? "bDelay" : "b") : "mixed";

  return (
    <div className="space-y-4 text-sm">
      {/* One-line reading */}
      <div className="flex items-start gap-3 rounded-xl bg-[#0D1B2A] p-3 text-white" aria-live="polite">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">{t(`${P}.live.willDo`)}</p>
          <p className="mt-0.5 font-bold leading-snug" data-reading={beh ?? "none"}>
            {beh && nudgeId ? t(`${P}.live.read.${beh}`, { v: name(nudgeId) }) : t(`${P}.live.read.empty`)}
          </p>
        </div>
      </div>

      {/* Push and simulate */}
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-bold text-[var(--ink2)]">
          {t(`${P}.nudge`)}
          <select
            value={nudgeId ?? ""}
            onChange={(e) => onNudge(e.target.value)}
            className="mt-0.5 block max-w-[220px] rounded-lg border border-[#D2DCE8] bg-white px-2 py-1.5 text-xs font-normal"
          >
            {vars.map((v) => (
              <option key={v.id} value={v.id}>
                {labelOf(v)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            onSimulate();
            setReplay((r) => r + 1);
          }}
          disabled={links.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2251A3] px-3 py-2 text-xs font-bold text-white shadow hover:bg-[#1B3A6B] disabled:opacity-40"
        >
          <LineChart size={14} aria-hidden="true" /> {t(`${P}.simulate`)}
        </button>
        {simulated && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F7B45]">
            <CheckCircle2 size={13} aria-hidden="true" /> {t(`${P}.live.simulated`)}
          </span>
        )}
      </div>

      {links.length > 0 && series.length > 0 ? (
        <Chart
          series={series}
          names={vars.map(labelOf)}
          title={t(`${P}.chartTitle`, { v: nudgeId ? name(nudgeId) : "" })}
          stepLabel={t(`${P}.step`)}
          tableLabel={t(`${P}.table`)}
          height={tall ? 300 : 220}
          drawKey={sig}
        />
      ) : (
        <p className="rounded-xl bg-[var(--s2)] p-3 text-xs text-[var(--ink3)]">{t(`${P}.live.noLinks`)}</p>
      )}

      {/* Loops found, live */}
      <div>
        <LiveHeading aside={<span className="text-[11px] text-[var(--ink3)]">{loops.length}</span>}>{t(`${P}.loops`)}</LiveHeading>
        {loops.length === 0 ? (
          <p className="mt-1 text-xs text-[var(--ink3)]">{t(`${P}.noLoops`)}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {loops.map((lp, i) => {
              const tag = isSandbox ? lp.name : loopTag(lp);
              const color = tag.startsWith("R") ? "border-[#C45A0A] text-[#C45A0A]" : tag.startsWith("B") ? "border-[#2251A3] text-[#2251A3]" : "border-[#9AAABC] text-[#7A8FA6]";
              return (
                <li key={lp.sig} data-loop={isSandbox ? lp.name : `L${i + 1}`} className="flex items-start gap-2 rounded-lg border border-[#D2DCE8] px-2.5 py-1.5">
                  <span className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border-2 px-1 text-[11px] font-black ${color}`}>{tag}</span>
                  <span className="min-w-0 text-xs leading-snug text-[var(--ink)]">
                    {[...lp.nodes, lp.nodes[0]].map(name).join(" → ")}
                    <span className="block text-[11px] text-[var(--ink3)]">
                      {lp.hasDelay ? `⏳ ${t(`${P}.hasDelay`)} · ` : ""}
                      {isSandbox ? t(`${P}.negCount`, { n: lp.negatives, kind: t(`${P}.kind.${lp.kind}`) }) : t(`${P}.live.negOnly`, { n: lp.negatives })}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {links.length > 0 && series.length > 0 && (
        <div>
          <LiveHeading>{t(`${P}.live.each`)}</LiveHeading>
          <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
            {vars.map((v, i) => (
              <li key={v.id} className="text-xs text-[var(--ink2)]">
                <strong className="text-[var(--ink)]">{labelOf(v)}:</strong> {t(`${P}.beh.${behaviour(series[i])}`)}
              </li>
            ))}
          </ul>
          {isSandbox && <p className="mt-2 rounded-lg bg-[#EBF0FA] p-2.5 text-xs leading-relaxed text-[var(--ink)]">{t(`${P}.simNote.${note}`)}</p>}
        </div>
      )}
      <p className="text-[11px] leading-snug text-[var(--ink3)]">{t(`${P}.simHint`)}</p>
    </div>
  );
}
