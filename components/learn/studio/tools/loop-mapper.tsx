"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, CheckCircle2, Circle, Hourglass, LineChart, MousePointer2, Plus, RotateCcw, Spline, Trash2, XCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import MapCanvas, { type Selection } from "./loops/MapCanvas";
import Chart from "./loops/Chart";
import { LOOP_CHALLENGES, LOOP_CHALLENGE_BY_ID, type LoopChallenge } from "./loops/challenges";
import { behaviour, checkReq, findLoops, H, isMapState, simulate, W, type Hint, type Link, type LoopKind, type MapState, type Variable } from "./loops/model";
import { Difficulty, Stars, useMediaQuery, type T } from "./automation/ui";

const P = "studio.loop-mapper";
const SANDBOX = "sandbox";
const BEST_KEY = "tib.studio.loop-mapper.best";
const mapKey = (mode: string) => `tib.studio.loop-mapper.map.${mode}`;
const SANDBOX_BANK = ["customers", "reviews", "wait", "price", "usage", "trust", "mistakes", "review", "pressure", "debt"];

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
    /* storage unavailable */
  }
}

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;

function slotPos(i: number, n: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 3);
  return { x: Math.round(W / 2 + Math.cos(a) * 225), y: Math.round(H / 2 + Math.sin(a) * 160) };
}

function freeSpot(vars: Variable[]) {
  for (let r = 0; r < 6; r++)
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * 2 * Math.PI + r;
      const p = { x: Math.round(W / 2 + Math.cos(a) * r * 38), y: Math.round(H / 2 + Math.sin(a) * r * 28) };
      if (vars.every((v) => Math.abs(v.x - p.x) > 120 || Math.abs(v.y - p.y) > 46)) return p;
    }
  return { x: W / 2, y: H / 2 };
}

function starter(ch: LoopChallenge | null): MapState {
  if (!ch) return { vars: [], links: [], labels: {}, simulated: false };
  const vars = ch.start.vars.map((k) => ({ id: k, key: k, ...slotPos(ch.bank.indexOf(k), ch.bank.length) }));
  const links = (ch.start.links ?? []).map((l) => ({ ...l, id: uid("l") }));
  return { vars, links, labels: {}, simulated: false };
}

interface CheckOut {
  stars: number;
  tiers: boolean[];
  hint: Hint | null;
  judged: Record<string, boolean>;
  improved: boolean;
}

