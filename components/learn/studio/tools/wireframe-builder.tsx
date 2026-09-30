"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { useStudioLayout, type StudioGuide } from "../StudioFrame";
import { Btn, Stars } from "./sorter/kit";
import { CICON, CTYPES, LINKABLE, newComp, newScreen, parseDesign, type CType, type Comp, type Design } from "./wireframe/model";
import { WF_BY_ID, WF_CHALLENGES, polishLabels, polishNotes } from "./wireframe/challenges";
import { labelOf } from "./wireframe/spec";
import { Mock, Phone } from "./wireframe/Mock";
import WireframeLive from "./wireframe/Live";
import { ChallengeBar, keyList, LockedNotice, Measure, useDebounced, useUnlocks } from "./automation/kit";

const TOOL = "wireframe-builder";
const NS = "studio.wireframe-builder";
const FREE = "free";
const storeKey = (id: string) => `tib:studio:wireframe:${id}`;
const BEST_KEY = "tib:studio:wireframe:best";

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
function loadBest(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export default function WireframeBuilder({ challengeId, onComplete, progress }: StudioToolProps) {
  const t = useT();
  const reduce = !!useReducedMotion();
  const layout = useStudioLayout();
  const unlocks = useUnlocks(TOOL, progress);
  const k = useCallback((s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v), [t]);
  const goalId = useId();

  const [cid, setCid] = useState<string>(() => (challengeId && WF_BY_ID.has(challengeId) ? challengeId : unlocks.firstOpen() ?? WF_CHALLENGES[0].id));
  const [design, setDesign] = useState<Design | null>(null);
  const loadedFor = useRef<string | null>(null);
  const [screenId, setScreenId] = useState<string>("");
  const [sel, setSel] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  const dragRef = useRef<{ kind: "new"; type: CType } | { kind: "move"; id: string } | null>(null);

  const tabDefault = k("comp.tabs.default");

  useEffect(() => setBest(loadBest()), []);

  // Load (or start) the design when a challenge is chosen.
  useEffect(() => {
    const stored = load(cid);
    const d: Design = stored ?? { app: "", screens: [newScreen(cid === FREE ? k("freeScreen") : k(`ch.${cid}.screen`))] };
    loadedFor.current = cid;
    setDesign(d);
    setScreenId(d.screens[0].id);
    setSel(null);
    setResult(null);
    setSubmitted(0);
  }, [cid, k]);

  useEffect(() => {
    // Only save a design under the challenge it was loaded for.
    if (design && loadedFor.current === cid) save(cid, design);
  }, [cid, design]);

  const screen = design?.screens.find((s) => s.id === screenId) ?? design?.screens[0];
  const selComp = screen?.comps.find((c) => c.id === sel) ?? null;
  const appFallback = cid !== FREE ? k(`ch.${cid}.name`) : k("myApp");

  const challenge = cid !== FREE ? WF_BY_ID.get(cid) : undefined;
  const checks = useMemo(() => {
    if (!design || !challenge) return null;
    const req = challenge.checks.map((c) => ({ id: c.id, ok: c.test(design, tabDefault) }));
    const reqOk = req.every((r) => r.ok);
    const labels = polishLabels(design);
    const notes = polishNotes(design);
    const stars = !reqOk ? 0 : labels && notes ? 3 : labels ? 2 : 1;
    return { req, reqOk, labels, notes, stars };
  }, [design, challenge, tabDefault]);

  // The live panel follows the design ~300ms behind the last edit.
  const liveDesign = useDebounced(design, 300);

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
    if (!window.confirm(k("resetConfirm"))) return;
    const d: Design = { app: "", screens: [newScreen(cid === FREE ? k("freeScreen") : k(`ch.${cid}.screen`))] };
    setDesign(d);
    setScreenId(d.screens[0].id);
    setSel(null);
    setResult(null);
  };

  const bestFor = (id: string) => Math.max(best[id] ?? 0, progress[id]?.perfect ? 3 : progress[id]?.done ? 1 : 0);
  const submit = () => {
    if (!checks || !challenge || !checks.reqOk) return;
    setResult(checks.stars);
    if (checks.stars > submitted || !unlocks.done(challenge.id)) {
      setSubmitted(Math.max(submitted, checks.stars));
      if (checks.stars > (best[challenge.id] ?? 0)) {
        const nb = { ...best, [challenge.id]: checks.stars };
        setBest(nb);
        try {
          window.localStorage.setItem(BEST_KEY, JSON.stringify(nb));
        } catch {
          /* storage unavailable */
        }
      }
      unlocks.markDone(challenge.id);
      onComplete({ challengeId: challenge.id, stars: checks.stars as 1 | 2 | 3 });
    }
  };

  // ── Toolbar and guide ─────────────────────────────────────────────────────
  const titleOf = (id: string) => k(`ch.${id}.name`);
  const switchTo = (id: string) => {
    if (id !== cid) setCid(id);
  };
  const toolbar = (
    <ChallengeBar
      t={t}
      label={t("studio.challenges")}
      items={WF_CHALLENGES.map((c) => ({ id: c.id, title: titleOf(c.id), icon: c.icon, difficulty: c.difficulty, stars: bestFor(c.id) }))}
      current={cid}
      onPick={switchTo}
      lockedBy={unlocks.lockedBy}
      titleOf={titleOf}
      levelLabel={(n) => k("level", { n })}
      free={{ id: FREE, label: k("free.name") }}
    />
  );

  const lockedBy = challenge ? unlocks.lockedBy(challenge.id) : null;
  if (challenge && lockedBy) {
    const open = unlocks.firstOpen() ?? WF_CHALLENGES[0].id;
    return (
      <div className="space-y-3">
        {toolbar}
        <LockedNotice t={t} title={titleOf(challenge.id)} prevTitle={titleOf(lockedBy)} goLabel={k("goTo", { name: titleOf(open) })} onGo={() => switchTo(open)} />
      </div>
    );
  }

  if (!design || !screen || !liveDesign) {
    return (
      <div className="space-y-3">
        {toolbar}
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--s2)]" />
      </div>
    );
  }

  const guide: StudioGuide = challenge
    ? {
        goal: k(`ch.${challenge.id}.goal`),
        steps: keyList(t, `${NS}.guide.${challenge.id}.s`),
        stars: [
          <span key="1">
            {k("guide.star1")}
            <ul className="mt-1 space-y-0.5 text-xs">
              {(checks?.req ?? challenge.checks.map((c) => ({ id: c.id, ok: false }))).map((r) => (
                <li key={r.id} className={r.ok ? "text-emerald-700" : ""}>
                  <span aria-hidden="true">{r.ok ? "✅" : "⬜"}</span> {k(`ch.${challenge.id}.${r.id}`)}
                  <span className="sr-only"> {r.ok ? k("checkDone") : k("checkTodo")}</span>
                </li>
              ))}
            </ul>
          </span>,
          k("guide.star2"),
          k("guide.star3"),
        ],
        tips: keyList(t, `${NS}.guide.${challenge.id}.tip`),
      }
    : { goal: k("free.intro"), steps: keyList(t, `${NS}.guide.free.s`), tips: keyList(t, `${NS}.guide.free.tip`) };

  const screenName = (id: string | null) => (id ? design.screens.find((s) => s.id === id)?.name : undefined);
  const overlay = layout === "overlay";

  // ── Workspace pieces ──────────────────────────────────────────────────────
  const checklist = checks && challenge && (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white p-3" aria-labelledby={goalId}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={goalId} className="min-w-0 font-black text-[var(--ink)]">
          <span aria-hidden="true">{challenge.icon}</span> {titleOf(challenge.id)}
        </h2>
        <Stars n={checks.stars} size="text-xl" label={k("starsNow", { n: checks.stars })} />
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
        {checks.req.map((r) => (
          <li key={r.id} className={`rounded-full px-2 py-1 ${r.ok ? "bg-[#E8F7EF] text-emerald-800" : "bg-[var(--s2)] text-[var(--ink2)]"}`}>
            <span aria-hidden="true">{r.ok ? "✅" : "⬜"}</span> {k(`ch.${challenge.id}.${r.id}`)}
            <span className="sr-only"> {r.ok ? k("checkDone") : k("checkTodo")}</span>
          </li>
        ))}
        <li className={`rounded-full px-2 py-1 ${checks.labels ? "bg-[#FFF8E1] text-[#8A6100]" : "bg-[var(--s2)] text-[var(--ink3)]"}`}>
          <span aria-hidden="true">{checks.labels ? "⭐" : "☆"}</span> {k("polish.labels")}
        </li>
        <li className={`rounded-full px-2 py-1 ${checks.notes ? "bg-[#FFF8E1] text-[#8A6100]" : "bg-[var(--s2)] text-[var(--ink3)]"}`}>
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

  const canvas = (h: number) => (
    <Phone label={k("canvasLabel", { screen: screen.name })} minHeight={overlay && h > 0 ? Math.max(440, h - 300) : 440}>
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
            <span aria-hidden="true" className="block text-3xl">
              📐
            </span>
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
            className={`relative rounded-xl p-0.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#2251A3] motion-reduce:transition-none ${c.half ? "col-span-1" : "col-span-2"} ${
              sel === c.id ? "ring-2 ring-[#F47C20] ring-offset-1" : "hover:ring-1 hover:ring-[#D2DCE8]"
            }`}
          >
            <Mock c={c} label={labelOf(c, t)} targetName={screenName(c.link)} />
            {c.note.trim() && c.type !== "input" && (
              <span className="absolute -right-1 -top-1 rounded-full bg-[#2251A3] px-1 text-[9px] font-bold text-white" title={c.note}>
                📝
              </span>
            )}
          </button>
        ))}
      </div>
    </Phone>
  );

  const field = "mt-1 w-full rounded-xl border-2 border-[#D2DCE8] px-2.5 py-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none";
  const inspector = (
    <aside className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3" aria-label={k("inspector")}>
      {selComp ? (
        <div className="space-y-3">
          <p className="font-bold text-[var(--ink)]">
            <span aria-hidden="true">{CICON[selComp.type]}</span> {k(`comp.${selComp.type}`)}
          </p>
          <label className="block text-xs font-semibold text-[var(--ink2)]">
            {selComp.type === "tabs" ? k("field.tabs") : k("field.label")}
            <input value={selComp.label} maxLength={120} onChange={(e) => patchComp(selComp.id, { label: e.target.value })} placeholder={k(`comp.${selComp.type}.default`)} className={field} />
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
              className={field}
            />
          </label>
          {LINKABLE.includes(selComp.type) && (
            <label className="block text-xs font-semibold text-[var(--ink2)]">
              {selComp.type === "header" ? k("field.back") : k("field.link")}
              <select
                value={selComp.link ?? ""}
                onChange={(e) => patchComp(selComp.id, { link: e.target.value || null })}
                className="mt-1 w-full rounded-xl border-2 border-[#D2DCE8] bg-white px-2 py-2 text-sm text-[var(--ink)]"
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
              className={field}
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink2)]">
            {k("field.app")}
            <input value={design.app} maxLength={60} placeholder={appFallback} onChange={(e) => update((d) => ({ ...d, app: e.target.value }))} className={field} />
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
  );

  const workspace = (w: number, h: number) => (
    <div className="flex min-h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!challenge && <h2 className="min-w-0 font-black text-[var(--ink)]">🧪 {k("free.name")}</h2>}
        <button type="button" onClick={reset} className="ml-auto text-xs font-semibold text-[var(--ink3)] underline">
          {k("reset")}
        </button>
      </div>
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
            }}
            className={`min-h-[40px] rounded-xl px-3 py-1.5 text-sm font-semibold ${s.id === screen.id ? "bg-[#0D1B2A] text-white" : "bg-[var(--s2)] text-[var(--ink)] hover:bg-[#FDEBDC]"}`}
          >
            📱 {s.name}
          </button>
        ))}
        <button
          type="button"
          onClick={addScreen}
          disabled={design.screens.length >= 8}
          className="min-h-[40px] rounded-xl border-2 border-dashed border-[#D2DCE8] px-3 py-1.5 text-sm font-semibold text-[var(--ink2)] hover:border-[#F47C20] disabled:opacity-50"
        >
          + {k("addScreen")}
        </button>
      </div>

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
              className="min-h-[40px] rounded-xl border-2 border-[#D2DCE8] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)] hover:border-[#F47C20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F47C20]"
              aria-label={k("addX", { x: k(`comp.${type}`) })}
            >
              <span aria-hidden="true">{CICON[type]}</span> {k(`comp.${type}`)}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-[var(--ink3)]">{k("paletteHint")}</p>
      </div>

      <div className={`flex-1 ${w >= 600 ? "grid grid-cols-[minmax(0,1fr)_minmax(220px,260px)] items-start gap-4" : "space-y-4"}`}>
        {canvas(h)}
        {inspector}
      </div>
    </div>
  );

  return (
    <StudioFrame
      toolbar={toolbar}
      guide={guide}
      liveTitle={k("live.title")}
      live={<WireframeLive t={t} design={liveDesign} screenId={screen.id} appFallback={appFallback} reduce={reduce} tall={overlay} />}
    >
      <Measure className="h-full">{(w, h) => workspace(w, h)}</Measure>
    </StudioFrame>
  );
}
