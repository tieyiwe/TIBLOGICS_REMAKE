"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { type StudioGuide } from "../../StudioFrame";
import { useStudioDraft } from "../../useStudioDraft";
import { Btn, Stars } from "../sorter/kit";
import { DeckBar, LockedDeck, useDeckLocks } from "../sorter/deck-bar";
import {
  ASK_FIRST,
  CHALLENGE_SCOPE,
  DOORS,
  DOOR_BY_N,
  DOOR_GROUPS,
  GROUP_COLOR,
  GROUP_ICON,
  VIEW_SCOPE,
  doorText,
  type Door,
  type DoorGroup,
} from "./doors";

// The 30 Doors: a pre-launch security audit. The learner works through each
// door on their own app (or the sample app from the lab): why it matters, a
// two-minute check, a prompt for their AI coding assistant, then marks it
// Checked, Not applicable or Needs work. Every view shares one audit, saved
// as a draft ("studio:security-doors:audit"), so marks made in a lesson show
// up on the Studio page and on any device. Challenges (one per group, then
// the full launch audit) earn stars when every door in them is marked.

const TOOL = "security-doors";
const NS = `studio.${TOOL}`;
const FREE = "free";
const DRAFT_ID = "audit";
const NOTE_MIN = 8;

type Status = "ok" | "na" | "fix";
interface Mark {
  s: Status;
  n?: string;
}
interface Audit {
  v: 1;
  d: Record<string, Mark>;
}

const EMPTY: Audit = { v: 1, d: {} };
const STATUS_ORDER: Status[] = ["ok", "na", "fix"];
const STATUS_ICON: Record<Status, string> = { ok: "✅", na: "➖", fix: "🛠️" };
const STATUS_STYLE: Record<Status, string> = {
  ok: "border-emerald-600 bg-emerald-50 text-emerald-800",
  na: "border-slate-500 bg-slate-50 text-slate-700",
  fix: "border-amber-600 bg-amber-50 text-amber-900",
};
const STATUS_FILL: Record<Status | "none", string> = {
  ok: "#1F8A55",
  na: "#94A3B8",
  fix: "#D97706",
  none: "#E2E8F0",
};

function isAudit(v: unknown): v is Audit {
  if (!v || typeof v !== "object") return false;
  const a = v as Audit;
  if (a.v !== 1 || !a.d || typeof a.d !== "object") return false;
  return Object.values(a.d).every(
    (m) => !!m && typeof m === "object" && STATUS_ORDER.includes((m as Mark).s) && ((m as Mark).n === undefined || typeof (m as Mark).n === "string"),
  );
}

const hasNote = (m?: Mark) => !!m && (m.n ?? "").trim().length >= NOTE_MIN;

/** 0: not finished; 1 all marked; 2 notes on every N/A and Needs work; 3 nothing left to fix. */
export function doorStars(scope: number[], d: Record<string, Mark>): 0 | 1 | 2 | 3 {
  if (scope.some((n) => !d[n])) return 0;
  const open = scope.map((n) => d[n]).filter((m) => m.s !== "ok");
  if (!open.every(hasNote)) return 1;
  return open.some((m) => m.s === "fix") ? 2 : 3;
}

/** Inline `code` in door texts. */
function Rich({ text }: { text: string }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <code key={i} className="rounded bg-[var(--s2)] px-1 py-0.5 font-mono text-[0.85em] text-[var(--ink)]">
            {p}
          </code>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const copy = useCallback(async (id: string, text: string) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setCopied(id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 2000);
  }, []);
  return { copied, copy };
}