export default function LoopMapper({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT() as T;
  const reduce = !!useReducedMotion();
  const wide = useMediaQuery("(min-width: 1024px)") && !embedded;

  const [best, setBest] = useState<Record<string, number>>(() => load(BEST_KEY, {}));
  const bestFor = useCallback(
    (id: string) => Math.max(best[id] ?? 0, progress[id]?.perfect ? 3 : progress[id]?.done ? 1 : 0),
    [best, progress],
  );
  const [mode, setMode] = useState<string>(() => {
    if (challengeId && LOOP_CHALLENGE_BY_ID.has(challengeId)) return challengeId;
    return LOOP_CHALLENGES.find((c) => !progress[c.id]?.done)?.id ?? LOOP_CHALLENGES[0].id;
  });
  const isSandbox = mode === SANDBOX;
  const ch = isSandbox ? null : LOOP_CHALLENGE_BY_ID.get(mode)!;
  const bank = ch ? ch.bank : SANDBOX_BANK;

  const [maps, setMaps] = useState<Record<string, MapState>>({});
  useEffect(() => {
    if (mode in maps) return;
    const stored = load<unknown>(mapKey(mode), null);
    setMaps((m) => ({ ...m, [mode]: isMapState(stored) ? stored : starter(ch) }));
  }, [mode, maps, ch]);
  const map: MapState = maps[mode] ?? { vars: [], links: [], labels: {}, simulated: false };

  const [selection, setSelection] = useState<Selection>(null);
  const [linkMode, setLinkMode] = useState(true);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [series, setSeries] = useState<number[][] | null>(null);
  const [check, setCheck] = useState<CheckOut | null>(null);
  const [newVar, setNewVar] = useState("");
  const [linkForm, setLinkForm] = useState<{ from: string; to: string; pol: "1" | "-1" }>({ from: "", to: "", pol: "1" });
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState("");

  const labelOfKey = useCallback((k: string) => t(`${P}.v.${k}`), [t]);
  const labelOf = useCallback((v: Variable) => (v.key ? labelOfKey(v.key) : v.label ?? "?"), [labelOfKey]);
  const loops = useMemo(() => findLoops(map.vars, map.links), [map.vars, map.links]);
  const hl = loops.find((l) => l.sig === highlight) ?? null;
  const byId = useMemo(() => new Map(map.vars.map((v) => [v.id, v])), [map.vars]);
  const name = (id: string) => {
    const v = byId.get(id);
    return v ? labelOf(v) : "?";
  };

  const update = (fn: (m: MapState) => MapState, structural = true) => {
    setMaps((all) => {
      const next = fn(all[mode] ?? map);
      save(mapKey(mode), next);
      return { ...all, [mode]: next };
    });
    if (structural) {
      setCheck(null);
      setSeries(null);
    }
  };

  const switchMode = (m: string) => {
    setMode(m);
    setSelection(null);
    setHighlight(null);
    setSeries(null);
    setCheck(null);
    setNotice("");
    setConfirmReset(false);
  };

  // ── Editing ──────────────────────────────────────────────────────────────
  const addBank = (key: string) => {
    if (map.vars.some((v) => v.key === key)) return;
    const pos = slotPos(bank.indexOf(key), bank.length);
    const clash = map.vars.some((v) => Math.abs(v.x - pos.x) < 100 && Math.abs(v.y - pos.y) < 40);
    update((m) => ({ ...m, vars: [...m.vars, { id: key, key, ...(clash ? freeSpot(m.vars) : pos) }] }));
    setNotice(t(`${P}.added`, { v: labelOfKey(key) }));
  };
  const addCustom = () => {
    const label = newVar.trim().slice(0, 40);
    if (!label) return;
    update((m) => ({ ...m, vars: [...m.vars, { id: uid("c"), label, ...freeSpot(m.vars) }] }));
    setNewVar("");
    setNotice(t(`${P}.added`, { v: label }));
  };
  const addLink = (from: string, to: string, pol: 1 | -1 = 1) => {
    if (from === to) return;
    const existing = map.links.find((l) => l.from === from && l.to === to);
    if (existing) {
      setSelection({ type: "link", id: existing.id });
      return;
    }
    const id = uid("l");
    update((m) => ({ ...m, links: [...m.links, { id, from, to, pol, delay: false }] }));
    setSelection({ type: "link", id });
    setNotice(t(`${P}.linkAdded`, { a: name(from), b: name(to) }));
  };
  const patchLink = (id: string, patch: Partial<Link>) => update((m) => ({ ...m, links: m.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const deleteLink = (id: string) => {
    update((m) => ({ ...m, links: m.links.filter((l) => l.id !== id) }));
    setSelection(null);
  };
  const deleteVar = (id: string) => {
    update((m) => ({ ...m, vars: m.vars.filter((v) => v.id !== id), links: m.links.filter((l) => l.from !== id && l.to !== id) }));
    setSelection(null);
    if (nudge === id) setNudge(null);
  };
  const tapVar = (id: string) => {
    if (linkMode && selection?.type === "var" && selection.id !== id) {
      addLink(selection.id, id);
      return;
    }
    setSelection(selection?.type === "var" && selection.id === id ? null : { type: "var", id });
  };
  const setLabel = (sig: string, k: LoopKind) => update((m) => ({ ...m, labels: { ...m.labels, [sig]: k } }), false);
  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    update(() => starter(ch));
    setSelection(null);
    setHighlight(null);
  };

  // ── Simulate & check ─────────────────────────────────────────────────────
  const nudgeId = nudge && byId.has(nudge) ? nudge : loops[0]?.nodes[0] ?? map.vars[0]?.id ?? null;
  const runSim = () => {
    setSeries(simulate(map.vars, map.links, nudgeId));
    if (!map.simulated) update((m) => ({ ...m, simulated: true }), false);
  };

  const runCheck = () => {
    if (!ch) return;
    const m = { ...map };
    const judged: Record<string, boolean> = {};
    const tiers: boolean[] = [];
    let hint: Hint | null = null;
    for (const reqs of ch.tiers) {
      let ok = true;
      for (const r of reqs) {
        const res = checkReq(r, m, loops, labelOfKey);
        for (const j of res.judged ?? []) judged[j.sig] = j.right;
        if (!res.ok) {
          ok = false;
          if (!hint && tiers.every(Boolean)) hint = res.hint ?? null;
        }
      }
      tiers.push(ok);
    }
    let stars = 0;
    for (const x of tiers) {
      if (!x) break;
      stars++;
    }
    let improved = false;
    if (stars > bestFor(ch.id)) {
      improved = true;
      const nb = { ...best, [ch.id]: stars };
      setBest(nb);
      save(BEST_KEY, nb);
      onComplete({ challengeId: ch.id, stars: stars as 1 | 2 | 3 });
    }
    setCheck({ stars, tiers, hint, judged, improved });
  };

  const hintText = (h: Hint) =>
    t(`${P}.hint.${h.key}`, {
      a: "a" in h ? labelOfKey(h.a) : "",
      b: "b" in h ? labelOfKey(h.b) : "",
      v: "v" in h ? labelOfKey(h.v) : "",
      kind: "kind" in h ? t(`${P}.kind.${h.kind}`) : "",
    });

  const selVar = selection?.type === "var" ? byId.get(selection.id) : undefined;
  const selLink = selection?.type === "link" ? map.links.find((l) => l.id === selection.id) : undefined;
  const loopTag = (lp: (typeof loops)[number]) => (isSandbox ? lp.name : map.labels[lp.sig] ?? "?");

  // ── Panels ───────────────────────────────────────────────────────────────
  const inspector = (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white p-4 shadow-sm" aria-label={t(`${P}.inspector`)}>
      {selLink ? (
        <>
          <h3 className="text-sm font-bold text-[var(--ink)]">
            {name(selLink.from)} → {name(selLink.to)}
          </h3>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t(`${P}.polQuestion`, { a: name(selLink.from), b: name(selLink.to) })}</p>
          <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label={t(`${P}.polarity`)}>
            {([1, -1] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={selLink.pol === p}
                onClick={() => patchLink(selLink.id, { pol: p })}
                className={`rounded-xl border-2 px-2 py-2 text-left text-xs font-semibold ${
                  selLink.pol === p ? (p === 1 ? "border-[#2251A3] bg-[#EBF0FA]" : "border-[#D9480F] bg-[#FFF1EA]") : "border-[#D2DCE8] bg-white"
                }`}
              >
                <span className={`text-lg font-black ${p === 1 ? "text-[#2251A3]" : "text-[#D9480F]"}`}>{p === 1 ? "+" : "−"}</span>{" "}
                {t(p === 1 ? `${P}.polSame` : `${P}.polOpposite`)}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--ink)]">
            <input type="checkbox" checked={selLink.delay} onChange={(e) => patchLink(selLink.id, { delay: e.target.checked })} className="h-4 w-4 accent-[#F47C20]" />
            <Hourglass size={14} aria-hidden="true" /> {t(`${P}.delay`)}
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={map.links.some((l) => l.from === selLink.to && l.to === selLink.from)}
              onClick={() => patchLink(selLink.id, { from: selLink.to, to: selLink.from })}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D2DCE8] px-2 py-1 text-xs font-semibold text-[var(--ink2)] hover:bg-[var(--s2)] disabled:opacity-40"
            >
              <ArrowLeftRight size={13} aria-hidden="true" /> {t(`${P}.reverse`)}
            </button>
            <button type="button" onClick={() => deleteLink(selLink.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
              <Trash2 size={13} aria-hidden="true" /> {t(`${P}.deleteLink`)}
            </button>
          </div>
        </>
      ) : selVar ? (
        <>
          <h3 className="text-sm font-bold text-[var(--ink)]">{labelOf(selVar)}</h3>
          <p className="mt-1 text-xs text-[var(--ink3)]">{linkMode ? t(`${P}.linkFromHint`, { v: labelOf(selVar) }) : t(`${P}.moveHint`)}</p>
          {!selVar.key && (
            <label className="mt-2 block text-xs font-bold text-[var(--ink2)]">
              {t(`${P}.rename`)}
              <input
                value={selVar.label ?? ""}
                maxLength={40}
                onChange={(e) => update((m) => ({ ...m, vars: m.vars.map((v) => (v.id === selVar.id ? { ...v, label: e.target.value } : v)) }), false)}
                className="mt-1 block w-full rounded-lg border border-[#D2DCE8] px-2.5 py-1.5 text-sm font-normal"
              />
            </label>
          )}
          <button type="button" onClick={() => deleteVar(selVar.id)} className="mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
            <Trash2 size={13} aria-hidden="true" /> {t(`${P}.deleteVar`)}
          </button>
        </>
      ) : (
        <p className="text-sm text-[var(--ink3)]">{linkMode ? t(`${P}.idleLink`) : t(`${P}.idleMove`)}</p>
      )}
    </section>
  );

  const loopList = (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white p-4 shadow-sm" aria-label={t(`${P}.loops`)}>
      <h3 className="text-sm font-bold text-[var(--ink)]">
        {t(`${P}.loops`)} <span className="font-normal text-[var(--ink3)]">({loops.length})</span>
      </h3>
      {loops.length === 0 ? (
        <p className="mt-1 text-xs text-[var(--ink3)]">{t(`${P}.noLoops`)}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {loops.map((lp) => {
            const on = highlight === lp.sig;
            const mine = map.labels[lp.sig];
            const judged = check?.judged[lp.sig];
            return (
              <li key={lp.sig} className={`rounded-xl border px-3 py-2 ${on ? "border-[#F47C20] bg-[#FFF8F1]" : "border-[#D2DCE8]"}`}>
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setHighlight(on ? null : lp.sig)}
                    aria-pressed={on}
                    aria-label={t(`${P}.showLoop`)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black ${
                      loopTag(lp).startsWith("R") ? "border-[#C45A0A] text-[#C45A0A]" : loopTag(lp).startsWith("B") ? "border-[#2251A3] text-[#2251A3]" : "border-[#9AAABC] text-[#7A8FA6]"
                    }`}
                  >
                    {loopTag(lp)}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-snug text-[var(--ink)]">
                      {[...lp.nodes, lp.nodes[0]].map(name).join(" → ")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--ink3)]">
                      {lp.hasDelay ? `⏳ ${t(`${P}.hasDelay`)} · ` : ""}
                      {isSandbox || judged !== undefined
                        ? t(`${P}.negCount`, { n: lp.negatives, kind: t(`${P}.kind.${lp.kind}`) })
                        : t(`${P}.labelIt`)}
                    </p>
                  </div>
                  {judged !== undefined && (judged ? <CheckCircle2 size={18} className="text-[#0F7B45]" aria-label={t(`${P}.right`)} /> : <XCircle size={18} className="text-[#E34948]" aria-label={t(`${P}.wrong`)} />)}
                </div>
                {!isSandbox && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5" role="group" aria-label={t(`${P}.labelIt`)}>
                    {(["R", "B"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={mine === k}
                        onClick={() => setLabel(lp.sig, k)}
                        className={`rounded-lg border-2 px-2 py-1 text-xs font-bold ${
                          mine === k ? (k === "R" ? "border-[#C45A0A] bg-[#FEF0E3] text-[#C45A0A]" : "border-[#2251A3] bg-[#EBF0FA] text-[#2251A3]") : "border-[#D2DCE8] text-[var(--ink2)] hover:bg-[var(--s2)]"
                        }`}
                      >
                        {t(`${P}.kind.${k}`)} ({k})
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
        <summary className="cursor-pointer font-semibold text-[var(--ink)]">{t(`${P}.howTitle`)}</summary>
        <p className="mt-1">{t(`${P}.how1`)}</p>
        <p className="mt-1">{t(`${P}.how2`)}</p>
        <p className="mt-1">{t(`${P}.how3`)}</p>
      </details>
    </section>
  );

  const reduceMotionCss = reduce;

  return (
    <div className="space-y-4">
      {/* Picker */}
      <nav aria-label={t("studio.challenges")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {LOOP_CHALLENGES.map((c, i) => {
          const active = mode === c.id;
          const s = bestFor(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => switchMode(c.id)}
              aria-current={active ? "true" : undefined}
              className={`flex min-w-[150px] shrink-0 flex-col items-start rounded-2xl border-2 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
                active ? "border-[#F47C20] bg-[#FEF0E3]" : "border-[#D2DCE8] bg-white hover:border-[#F47C20]"
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2 text-[11px] font-bold text-[var(--ink3)]">
                <span>{t(`${P}.level`, { n: i + 1 })}</span>
                <Difficulty d={c.difficulty} label={t(`studio.difficulty.${c.difficulty}`)} />
              </span>
              <span className="mt-0.5 text-sm font-bold leading-snug text-[var(--ink)]">{t(`${P}.ch.${c.id}.title`)}</span>
              <span className="mt-1">
                <Stars n={s} size={13} label={t(`${P}.starsN`, { n: s })} />
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => switchMode(SANDBOX)}
          aria-current={isSandbox ? "true" : undefined}
          className={`flex min-w-[130px] shrink-0 flex-col items-start justify-center rounded-2xl border-2 border-dashed px-3 py-2 text-left ${
            isSandbox ? "border-[#2251A3] bg-[#EBF0FA]" : "border-[#B8C4D3] bg-white hover:border-[#2251A3]"
          }`}
        >
          <span className="text-lg" aria-hidden="true">🧪</span>
          <span className="text-sm font-bold text-[var(--ink)]">{t("studio.sandbox")}</span>
        </button>
      </nav>

      {/* Scenario */}
      <section className="rounded-2xl border border-[#D2DCE8] bg-white p-4 shadow-sm">
        {ch ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#C45A0A]">{t(`${P}.scenario`)}</p>
              <h2 className="mt-0.5 text-lg font-black leading-snug text-[var(--ink)]">{t(`${P}.ch.${ch.id}.title`)}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{t(`${P}.ch.${ch.id}.story`)}</p>
            </div>
            <div className="rounded-xl bg-[var(--s2)] p-3">
              <ol className="space-y-1.5">
                {[0, 1, 2].map((i) => {
                  const ok = check?.tiers[i];
                  const Icon = !check ? Circle : ok ? CheckCircle2 : XCircle;
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm leading-snug text-[var(--ink2)]">
                      <Icon
                        size={16}
                        className={`mt-0.5 shrink-0 ${!check ? "text-[#B8C4D3]" : ok ? "text-[#0F7B45]" : "text-[#E34948]"}`}
                        aria-label={!check ? t(`${P}.pending`) : ok ? t(`${P}.right`) : t(`${P}.notYet`)}
                      />
                      <span>
                        <Stars n={i + 1} size={11} label={t(`${P}.starsN`, { n: i + 1 })} /> <span className="ml-1">{t(`${P}.ch.${ch.id}.t${i + 1}`)}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-black text-[var(--ink)]">🧪 {t(`${P}.sandboxTitle`)}</h2>
            <p className="mt-1 text-sm text-[var(--ink2)]">{t(`${P}.sandboxBody`)}</p>
          </>
        )}
      </section>

      {/* Workspace */}
      <div className={wide ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]" : "space-y-4"}>
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-3 shadow-sm sm:p-4" aria-label={t(`${P}.workspace`)}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-[var(--s2)] p-1" role="group" aria-label={t(`${P}.tool`)}>
              <button
                type="button"
                aria-pressed={linkMode}
                onClick={() => setLinkMode(true)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${linkMode ? "bg-white text-[#C45A0A] shadow-sm" : "text-[var(--ink2)]"}`}
              >
                <Spline size={14} aria-hidden="true" /> {t(`${P}.modeLink`)}
              </button>
              <button
                type="button"
                aria-pressed={!linkMode}
                onClick={() => setLinkMode(false)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${!linkMode ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--ink2)]"}`}
              >
                <MousePointer2 size={14} aria-hidden="true" /> {t(`${P}.modeMove`)}
              </button>
            </div>
            <button
              type="button"
              onClick={reset}
              onBlur={() => setConfirmReset(false)}
              className={`ml-auto inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${
                confirmReset ? "border-red-300 bg-red-50 text-red-700" : "border-[#D2DCE8] text-[var(--ink2)] hover:bg-[var(--s2)]"
              }`}
            >
              <RotateCcw size={13} aria-hidden="true" /> {confirmReset ? t(`${P}.resetSure`) : t(`${P}.reset`)}
            </button>
          </div>

          <div className="mt-3">
            <p className="text-xs font-bold text-[var(--ink2)]">{t(`${P}.bank`)}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {bank.map((k) => {
                const placed = map.vars.some((v) => v.key === k);
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={placed}
                    onClick={() => addBank(k)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#D2DCE8] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)] transition-transform hover:-translate-y-0.5 hover:border-[#F47C20] disabled:translate-y-0 disabled:border-transparent disabled:bg-[var(--s2)] disabled:text-[var(--ink3)]"
                  >
                    {placed ? "✓" : <Plus size={12} aria-hidden="true" />} {labelOfKey(k)}
                  </button>
                );
              })}
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addCustom();
              }}
            >
              <label className="sr-only" htmlFor="lm-newvar">{t(`${P}.newVar`)}</label>
              <input
                id="lm-newvar"
                value={newVar}
                maxLength={40}
                onChange={(e) => setNewVar(e.target.value)}
                placeholder={t(`${P}.newVarPh`)}
                className="min-w-0 flex-1 rounded-lg border border-[#D2DCE8] px-2.5 py-1.5 text-sm"
              />
              <button type="submit" className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40" disabled={!newVar.trim()}>
                {t(`${P}.add`)}
              </button>
            </form>
          </div>

          <p className="mt-3 rounded-lg bg-[#FEF0E3] px-3 py-1.5 text-xs font-semibold text-[#8A4206]" role="status" aria-live="polite">
            {selection?.type === "var" && linkMode ? t(`${P}.linkFromHint`, { v: name(selection.id) }) : notice || (linkMode ? t(`${P}.idleLink`) : t(`${P}.idleMove`))}
          </p>

          <div className="mt-2 overflow-x-auto overscroll-x-contain rounded-xl border border-[#D2DCE8]">
            <MapCanvas
              vars={map.vars}
              links={map.links}
              loops={loops}
              labelOf={labelOf}
              selection={selection}
              linkSource={linkMode && selection?.type === "var" ? selection.id : null}
              highlight={hl}
              loopTag={loopTag}
              reduceMotion={reduceMotionCss}
              ariaLabel={t(`${P}.canvas`, { v: map.vars.length, l: map.links.length })}
              varAria={(v) => t(`${P}.varAria`, { v: labelOf(v) })}
              linkAria={(l) => t(`${P}.linkAria`, { a: name(l.from), b: name(l.to), pol: l.pol === 1 ? t(`${P}.polSameShort`) : t(`${P}.polOppositeShort`), delay: l.delay ? t(`${P}.withDelay`) : "" })}
              onTapVar={tapVar}
              onTapLink={(id) => setSelection({ type: "link", id })}
              onTapEmpty={() => setSelection(null)}
              onMoveVar={(id, x, y) => update((m) => ({ ...m, vars: m.vars.map((v) => (v.id === id ? { ...v, x, y } : v)) }), false)}
            />
          </div>

          {/* Keyboard / small-screen friendly link form */}
          <details className="mt-3 rounded-xl border border-[#D2DCE8] px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--ink)]">{t(`${P}.formTitle`)}</summary>
            <form
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (linkForm.from && linkForm.to) addLink(linkForm.from, linkForm.to, linkForm.pol === "1" ? 1 : -1);
              }}
            >
              {(["from", "to"] as const).map((f) => (
                <label key={f} className="text-[11px] font-bold text-[var(--ink2)]">
                  {t(`${P}.form.${f}`)}
                  <select
                    value={linkForm[f]}
                    onChange={(e) => setLinkForm({ ...linkForm, [f]: e.target.value })}
                    className="mt-0.5 block w-full rounded-lg border border-[#D2DCE8] bg-white px-2 py-1.5 text-xs font-normal"
                  >
                    <option value="">–</option>
                    {map.vars.map((v) => (
                      <option key={v.id} value={v.id}>{labelOf(v)}</option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="text-[11px] font-bold text-[var(--ink2)]">
                {t(`${P}.polarity`)}
                <select value={linkForm.pol} onChange={(e) => setLinkForm({ ...linkForm, pol: e.target.value as "1" | "-1" })} className="mt-0.5 block w-full rounded-lg border border-[#D2DCE8] bg-white px-2 py-1.5 text-xs font-normal">
                  <option value="1">+ {t(`${P}.polSameShort`)}</option>
                  <option value="-1">− {t(`${P}.polOppositeShort`)}</option>
                </select>
              </label>
              <button type="submit" disabled={!linkForm.from || !linkForm.to || linkForm.from === linkForm.to} className="self-end rounded-lg bg-[var(--ink)] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                {t(`${P}.form.add`)}
              </button>
            </form>
          </details>
        </section>

        <aside className={wide ? "space-y-4 lg:sticky lg:top-4" : "space-y-4"}>
          {inspector}
          {loopList}
        </aside>
      </div>

      {/* Simulation */}
      <section className="rounded-2xl border border-[#D2DCE8] bg-white p-4 shadow-sm" aria-label={t(`${P}.simTitle`)}>
        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={runSim}
            disabled={map.links.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2251A3] px-4 py-2.5 text-sm font-bold text-white shadow hover:-translate-y-0.5 disabled:opacity-40"
          >
            <LineChart size={16} aria-hidden="true" /> {t(`${P}.simulate`)}
          </button>
          <label className="text-xs font-bold text-[var(--ink2)]">
            {t(`${P}.nudge`)}
            <select
              value={nudgeId ?? ""}
              onChange={(e) => {
                setNudge(e.target.value);
                setSeries(null);
              }}
              className="mt-0.5 block rounded-lg border border-[#D2DCE8] bg-white px-2 py-1.5 text-xs font-normal"
            >
              {map.vars.map((v) => (
                <option key={v.id} value={v.id}>{labelOf(v)}</option>
              ))}
            </select>
          </label>
          {ch && (
            <button
              type="button"
              onClick={runCheck}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#F47C20] px-5 py-2.5 text-sm font-black text-white shadow hover:-translate-y-0.5 hover:bg-[#E05F00]"
            >
              <CheckCircle2 size={16} aria-hidden="true" /> {t(`${P}.check`)}
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-[var(--ink3)]">{t(`${P}.simHint`)}</p>

        {check && ch && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl bg-[#FFF8E1] p-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center gap-2">
              <motion.span initial={reduce ? false : { scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 12 }}>
                <Stars n={check.stars} size={22} label={t(`${P}.starsN`, { n: check.stars })} />
              </motion.span>
              <span className="text-sm font-bold text-[#8A6100]">{t(`${P}.cheer.${check.stars}`)}</span>
              {check.improved && <span className="text-xs font-semibold text-[#C45A0A]">{t(`${P}.newBest`)}</span>}
            </div>
            <p className="mt-1 text-sm text-[var(--ink)]">{check.hint ? `💡 ${hintText(check.hint)}` : `🎉 ${t(`${P}.ch.${ch.id}.insight`)}`}</p>
          </motion.div>
        )}

        {series && (
          <div className="mt-4">
            <Chart
              series={series}
              names={map.vars.map(labelOf)}
              title={t(`${P}.chartTitle`, { v: nudgeId ? name(nudgeId) : "" })}
              stepLabel={t(`${P}.step`)}
              tableLabel={t(`${P}.table`)}
            />
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {map.vars.map((v, i) => (
                <li key={v.id} className="text-xs text-[var(--ink2)]">
                  <strong className="text-[var(--ink)]">{labelOf(v)}:</strong> {t(`${P}.beh.${behaviour(series[i])}`)}
                </li>
              ))}
            </ul>
            <p className="mt-2 rounded-lg bg-[#EBF0FA] p-2.5 text-xs leading-relaxed text-[var(--ink)]">
              {t(
                `${P}.simNote.${
                  loops.length === 0 ? "none" : loops.every((l) => l.kind === "R") ? "r" : loops.every((l) => l.kind === "B") ? (loops.some((l) => l.hasDelay) ? "bDelay" : "b") : "mixed"
                }`,
              )}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
