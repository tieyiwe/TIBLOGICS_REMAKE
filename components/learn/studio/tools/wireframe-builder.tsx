"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import { Btn, ChallengePicker, Stars } from "./sorter/kit";
import { CICON, CTYPES, LINKABLE, newComp, newScreen, parseDesign, screenByName, type CType, type Comp, type Design } from "./wireframe/model";
import { WF_BY_ID, WF_CHALLENGES, polishLabels, polishNotes } from "./wireframe/challenges";
import { buildSpec, labelOf } from "./wireframe/spec";
import { Mock } from "./wireframe/Mock";

const NS = "studio.wireframe-builder";
const FREE = "free";
const storeKey = (id: string) => `tib:studio:wireframe:${id}`;

function load(id: string): Design | null {
  try {
    const raw = window.localStorage.getItem(storeKey(id));
    return raw ? parseDesign(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
function save(id: string, d: Design) {
  try {
    window.localStorage.setItem(storeKey(id), JSON.stringify(d));
  } catch {
    // Storage unavailable: the design lives only on this page.
  }
}

export default function WireframeBuilder({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT();
  const reduce = useReducedMotion();
  const k = useCallback((s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v), [t]);

  const [cid, setCid] = useState<string | null>(challengeId && WF_BY_ID.has(challengeId) ? challengeId : null);
  const [design, setDesign] = useState<Design | null>(null);
  const [screenId, setScreenId] = useState<string>("");
  const [sel, setSel] = useState<string | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [pvStack, setPvStack] = useState<string[]>([]);
  const [specTab, setSpecTab] = useState<"stories" | "criteria" | "prompt">("prompt");
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const dragRef = useRef<{ kind: "new"; type: CType } | { kind: "move"; id: string } | null>(null);

  const tabDefault = k("comp.tabs.default");

  // Load (or start) the design when a challenge is chosen.
  useEffect(() => {
    if (!cid) return;
    const stored = load(cid);
    const d: Design = stored ?? { app: "", screens: [newScreen(cid === FREE ? k("freeScreen") : k(`ch.${cid}.screen`))] };
    setDesign(d);
    setScreenId(d.screens[0].id);
    setSel(null);
    setView("edit");
    setResult(null);
    setSubmitted(0);
  }, [cid, k]);

  useEffect(() => {
    if (cid && design) save(cid, design);
  }, [cid, design]);

  const screen = design?.screens.find((s) => s.id === screenId) ?? design?.screens[0];
  const selComp = screen?.comps.find((c) => c.id === sel) ?? null;
  const appFallback = cid && cid !== FREE ? k(`ch.${cid}.name`) : k("myApp");
  const spec = useMemo(() => (design ? buildSpec(design, t, appFallback) : null), [design, t, appFallback]);

  const challenge = cid && cid !== FREE ? WF_BY_ID.get(cid) : undefined;
  const checks = useMemo(() => {
    if (!design || !challenge) return null;
    const req = challenge.checks.map((c) => ({ id: c.id, ok: c.test(design, tabDefault) }));
    const reqOk = req.every((r) => r.ok);
    const labels = polishLabels(design);
    const notes = polishNotes(design);
    const stars = !reqOk ? 0 : labels && notes ? 3 : labels ? 2 : 1;
    return { req, reqOk, labels, notes, stars };
  }, [design, challenge, tabDefault]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const update = (fn: (d: Design) => Design) => setDesign((d) => (d ? fn(d) : d));
  const updateScreen = (id: string, fn: (comps: Comp[]) => Comp[]) =>
    update((d) => ({ ...d, screens: d.screens.map((s) => (s.id === id ? { ...s, comps: fn(s.comps) } : s)) }));
  const patchComp = (id: string, patch: Partial<Comp>) => screen && updateScreen(screen.id, (cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addComp = (type: CType, beforeId?: string | null) => {
    if (!screen) return;
    const c = newComp(type);
    updateScreen(screen.id, (cs) => {
      if (beforeId) {
        const i = cs.findIndex((x) => x.id === beforeId);
        if (i >= 0) return [...cs.slice(0, i), c, ...cs.slice(i)];
      }
      if (sel && beforeId === undefined) {
        const i = cs.findIndex((x) => x.id === sel);
        if (i >= 0) return [...cs.slice(0, i + 1), c, ...cs.slice(i + 1)];
      }
      return [...cs, c];
    });
    setSel(c.id);
  };
  const moveComp = (id: string, dir: -1 | 1) =>
    screen &&
    updateScreen(screen.id, (cs) => {
      const i = cs.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cs.length) return cs;
      const next = cs.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const moveBefore = (id: string, beforeId: string | null) =>
    screen &&
    updateScreen(screen.id, (cs) => {
      const c = cs.find((x) => x.id === id);
      if (!c || id === beforeId) return cs;
      const rest = cs.filter((x) => x.id !== id);
      const i = beforeId ? rest.findIndex((x) => x.id === beforeId) : -1;
      return i >= 0 ? [...rest.slice(0, i), c, ...rest.slice(i)] : [...rest, c];
    });
  const removeComp = (id: string) => {
    if (!screen) return;
    updateScreen(screen.id, (cs) => cs.filter((c) => c.id !== id));
    setSel(null);
  };
  const duplicate = (id: string) => {
    if (!screen) return;
    const src = screen.comps.find((c) => c.id === id);
    if (!src) return;
    const copy = { ...src, id: newComp(src.type).id };
    updateScreen(screen.id, (cs) => {
      const i = cs.findIndex((c) => c.id === id);
      return [...cs.slice(0, i + 1), copy, ...cs.slice(i + 1)];
    });
    setSel(copy.id);
  };
  const addScreen = () => {
    if (!design || design.screens.length >= 8) return;
    const s = newScreen(k("screenN", { n: design.screens.length + 1 }));
    update((d) => ({ ...d, screens: [...d.screens, s] }));
    setScreenId(s.id);
    setSel(null);
  };
  const removeScreen = (id: string) => {
    if (!design || design.screens.length <= 1) return;
    update((d) => ({
      ...d,
      screens: d.screens.filter((s) => s.id !== id).map((s) => ({ ...s, comps: s.comps.map((c) => (c.link === id ? { ...c, link: null } : c)) })),
    }));
    setScreenId(design.screens.find((s) => s.id !== id)!.id);
    setSel(null);
  };
  const reset = () => {
    if (!cid || !window.confirm(k("resetConfirm"))) return;
    const d: Design = { app: "", screens: [newScreen(cid === FREE ? k("freeScreen") : k(`ch.${cid}.screen`))] };
    setDesign(d);
    setScreenId(d.screens[0].id);
    setSel(null);
    setResult(null);
  };

  const copy = async (text: string) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch {
        ok = false;
      }
    }
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 2000);
  };

  const submit = () => {
    if (!checks || !cid || !checks.reqOk) return;
    setResult(checks.stars);
    if (checks.stars > submitted) {
      setSubmitted(checks.stars);
      onComplete({ challengeId: cid, stars: checks.stars as 1 | 2 | 3 });
    }
  };

  // ── Picker ────────────────────────────────────────────────────────────────
  if (!cid) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink2)]">{k("pick")}</p>
        <ChallengePicker
          t={t}
          progress={progress}
          onPick={setCid}
          items={[
            ...WF_CHALLENGES.map((c) => ({ id: c.id, icon: c.icon, name: k(`ch.${c.id}.name`), sub: k(`ch.${c.id}.goal`), difficulty: c.difficulty })),
            { id: FREE, icon: "🧪", name: k("free.name"), sub: k("free.sub") },
          ]}
        />
      </div>
    );
  }

  if (!design || !screen || !spec) return <div className="h-48 animate-pulse rounded-2xl bg-[var(--s2)]" />;

  const screenName = (id: string | null) => (id ? design.screens.find((s) => s.id === id)?.name : undefined);

  // ── Preview helpers ───────────────────────────────────────────────────────
  const pvId = pvStack[pvStack.length - 1] ?? screen.id;
  const pvScreen = design.screens.find((s) => s.id === pvId) ?? screen;
  const go = (id: string) => setPvStack((st) => [...(st.length ? st : [screen.id]), id]);
  const goTab = (name: string) => {
    const s = screenByName(design, name);
    if (s && s.id !== pvScreen.id) go(s.id);
  };

  const phone = (children: React.ReactNode, label: string) => (
    <div className="mx-auto w-full max-w-[340px] rounded-[28px] border-[6px] border-[#0D1B2A] bg-[#0D1B2A] shadow-lg" aria-label={label} role="region">
      <div className="mx-auto my-1 h-1.5 w-16 rounded-full bg-white/30" aria-hidden="true" />
      <div className="min-h-[420px] rounded-[20px] bg-white bg-[radial-gradient(circle,#D2DCE8_1px,transparent_1px)] bg-[length:16px_16px] p-2.5">{children}</div>
    </div>
  );

  const checklist = checks && challenge && (
    <section className="rounded-2xl border-2 border-[var(--border)] bg-white p-3 sm:p-4" aria-labelledby="wf-goal">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id="wf-goal" className="font-black text-[var(--ink)]">
            <span aria-hidden="true">{challenge.icon}</span> {k(`ch.${challenge.id}.name`)}
          </h3>
          <p className="mt-0.5 text-sm text-[var(--ink2)]">{k(`ch.${challenge.id}.goal`)}</p>
        </div>
        <Stars n={checks.stars} size="text-xl" label={k("starsNow", { n: checks.stars })} />
      </div>
      <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
        {checks.req.map((r) => (
          <li key={r.id} className={r.ok ? "text-emerald-700" : "text-[var(--ink2)]"}>
            <span aria-hidden="true">{r.ok ? "✅" : "⬜"}</span> {k(`ch.${challenge.id}.${r.id}`)}
            <span className="sr-only">{r.ok ? k("checkDone") : k("checkTodo")}</span>
          </li>
        ))}
        <li className={checks.labels ? "text-emerald-700" : "text-[var(--ink3)]"}>
          <span aria-hidden="true">{checks.labels ? "⭐" : "☆"}</span> {k("polish.labels")}
        </li>
        <li className={checks.notes ? "text-emerald-700" : "text-[var(--ink3)]"}>
          <span aria-hidden="true">{checks.notes ? "⭐" : "☆"}</span> {k("polish.notes")}
        </li>
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn onClick={submit} disabled={!checks.reqOk}>
          🏁 {k("submit")}
        </Btn>
        {progress[challenge.id]?.perfect ? (
          <Stars n={3} size="text-sm" label={t("studio.perfect")} />
        ) : progress[challenge.id]?.done ? (
          <span className="text-xs font-semibold text-emerald-700">✓ {t("studio.done")}</span>
        ) : null}
        {!checks.reqOk && <span className="text-xs text-[var(--ink3)]">{k("submitHint")}</span>}
      </div>
      {result !== null && (
        <motion.p
          role="status"
          initial={reduce ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-3 rounded-xl bg-[#FDEBDC] p-3 text-sm font-semibold text-[var(--ink)]"
        >
          🎉 {k(result === 3 ? "result.3" : "result.more", { n: result })}
        </motion.p>
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setCid(null)} className="text-xs font-semibold text-[var(--blue2)] underline">
          ← {k("allChallenges")}
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={reset} className="text-xs font-semibold text-[var(--ink3)] underline">
            {k("reset")}
          </button>
        </div>
      </div>
      {cid === FREE && <p className="rounded-2xl bg-[var(--s2)] p-3 text-sm text-[var(--ink2)]">{k("free.intro")}</p>}
      {checklist}

      {/* Screens */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={k("screens")}>
        {design.screens.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === screen.id}
            onClick={() => {
              setScreenId(s.id);
              setSel(null);
              setPvStack([]);
            }}
            className={`min-h-[40px] rounded-xl px-3 py-1.5 text-sm font-semibold ${s.id === screen.id ? "bg-[#0D1B2A] text-white" : "bg-[var(--s2)] text-[var(--ink)] hover:bg-[#FDEBDC]"}`}
          >
            📱 {s.name}
          </button>
        ))}
        <button type="button" onClick={addScreen} disabled={design.screens.length >= 8} className="min-h-[40px] rounded-xl border-2 border-dashed border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--ink2)] hover:border-[#F47C20] disabled:opacity-50">
          + {k("addScreen")}
        </button>
        <div className="ml-auto flex overflow-hidden rounded-xl border-2 border-[var(--border)]" role="group" aria-label={k("mode")}>
          {(["edit", "preview"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => {
                setView(v);
                setPvStack([]);
              }}
              className={`min-h-[40px] px-3 text-sm font-bold ${view === v ? "bg-[#F47C20] text-white" : "bg-white text-[var(--ink2)]"}`}
            >
              {v === "edit" ? `✏️ ${k("edit")}` : `▶ ${k("preview")}`}
            </button>
          ))}
        </div>
      </div>

      {view === "edit" ? (
        <>
          {/* Palette */}
          <div aria-label={k("palette")} role="group">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("palette")}</p>
            <div className="flex flex-wrap gap-1.5">
              {CTYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    dragRef.current = { kind: "new", type };
                    e.dataTransfer.effectAllowed = "copy";
                    e.dataTransfer.setData("text/plain", type);
                  }}
                  onClick={() => addComp(type)}
                  className="min-h-[40px] rounded-xl border-2 border-[var(--border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)] hover:border-[#F47C20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F47C20]"
                  aria-label={k("addX", { x: k(`comp.${type}`) })}
                >
                  <span aria-hidden="true">{CICON[type]}</span> {k(`comp.${type}`)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-[var(--ink3)]">{k("paletteHint")}</p>
          </div>

          <div className={`grid gap-4 ${embedded ? "" : "md:grid-cols-[minmax(0,1fr)_300px]"}`}>
            {/* Canvas */}
            {phone(
              <div
                className="grid min-h-[400px] auto-rows-min grid-cols-2 gap-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dr = dragRef.current;
                  dragRef.current = null;
                  if (dr?.kind === "new") addComp(dr.type, null);
                  else if (dr?.kind === "move") moveBefore(dr.id, null);
                }}
              >
                {screen.comps.length === 0 && (
                  <p className="col-span-2 mt-16 text-center text-sm text-[var(--ink3)]">
                    <span aria-hidden="true" className="block text-3xl">📐</span>
                    {k("emptyCanvas")}
                  </p>
                )}
                {screen.comps.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      dragRef.current = { kind: "move", id: c.id };
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", c.id);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const dr = dragRef.current;
                      dragRef.current = null;
                      if (dr?.kind === "new") addComp(dr.type, c.id);
                      else if (dr?.kind === "move") moveBefore(dr.id, c.id);
                    }}
                    onClick={() => setSel(c.id === sel ? null : c.id)}
                    onKeyDown={(e) => {
                      if (e.altKey && e.key === "ArrowUp") {
                        e.preventDefault();
                        moveComp(c.id, -1);
                      } else if (e.altKey && e.key === "ArrowDown") {
                        e.preventDefault();
                        moveComp(c.id, 1);
                      } else if (e.key === "Delete") {
                        e.preventDefault();
                        removeComp(c.id);
                      }
                    }}
                    aria-pressed={sel === c.id}
                    aria-label={`${i + 1}. ${k(`comp.${c.type}`)}: ${labelOf(c, t)}`}
                    className={`relative rounded-xl p-0.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#2251A3] motion-reduce:transition-none ${c.half ? "col-span-1" : "col-span-2"} ${sel === c.id ? "ring-2 ring-[#F47C20] ring-offset-1" : "hover:ring-1 hover:ring-[var(--border)]"}`}
                  >
                    <Mock c={c} label={labelOf(c, t)} targetName={screenName(c.link)} />
                    {c.note.trim() && c.type !== "input" && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-[#2251A3] px-1 text-[9px] font-bold text-white" title={c.note}>
                        📝
                      </span>
                    )}
                  </button>
                ))}
              </div>,
              k("canvasLabel", { screen: screen.name }),
            )}

            {/* Inspector */}
            <aside className="rounded-2xl border-2 border-[var(--border)] bg-white p-3" aria-label={k("inspector")}>
              {selComp ? (
                <div className="space-y-3">
                  <p className="font-bold text-[var(--ink)]">
                    <span aria-hidden="true">{CICON[selComp.type]}</span> {k(`comp.${selComp.type}`)}
                  </p>
                  <label className="block text-xs font-semibold text-[var(--ink2)]">
                    {selComp.type === "tabs" ? k("field.tabs") : k("field.label")}
                    <input
                      value={selComp.label}
                      maxLength={120}
                      onChange={(e) => patchComp(selComp.id, { label: e.target.value })}
                      placeholder={k(`comp.${selComp.type}.default`)}
                      className="mt-1 w-full rounded-xl border-2 border-[var(--border)] px-2.5 py-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none"
                    />
                  </label>
                  {selComp.type === "tabs" && <p className="text-[11px] text-[var(--ink3)]">{k("field.tabsHint")}</p>}
                  <label className="block text-xs font-semibold text-[var(--ink2)]">
                    {k(`field.note.${selComp.type === "button" || selComp.type === "error" || selComp.type === "input" ? selComp.type : "other"}`)}
                    <textarea
                      value={selComp.note}
                      maxLength={300}
                      rows={2}
                      onChange={(e) => patchComp(selComp.id, { note: e.target.value })}
                      placeholder={k(`field.notePh.${selComp.type === "button" || selComp.type === "error" || selComp.type === "input" ? selComp.type : "other"}`)}
                      className="mt-1 w-full rounded-xl border-2 border-[var(--border)] px-2.5 py-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none"
                    />
                  </label>
                  {LINKABLE.includes(selComp.type) && (
                    <label className="block text-xs font-semibold text-[var(--ink2)]">
                      {selComp.type === "header" ? k("field.back") : k("field.link")}
                      <select
                        value={selComp.link ?? ""}
                        onChange={(e) => patchComp(selComp.id, { link: e.target.value || null })}
                        className="mt-1 w-full rounded-xl border-2 border-[var(--border)] bg-white px-2 py-2 text-sm text-[var(--ink)]"
                      >
                        <option value="">{k("field.noLink")}</option>
                        {design.screens
                          .filter((s) => s.id !== screen.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              → {s.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  {design.screens.length < 2 && LINKABLE.includes(selComp.type) && <p className="text-[11px] text-[var(--ink3)]">{k("field.linkHint")}</p>}
                  <label className="flex items-center gap-2 text-sm text-[var(--ink2)]">
                    <input type="checkbox" checked={selComp.half} onChange={(e) => patchComp(selComp.id, { half: e.target.checked })} className="h-4 w-4 accent-[#F47C20]" />
                    {k("field.half")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <Btn kind="ghost" className="!min-h-[40px] !px-3" onClick={() => moveComp(selComp.id, -1)} ariaLabel={k("moveUp")}>
                      ↑
                    </Btn>
                    <Btn kind="ghost" className="!min-h-[40px] !px-3" onClick={() => moveComp(selComp.id, 1)} ariaLabel={k("moveDown")}>
                      ↓
                    </Btn>
                    <Btn kind="ghost" className="!min-h-[40px] !px-3" onClick={() => duplicate(selComp.id)}>
                      ⧉ {k("duplicate")}
                    </Btn>
                    <Btn kind="ghost" className="!min-h-[40px] !px-3 !text-rose-700" onClick={() => removeComp(selComp.id)}>
                      🗑 {k("delete")}
                    </Btn>
                  </div>
                  <p className="text-[11px] text-[var(--ink3)]">{k("keysHint")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-bold text-[var(--ink)]">{k("screenSettings")}</p>
                  <label className="block text-xs font-semibold text-[var(--ink2)]">
                    {k("field.screenName")}
                    <input
                      value={screen.name}
                      maxLength={40}
                      onChange={(e) => update((d) => ({ ...d, screens: d.screens.map((s) => (s.id === screen.id ? { ...s, name: e.target.value } : s)) }))}
                      className="mt-1 w-full rounded-xl border-2 border-[var(--border)] px-2.5 py-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[var(--ink2)]">
                    {k("field.app")}
                    <input
                      value={design.app}
                      maxLength={60}
                      placeholder={appFallback}
                      onChange={(e) => update((d) => ({ ...d, app: e.target.value }))}
                      className="mt-1 w-full rounded-xl border-2 border-[var(--border)] px-2.5 py-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none"
                    />
                  </label>
                  {design.screens.length > 1 && (
                    <Btn kind="ghost" className="!text-rose-700" onClick={() => removeScreen(screen.id)}>
                      🗑 {k("deleteScreen")}
                    </Btn>
                  )}
                  <p className="text-xs text-[var(--ink3)]">{k("selectHint")}</p>
                </div>
              )}
            </aside>
          </div>
        </>
      ) : (
        <div>
          <div className="mx-auto mb-2 flex max-w-[340px] items-center justify-between gap-2">
            <Btn kind="soft" className="!min-h-[40px]" disabled={pvStack.length < 2} onClick={() => setPvStack((st) => st.slice(0, -1))} ariaLabel={k("pvBack")}>
              ← {k("pvBack")}
            </Btn>
            <span className="truncate text-sm font-bold text-[var(--ink)]">📱 {pvScreen.name}</span>
          </div>
          {phone(
            <div className="grid auto-rows-min grid-cols-2 gap-2">
              {pvScreen.comps.map((c) => {
                const body = (
                  <Mock c={c} label={labelOf(c, t)} preview activeTab={pvScreen.name} onTab={goTab} />
                );
                return c.link && c.type !== "tabs" ? (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => go(c.link!)}
                    className={`rounded-xl text-left transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2251A3] ${c.half ? "col-span-1" : "col-span-2"}`}
                    aria-label={`${labelOf(c, t)} → ${screenName(c.link)}`}
                  >
                    {body}
                  </button>
                ) : (
                  <div key={c.id} className={c.half ? "col-span-1" : "col-span-2"}>
                    {body}
                  </div>
                );
              })}
              {pvScreen.comps.length === 0 && <p className="col-span-2 mt-16 text-center text-sm text-[var(--ink3)]">{k("emptyCanvas")}</p>}
            </div>,
            k("previewLabel", { screen: pvScreen.name }),
          )}
          <p className="mt-2 text-center text-xs text-[var(--ink3)]">{k("previewHint")}</p>
        </div>
      )}

      {/* Spec */}
      <section className="rounded-2xl border-2 border-[#F47C20]/40 bg-white p-3 sm:p-4" aria-labelledby="wf-spec">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="wf-spec" className="font-black text-[var(--ink)]">
            <span aria-hidden="true">📄</span> {k("spec.title")}
          </h3>
          <span className="text-xs text-[var(--ink3)]">{k("spec.live")}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="tablist">
          {(["prompt", "stories", "criteria"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={specTab === tab}
              onClick={() => setSpecTab(tab)}
              className={`min-h-[36px] rounded-xl px-3 text-xs font-bold ${specTab === tab ? "bg-[#0D1B2A] text-white" : "bg-[var(--s2)] text-[var(--ink2)]"}`}
            >
              {k(`spec.${tab}`)}
              {tab === "stories" ? ` (${spec.stories.length})` : tab === "criteria" ? ` (${spec.criteria.length})` : ""}
            </button>
          ))}
        </div>
        <div className="mt-3" role="tabpanel">
          {specTab === "prompt" ? (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[var(--s2)] p-3 text-xs leading-relaxed text-[var(--ink)]">{spec.prompt}</pre>
          ) : specTab === "stories" ? (
            spec.stories.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--ink)]">
                {spec.stories.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--ink3)]">{k("spec.emptyStories")}</p>
            )
          ) : spec.criteria.length ? (
            <ul className="space-y-2">
              {spec.criteria.map((c, i) => (
                <li key={i} className="rounded-xl bg-[var(--s2)] p-2.5 text-sm text-[var(--ink)]">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink3)]">{c.screen}</span>
                  <span className="block">
                    <b className="text-[#2251A3]">{k("spec.given")}</b> {c.given}
                  </span>
                  <span className="block">
                    <b className="text-[#F47C20]">{k("spec.when")}</b> {c.when}
                  </span>
                  <span className="block">
                    <b className="text-emerald-700">{k("spec.then")}</b> {c.then}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--ink3)]">{k("spec.emptyCriteria")}</p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Btn onClick={() => copy(specTab === "prompt" ? spec.prompt : spec.markdown)}>📋 {specTab === "prompt" ? k("spec.copyPrompt") : k("spec.copySpec")}</Btn>
          <span role="status" className="text-xs font-semibold text-emerald-700">
            {copied ? k("spec.copied") : ""}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[var(--ink3)]">{k("spec.tip")}</p>
      </section>
    </div>
  );
}
