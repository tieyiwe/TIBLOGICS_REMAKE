"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Play, RotateCcw, SkipForward, Undo2, X, Zap, Bug } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { useStudioLayout, type StudioGuide } from "../StudioFrame";
import Canvas from "./automation/Canvas";
import Settings from "./automation/Settings";
import Results, { CheckList } from "./automation/Results";
import AutomationLive from "./automation/Live";
import { CHALLENGES, CHALLENGE_BY_ID, type AutomationChallenge } from "./automation/challenges";
import { findRisks, OUTCOME_EMOJI, runAll, type Run } from "./automation/engine";
import { findNode, isFlowNode, newId, removeNode, setSlot, updateNode, type FlowNode, type NodeKind, type SlotName } from "./automation/model";
import { KIND_STYLE, P, useMediaQuery, type T } from "./automation/ui";
import { ChallengeBar, keyList, LockedNotice, Measure, useDebounced, useUnlocks } from "./automation/kit";

const TOOL = "automation-builder";
const SANDBOX = "sandbox";
const STAGGER = 2;
const TICK_MS = 420;
const PALETTE: NodeKind[] = ["condition", "ai", "action", "human", "delay", "error", "end"];

function load<V>(key: string, fallback: V): V {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as V) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

const flowKey = (mode: string) => `tib.studio.${"automation-builder"}.flow.${mode}`;
const BEST_KEY = "tib.studio.automation-builder.best";

function newNode(kind: NodeKind, ch: AutomationChallenge): FlowNode {
  const f = ch.fields[0];
  const cfg: FlowNode["cfg"] =
    kind === "trigger"
      ? { trigger: ch.trigger }
      : kind === "condition"
        ? { field: f.name, op: f.type === "tags" ? "contains" : f.type === "number" ? "gt" : "equals", value: f.values?.[0] ?? "0" }
        : kind === "ai"
          ? { task: "classify", confidence: 80, failRate: 5 }
          : kind === "action"
            ? { action: ch.defaultAction, to: "team" }
            : kind === "delay"
              ? { hours: 24 }
              : kind === "error"
                ? { channel: "chat", retry: false }
                : {};
  return { id: newId(), kind, cfg, slots: {} };
}

const starter = (ch: AutomationChallenge): FlowNode => newNode("trigger", ch);

function starsFrom(checks: boolean[]): number {
  let n = 0;
  for (const c of checks) {
    if (!c) break;
    n += 1;
  }
  return n;
}

interface Sim {
  run: Run;
  tick: number;
  total: number;
  playing: boolean;
}
interface Outcome {
  stars: number | null;
  checks: boolean[] | null;
  improved: boolean;
  tip: string;
}

