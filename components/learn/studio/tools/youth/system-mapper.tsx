"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeftRight, CheckCircle2, FastForward, Hourglass, Minus, MousePointer2, Pause, Play, Plus, RotateCcw, Spline, StepForward, Trash2, XCircle } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { useStudioLayout, type StudioGuide } from "../../StudioFrame";
import { useStudioDraft } from "../../useStudioDraft";
import { Measure } from "../automation/kit";
import { useMediaQuery } from "../automation/ui";
import SystemCanvas, { type Selection } from "./system-canvas";
import SystemChart, { SERIES } from "./system-chart";
import {
  H,
  HELPER,
  MAX_LINKS,
  MAX_NODES,
  PARTS,
  SANDBOX_BANK,
  STEPS,
  STRENGTHS,
  SYS_BY_ID,
  W,
  capOf,
  freshSys,
  isSysState,
  loopThrough,
  loopsOf,
  simulate,
  type NodeKind,
  type SLink,
  type SNode,
  type SysState,
} from "./system-model";
import { MissionBoard, Quiz, SANDBOX, WhyBox, Y, YouthBar, YouthLocked, keys, loadLS, missionStars, saveLS, useChallengeFlow, type Mission, type T } from "./kit";

// System Mapper: build a system out of stocks (piles) and flows, connect them
// with + and - arrows, then press Play to run it step by step and watch the
// chart. Challenges: fix a lunch queue's bottleneck, stop a game's coin
// inflation with a sink, and name the loops in a football team's season.

const TOOL = "system-mapper";
const NS = `studio.${TOOL}`;
const IDS = ["lunch-queue", "game-economy", "feedback-loops"];
const ICONS: Record<string, string> = { "lunch-queue": "🍽️", "game-economy": "🪙", "feedback-loops": "⚽" };
const HELPERS = 2;
const stateKey = (mode: string) => `tib.studio.system-mapper.state.${mode}`;

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;

function freeSpot(nodes: SNode[]) {
  for (let r = 0; r < 8; r++)
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * 2 * Math.PI + r;
      const p = { x: Math.round(W / 2 + Math.cos(a) * r * 40), y: Math.round(H / 2 + Math.sin(a) * r * 30) };
      if (p.x < 80 || p.x > W - 80 || p.y < 40 || p.y > H - 40) continue;
      if (nodes.every((n) => Math.abs(n.x - p.x) > 140 || Math.abs(n.y - p.y) > 60)) return p;
    }
  return { x: W / 2, y: H / 2 };
}

type Last =
  | { a: "helper"; n: number }
  | { a: "pick"; right: boolean }
  | { a: "label"; right: boolean; kind: "R" | "B" }
  | { a: "linkAdded" | "polarity" | "strength" | "delay" | "partAdded" | "deleted" | "played" | "base" | "locked" | "reset" | "full" | "moved" }
  | null;