export default function SecurityDoors({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT();
  const locale = useLocale();
  const reduce = !!useReducedMotion();
  const k = useCallback((s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v), [t]);
  const locks = useDeckLocks(TOOL, progress);
  const { copied, copy } = useCopy();

  const initial = challengeId && (CHALLENGE_SCOPE[challengeId] || VIEW_SCOPE[challengeId]) ? challengeId : null;
  const [picked, setPicked] = useState<string | null>(initial);
  const scopeId = picked ?? FREE;
  const isChallenge = scopeId in CHALLENGE_SCOPE;
  const isView = scopeId in VIEW_SCOPE;
  const askFirst = ASK_FIRST.has(scopeId);
  const scope = useMemo(() => CHALLENGE_SCOPE[scopeId] ?? VIEW_SCOPE[scopeId] ?? DOORS.map((d) => d.n), [scopeId]);

  const [audit, setAudit] = useState<Audit>(EMPTY);
  useStudioDraft<Audit>(TOOL, DRAFT_ID, audit, (v) => setAudit(v), { validate: isAudit, delay: 800 });
  const d = audit.d;

  const groupsInScope = useMemo(() => DOOR_GROUPS.filter((g) => scope.some((n) => DOOR_BY_N.get(n)?.group === g)), [scope]);
  const [group, setGroup] = useState<DoorGroup | "all">("all");
  const shown = useMemo(() => scope.filter((n) => group === "all" || DOOR_BY_N.get(n)?.group === group), [scope, group]);

  const firstOpen = scope.find((n) => !d[n]) ?? null;
  const [openN, setOpenN] = useState<number | null>(null);
  // Open the first unmarked door once the saved audit has had a chance to load.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    const h = window.setTimeout(() => {
      opened.current = true;
      setOpenN((o) => o ?? firstOpen ?? scope[0] ?? null);
    }, 600);
    return () => window.clearTimeout(h);
  }, [firstOpen, scope]);

  const [result, setResult] = useState<{ stars: 0 | 1 | 2 | 3 } | null>(null);
  const [announce, setAnnounce] = useState("");

  const marked = scope.filter((n) => d[n]).length;
  const counts = useMemo(() => {
    const c = { ok: 0, na: 0, fix: 0 };
    for (const n of scope) if (d[n]) c[d[n].s]++;
    return c;
  }, [scope, d]);
  const stars = doorStars(scope, d);
  const complete = marked === scope.length;

  const pick = (id: string) => {
    setPicked(id === FREE ? null : id);
    setGroup("all");
    setResult(null);
    const sc = CHALLENGE_SCOPE[id] ?? VIEW_SCOPE[id] ?? DOORS.map((x) => x.n);
    setOpenN(sc.find((n) => !d[n]) ?? sc[0] ?? null);
  };

  const setMark = (n: number, s: Status) => {
    setResult(null);
    setAudit((a) => {
      const prev = a.d[String(n)];
      return { v: 1, d: { ...a.d, [String(n)]: { s, ...(prev?.n ? { n: prev.n } : {}) } } };
    });
    const door = DOOR_BY_N.get(n);
    setAnnounce(k("marked", { n, status: k(`status.${s}`), title: door ? doorText(door, locale).title : "" }));
    // Checked: move on to the next unmarked door. N/A and Needs work: stay for the note.
    if (s === "ok") {
      const next = scope.find((x) => x !== n && !d[x]);
      if (next) setOpenN(next);
    }
  };
  const setNote = (n: number, note: string) => {
    setResult(null);
    setAudit((a) => {
      const prev = a.d[String(n)];
      if (!prev) return a;
      return { v: 1, d: { ...a.d, [String(n)]: { s: prev.s, n: note.slice(0, 600) } } };
    });
  };
  const clearScope = () => {
    if (!window.confirm(k("resetConfirm"))) return;
    setAudit((a) => {
      const next = { ...a.d };
      for (const n of scope) delete next[String(n)];
      return { v: 1, d: next };
    });
    setResult(null);
    setOpenN(scope[0] ?? null);
  };

  const finish = () => {
    if (!complete) return;
    setResult({ stars });
    if (isChallenge && stars > 0 && !locks.isLocked(scopeId)) {
      locks.markDone(scopeId);
      onComplete({ challengeId: scopeId, stars: stars as 1 | 2 | 3 });
    }
  };

  const reportText = useMemo(() => {
    const name = isChallenge || isView ? k(`deck.${scopeId}.name`) : k("deck.free.name");
    const lines = [`# ${k("report.title")}: ${name}`, "", k("report.summary", { done: marked, total: scope.length, ok: counts.ok, na: counts.na, fix: counts.fix }), ""];
    for (const g of groupsInScope) {
      lines.push(`## ${GROUP_ICON[g]} ${k(`group.${g}`)}`);
      for (const n of scope) {
        const door = DOOR_BY_N.get(n);
        if (!door || door.group !== g) continue;
        const m = d[n];
        const status = m ? `${STATUS_ICON[m.s]} ${k(`status.${m.s}`)}` : `⬜ ${k("status.none")}`;
        lines.push(`- ${k("doorN", { n })} ${doorText(door, locale).title}: ${status}${m?.n?.trim() ? `. ${m.n.trim()}` : ""}`);
      }
      lines.push("");
    }
    return lines.join("\n").trim();
  }, [isChallenge, isView, k, scopeId, marked, scope, counts, groupsInScope, d, locale]);

  // ── Toolbar, guide, live panel ────────────────────────────────────────────
  const deckName = (id: string) => k(`deck.${id}.name`);
  const toolbar = (
    <DeckBar
      t={t}
      label={k("decks")}
      progress={progress}
      active={scopeId}
      onPick={pick}
      isLocked={locks.isLocked}
      lockHint={(id) => {
        const prev = locks.prevOf(id);
        return t("studio.lockedHint", { prev: prev ? deckName(prev) : "" });
      }}
      items={[
        ...(isView ? [{ id: scopeId, icon: "🎯", name: deckName(scopeId), free: true }] : []),
        ...locks.order.map((id) => ({ id, icon: id === "launch" ? "🚀" : GROUP_ICON[id as DoorGroup], name: deckName(id) })),
        { id: FREE, icon: "🗺️", name: deckName(FREE), free: true },
      ]}
    />
  );

  const guide: StudioGuide = {
    goal: k(isChallenge ? `guide.goal.${scopeId}` : isView ? "guide.goal.view" : "guide.goal.free"),
    steps: [k("guide.step1"), k("guide.step2"), k("guide.step3"), k("guide.step4"), k(isChallenge ? "guide.step5" : "guide.step5view")],
    stars: [k("guide.star1"), k("guide.star2"), k("guide.star3")],
    tips: [k("guide.tip1"), k("guide.tip2")],
  };

  const live = (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("live.map")}</p>
        <div className="mt-2 space-y-1.5">
          {DOOR_GROUPS.map((g) => (
            <div key={g} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-center" aria-hidden="true">
                {GROUP_ICON[g]}
              </span>
              <div className="flex flex-wrap gap-1" role="list" aria-label={k(`group.${g}`)}>
                {DOORS.filter((x) => x.group === g).map((x) => {
                  const m = d[x.n];
                  const inScope = scope.includes(x.n);
                  return (
                    <button
                      key={x.n}
                      type="button"
                      role="listitem"
                      onClick={() => inScope && setOpenN(x.n)}
                      disabled={!inScope}
                      title={`${k("doorN", { n: x.n })} ${doorText(x, locale).title}`}
                      aria-label={`${k("doorN", { n: x.n })}: ${m ? k(`status.${m.s}`) : k("status.none")}`}
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold ${inScope ? "" : "opacity-30"} ${openN === x.n ? "ring-2 ring-[#F47C20]" : ""}`}
                      style={{ background: STATUS_FILL[m?.s ?? "none"], color: m ? "#fff" : "#475569" }}
                    >
                      {x.n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--ink3)]">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_FILL[s] }} aria-hidden="true" />
              {k(`status.${s}`)}
            </span>
          ))}
        </p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("live.fixList", { n: counts.fix })}</p>
        {counts.fix === 0 ? (
          <p className="mt-1 text-[var(--ink3)]">{k("live.fixNone")}</p>
        ) : (
          <ul className="mt-1 space-y-1.5">
            {scope
              .filter((n) => d[n]?.s === "fix")
              .map((n) => {
                const door = DOOR_BY_N.get(n)!;
                return (
                  <li key={n} className="rounded-lg bg-amber-50 p-2">
                    <span className="font-semibold text-amber-900">
                      {k("doorN", { n })} {doorText(door, locale).title}
                    </span>
                    <span className="block text-xs text-amber-900/80">{d[n].n?.trim() || k("live.noPlan")}</span>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
      <div>
        <Btn kind="ghost" className="w-full" onClick={() => copy("report", reportText)}>
          {copied === "report" ? <Check size={16} /> : <Copy size={16} />} {copied === "report" ? k("copied") : k("copyReport")}
        </Btn>
        <p className="mt-1 text-[11px] text-[var(--ink3)]">{k("reportHint")}</p>
      </div>
    </div>
  );

  const framed = (body: ReactNode) => (
    <StudioFrame toolbar={toolbar} guide={guide} live={live} liveTitle={k("live.title")}>
      {body}
    </StudioFrame>
  );

  if (isChallenge && locks.isLocked(scopeId)) {
    const go = locks.firstOpen;
    return framed(
      <LockedDeck
        icon={scopeId === "launch" ? "🚀" : GROUP_ICON[scopeId as DoorGroup]}
        name={deckName(scopeId)}
        title={t("studio.locked")}
        hint={t("studio.lockedHint", { prev: deckName(locks.prevOf(scopeId) ?? "") })}
        goLabel={go ? k("lockedGo", { deck: deckName(go) }) : null}
        onGo={() => go && pick(go)}
      />,
    );
  }

  const pct = scope.length ? marked / scope.length : 0;

  return framed(
    <div className="space-y-3">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {/* Header and meter */}
      <div className="rounded-2xl bg-[var(--s2)] p-3 sm:p-4">
        <p className="font-bold text-[var(--ink)]">
          <span aria-hidden="true">{isChallenge ? (scopeId === "launch" ? "🚀" : GROUP_ICON[scopeId as DoorGroup]) : isView ? "🎯" : "🗺️"}</span>{" "}
          {deckName(scopeId)}
        </p>
        <p className="mt-0.5 text-sm text-[var(--ink2)]">{k(`deck.${scopeId}.sub`)}</p>
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span className="font-black text-[var(--ink)]" data-meter>
            {k("meter", { n: marked, total: scope.length })}
          </span>
          <span className="text-xs text-[var(--ink2)]">
            {STATUS_ICON.ok} {counts.ok} · {STATUS_ICON.na} {counts.na} · {STATUS_ICON.fix} {counts.fix}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={scope.length} aria-valuenow={marked} aria-label={k("meterLabel")}>
          <motion.div
            className="h-full rounded-full bg-[#F47C20]"
            initial={false}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: reduce ? 0 : 0.3 }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--ink3)]">{k("sharedNote")}</p>
      </div>

      {/* Group filter */}
      {groupsInScope.length > 1 && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label={k("filter")}>
          {(["all", ...groupsInScope] as Array<DoorGroup | "all">).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
              className={`min-h-[36px] shrink-0 rounded-full border px-3 text-xs font-bold ${group === g ? "border-[#F47C20] bg-[#FEF0E3] text-[var(--ink)]" : "border-[#D2DCE8] bg-white text-[var(--ink2)]"}`}
            >
              {g === "all" ? k("allGroups") : `${GROUP_ICON[g]} ${k(`group.${g}`)}`}
            </button>
          ))}
        </div>
      )}

      {/* Door cards */}
      <ol className="space-y-2">
        {shown.map((n) => (
          <DoorCard
            key={n}
            door={DOOR_BY_N.get(n)!}
            mark={d[n]}
            open={openN === n}
            askFirst={askFirst}
            locale={locale}
            k={k}
            copied={copied === `p${n}`}
            onCopy={(text) => copy(`p${n}`, text)}
            onToggle={() => setOpenN((o) => (o === n ? null : n))}
            onMark={(s) => setMark(n, s)}
            onNote={(v) => setNote(n, v)}
            onNext={() => {
              const i = scope.indexOf(n);
              const next = scope.slice(i + 1).find((x) => !d[x]) ?? scope.find((x) => !d[x]) ?? scope[i + 1] ?? null;
              setOpenN(next);
            }}
          />
        ))}
      </ol>

      {/* Finish */}
      <div className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3 sm:p-4" data-finish>
        {result ? (
          <div className="text-center">
            <Stars n={result.stars} size="text-3xl" label={k("starsLabel", { n: result.stars })} />
            <p className="mt-1 font-black text-[var(--ink)]">{k(`result.${result.stars}`)}</p>
            <p className="mt-1 text-sm text-[var(--ink2)]">{k("result.counts", { ok: counts.ok, na: counts.na, fix: counts.fix })}</p>
            {!isChallenge && <p className="mt-2 text-xs text-[var(--ink3)]">{k("result.practice")}</p>}
            {isChallenge && result.stars < 3 && <p className="mt-2 text-xs text-[var(--ink3)]">{k("result.again")}</p>}
            {isChallenge && (() => {
              const next = locks.nextOpen(scopeId);
              return next ? (
                <Btn kind="ghost" className="mt-3" onClick={() => pick(next)}>
                  {k("next", { deck: deckName(next) })} →
                </Btn>
              ) : null;
            })()}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--ink2)]">{complete ? k("readyToFinish") : k("notYet", { n: scope.length - marked })}</p>
            <Btn onClick={finish} disabled={!complete}>
              ★ {k("finish")}
            </Btn>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={clearScope} className="text-xs font-semibold text-[var(--ink3)] underline hover:text-[var(--ink)]">
          {k("reset")}
        </button>
      </div>
    </div>,
  );
}

function DoorCard({
  door,
  mark,
  open,
  askFirst,
  locale,
  k,
  copied,
  onCopy,
  onToggle,
  onMark,
  onNote,
  onNext,
}: {
  door: Door;
  mark?: Mark;
  open: boolean;
  askFirst: boolean;
  locale: Locale;
  k: (s: string, v?: Record<string, string | number>) => string;
  copied: boolean;
  onCopy: (text: string) => void;
  onToggle: () => void;
  onMark: (s: Status) => void;
  onNote: (v: string) => void;
  onNext: () => void;
}) {
  const tx = doorText(door, locale);
  const color = GROUP_COLOR[door.group];
  const bodyId = `door-${door.n}-body`;
  const ref = useRef<HTMLLIElement>(null);
  const wasOpen = useRef(open);
  useEffect(() => {
    // Bring a door that just opened into view (not on first render).
    if (open && !wasOpen.current) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    wasOpen.current = open;
  }, [open]);

  const ask = (
    <div className="rounded-xl border border-[#D2DCE8] bg-[#F4F7FB] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">🗣️ {k("card.ask")}</p>
      <p className="mt-1 text-sm text-[var(--ink)]">{tx.ask}</p>
    </div>
  );

  return (
    <li ref={ref} className="rounded-2xl border-2 bg-white" style={{ borderColor: mark ? STATUS_FILL[mark.s] : "#D2DCE8" }} data-door={door.n} data-status={mark?.s ?? "none"}>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={bodyId} className="flex w-full items-start gap-3 p-3 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white" style={{ background: color }} aria-hidden="true">
          {door.n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
            {k("doorN", { n: door.n })} · {k(`group.${door.group}`)}
          </span>
          <span className="block font-bold leading-snug text-[var(--ink)]">{tx.title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {mark && (
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[mark.s]}`}>
              {STATUS_ICON[mark.s]} <span className="hidden sm:inline">{k(`status.${mark.s}`)}</span>
            </span>
          )}
          <ChevronDown size={18} className={`text-[var(--ink3)] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </span>
      </button>
      {open && (
        <div id={bodyId} className="space-y-3 border-t border-[#E5EBF2] p-3 text-sm leading-relaxed text-[var(--ink2)]">
          {askFirst && ask}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">💡 {k("card.why")}</p>
            <p className="mt-1">{tx.why}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">⏱️ {k("card.test")}</p>
            <p className="mt-1">
              <Rich text={tx.test} />
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">🤖 {k("card.prompt")}</p>
              <button
                type="button"
                onClick={() => onCopy(tx.prompt)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#D2DCE8] bg-white px-3 text-xs font-bold text-[var(--ink)] hover:border-[#F47C20]"
                aria-label={k("copyPromptLabel", { n: door.n })}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? k("copied") : k("copy")}
              </button>
            </div>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-[#0D1B2A] p-3 font-mono text-xs leading-relaxed text-[#E6EDF6]">{tx.prompt}</pre>
          </div>
          {!askFirst && (
            <details className="rounded-xl bg-[#F4F7FB] p-2.5 text-sm">
              <summary className="cursor-pointer text-xs font-bold text-[var(--ink2)]">🗣️ {k("card.askToggle")}</summary>
              <p className="mt-1 text-[var(--ink)]">{tx.ask}</p>
            </details>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("card.mark")}</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2" role="group" aria-label={k("card.mark")}>
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={mark?.s === s}
                  data-mark={s}
                  onClick={() => onMark(s)}
                  className={`min-h-[48px] rounded-xl border-2 px-1 text-xs font-bold sm:text-sm ${mark?.s === s ? STATUS_STYLE[s] : "border-[#D2DCE8] bg-white text-[var(--ink2)] hover:border-[var(--ink3)]"}`}
                >
                  <span aria-hidden="true">{STATUS_ICON[s]}</span> {k(`status.${s}`)}
                </button>
              ))}
            </div>
          </div>
          {mark && mark.s !== "ok" && (
            <label className="block">
              <span className="text-xs font-bold text-[var(--ink2)]">{k(mark.s === "fix" ? "note.fix" : "note.na")}</span>
              <textarea
                value={mark.n ?? ""}
                onChange={(e) => onNote(e.target.value)}
                rows={2}
                maxLength={600}
                placeholder={k(mark.s === "fix" ? "note.fixPh" : "note.naPh")}
                className="mt-1 w-full rounded-xl border border-[#D2DCE8] bg-white p-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none"
              />
              {!hasNote(mark) && <span className="text-[11px] text-[var(--ink3)]">{k("note.need")}</span>}
            </label>
          )}
          {mark && (
            <div className="flex justify-end">
              <Btn kind="soft" onClick={onNext}>
                {k("nextDoor")} →
              </Btn>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