export default function AutomationBuilder({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT() as T;
  const locale = useLocale();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const layout = useStudioLayout();
  const unlocks = useUnlocks(TOOL, progress);

  const [best, setBest] = useState<Record<string, number>>(() => load(BEST_KEY, {}));
  const bestFor = useCallback(
    (id: string) => Math.max(best[id] ?? 0, progress[id]?.perfect ? 3 : progress[id]?.done ? 1 : 0),
    [best, progress],
  );

  const [mode, setMode] = useState<string>(() => {
    if (challengeId && CHALLENGE_BY_ID.has(challengeId)) return challengeId;
    return unlocks.firstOpen() ?? CHALLENGES[0].id;
  });
  const [sandboxSet, setSandboxSet] = useState(CHALLENGES[0].id);
  const isSandbox = mode === SANDBOX;
  const ch = CHALLENGE_BY_ID.get(isSandbox ? sandboxSet : mode)!;

  const [flows, setFlows] = useState<Record<string, FlowNode | null>>({});
  const [past, setPast] = useState<(FlowNode | null)[]>([]);
  const flow: FlowNode | null = mode in flows ? flows[mode] : null;

  // Load the saved design for this challenge (or a fresh trigger).
  useEffect(() => {
    if (mode in flows) return;
    const stored = load<unknown>(flowKey(mode), undefined);
    const initial = stored === null ? null : isFlowNode(stored) ? stored : starter(ch);
    setFlows((f) => ({ ...f, [mode]: initial }));
  }, [mode, flows, ch]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [armed, setArmed] = useState<NodeKind | null>(null);
  const [dragKind, setDragKind] = useState<NodeKind | null>(null);
  const [injectAi, setInjectAi] = useState(false);
  const [injectApi, setInjectApi] = useState(false);
  const [sim, setSim] = useState<Sim | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const clearRun = () => {
    setSim(null);
    setOutcome(null);
  };

  const setFlow = (next: FlowNode | null) => {
    setPast((p) => [...p.slice(-29), flow]);
    setFlows((f) => ({ ...f, [mode]: next }));
    save(flowKey(mode), next);
    clearRun();
  };

  const switchMode = (m: string) => {
    setMode(m);
    setPast([]);
    setSelectedId(null);
    setArmed(null);
    setConfirmReset(false);
    clearRun();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArmed(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onAdd = (parentId: string | null, slot: SlotName | "root", kind: NodeKind) => {
    const node = newNode(kind, ch);
    if (slot === "root" || !parentId) setFlow(node);
    else setFlow(setSlot(flow, parentId, slot, node));
    setSelectedId(node.id);
    setArmed(null);
    setDragKind(null);
  };
  const onDelete = (id: string) => {
    setFlow(removeNode(flow, id));
    if (selectedId === id) setSelectedId(null);
  };
  const undo = () => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFlows((f) => ({ ...f, [mode]: prev }));
    save(flowKey(mode), prev);
    clearRun();
  };
  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    setSelectedId(null);
    setFlow(starter(ch));
  };

  const selected = selectedId ? findNode(flow, selectedId) : null;
  const settings = selected ? (
    <Settings
      t={t}
      node={selected}
      fields={ch.fields}
      onChange={(cfg) => setFlow(updateNode(flow, selected.id, (n) => ({ ...n, cfg })))}
      onDelete={() => onDelete(selected.id)}
      onClose={() => setSelectedId(null)}
    />
  ) : null;

  const risks = useMemo(() => findRisks(flow, ch.trigger, ch.fields), [flow, ch]);

  // ── Simulation ───────────────────────────────────────────────────────────
  const finish = useCallback(
    (run: Run) => {
      const base = { trigger: ch.trigger, useRates: false };
      const clean = runAll(flow, ch.events, ch.fields, { ...base, injectAi: false, injectApi: false });
      const stress = runAll(flow, ch.events, ch.fields, { ...base, injectAi: true, injectApi: true });
      let checks: boolean[] | null = null;
      let stars: number | null = null;
      let improved = false;
      if (!isSandbox) {
        checks = ch.checks.map((f) => f({ flow, clean, stress, events: ch.events }));
        stars = starsFrom(checks);
        // Report when it beats the best, or when the server doesn't know yet
        // (a best kept only in this browser must still unlock the next level).
        if (stars > 0 && (stars > bestFor(ch.id) || !unlocks.done(ch.id))) {
          improved = stars > bestFor(ch.id);
          if (improved) {
            const nb = { ...best, [ch.id]: stars };
            setBest(nb);
            save(BEST_KEY, nb);
          }
          unlocks.markDone(ch.id);
          onComplete({ challengeId: ch.id, stars: stars as 1 | 2 | 3 });
        }
      }
      const rk = risks.map((r) => r.key);
      const tip =
        run.counts.notrun > 0
          ? "tip.mismatch"
          : run.counts.silent > 0 || stress.counts.silent > 0
            ? "tip.silent"
            : run.counts.stuck > 0
              ? "tip.dead"
              : rk.includes("aiToCustomer")
                ? "tip.approval"
                : run.traces.some((x) => x.wrongAi && !x.unsure && x.humans === 0)
                  ? "tip.confidence"
                  : isSandbox
                    ? "tip.sandbox"
                    : `ch.${ch.id}.why`;
      setOutcome({ stars, checks, improved, tip: `${P}.${tip}` });
    },
    [ch, flow, isSandbox, best, bestFor, onComplete, risks, unlocks],
  );

  const play = () => {
    const run = runAll(flow, ch.events, ch.fields, { trigger: ch.trigger, injectAi, injectApi, useRates: true });
    const total = Math.max(0, ...run.traces.map((tr, i) => i * STAGGER + tr.path.length));
    setSelectedId(null);
    setOutcome(null);
    if (reduceMotion) {
      setSim({ run, tick: total, total, playing: false });
      finish(run);
    } else setSim({ run, tick: 0, total, playing: true });
  };
  const skip = () => {
    if (!sim) return;
    setSim({ ...sim, tick: sim.total, playing: false });
    finish(sim.run);
  };

  useEffect(() => {
    if (!sim?.playing) return;
    if (sim.tick >= sim.total) {
      setSim({ ...sim, playing: false });
      finish(sim.run);
      return;
    }
    const id = window.setTimeout(() => setSim((s) => (s ? { ...s, tick: s.tick + 1 } : s)), TICK_MS);
    return () => window.clearTimeout(id);
  }, [sim, finish]);

  // Bring the results into view (the frame may render the workspace twice,
  // one copy hidden, so pick the visible one).
  useEffect(() => {
    if (!outcome || embedded) return;
    const el = Array.from(document.querySelectorAll<HTMLElement>("[data-ab-results]")).find((x) => x.offsetParent !== null);
    el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }, [outcome, embedded, reduceMotion]);

  const { tokens, trail } = useMemo(() => {
    const tokens = new Map<string, number[]>();
    const trail = new Set<string>();
    if (!sim) return { tokens, trail };
    sim.run.traces.forEach((tr, i) => {
      const pos = Math.min(sim.tick - i * STAGGER, tr.path.length);
      for (let k = 0; k < Math.min(pos + 1, tr.path.length); k++) trail.add(tr.path[k]);
      if (sim.playing && pos >= 0 && pos < tr.path.length) {
        const id = tr.path[pos];
        tokens.set(id, [...(tokens.get(id) ?? []), i]);
      }
    });
    return { tokens, trail };
  }, [sim]);

  // ── Live panel input (debounced so it follows the build, not every keystroke)
  const live = useDebounced(useMemo(() => ({ flow, ch }), [flow, ch]), 300);

  // ── Toolbar, guide ────────────────────────────────────────────────────────
  const titleOf = (id: string) => t(`${P}.ch.${id}.title`);
  const toolbar = (
    <ChallengeBar
      t={t}
      label={t("studio.challenges")}
      items={CHALLENGES.map((c) => ({ id: c.id, title: titleOf(c.id), difficulty: c.difficulty, stars: bestFor(c.id) }))}
      current={mode}
      onPick={switchMode}
      lockedBy={unlocks.lockedBy}
      titleOf={titleOf}
      levelLabel={(n) => t(`${P}.level`, { n })}
      free={{ id: SANDBOX, label: t("studio.sandbox") }}
    />
  );

  const lockedBy = isSandbox ? null : unlocks.lockedBy(mode);
  if (lockedBy) {
    const open = unlocks.firstOpen() ?? CHALLENGES[0].id;
    return (
      <div className="space-y-3">
        {toolbar}
        <LockedNotice t={t} title={titleOf(mode)} prevTitle={titleOf(lockedBy)} goLabel={t(`${P}.goTo`, { name: titleOf(open) })} onGo={() => switchMode(open)} />
      </div>
    );
  }

  const guide: StudioGuide = isSandbox
    ? { goal: t(`${P}.sandboxBody`), steps: keyList(t, `${P}.guide.sandbox.s`), tips: keyList(t, `${P}.guide.sandbox.tip`) }
    : {
        goal: t(`${P}.ch.${ch.id}.goal`),
        steps: keyList(t, `${P}.guide.${ch.id}.s`),
        stars: [t(`${P}.ch.${ch.id}.t1`), t(`${P}.ch.${ch.id}.t2`), t(`${P}.ch.${ch.id}.t3`)],
        tips: [...keyList(t, `${P}.guide.${ch.id}.tip`), t(`${P}.checksNote`)],
      };

  // ── Workspace ─────────────────────────────────────────────────────────────
  const workspace = (w: number) => {
    const side = w >= 820;
    const stacked = w > 0 && w < 520;
    return (
      <div className="flex min-h-full flex-col gap-3">
        {/* Title and edit controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 text-base font-black leading-snug text-[var(--ink)]">
            {isSandbox ? `🧪 ${t(`${P}.sandboxTitle`)}` : titleOf(ch.id)}
          </h2>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={undo}
              disabled={!past.length}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D2DCE8] bg-white px-2 py-1 text-xs font-semibold text-[var(--ink2)] hover:bg-[var(--s2)] disabled:opacity-40"
            >
              <Undo2 size={13} aria-hidden="true" /> {t(`${P}.undo`)}
            </button>
            <button
              type="button"
              onClick={reset}
              onBlur={() => setConfirmReset(false)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${
                confirmReset ? "border-red-300 bg-red-50 text-red-700" : "border-[#D2DCE8] bg-white text-[var(--ink2)] hover:bg-[var(--s2)]"
              }`}
            >
              <RotateCcw size={13} aria-hidden="true" /> {confirmReset ? t(`${P}.resetSure`) : t(`${P}.reset`)}
            </button>
          </div>
        </div>
        {isSandbox && (
          <label className="block text-xs font-bold text-[var(--ink2)]">
            {t(`${P}.sandboxEvents`)}
            <select
              value={sandboxSet}
              onChange={(e) => {
                setSandboxSet(e.target.value);
                clearRun();
              }}
              className="mt-1 block w-full max-w-sm rounded-lg border border-[#D2DCE8] bg-white px-2.5 py-2 text-sm font-normal text-[var(--ink)]"
            >
              {CHALLENGES.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(`${P}.eventsOf.${c.id}`)} ({t(`${P}.trigger.${c.trigger}`)})
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Palette */}
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-3 shadow-sm" aria-label={t(`${P}.palette`)}>
          <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label={t(`${P}.palette`)}>
            {PALETTE.map((k) => {
              const s = KIND_STYLE[k];
              const Icon = s.icon;
              const on = armed === k;
              return (
                <button
                  key={k}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", k);
                    e.dataTransfer.effectAllowed = "copy";
                    setDragKind(k);
                  }}
                  onDragEnd={() => setDragKind(null)}
                  onClick={() => setArmed(on ? null : k)}
                  aria-pressed={on}
                  className={`inline-flex cursor-grab items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] active:cursor-grabbing ${
                    on ? "scale-105 border-[#F47C20] shadow" : "border-transparent hover:-translate-y-0.5"
                  }`}
                  style={{ background: s.bg, color: s.color }}
                >
                  <Icon size={14} aria-hidden="true" /> {t(`${P}.kind.${k}`)}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-[var(--ink3)]">{t(`${P}.paletteHint`)}</p>
          {armed && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-[#FEF0E3] px-3 py-2 text-xs font-semibold text-[#C45A0A]" role="status">
              <span>{t(`${P}.armed`, { step: t(`${P}.kind.${armed}`) })}</span>
              <button type="button" onClick={() => setArmed(null)} className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 hover:bg-white">
                <X size={13} aria-hidden="true" /> {t(`${P}.cancel`)}
              </button>
            </div>
          )}
        </section>

        {/* Canvas (fills the height the frame gives it) and settings */}
        <div className={`flex-1 ${side ? "grid grid-cols-[minmax(0,1fr)_300px] items-stretch gap-3" : ""}`}>
          <div
            className={`h-full overflow-auto rounded-2xl border border-[#D2DCE8] bg-[var(--s2)] p-3 [background-image:radial-gradient(#D2DCE8_1px,transparent_1px)] [background-size:16px_16px] sm:p-4 ${
              layout === "overlay" ? "min-h-[440px]" : "min-h-[400px]"
            }`}
            aria-label={t(`${P}.builder`)}
            role="group"
          >
            {mode in flows ? (
              <Canvas
                t={t}
                root={flow}
                fields={ch.fields}
                events={ch.events}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={onAdd}
                onDelete={onDelete}
                tokens={tokens}
                trail={trail}
                armed={armed}
                dragKind={dragKind}
                stacked={stacked}
                inlineSettings={side ? undefined : settings}
              />
            ) : (
              <div className="h-24 animate-pulse rounded-xl bg-white" />
            )}
          </div>
          {side && (
            <aside className="min-w-0">
              <div className="sticky top-0">
                {settings ?? (
                  <div className="rounded-2xl border border-dashed border-[#B8C4D3] bg-white p-4 text-sm text-[var(--ink3)]">{t(`${P}.noSelection`)}</div>
                )}
              </div>
            </aside>
          )}
        </div>

        {/* Explicit run: scores the stars */}
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-3 shadow-sm sm:p-4" aria-label={t(`${P}.simulator`)}>
          <div className="flex flex-wrap items-center gap-3">
            {sim?.playing ? (
              <button type="button" onClick={skip} className="inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-bold text-white">
                <SkipForward size={16} aria-hidden="true" /> {t(`${P}.skip`)}
              </button>
            ) : (
              <button
                type="button"
                onClick={play}
                disabled={!flow}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F47C20] px-5 py-2.5 text-sm font-black text-white shadow transition-transform hover:-translate-y-0.5 hover:bg-[#E05F00] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
              >
                <Play size={16} aria-hidden="true" /> {sim ? t(`${P}.playAgain`) : t(`${P}.play`, { n: ch.events.length })}
              </button>
            )}
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">{t(`${P}.inject`)}</legend>
              <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${injectAi ? "border-red-300 bg-red-50 text-red-700" : "border-[#D2DCE8] text-[var(--ink2)]"}`}>
                <input type="checkbox" className="h-3.5 w-3.5 accent-red-600" checked={injectAi} onChange={(e) => { setInjectAi(e.target.checked); clearRun(); }} />
                <Bug size={13} aria-hidden="true" /> {t(`${P}.injectAi`)}
              </label>
              <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${injectApi ? "border-red-300 bg-red-50 text-red-700" : "border-[#D2DCE8] text-[var(--ink2)]"}`}>
                <input type="checkbox" className="h-3.5 w-3.5 accent-red-600" checked={injectApi} onChange={(e) => { setInjectApi(e.target.checked); clearRun(); }} />
                <Zap size={13} aria-hidden="true" /> {t(`${P}.injectApi`)}
              </label>
            </fieldset>
          </div>
          <p className="mt-2 text-xs text-[var(--ink3)]">{t(`${P}.injectHint`)}</p>

          {sim && (
            <ol className="mt-3 flex flex-wrap gap-1.5" aria-label={t(`${P}.lane`)}>
              {sim.run.traces.map((tr, i) => {
                const pos = sim.tick - i * STAGGER;
                const doneHere = pos >= tr.path.length;
                const state = pos < 0 ? "wait" : doneHere ? "done" : "move";
                return (
                  <li
                    key={tr.eventId}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                      state === "wait" ? "bg-[var(--s2)] text-[var(--ink3)]" : state === "move" ? "bg-[#FEF0E3] text-[#C45A0A]" : "bg-[#EEF7F2] text-[var(--ink)]"
                    }`}
                    title={t(`${P}.ev.${tr.eventId}`)}
                  >
                    <span aria-hidden="true">{ch.events[i].emoji}</span>
                    <span className="sr-only">{t(`${P}.ev.${tr.eventId}`)}:</span>
                    {state === "done" ? (
                      <span>
                        <span aria-hidden="true">{OUTCOME_EMOJI[tr.outcome]}</span>
                        <span className="sr-only">{t(`${P}.out.${tr.outcome}`)}</span>
                      </span>
                    ) : (
                      <span>{state === "move" ? "…" : i + 1}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {!isSandbox && outcome?.checks && (
            <div className="mt-3 rounded-xl bg-[var(--s2)] p-3">
              <CheckList t={t} challengeId={ch.id} checks={outcome.checks} />
            </div>
          )}
        </section>

        <div data-ab-results="">
          {sim && !sim.playing && outcome && (
            <Results
              t={t}
              locale={locale}
              run={sim.run}
              events={ch.events}
              manualMin={ch.manualMin}
              monthly={ch.monthly}
              stars={outcome.stars}
              improved={outcome.improved}
              tipKey={outcome.tip}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="ab-root">
      <style>{`
        @keyframes abPop { 0% { transform: scale(.3); opacity: 0 } 70% { transform: scale(1.15) } 100% { transform: scale(1); opacity: 1 } }
        @keyframes abGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(244,124,32,.35) } 50% { box-shadow: 0 0 0 5px rgba(244,124,32,0) } }
        .ab-token { animation: abPop .35s ease-out both }
        .ab-slot-hot { animation: abGlow 1.2s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .ab-token, .ab-slot-hot { animation: none } }
      `}</style>
      <StudioFrame
        toolbar={toolbar}
        guide={guide}
        liveTitle={t(`${P}.live.title`)}
        live={<AutomationLive t={t} flow={live.flow} ch={live.ch} reduceMotion={reduceMotion} />}
      >
        <Measure className="h-full">{workspace}</Measure>
      </StudioFrame>
    </div>
  );
}