export default function SystemMapper({ challengeId, onComplete, progress }: StudioToolProps) {
  const t = useT() as T;
  const k = useCallback((s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v), [t]);
  const reduce = !!useReducedMotion();
  // Side-by-side frame (Live panel visible next to the workspace)?
  const layout = useStudioLayout();
  const wideScreen = useMediaQuery("(min-width: 1024px)");
  const sideBySide = layout !== "embedded" && wideScreen;
  const flow = useChallengeFlow({ tool: TOOL, ids: IDS, challengeId, progress, onComplete });
  const mode = flow.mode;
  const ch = SYS_BY_ID.get(mode) ?? null;
  const editable = ch ? ch.editable : true;
  const bank = ch ? ch.bank : SANDBOX_BANK;
  const unit = ch ? ch.unit : "step";

  const [states, setStates] = useState<Record<string, SysState>>({});
  useEffect(() => {
    if (mode in states) return;
    const stored = loadLS<unknown>(stateKey(mode), null);
    setStates((m) => ({ ...m, [mode]: isSysState(stored) ? stored : freshSys(mode) }));
  }, [mode, states]);
  useStudioDraft<SysState>(
    TOOL,
    mode,
    states[mode],
    (v) => {
      setStates((m) => ({ ...m, [mode]: v }));
      saveLS(stateKey(mode), v);
    },
    { validate: isSysState, legacyKey: stateKey(mode) },
  );
  const st = states[mode] ?? null;

  const [selection, setSelection] = useState<Selection>(null);
  const [connect, setConnect] = useState(editable);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [last, setLast] = useState<Last>(null);
  const [claimed, setClaimed] = useState<{ stars: number; improved: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [custom, setCustom] = useState<{ label: string; kind: NodeKind }>({ label: "", kind: "stock" });
  const [linkForm, setLinkForm] = useState<{ from: string; to: string; pol: "1" | "-1" }>({ from: "", to: "", pol: "1" });
  const [shownSeries, setShownSeries] = useState<Record<string, string[]>>({});

  /** structural: the system changed, so the last run no longer counts. */
  const update = useCallback(
    (fn: (s: SysState) => SysState, structural = true) => {
      setStates((all) => {
        const cur = all[mode];
        if (!cur) return all;
        const n = fn(cur);
        const next = structural ? { ...n, ran: false } : n;
        saveLS(stateKey(mode), next);
        return { ...all, [mode]: next };
      });
      if (structural) {
        setClaimed(null);
        setStep(0);
        setPlaying(false);
      }
    },
    [mode],
  );

  // Escape clears the selection (and keeps full screen open).
  const selRef = useRef(selection);
  selRef.current = selection;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selRef.current) {
        e.preventDefault();
        setSelection(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nodes = useMemo(() => st?.nodes ?? [], [st]);
  const links = useMemo(() => st?.links ?? [], [st]);
  const series = useMemo(() => simulate(nodes, links), [nodes, links]);
  const loops = useMemo(() => loopsOf(nodes, links), [nodes, links]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const idxOf = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);
  const labelOf = useCallback((n: SNode) => (n.key ? k(`v.${n.key}`) : n.label?.trim() || "?"), [k]);
  const name = (id: string) => {
    const n = byId.get(id);
    return n ? labelOf(n) : "?";
  };
  const valueAt = (id: string, s: number) => {
    const i = idxOf.get(id);
    return i === undefined ? 0 : series[i][Math.min(s, STEPS)];
  };

  // Playback.
  useEffect(() => {
    if (!playing) return;
    const h = window.setInterval(() => setStep((s) => Math.min(STEPS, s + 1)), reduce ? 250 : 420);
    return () => window.clearInterval(h);
  }, [playing, reduce]);
  useEffect(() => {
    if (step >= STEPS && st && !st.ran) {
      setPlaying(false);
      update((s) => ({ ...s, ran: true }), false);
      setLast({ a: "played" });
    } else if (step >= STEPS && playing) {
      setPlaying(false);
    }
  }, [step, st, playing, update]);

  const switchMode = (m: string) => {
    flow.setMode(m);
    setConnect(SYS_BY_ID.get(m)?.editable ?? true);
    setSelection(null);
    setHighlight(null);
    setStep(0);
    setPlaying(false);
    setLast(null);
    setClaimed(null);
    setConfirmReset(false);
  };

  // ── Editing ──────────────────────────────────────────────────────────────
  const addPart = (key: string) => {
    if (!editable || nodes.length >= MAX_NODES || nodes.some((n) => n.key === key)) return;
    const part = PARTS[key];
    update((s) => ({ ...s, nodes: [...s.nodes, { id: key, key, ...part, ...freeSpot(s.nodes) }] }));
    setLast({ a: "partAdded" });
  };
  const addCustom = () => {
    const label = custom.label.trim().slice(0, 40);
    if (!label || nodes.length >= MAX_NODES) return;
    update((s) => ({ ...s, nodes: [...s.nodes, { id: uid("c"), label, kind: custom.kind, init: custom.kind === "stock" ? 50 : 5, ...freeSpot(s.nodes) }] }));
    setCustom({ label: "", kind: custom.kind });
    setLast({ a: "partAdded" });
  };
  const addLink = (from: string, to: string, pol: 1 | -1 = 1) => {
    if (from === to) return;
    if (!editable) {
      setLast({ a: "locked" });
      setSelection({ type: "node", id: to });
      return;
    }
    const existing = links.find((l) => l.from === from && l.to === to);
    if (existing) {
      setSelection({ type: "link", id: existing.id });
      return;
    }
    if (links.length >= MAX_LINKS) {
      setLast({ a: "full" });
      return;
    }
    const src = byId.get(from);
    const id = uid("l");
    const w = src?.kind === "stock" ? 0.1 : 1;
    update((s) => ({ ...s, links: [...s.links, { id, from, to, pol, w, delay: false }] }));
    setSelection({ type: "link", id });
    setLast({ a: "linkAdded" });
  };
  const patchLink = (id: string, patch: Partial<SLink>, a: "polarity" | "strength" | "delay") => {
    update((s) => ({ ...s, links: s.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
    setLast({ a });
  };
  const patchNode = (id: string, patch: Partial<SNode>) => update((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  const deleteLink = (id: string) => {
    update((s) => ({ ...s, links: s.links.filter((l) => l.id !== id) }));
    setSelection(null);
    setLast({ a: "deleted" });
  };
  const deleteNode = (id: string) => {
    update((s) => ({ ...s, nodes: s.nodes.filter((n) => n.id !== id), links: s.links.filter((l) => l.from !== id && l.to !== id) }));
    setSelection(null);
    setLast({ a: "deleted" });
  };
  const tapNode = (id: string) => {
    if (connect && selection?.type === "node" && selection.id !== id) {
      addLink(selection.id, id);
      return;
    }
    setSelection(selection?.type === "node" && selection.id === id ? null : { type: "node", id });
  };
  const helpersUsed = nodes.reduce((s, n) => s + (n.helpers ?? 0), 0);
  const setHelpers = (id: string, n: number) => {
    patchNode(id, { helpers: n });
    setLast({ a: "helper", n });
  };
  const setLabel = (sig: string, kind: "R" | "B", right: boolean) => {
    update((s) => ({ ...s, labels: { ...s.labels, [sig]: kind } }), false);
    setLast({ a: "label", right, kind });
    setClaimed(null);
  };
  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    const f = freshSys(mode);
    setStates((all) => ({ ...all, [mode]: f }));
    saveLS(stateKey(mode), f);
    setSelection(null);
    setHighlight(null);
    setStep(0);
    setPlaying(false);
    setLast({ a: "reset" });
    setClaimed(null);
  };

  // ── Missions ─────────────────────────────────────────────────────────────
  const missions: Mission[] = useMemo(() => {
    if (!st || !ch) return [];
    const ran = st.ran;
    const ser = (id: string) => series[idxOf.get(id) ?? -1] ?? [];
    if (mode === "lunch-queue") {
      const peak = Math.max(...ser("foodLine"), ...ser("tillLine"));
      const allEat = (ser("eating")[STEPS] ?? 0) >= 59.5;
      return [
        { id: "find", label: k("m.lunch-queue.1"), done: ran && st.pick === "serve" },
        { id: "fix", label: k("m.lunch-queue.2"), done: ran && allEat },
        { id: "smooth", label: k("m.lunch-queue.3"), done: ran && allEat && peak <= 8 },
      ];
    }
    if (mode === "game-economy") {
      const coins = ser("coins");
      const prices = ser("prices");
      const sink = loops.some((lp) => lp.kind === "B" && lp.nodes.includes("coins"));
      const tail = coins.slice(-5);
      return [
        { id: "sink", label: k("m.game-economy.1"), done: sink },
        { id: "stop", label: k("m.game-economy.2"), done: ran && sink && (coins[STEPS] ?? 0) <= 300 && (prices[STEPS] ?? 0) <= 25 },
        { id: "fair", label: k("m.game-economy.3"), done: ran && sink && tail.length === 5 && tail.every((v) => v >= 40 && v <= 300) },
      ];
    }
    // feedback-loops
    const winLink = links.some((l) => l.from === "wins" && l.to === "confidence" && l.pol === 1);
    const r = loopThrough(loops, ["confidence", "practice", "skill", "wins"]);
    const b1 = loopThrough(loops, ["practice", "tiredness"]);
    const b2 = loopThrough(loops, ["wins", "rivals"]);
    const ok = (lp: typeof r, kind: "R" | "B") => !!lp && lp.kind === kind && st.labels[lp.sig] === kind;
    return [
      { id: "close", label: k("m.feedback-loops.1"), done: winLink && ok(r, "R") },
      { id: "balance", label: k("m.feedback-loops.2"), done: ok(b1, "B") && ok(b2, "B") },
      { id: "lever", label: k("m.feedback-loops.3"), done: ran && st.q === "rest" },
    ];
  }, [st, ch, mode, series, idxOf, loops, links, k]);

  const claim = () => {
    const stars = missionStars(missions);
    if (!stars || !flow.isChallenge) return;
    const improved = flow.claim(mode, stars);
    setClaimed({ stars, improved });
  };

  // ── Frame ────────────────────────────────────────────────────────────────
  const toolbar = <YouthBar t={t} ns={NS} ids={IDS} icons={ICONS} flow={flow} onPick={switchMode} />;
  const guide: StudioGuide = ch
    ? {
        goal: k(`ch.${mode}.goal`),
        steps: keys(t, `${NS}.ch.${mode}.s`),
        stars: [k(`m.${mode}.1`), k(`m.${mode}.2`), k(`m.${mode}.3`)],
        tips: [...keys(t, `${NS}.ch.${mode}.tip`), k("how.loops")],
      }
    : { goal: k("sandboxGoal"), steps: keys(t, `${NS}.sandbox.s`), tips: [k("how.stock"), k("how.loops")] };

  const defaultsShown = ch ? ch.chart : nodes.filter((n) => n.kind === "stock").map((n) => n.id);
  const shown = (shownSeries[mode] ?? defaultsShown).filter((id) => byId.has(id));
  const toggleSeries = (id: string) =>
    setShownSeries((m) => {
      const cur = m[mode] ?? defaultsShown;
      return { ...m, [mode]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });

  const chart = (
    <div className="space-y-2">
      <SystemChart
        series={shown.map((id) => series[idxOf.get(id)!])}
        names={shown.map(name)}
        colors={shown.map((id) => SERIES[(idxOf.get(id) ?? 0) % SERIES.length])}
        upTo={step}
        title={k("chartTitle", { unit: k(`unit.${unit}`), n: step })}
        stepLabel={k(`unit.${unit}`)}
        tableLabel={k("table")}
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={k("chartPick")}>
        {nodes.map((n) => (
          <button
            key={n.id}
            type="button"
            aria-pressed={shown.includes(n.id)}
            onClick={() => toggleSeries(n.id)}
            className={`rounded-full border px-2 py-1 text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
              shown.includes(n.id) ? "border-[#0D1B2A] bg-[#0D1B2A] text-white" : "border-[#D2DCE8] bg-white text-[var(--ink2)]"
            }`}
          >
            {shown.includes(n.id) ? "✓ " : ""}
            {labelOf(n)}
          </button>
        ))}
      </div>
    </div>
  );

  const controls = (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={k("playback")} data-testid="sm-controls">
      <button
        type="button"
        onClick={() => {
          if (step >= STEPS) setStep(0);
          setPlaying((p) => !p);
        }}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#F47C20] px-4 text-sm font-black text-white shadow hover:bg-[#E05F00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
        data-testid="sm-play"
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />} {playing ? k("pause") : k("play")}
      </button>
      <button
        type="button"
        onClick={() => {
          setPlaying(false);
          setStep((s) => Math.min(STEPS, s + 1));
        }}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border-2 border-[#D2DCE8] bg-white px-3 text-sm font-bold text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
        data-testid="sm-step"
      >
        <StepForward size={16} aria-hidden="true" /> {k("stepBtn")}
      </button>
      <button
        type="button"
        onClick={() => {
          setPlaying(false);
          setStep(STEPS);
        }}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border-2 border-[#D2DCE8] bg-white px-3 text-sm font-bold text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
        data-testid="sm-end"
      >
        <FastForward size={16} aria-hidden="true" /> {k("toEnd")}
      </button>
      <button
        type="button"
        onClick={() => {
          setPlaying(false);
          setStep(0);
        }}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border-2 border-[#D2DCE8] bg-white px-3 text-sm font-bold text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
        data-testid="sm-rewind"
      >
        <RotateCcw size={15} aria-hidden="true" /> {k("rewind")}
      </button>
      <span className="text-sm font-bold text-[var(--ink2)]" aria-live="off" data-testid="sm-step-label">
        {k("stepNow", { unit: k(`unit.${unit}`), n: step, total: STEPS })}
      </span>
    </div>
  );

  const livePanel = (
    <div className="space-y-3 text-sm" data-testid="sm-live">
      {chart}
      <p className="text-xs text-[var(--ink3)]">{st?.ran ? `✓ ${k("ranOk")}` : k("ranNot")}</p>
    </div>
  );

  const framed = (body: ReactNode) => (
    <StudioFrame toolbar={toolbar} guide={guide} live={livePanel} liveTitle={k("liveTitle")}>
      {body}
    </StudioFrame>
  );
  if (flow.lockedBy) return framed(<YouthLocked t={t} ns={NS} flow={flow} onGo={switchMode} />);
  if (!st) return framed(<div className="h-48 animate-pulse rounded-xl bg-[var(--s2)]" />);

  const selNode = selection?.type === "node" ? byId.get(selection.id) : undefined;
  const selLink = selection?.type === "link" ? links.find((l) => l.id === selection.id) : undefined;
  const hl = loops.find((l) => l.sig === highlight) ?? null;
  const loopTag = (lp: (typeof loops)[number]) => (!ch ? lp.name : st.labels[lp.sig] ?? "?");
  const fullOf = (id: string) => {
    const n = byId.get(id);
    const cap = n ? capOf(n) : undefined;
    const v = valueAt(id, step);
    return cap !== undefined && step > 0 && v > 0 && v >= cap - 0.01;
  };
  const canTune = !ch || mode === "feedback-loops";

  const whyText = (() => {
    if (!last) return k(`why.start.${ch ? mode : "sandbox"}`);
    if (last.a === "helper") return k("why.helper", { n: HELPERS - helpersUsed });
    if (last.a === "pick") return k(last.right ? "why.pickRight" : "why.pickWrong");
    if (last.a === "label") return k(last.right ? `why.label${last.kind}` : "why.labelWrong");
    if (last.a === "played") return k(`why.played.${ch ? mode : "sandbox"}`);
    return k(`why.${last.a}`);
  })();

  const btn = "inline-flex min-h-[36px] items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]";

  const inspector = (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white px-3 py-2.5" aria-label={k("inspector")} data-testid="sm-inspector">
      {selLink ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto min-w-0 text-xs text-[var(--ink2)]">
            <strong className="text-sm text-[var(--ink)]">
              {name(selLink.from)} → {name(selLink.to)}
            </strong>
            <span className="block">{k(selLink.pol === 1 ? "polSameLong" : "polOppositeLong", { a: name(selLink.from), b: name(selLink.to) })}</span>
          </p>
          {editable && !selLink.fixed ? (
            <>
              <div className="flex gap-1.5" role="group" aria-label={k("polarity")}>
                {([1, -1] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={selLink.pol === p}
                    onClick={() => patchLink(selLink.id, { pol: p }, "polarity")}
                    className={`rounded-xl border-2 px-2.5 py-1.5 text-xs font-semibold ${selLink.pol === p ? (p === 1 ? "border-[#2251A3] bg-[#EBF0FA]" : "border-[#D9480F] bg-[#FFF1EA]") : "border-[#D2DCE8] bg-white"}`}
                    data-testid={`sm-pol-${p === 1 ? "plus" : "minus"}`}
                  >
                    <span className={`font-black ${p === 1 ? "text-[#2251A3]" : "text-[#D9480F]"}`}>{p === 1 ? "+" : "−"}</span> {k(p === 1 ? "polSame" : "polOpposite")}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
                {k("strength")}
                <select
                  value={String(selLink.w)}
                  onChange={(e) => patchLink(selLink.id, { w: Number(e.target.value) }, "strength")}
                  className="rounded-lg border border-[#D2DCE8] bg-white px-2 py-1 text-xs"
                  data-testid="sm-strength"
                >
                  {(STRENGTHS.includes(selLink.w) ? STRENGTHS : [...STRENGTHS, selLink.w].sort((a, b) => a - b)).map((s) => (
                    <option key={s} value={String(s)}>
                      {Math.round(s * 100)}%
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
                <input type="checkbox" checked={selLink.delay} onChange={(e) => patchLink(selLink.id, { delay: e.target.checked }, "delay")} className="h-4 w-4 accent-[#F47C20]" />
                <Hourglass size={13} aria-hidden="true" /> {k("delay")}
              </label>
              <button
                type="button"
                disabled={links.some((l) => l.from === selLink.to && l.to === selLink.from)}
                onClick={() => patchLink(selLink.id, { from: selLink.to, to: selLink.from }, "polarity")}
                className={`${btn} border-[#D2DCE8] text-[var(--ink2)] disabled:opacity-40`}
              >
                <ArrowLeftRight size={13} aria-hidden="true" /> {k("reverse")}
              </button>
              <button type="button" onClick={() => deleteLink(selLink.id)} className={`${btn} border-transparent text-red-600 hover:bg-red-50`}>
                <Trash2 size={13} aria-hidden="true" /> {k("deleteLink")}
              </button>
            </>
          ) : (
            <span className="text-xs text-[var(--ink3)]">
              {k("strengthIs", { n: Math.round(selLink.w * 100) })} · {k("fixedPart")}
            </span>
          )}
        </div>
      ) : selNode ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto min-w-0 text-xs text-[var(--ink2)]">
            <strong className="text-sm text-[var(--ink)]">{labelOf(selNode)}</strong>{" "}
            <span className="rounded-full bg-[var(--s2)] px-1.5 py-0.5 font-bold">{k(`kind.${selNode.kind}`)}</span>
            <span className="block">{k(`kindHelp.${selNode.kind}`)}</span>
            <span className="block">{connect ? k("linkFromHint", { v: labelOf(selNode) }) : k("moveHint")}</span>
          </p>
          {mode === "lunch-queue" && selNode.cap !== undefined && (
            <div className="flex items-center gap-1.5" role="group" aria-label={k("helpers")}>
              <span className="text-xs font-bold text-[var(--ink)]">👷 {k("helpersHere", { n: selNode.helpers ?? 0 })}</span>
              <button
                type="button"
                aria-label={k("helperMinus")}
                disabled={(selNode.helpers ?? 0) <= 0}
                onClick={() => setHelpers(selNode.id, (selNode.helpers ?? 0) - 1)}
                className={`${btn} border-[#D2DCE8] disabled:opacity-40`}
                data-testid="sm-helper-minus"
              >
                <Minus size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={k("helperPlus")}
                disabled={helpersUsed >= HELPERS}
                onClick={() => setHelpers(selNode.id, (selNode.helpers ?? 0) + 1)}
                className={`${btn} border-[#D2DCE8] disabled:opacity-40`}
                data-testid="sm-helper-plus"
              >
                <Plus size={13} aria-hidden="true" />
              </button>
              <span className="text-[11px] text-[var(--ink3)]">{k("helpersLeft", { n: HELPERS - helpersUsed, per: HELPER })}</span>
            </div>
          )}
          {canTune && (
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
              {k(selNode.kind === "stock" ? "startAmount" : "baseAmount")}
              <input
                type="number"
                min={0}
                max={1000}
                value={selNode.init}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(1000, Math.round(Number(e.target.value) || 0)));
                  patchNode(selNode.id, { init: v });
                  setLast({ a: "base" });
                }}
                className="w-20 rounded-lg border border-[#D2DCE8] px-2 py-1 text-sm"
                data-testid="sm-init"
              />
            </label>
          )}
          {editable && !selNode.fixed && (
            <button type="button" onClick={() => deleteNode(selNode.id)} className={`${btn} border-transparent text-red-600 hover:bg-red-50`}>
              <Trash2 size={13} aria-hidden="true" /> {k("deleteNode")}
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--ink3)]">{connect ? k("idleLink") : k("idleMove")}</p>
      )}
    </section>
  );

  const loopList = (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white p-3" aria-label={k("loops")} data-testid="sm-loops">
      <h3 className="text-sm font-bold text-[var(--ink)]">
        {k("loops")} <span className="font-normal text-[var(--ink3)]">({loops.length})</span>
      </h3>
      {loops.length === 0 ? (
        <p className="mt-1 text-xs text-[var(--ink3)]">{k("noLoops")}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {loops.map((lp) => {
            const on = highlight === lp.sig;
            const mine = st.labels[lp.sig];
            return (
              <li key={lp.sig} className={`rounded-xl border px-3 py-2 ${on ? "border-[#F47C20] bg-[#FFF8F1]" : "border-[#D2DCE8]"}`} data-loop={lp.nodes.join(">")}>
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setHighlight(on ? null : lp.sig)}
                    aria-pressed={on}
                    aria-label={k("showLoop")}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black ${
                      loopTag(lp).startsWith("R") ? "border-[#C45A0A] text-[#C45A0A]" : loopTag(lp).startsWith("B") ? "border-[#2251A3] text-[#2251A3]" : "border-[#9AAABC] text-[#7A8FA6]"
                    }`}
                  >
                    {loopTag(lp)}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-snug text-[var(--ink)]">{[...lp.nodes, lp.nodes[0]].map(name).join(" → ")}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--ink3)]">
                      {!ch || mine ? k("negCount", { n: lp.negatives }) : k("labelIt")}
                    </p>
                  </div>
                  {ch && mine && (mine === lp.kind ? <CheckCircle2 size={18} className="text-[#0F7B45]" aria-label={k("right")} /> : <XCircle size={18} className="text-[#E34948]" aria-label={k("wrong")} />)}
                </div>
                {ch && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5" role="group" aria-label={k("labelIt")}>
                    {(["R", "B"] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        aria-pressed={mine === kind}
                        onClick={() => setLabel(lp.sig, kind, kind === lp.kind)}
                        className={`min-h-[36px] rounded-lg border-2 px-2 py-1 text-xs font-bold ${
                          mine === kind ? (kind === "R" ? "border-[#C45A0A] bg-[#FEF0E3] text-[#C45A0A]" : "border-[#2251A3] bg-[#EBF0FA] text-[#2251A3]") : "border-[#D2DCE8] text-[var(--ink2)] hover:bg-[var(--s2)]"
                        }`}
                        data-testid={`sm-label-${kind}`}
                      >
                        {k(`kindLoop.${kind}`)} ({kind})
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <details className="mt-3 rounded-xl bg-[var(--s2)] px-3 py-2 text-xs leading-relaxed text-[var(--ink2)]">
        <summary className="cursor-pointer font-semibold text-[var(--ink)]">{k("howTitle")}</summary>
        <p className="mt-1">{k("how.stock")}</p>
        <p className="mt-1">{k("how.arrows")}</p>
        <p className="mt-1">{k("how.loops")}</p>
        <p className="mt-1">{k("how.delays")}</p>
      </details>
    </section>
  );

  const partsBin =
    editable && (bank.length > 0 || !ch) ? (
      <section className="rounded-2xl border border-[#D2DCE8] bg-white p-3" aria-label={k("bank")} data-testid="sm-bank">
        <p className="text-xs font-bold text-[var(--ink2)]">{k("bank")}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {bank.map((key) => {
            const placed = nodes.some((n) => n.key === key);
            return (
              <button
                key={key}
                type="button"
                disabled={placed || nodes.length >= MAX_NODES}
                onClick={() => addPart(key)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-[#D2DCE8] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)] hover:border-[#F47C20] disabled:border-transparent disabled:bg-[var(--s2)] disabled:text-[var(--ink3)]"
                data-testid={`sm-part-${key}`}
              >
                {placed ? "✓" : <Plus size={12} aria-hidden="true" />} {PARTS[key].kind === "flow" ? "⇢" : "▦"} {k(`v.${key}`)}
              </button>
            );
          })}
        </div>
        {!ch && <CustomPart k={k} custom={custom} setCustom={setCustom} onAdd={addCustom} />}
      </section>
    ) : null;

  const lunchPick =
    mode === "lunch-queue" ? (
      <section className="rounded-2xl border-2 border-[#2251A3] bg-[#F5F8FE] p-3" aria-label={k("pickTitle")} data-testid="sm-bottleneck">
        <p className="text-sm font-black text-[var(--ink)]">🔍 {k("pickTitle")}</p>
        <p className="mt-0.5 text-xs text-[var(--ink2)]">{st.ran ? k("pickHelp") : k("pickFirst")}</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {["arrive", "serve", "pay"].map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={st.pick === id}
              disabled={!st.ran}
              onClick={() => {
                update((s) => ({ ...s, pick: id }), false);
                setLast({ a: "pick", right: id === "serve" });
                setClaimed(null);
              }}
              className={`min-h-[44px] rounded-xl border-2 px-2 text-xs font-bold disabled:opacity-50 ${
                st.pick === id ? (id === "serve" ? "border-[#0F7B45] bg-[#E8F7EF] text-[#0B5A33]" : "border-[#D9480F] bg-[#FFF1EA] text-[#8A2E07]") : "border-[#D2DCE8] bg-white text-[var(--ink)]"
              }`}
              data-testid={`sm-pick-${id}`}
            >
              {st.pick === id ? (id === "serve" ? "✅ " : "❌ ") : ""}
              {k(`v.${id}`)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--ink2)]">
          👷 {k("helpersLeft", { n: HELPERS - helpersUsed, per: HELPER })} {k("helpersHow")}
        </p>
      </section>
    ) : null;

  const quiz =
    mode === "feedback-loops" ? (
      <Quiz
        t={t}
        question={k("quiz.q")}
        options={["shout", "rest", "shirts"].map((id) => ({ id, label: k(`quiz.${id}`) }))}
        correct="rest"
        answer={st.q}
        onAnswer={(id) => {
          update((s) => ({ ...s, q: id }), false);
          setClaimed(null);
        }}
        explain={k("quiz.explain")}
        wrongHint={k("quiz.hint")}
        testId="sm-quiz"
      />
    ) : null;

  const nextId = flow.isChallenge ? flow.nextOf(mode) : null;
  const board = flow.isChallenge ? (
    <MissionBoard
      t={t}
      missions={missions}
      onClaim={claim}
      claimed={claimed}
      insight={k(`ch.${mode}.insight`)}
      nextLabel={nextId && claimed && !flow.unlocks.lockedBy(nextId) ? t(`${Y}.goTo`, { name: k(`ch.${nextId}.title`) }) : null}
      onNext={() => nextId && switchMode(nextId)}
    />
  ) : null;

  return framed(
    <Measure className="h-full">
      {(width) => (
        <div className="space-y-3" data-testid="sm-workspace">
          <div className="flex flex-wrap items-start justify-between gap-2 rounded-2xl bg-[var(--s2)] p-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-[var(--ink)]">
                <span aria-hidden="true">{ch ? ICONS[mode] : "🧪"}</span> {ch ? k(`ch.${mode}.title`) : t("studio.sandbox")}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--ink2)]">{k(ch ? `ch.${mode}.story` : "sandboxGoal")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-white p-1" role="group" aria-label={k("tool")}>
                <button
                  type="button"
                  aria-pressed={connect}
                  onClick={() => setConnect(true)}
                  className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-xs font-bold ${connect ? "bg-[#FEF0E3] text-[#C45A0A]" : "text-[var(--ink2)]"}`}
                  data-testid="sm-mode-connect"
                >
                  <Spline size={14} aria-hidden="true" /> {k("modeLink")}
                </button>
                <button
                  type="button"
                  aria-pressed={!connect}
                  onClick={() => setConnect(false)}
                  className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-xs font-bold ${!connect ? "bg-[var(--s2)] text-[var(--ink)]" : "text-[var(--ink2)]"}`}
                  data-testid="sm-mode-move"
                >
                  <MousePointer2 size={14} aria-hidden="true" /> {k("modeMove")}
                </button>
              </div>
              <button
                type="button"
                onClick={resetAll}
                onBlur={() => setConfirmReset(false)}
                className={`${btn} ${confirmReset ? "border-red-300 bg-red-50 text-red-700" : "border-[#D2DCE8] bg-white text-[var(--ink2)]"}`}
                data-testid="sm-reset"
              >
                <RotateCcw size={13} aria-hidden="true" /> {confirmReset ? k("resetSure") : k("reset")}
              </button>
            </div>
          </div>

          {partsBin}

          <p className="rounded-lg bg-[#FEF0E3] px-3 py-1.5 text-xs font-semibold text-[#8A4206]" role="status" aria-live="polite">
            {selection?.type === "node" && connect ? k("linkFromHint", { v: name(selection.id) }) : connect ? k("idleLink") : k("idleMove")}
          </p>

          <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-[#D2DCE8] bg-white">
            <SystemCanvas
              nodes={nodes}
              links={links}
              loops={loops}
              labelOf={labelOf}
              valueOf={(id) => valueAt(id, step)}
              fullOf={fullOf}
              selection={selection}
              linkSource={connect && selection?.type === "node" ? selection.id : null}
              highlight={hl}
              loopTag={loopTag}
              reduceMotion={reduce}
              ariaLabel={k("canvas", { n: nodes.length, l: links.length })}
              nodeAria={(n) => k("nodeAria", { v: labelOf(n), kind: k(`kind.${n.kind}`), n: Math.round(valueAt(n.id, step)) })}
              linkAria={(l) => k("linkAria", { a: name(l.from), b: name(l.to), pol: l.pol === 1 ? k("polSame") : k("polOpposite"), delay: l.delay ? k("withDelay") : "" })}
              fullLabel={k("full")}
              maxLabel={(n) => k("max", { n })}
              onTapNode={tapNode}
              onTapLink={(id) => setSelection({ type: "link", id })}
              onTapEmpty={() => setSelection(null)}
              onMoveNode={(id, x, y) => update((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) }), false)}
            />
          </div>
          {inspector}
          {controls}
          {!sideBySide && <div className="rounded-2xl border border-[#D2DCE8] bg-white p-3">{chart}</div>}

          <div className={width >= 720 ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3" : "space-y-3"}>
            <div className="space-y-3">
              <WhyBox t={t} testId="sm-why">
                {whyText}
              </WhyBox>
              {lunchPick}
              {loopList}
            </div>
            <div className="space-y-3">
              {quiz}
              {board}
              {editable && (
                <details className="rounded-2xl border border-[#D2DCE8] bg-white px-3 py-2">
                  <summary className="cursor-pointer text-xs font-semibold text-[var(--ink)]">{k("formTitle")}</summary>
                  <form
                    className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (linkForm.from && linkForm.to) addLink(linkForm.from, linkForm.to, linkForm.pol === "1" ? 1 : -1);
                    }}
                  >
                    {(["from", "to"] as const).map((f) => (
                      <label key={f} className="text-[11px] font-bold text-[var(--ink2)]">
                        {k(`form.${f}`)}
                        <select
                          value={linkForm[f]}
                          onChange={(e) => setLinkForm({ ...linkForm, [f]: e.target.value })}
                          className="mt-0.5 block w-full rounded-lg border border-[#D2DCE8] bg-white px-2 py-1.5 text-xs font-normal"
                        >
                          <option value="">–</option>
                          {nodes.map((n) => (
                            <option key={n.id} value={n.id}>
                              {labelOf(n)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                    <label className="text-[11px] font-bold text-[var(--ink2)]">
                      {k("polarity")}
                      <select
                        value={linkForm.pol}
                        onChange={(e) => setLinkForm({ ...linkForm, pol: e.target.value as "1" | "-1" })}
                        className="mt-0.5 block w-full rounded-lg border border-[#D2DCE8] bg-white px-2 py-1.5 text-xs font-normal"
                      >
                        <option value="1">+ {k("polSame")}</option>
                        <option value="-1">− {k("polOpposite")}</option>
                      </select>
                    </label>
                    <button
                      type="submit"
                      disabled={!linkForm.from || !linkForm.to || linkForm.from === linkForm.to}
                      className="self-end rounded-lg bg-[var(--ink)] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                      data-testid="sm-form-add"
                    >
                      {k("form.add")}
                    </button>
                  </form>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </Measure>,
  );
}

function CustomPart({
  k,
  custom,
  setCustom,
  onAdd,
}: {
  k: (s: string, v?: Record<string, string | number>) => string;
  custom: { label: string; kind: NodeKind };
  setCustom: (c: { label: string; kind: NodeKind }) => void;
  onAdd: () => void;
}) {
  const id = useId();
  return (
    <form
      className="mt-2 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd();
      }}
    >
      <label className="sr-only" htmlFor={`${id}-name`}>
        {k("newPart")}
      </label>
      <input
        id={`${id}-name`}
        value={custom.label}
        maxLength={40}
        onChange={(e) => setCustom({ ...custom, label: e.target.value })}
        placeholder={k("newPartPh")}
        className="min-w-0 flex-1 rounded-lg border border-[#D2DCE8] px-2.5 py-1.5 text-sm"
      />
      <label className="sr-only" htmlFor={`${id}-kind`}>
        {k("newKind")}
      </label>
      <select
        id={`${id}-kind`}
        value={custom.kind}
        onChange={(e) => setCustom({ ...custom, kind: e.target.value as NodeKind })}
        className="rounded-lg border border-[#D2DCE8] bg-white px-2 py-1.5 text-xs"
      >
        <option value="stock">▦ {k("kind.stock")}</option>
        <option value="flow">⇢ {k("kind.flow")}</option>
      </select>
      <button type="submit" disabled={!custom.label.trim()} className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
        {k("add")}
      </button>
    </form>
  );
}
