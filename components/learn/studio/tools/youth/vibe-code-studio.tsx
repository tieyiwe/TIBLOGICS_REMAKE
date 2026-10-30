"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Circle, Code2, Eye, Hammer, History, Loader2, Play, RotateCcw, ShieldCheck, Sparkles, Undo2, Wand2, XCircle } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import { LiveDot, useStudioLayout } from "../../StudioFrame";
import { useStudioDraft } from "../../useStudioDraft";
import { useMediaQuery } from "../automation/ui";
import { MissionBoard, Quiz, SANDBOX, Y, YouthBar, YouthLocked, missionStars, useChallengeFlow, type Mission, type T } from "./kit";
import { diffStat, withRunner } from "@/lib/learn/labs/code-sandbox";
import { DRAFT_MAX_BYTES, draftBytes } from "@/lib/learn/drafts/shared";
import {
  checkDoc,
  previewDoc,
  vibeProblems,
  wordCount,
  VIBE_MAX_CODE,
  VIBE_MAX_REQUEST,
  VIBE_MAX_SELECTION,
  VIBE_MAX_VERSIONS,
  type VibeProblem,
} from "@/lib/learn/vibe/safety";
import { buggyApp, codeHash, FIX_CHECKS, QUIZ_ANSWER, starterApp, VIBE_IDS, type QuizId, type VibeId } from "./vibe-data";

// Vibe Code Studio (AI-Empowered Youth, ages 10 to 17). The young person
// describes an app; the AI returns the whole single-file app with a plain
// summary of what changed; they Apply it (or not), test it in the live
// preview, fix it by talking or by hand, and every change becomes a version
// they can restore. "Explain this code" explains the selection or the file.
//
// The preview is a sandboxed iframe (allow-scripts only: no same origin, no
// forms, no popups, no top navigation) with a CSP meta that blocks every
// network request (lib/learn/vibe/safety.ts). The AI routes are
// app/api/learn/studio/vibe/{build,explain}. The project for each challenge
// is a server draft ("studio:vibe-code-studio:<challenge>"), so it follows
// the learner to any device.

const TOOL = "vibe-code-studio";
const NS = `studio.${TOOL}`;
const IDS = [...VIBE_IDS] as string[];
const ICONS: Record<string, string> = { "first-app": "🪄", "fix-it": "🐞", "level-up": "🚀" };
const MAX_TURNS = 12;
const SPEC_MIN_WORDS = 2;
const NOTE_MIN_WORDS = 5;
const QUIZ_OPTS: QuizId[] = ["a", "b", "c"];

type Mode = VibeId | typeof SANDBOX;
type Tab = "build" | "preview" | "code";
type Kind = "start" | "ai" | "edit" | "restore" | "undo";

interface Version {
  at: number;
  kind: Kind;
  label: string;
  code: string;
}

interface Turn {
  id: string;
  request: string;
  summary: string;
  changes: string[];
  tryIt: string;
  /** The proposed file, until it is applied or turned down. */
  proposal?: string | null;
  /** The code before the AI asked (to warn), then before applying (for Undo). */
  base?: string | null;
  /** codeHash of the applied code: Undo is offered while the code is still that. */
  appliedHash?: string | null;
  stat?: { a: number; r: number } | null;
  blocked?: VibeProblem[];
  decision?: "applied" | "discarded" | "undone";
}

interface CheckRes {
  id: string;
  pass: boolean;
  kind?: string;
}

interface Project {
  code: string;
  versions: Version[];
  turns: Turn[];
  explains: number;
  quiz: string | null;
  spec: { what: string; who: string; test: string };
  /** When the mini-spec was first complete (level up): changes after it count as the feature. */
  specAt: number | null;
  testNote: string;
  bugNote: string;
  /** The last check run (fix it) and which code it ran on. */
  checks: { hash: string; results: CheckRes[] } | null;
  imported: boolean;
}

interface RunState {
  nonce: string;
  hash: string;
  status: "loading" | "ok" | "error";
  error?: { msg: string; line: number };
}

const newId = () => Math.random().toString(36).slice(2, 10);
const iterationsOf = (p: Project) => p.versions.filter((v) => v.kind === "ai" || v.kind === "edit").length;
const addVersion = (list: Version[], v: Omit<Version, "at">): Version[] => [...list, { ...v, at: Date.now() }].slice(-VIBE_MAX_VERSIONS);

function isProject(v: unknown): v is Project {
  const p = v as Project;
  return !!p && typeof p === "object" && typeof p.code === "string" && p.code.length <= VIBE_MAX_CODE && Array.isArray(p.versions) && Array.isArray(p.turns);
}

/** A saved project, with any field an older save lacks filled in. */
function normalise(v: Project, fresh: Project): Project {
  return {
    ...fresh,
    ...v,
    spec: { ...fresh.spec, ...(v.spec ?? {}) },
    versions: v.versions.filter((x) => x && typeof x.code === "string").slice(-VIBE_MAX_VERSIONS),
    turns: v.turns.filter((x) => x && typeof x.request === "string").slice(-MAX_TURNS),
  };
}

/** Over the server's size limit: drop the oldest versions, then old AI turns. */
function fitProject(p: Project): Project {
  const out = { ...p, versions: [...p.versions], turns: [...p.turns] };
  while (draftBytes(out) > DRAFT_MAX_BYTES && out.versions.length > 1) out.versions.shift();
  while (draftBytes(out) > DRAFT_MAX_BYTES && out.turns.length > 0) out.turns.shift();
  return out;
}

/** What is saved: decided turns lose their copies of the code, except the one Undo needs. */
function forSaving(p: Project): Project {
  const lastApplied = [...p.turns].reverse().find((x) => x.decision === "applied")?.id;
  return {
    ...p,
    turns: p.turns.slice(-MAX_TURNS).map((x) =>
      x.decision ? { ...x, proposal: null, base: x.id === lastApplied ? x.base : null } : x,
    ),
  };
}

export default function VibeCodeStudio({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT() as T;
  const k = useCallback((s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v), [t]);
  const flow = useChallengeFlow({ tool: TOOL, ids: IDS, challengeId, progress, onComplete });
  const mode = flow.mode as Mode;
  const isChallenge = mode !== SANDBOX;
  const layout = useStudioLayout();
  const bigScreen = useMediaQuery("(min-width: 1024px)");
  const wide = bigScreen && layout !== "embedded";

  const freshProject = useCallback(
    (m: Mode): Project => {
      const code =
        m === "fix-it"
          ? buggyApp({
              title: k("bug.title"),
              hint: k("bug.hint"),
              add: k("bug.add"),
              reset: k("bug.reset"),
              c1: k("bug.c1"),
              c2: k("bug.c2"),
              c3: k("bug.c3"),
            })
          : starterApp({ title: k("starter.title"), hint: k("starter.hint") });
      return {
        code,
        versions: [{ at: Date.now(), kind: "start", label: k("history.startLabel"), code }],
        turns: [],
        explains: 0,
        quiz: null,
        spec: { what: "", who: "", test: "" },
        specAt: null,
        testNote: "",
        bugNote: "",
        checks: null,
        imported: false,
      };
    },
    [k],
  );

  // One project per challenge (and one for free building).
  const [projects, setProjects] = useState<Record<string, Project>>({});
  useEffect(() => {
    setProjects((ps) => (ps[mode] ? ps : { ...ps, [mode]: freshProject(mode) }));
  }, [mode, freshProject]);
  const project = projects[mode];
  /** Changes one challenge's project (async work names the challenge it started in). */
  const updateFor = useCallback(
    (m: string, fn: (p: Project) => Project) => setProjects((ps) => (ps[m] ? { ...ps, [m]: fn(ps[m]) } : ps)),
    [],
  );
  const update = useCallback((fn: (p: Project) => Project) => updateFor(mode, fn), [mode, updateFor]);
  const saved = useMemo(() => (project ? forSaving(project) : undefined), [project]);
  useStudioDraft<Project>(
    TOOL,
    mode,
    saved,
    (v) => setProjects((ps) => ({ ...ps, [mode]: normalise(v, ps[mode] ?? freshProject(mode)) })),
    { validate: isProject, fit: fitProject },
  );

  const [tab, setTab] = useState<Tab>("build");
  const [request, setRequest] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [aiLeft, setAiLeft] = useState<number | null>(null);
  const [claimed, setClaimed] = useState<{ stars: number; improved: boolean } | null>(null);
  const [explain, setExplain] = useState<{ text: string; part: boolean } | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [selection, setSelection] = useState("");
  const [flash, setFlash] = useState("");
  const [notice, setNotice] = useState("");
  const composer = useRef<HTMLTextAreaElement>(null);

  const code = project?.code ?? "";
  const hash = useMemo(() => codeHash(code), [code]);

  // ── Live preview ────────────────────────────────────────────────────────
  // A new run (fresh nonce, fresh frame) shortly after the code changes, or
  // at once on Restart / Apply. The frame reports "loaded" and any errors.
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [run, setRun] = useState<{ nonce: string; code: string } | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);
  const runRef = useRef<{ nonce: string; hash: string } | null>(null);
  const restart = useCallback((c: string) => {
    const nonce = newId() + newId();
    const h = codeHash(c);
    runRef.current = { nonce, hash: h };
    setRun({ nonce, code: c });
    setRunState({ nonce, hash: h, status: "loading" });
  }, []);
  useEffect(() => {
    if (!project) return;
    if (runRef.current?.hash === hash) return;
    const id = window.setTimeout(() => restart(project.code), run ? 600 : 0);
    return () => window.clearTimeout(id);
  }, [hash, project, restart, run]);
  const previewSrc = useMemo(() => (run ? previewDoc(run.code, run.nonce) : ""), [run]);

  // ── Fix it: checks in a hidden copy of the app ──────────────────────────
  const checkFrame = useRef<HTMLIFrameElement>(null);
  const [checkSrc, setCheckSrc] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const checkRun = useRef<{ nonce: string; hash: string } | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (watchdog.current) clearTimeout(watchdog.current); }, []);

  const finishChecks = useCallback(
    (h: string, results: CheckRes[]) => {
      if (watchdog.current) clearTimeout(watchdog.current);
      checkRun.current = null;
      setChecking(false);
      setCheckSrc(null);
      update((p) => ({ ...p, checks: { hash: h, results } }));
    },
    [update],
  );

  const runChecks = () => {
    if (checking) return;
    const nonce = newId() + newId();
    checkRun.current = { nonce, hash };
    setChecking(true);
    setCheckSrc(checkDoc(withRunner(code, FIX_CHECKS)));
    if (watchdog.current) clearTimeout(watchdog.current);
    const h = hash;
    watchdog.current = setTimeout(() => {
      if (checkRun.current?.nonce !== nonce) return;
      finishChecks(h, FIX_CHECKS.map((c) => ({ id: c.id, pass: false, kind: "noresponse" })));
    }, 12_000);
  };

  // Messages from the preview and from the check frame.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as Record<string, unknown> | null;
      if (!d || typeof d !== "object") return;
      const cur = runRef.current;
      if (cur && e.source === previewRef.current?.contentWindow && d.vibe === cur.nonce) {
        if (d.type === "loaded") {
          setRunState((s) => (s && s.nonce === cur.nonce && s.status === "loading" ? { ...s, status: "ok" } : s));
        } else if (d.type === "error") {
          const msg = typeof d.message === "string" ? d.message.slice(0, 200) : "Error";
          const line = typeof d.line === "number" && Number.isFinite(d.line) ? Math.max(0, Math.floor(d.line)) : 0;
          setRunState((s) => (s && s.nonce === cur.nonce && !s.error ? { ...s, status: "error", error: { msg, line } } : s));
        }
        return;
      }
      const cr = checkRun.current;
      if (cr && d.type === "tib-check-results" && d.nonce === cr.nonce && e.source === checkFrame.current?.contentWindow) {
        const results = Array.isArray(d.results) ? (d.results as CheckRes[]) : [];
        finishChecks(
          cr.hash,
          FIX_CHECKS.map((c) => {
            const r = results.find((x) => x && x.id === c.id);
            return { id: c.id, pass: r?.pass === true, kind: typeof r?.kind === "string" ? r.kind : undefined };
          }),
        );
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [finishChecks]);

  function onCheckFrameLoad() {
    const nonce = checkRun.current?.nonce;
    if (!nonce) return;
    setTimeout(() => checkFrame.current?.contentWindow?.postMessage({ type: "tib-run-checks", nonce }, "*"), 150);
  }

  // ── Derived progress ────────────────────────────────────────────────────
  const iterations = project ? iterationsOf(project) : 0;
  const runsOk = !!runState && runState.hash === hash && runState.status === "ok";
  const specDone = !!project && (["what", "who", "test"] as const).every((f) => wordCount(project.spec[f]) >= SPEC_MIN_WORDS);
  const featureAdded =
    !!project && project.specAt != null && project.versions.some((v) => (v.kind === "ai" || v.kind === "edit") && v.at > (project.specAt ?? 0));
  const testNoteDone = !!project && wordCount(project.testNote) >= NOTE_MIN_WORDS;
  const checksFresh = !!project?.checks && project.checks.hash === hash;
  const checksPass = checksFresh && project!.checks!.results.length === FIX_CHECKS.length && project!.checks!.results.every((r) => r.pass);
  const quizRight = isChallenge && project?.quiz === QUIZ_ANSWER[mode as VibeId];

  // The plan's time stamp: the first moment all three boxes are filled in.
  useEffect(() => {
    if (mode === "level-up" && specDone && project && project.specAt == null) update((p) => ({ ...p, specAt: Date.now() }));
  }, [mode, specDone, project, update]);

  const missions: Mission[] = useMemo(() => {
    if (!isChallenge || !project) return [];
    const done: Record<VibeId, [boolean, boolean, boolean]> = {
      "first-app": [runsOk && iterations >= 2, project.explains >= 1, quizRight],
      "fix-it": [checksPass, wordCount(project.bugNote) >= NOTE_MIN_WORDS, quizRight],
      "level-up": [specDone && featureAdded && testNoteDone, runsOk, quizRight],
    };
    return done[mode as VibeId].map((d, i) => ({ id: `m${i + 1}`, label: k(`m.${mode}.${i + 1}`), done: d }));
  }, [isChallenge, project, mode, runsOk, iterations, quizRight, checksPass, specDone, featureAdded, testNoteDone, k]);

  const pick = (id: string) => {
    flow.setMode(id);
    setClaimed(null);
    setExplain(null);
    setSelection("");
    setError("");
    setNotice("");
    setRequest("");
    setTab("build");
    runRef.current = null;
    setRun(null);
    setRunState(null);
  };

  const claim = () => {
    if (!isChallenge) return;
    const stars = missionStars(missions);
    if (stars === 0) return;
    const improved = flow.claim(mode, stars);
    setClaimed({ stars, improved });
  };

  // ── AI: build ───────────────────────────────────────────────────────────
  async function ask(text?: string) {
    const req = (text ?? request).trim();
    if (!project || req.length < 3 || asking) return;
    const m = mode;
    setAsking(true);
    setError("");
    const base = project.code;
    const res = await fetch("/api/learn/studio/vibe/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge: mode, code: base, request: req }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : null;
    setAsking(false);
    if (!res || !d) {
      setError(k("err.network"));
      return;
    }
    if (typeof d.aiLeft === "number") setAiLeft(d.aiLeft);
    if (!res.ok) {
      setError(typeof d.error === "string" ? d.error : k("api.failed"));
      return;
    }
    const proposal = typeof d.code === "string" && d.code.length <= VIBE_MAX_CODE ? d.code : null;
    const stat = proposal ? diffStat(base, proposal) : null;
    const turn: Turn = {
      id: newId(),
      request: req,
      summary: typeof d.summary === "string" ? d.summary : "",
      changes: Array.isArray(d.changes) ? d.changes.filter((x: unknown) => typeof x === "string").slice(0, 6) : [],
      tryIt: typeof d.tryIt === "string" ? d.tryIt : "",
      proposal,
      base: proposal ? base : null,
      stat: stat ? { a: stat.added.length, r: stat.removed.length } : null,
      blocked: Array.isArray(d.blocked) ? d.blocked.filter((x: unknown): x is VibeProblem => typeof x === "string") : [],
    };
    updateFor(m, (p) => ({ ...p, turns: [...p.turns, turn].slice(-MAX_TURNS) }));
    setRequest("");
  }

  function applyTurn(turn: Turn) {
    if (!project || !turn.proposal) return;
    if (turn.base != null && turn.base !== project.code && !window.confirm(k("chat.overwrite"))) return;
    const next = turn.proposal;
    update((p) => ({
      ...p,
      code: next,
      versions: addVersion(p.versions, { kind: "ai", label: turn.request.slice(0, 120), code: next }),
      turns: p.turns.map((x) => (x.id === turn.id ? { ...x, decision: "applied", proposal: null, base: p.code, appliedHash: codeHash(next) } : x)),
    }));
    restart(next);
  }

  function discardTurn(turn: Turn) {
    update((p) => ({ ...p, turns: p.turns.map((x) => (x.id === turn.id ? { ...x, decision: "discarded", proposal: null, base: null } : x)) }));
  }

  function undoTurn(turn: Turn) {
    if (turn.base == null) return;
    const back = turn.base;
    update((p) => ({
      ...p,
      code: back,
      versions: addVersion(p.versions, { kind: "undo", label: k("history.undoLabel"), code: back }),
      turns: p.turns.map((x) => (x.id === turn.id ? { ...x, decision: "undone", base: null, appliedHash: null } : x)),
    }));
    restart(back);
  }

  // ── Code: edit, save, explain ───────────────────────────────────────────
  function setCode(c: string) {
    update((p) => ({ ...p, code: c.slice(0, VIBE_MAX_CODE) }));
  }

  function runAndSave() {
    if (!project) return;
    const last = project.versions[project.versions.length - 1];
    if (!last || last.code !== project.code) {
      update((p) => ({ ...p, versions: addVersion(p.versions, { kind: "edit", label: k("history.editLabel"), code: p.code }) }));
      setFlash(k("code.saved", { n: Math.min(VIBE_MAX_VERSIONS, project.versions.length + 1) }));
    } else {
      setFlash(k("code.unchanged"));
    }
    restart(project.code);
  }

  function restore(i: number) {
    if (!project) return;
    const v = project.versions[i];
    if (!v) return;
    update((p) => ({ ...p, code: v.code, versions: addVersion(p.versions, { kind: "restore", label: k("history.restoreLabel", { n: i + 1 }), code: v.code }) }));
    restart(v.code);
  }

  function startOver() {
    if (!window.confirm(k("code.resetConfirm"))) return;
    const fresh = freshProject(mode);
    update((p) => ({ ...p, code: fresh.code, versions: addVersion(p.versions, { kind: "start", label: k("history.startLabel"), code: fresh.code }) }));
    restart(fresh.code);
  }

  async function explainCode() {
    if (!project || explaining) return;
    const part = selection.trim().length > 0;
    const m = mode;
    setExplaining(true);
    setError("");
    const res = await fetch("/api/learn/studio/vibe/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge: mode, code: project.code, ...(part ? { selection: selection.slice(0, VIBE_MAX_SELECTION) } : {}) }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : null;
    setExplaining(false);
    if (!res || !d) {
      setError(k("err.network"));
      return;
    }
    if (typeof d.aiLeft === "number") setAiLeft(d.aiLeft);
    if (!res.ok || typeof d.text !== "string") {
      setError(typeof d.error === "string" ? d.error : k("api.failed"));
      return;
    }
    setExplain({ text: d.text, part });
    updateFor(m, (p) => ({ ...p, explains: p.explains + 1 }));
  }

  // Level up: carry the first app over.
  async function importFirstApp() {
    setNotice("");
    const m = mode;
    let from: string | null = projects["first-app"]?.code ?? null;
    if (!from) {
      const res = await fetch(`/api/learn/drafts?key=${encodeURIComponent(`studio:${TOOL}:first-app`)}`, { cache: "no-store" }).catch(() => null);
      const d = res?.ok ? await res.json().catch(() => null) : null;
      const v = d?.draft?.value as Partial<Project> | undefined;
      if (v && typeof v.code === "string" && v.code.length <= VIBE_MAX_CODE) from = v.code;
    }
    if (!from) {
      setNotice(k("import.none"));
      updateFor(m, (p) => ({ ...p, imported: true }));
      return;
    }
    const c = from;
    updateFor(m, (p) => ({ ...p, code: c, imported: true, versions: addVersion(p.versions, { kind: "start", label: k("history.importLabel"), code: c }) }));
    restart(c);
  }

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(""), 2500);
    return () => window.clearTimeout(id);
  }, [flash]);

  // ── Render ──────────────────────────────────────────────────────────────
  const toolbar = <YouthBar t={t} ns={NS} ids={IDS} icons={ICONS} flow={flow} onPick={pick} />;
  if (flow.lockedBy) {
    return (
      <div className="space-y-3">
        {toolbar}
        <YouthLocked t={t} ns={NS} flow={flow} onGo={pick} />
      </div>
    );
  }
  if (!project) return <div className="space-y-3">{toolbar}<div className="h-48 animate-pulse rounded-xl bg-[var(--s2)]" /></div>;

  const warnings = vibeProblems(code);
  const lastApplied = [...project.turns].reverse().find((x) => x.decision === "applied");
  const nextId = isChallenge ? flow.nextOf(mode) : null;
  const nextOpen = nextId && !flow.unlocks.lockedBy(nextId) ? nextId : null;

  const tabsFor: Tab[] = wide ? ["build", "code"] : ["build", "preview", "code"];
  const leftTab: Tab = tab === "code" ? "code" : "build";
  const TAB_ICON: Record<Tab, ReactNode> = {
    build: <Hammer size={15} aria-hidden="true" />,
    preview: <Eye size={15} aria-hidden="true" />,
    code: <Code2 size={15} aria-hidden="true" />,
  };
  const tabBar = (
    <div role="tablist" aria-label={k("tabs")} className="flex rounded-2xl bg-[#E8EFF8] p-1">
      {tabsFor.map((id) => {
        const on = wide ? leftTab === id : tab === id;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => setTab(id)}
            data-testid={`vibe-tab-${id}`}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
              on ? "bg-white text-[#0D1B2A] shadow-sm" : "text-[#4A5A70] hover:text-[#0D1B2A]"
            }`}
          >
            {TAB_ICON[id]}
            {k(`tab.${id}`)}
            {id === "preview" && (
              <span
                className={`ml-0.5 h-2 w-2 rounded-full ${runState?.status === "error" ? "bg-[#D9480F]" : runState?.status === "ok" ? "bg-[#22C55E]" : "bg-[#9AAABC]"}`}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );

  // Header: the challenge, its goal, AI helps left, changes made.
  const header = (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1B2A] via-[#1B3A6B] to-[#2251A3] p-4 text-white sm:p-5" data-testid="vibe-header" data-mode={mode}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F9A738]">
            <Wand2 size={12} className="mr-1 inline" aria-hidden="true" />
            {t(`${NS}.name`)}
          </p>
          <h2 className="mt-1 text-lg font-black leading-tight sm:text-xl">
            <span aria-hidden="true">{isChallenge ? ICONS[mode] : "🧪"} </span>
            {isChallenge ? k(`ch.${mode}.title`) : t("studio.sandbox")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/85">{isChallenge ? k(`ch.${mode}.goal`) : k("sandboxGoal")}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-white/10 px-3 py-1.5" data-testid="vibe-iterations" data-n={iterations}>
            {k("iterations", { n: iterations })}
          </span>
          {aiLeft != null && (
            <span className="rounded-full bg-[#F47C20]/90 px-3 py-1.5" data-testid="vibe-ai-left" data-n={aiLeft}>
              ✨ {k("aiLeft", { n: aiLeft })}
            </span>
          )}
        </div>
      </div>
    </section>
  );

  const errorBox = error ? (
    <p role="alert" className="rounded-xl border border-[#F5C2B0] bg-[#FFF1EA] px-3 py-2 text-sm text-[#8A2E07]" data-testid="vibe-error">
      {error}
    </p>
  ) : null;

  // ── Preview panel ───────────────────────────────────────────────────────
  const status = runState?.hash === hash ? runState.status : "loading";
  const runErr = runState?.hash === hash ? runState.error : undefined;
  const previewPanel = (
    <section aria-label={k("tab.preview")} className="flex flex-col overflow-hidden rounded-2xl border border-[#D2DCE8] bg-[#0D1B2A]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <LiveDot label={k("preview.live")} />
        <span className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              status === "ok" ? "bg-[#14532D] text-[#BBF7D0]" : status === "error" ? "bg-[#7C2D12] text-[#FED7AA]" : "bg-white/10 text-white/80"
            }`}
            data-testid="vibe-run-status"
            data-status={status}
            role="status"
          >
            {status === "ok" ? <CheckCircle2 size={12} aria-hidden="true" /> : status === "error" ? <AlertTriangle size={12} aria-hidden="true" /> : <Loader2 size={12} className="motion-safe:animate-spin" aria-hidden="true" />}
            {status === "ok" ? k("preview.running") : status === "error" ? k("preview.errorNoLine", { msg: "" }).replace(/[:\s]+$/, "") : k("preview.loading")}
          </span>
          <button
            type="button"
            onClick={() => restart(code)}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
            data-testid="vibe-restart"
          >
            <RotateCcw size={13} aria-hidden="true" /> {k("preview.restart")}
          </button>
        </span>
      </div>
      {runErr && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FFF1EA] px-3 py-2 text-xs text-[#8A2E07]" data-testid="vibe-run-error">
          <span className="min-w-0 break-words font-semibold">
            🐞 {runErr.line ? k("preview.error", { line: runErr.line, msg: runErr.msg }) : k("preview.errorNoLine", { msg: runErr.msg })}
          </span>
          <button
            type="button"
            onClick={() => {
              setRequest(k("preview.fixRequest", { msg: runErr.msg.slice(0, 140), line: runErr.line || "?" }).slice(0, VIBE_MAX_REQUEST));
              setTab("build");
              window.setTimeout(() => composer.current?.focus(), 50);
            }}
            className="rounded-full bg-[#0D1B2A] px-3 py-1.5 font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
            data-testid="vibe-ask-fix"
          >
            {k("preview.askFix")}
          </button>
        </div>
      )}
      <div className={`bg-white ${wide ? "h-[calc(100vh-15rem)] min-h-[440px]" : "h-[min(68vh,560px)]"}`}>
        {run && (
          <iframe
            key={run.nonce}
            ref={previewRef}
            title={k("preview.title")}
            sandbox="allow-scripts"
            srcDoc={previewSrc}
            referrerPolicy="no-referrer"
            className="h-full w-full border-0 bg-white"
            data-testid="vibe-preview"
          />
        )}
      </div>
      <p className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-white/70">
        <ShieldCheck size={13} className="text-[#4ADE80]" aria-hidden="true" /> {k("preview.locked")}
      </p>
    </section>
  );

  // ── Build panel ─────────────────────────────────────────────────────────
  const ideas = [1, 2, 3].map((i) => k(`ideas.${mode}.${i}`)).filter((s, i) => s !== `${NS}.ideas.${mode}.${i + 1}`);
  const buildPanel = (
    <div className="space-y-3" data-testid="vibe-build">
      <details className="rounded-2xl border border-[#D2DCE8] bg-white px-3 py-2 text-sm">
        <summary className="flex min-h-[36px] cursor-pointer list-none items-center gap-2 font-bold text-[var(--ink)]">
          <BookOpen size={15} aria-hidden="true" /> {k("how.title")}
        </summary>
        <ol className="mt-2 space-y-1.5 pb-1">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flex gap-2 text-[var(--ink2)]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B] text-[11px] font-bold text-white">{i}</span>
              <span>{k(`how.s${i}`)}</span>
            </li>
          ))}
        </ol>
      </details>

      {mode === "fix-it" && (
        <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3" data-testid="vibe-fix">
          <h3 className="text-sm font-black text-[var(--ink)]">🐞 {k("fix.title")}</h3>
          <p className="mt-1 text-sm text-[var(--ink2)]">{k("fix.intro")}</p>
          <button
            type="button"
            onClick={runChecks}
            disabled={checking}
            className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0D1B2A] px-4 text-sm font-bold text-white hover:bg-[#1B3A6B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] disabled:opacity-60"
            data-testid="vibe-run-checks"
          >
            {checking ? <Loader2 size={15} className="motion-safe:animate-spin" aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
            {checking ? k("fix.running") : k("fix.run")}
          </button>
          {project.checks && (
            <p className="mt-2 text-xs font-bold" role="status" data-testid="vibe-check-summary" data-pass={checksPass ? "true" : "false"}>
              <span className={checksPass ? "text-[#0F7B45]" : "text-[#C45A0A]"}>
                {k("fix.pass", { p: project.checks.results.filter((r) => r.pass).length, n: FIX_CHECKS.length })}
              </span>
              {!checksFresh && <span className="ml-2 font-normal text-[var(--ink3)]">{k("fix.stale")}</span>}
            </p>
          )}
          <ul className="mt-2 space-y-1.5">
            {FIX_CHECKS.map((c) => {
              const r = checksFresh ? project.checks?.results.find((x) => x.id === c.id) : undefined;
              return (
                <li key={c.id} className="flex items-start gap-2 text-sm" data-testid={`vibe-check-${c.id}`} data-pass={r ? (r.pass ? "true" : "false") : "none"}>
                  {!r ? (
                    <Circle size={17} className="mt-0.5 shrink-0 text-[#9AAABC]" aria-hidden="true" />
                  ) : r.pass ? (
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#0F7B45]" aria-hidden="true" />
                  ) : (
                    <XCircle size={17} className="mt-0.5 shrink-0 text-[#D9480F]" aria-hidden="true" />
                  )}
                  <span className="text-[var(--ink)]">
                    {k(`fix.check.${c.id}`)}
                    {r && !r.pass && (
                      <span className="block text-xs text-[var(--ink3)]">{r.kind === "noresponse" ? k("fix.noresponse") : k(`fix.hint.${c.id}`)}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <label htmlFor="vibe-bugnote" className="mt-3 block text-sm font-bold text-[var(--ink)]">{k("bugNote.label")}</label>
          <textarea
            id="vibe-bugnote"
            rows={2}
            maxLength={600}
            value={project.bugNote}
            onChange={(e) => update((p) => ({ ...p, bugNote: e.target.value }))}
            placeholder={k("bugNote.ph")}
            className="mt-1 w-full rounded-xl border border-[#D2DCE8] px-3 py-2 text-base outline-none focus:border-[#F47C20] sm:text-sm"
            data-testid="vibe-bugnote"
          />
          <p className="text-right text-xs text-[var(--ink3)]">{k("words", { n: wordCount(project.bugNote) })}</p>
          {checkSrc && (
            // Off screen rather than display:none, so the app gets a real layout.
            <iframe
              ref={checkFrame}
              title={k("fix.title")}
              sandbox="allow-scripts"
              srcDoc={checkSrc}
              onLoad={onCheckFrameLoad}
              aria-hidden="true"
              tabIndex={-1}
              className="pointer-events-none fixed left-[-10000px] top-0 h-[600px] w-[800px] opacity-0"
            />
          )}
        </section>
      )}

      {mode === "level-up" && (
        <section className="space-y-3 rounded-2xl border-2 border-[#D2DCE8] bg-white p-3" data-testid="vibe-spec">
          {!project.imported && iterations === 0 && (
            <button
              type="button"
              onClick={importFirstApp}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#F47C20] bg-[#FFF8F1] px-4 text-sm font-bold text-[#B8500A] hover:bg-[#FEF0E3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
              data-testid="vibe-import"
            >
              🪄 {k("import.btn")}
            </button>
          )}
          {notice && <p className="rounded-lg bg-[var(--s2)] px-3 py-2 text-xs text-[var(--ink2)]" role="status">{notice}</p>}
          <div className="flex flex-wrap gap-1.5" aria-hidden="true">
            {([
              ["spec", specDone],
              ["feature", featureAdded],
              ["test", testNoteDone],
            ] as const).map(([id, ok]) => (
              <span
                key={id}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${ok ? "bg-[#E8F7EF] text-[#0B5A33]" : "bg-[var(--s2)] text-[var(--ink3)]"}`}
                data-testid={`vibe-step-${id}`}
                data-done={ok ? "true" : "false"}
              >
                {ok ? "✓" : "○"} {k(`step.${id}`)}
              </span>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--ink)]">📝 {k("spec.title")}</h3>
            <p className="text-xs text-[var(--ink3)]">{k("spec.intro")} {k("spec.min", { n: SPEC_MIN_WORDS })}</p>
          </div>
          {(["what", "who", "test"] as const).map((f) => (
            <div key={f}>
              <label htmlFor={`vibe-spec-${f}`} className="text-sm font-bold text-[var(--ink)]">{k(`spec.${f}`)}</label>
              <input
                id={`vibe-spec-${f}`}
                value={project.spec[f]}
                maxLength={200}
                onChange={(e) => update((p) => ({ ...p, spec: { ...p.spec, [f]: e.target.value } }))}
                placeholder={k(`spec.${f}Ph`)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D2DCE8] px-3 text-base outline-none focus:border-[#F47C20] sm:text-sm"
                data-testid={`vibe-spec-${f}`}
              />
            </div>
          ))}
          {specDone && <p className="rounded-lg bg-[#E8F7EF] px-3 py-2 text-xs font-semibold text-[#0B5A33]">✓ {k("spec.ready")}</p>}
        </section>
      )}

      {/* Conversation */}
      <section className="space-y-3" aria-live="polite" data-testid="vibe-chat">
        {project.turns.length === 0 && <p className="rounded-xl bg-[var(--s2)] px-3 py-3 text-sm text-[var(--ink2)]">{k("chat.empty")}</p>}
        {project.turns.map((turn) => (
          <TurnCard
            key={turn.id}
            k={k}
            turn={turn}
            canUndo={turn.id === lastApplied?.id && turn.appliedHash === hash && turn.base != null}
            onApply={() => applyTurn(turn)}
            onDiscard={() => discardTurn(turn)}
            onUndo={() => undoTurn(turn)}
          />
        ))}
        {asking && (
          <p className="flex items-center gap-2 rounded-xl border border-[#D2DCE8] bg-white px-3 py-3 text-sm font-semibold text-[var(--ink2)]" role="status">
            <Loader2 size={16} className="text-[#F47C20] motion-safe:animate-spin" aria-hidden="true" /> {k("compose.sending")}
          </p>
        )}
      </section>

      {/* Composer */}
      <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3">
        <label htmlFor="vibe-request" className="text-sm font-black text-[var(--ink)]">{k("compose.label")}</label>
        {ideas.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">💡 {k("ideas.title")}</p>
            <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1">
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setRequest(idea);
                    composer.current?.focus();
                  }}
                  className="max-w-[240px] shrink-0 rounded-2xl border border-[#D2DCE8] bg-[#F4F7FB] px-3 py-1.5 text-left text-xs font-semibold text-[var(--ink)] hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
                  data-testid={`vibe-idea-${i + 1}`}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        )}
        <textarea
          id="vibe-request"
          ref={composer}
          rows={3}
          maxLength={VIBE_MAX_REQUEST}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void ask();
            }
          }}
          placeholder={k(`compose.ph.${mode}`)}
          className="mt-2 w-full rounded-xl border border-[#D2DCE8] px-3 py-2 text-base outline-none focus:border-[#F47C20] sm:text-sm"
          data-testid="vibe-request"
        />
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[var(--ink3)]">🔒 {k("compose.privacy")}</p>
          <p className="text-[11px] tabular-nums text-[var(--ink3)]">{k("compose.count", { n: request.length, max: VIBE_MAX_REQUEST })}</p>
        </div>
        {errorBox && <div className="mt-2">{errorBox}</div>}
        <button
          type="button"
          onClick={() => void ask()}
          disabled={asking || request.trim().length < 3}
          className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#F47C20] px-4 text-base font-black text-white shadow hover:bg-[#E05F00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="vibe-send"
        >
          {asking ? <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
          {asking ? k("compose.sending") : k("compose.send")}
        </button>
      </section>

      {mode === "level-up" && (
        <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3">
          <label htmlFor="vibe-testnote" className="text-sm font-black text-[var(--ink)]">🧪 {k("testNote.label")}</label>
          {!featureAdded && <p className="mt-0.5 text-xs text-[var(--ink3)]">{k("testNote.wait")}</p>}
          <textarea
            id="vibe-testnote"
            rows={2}
            maxLength={600}
            value={project.testNote}
            onChange={(e) => update((p) => ({ ...p, testNote: e.target.value }))}
            placeholder={k("testNote.ph")}
            className="mt-1 w-full rounded-xl border border-[#D2DCE8] px-3 py-2 text-base outline-none focus:border-[#F47C20] sm:text-sm"
            data-testid="vibe-testnote"
          />
          <p className="text-right text-xs text-[var(--ink3)]">{k("words", { n: wordCount(project.testNote) })}</p>
        </section>
      )}

      {isChallenge ? (
        <>
          <Quiz
            t={t}
            question={k(`quiz.${mode}.q`)}
            options={QUIZ_OPTS.map((id) => ({ id, label: k(`quiz.${mode}.${id}`) }))}
            correct={QUIZ_ANSWER[mode as VibeId]}
            answer={project.quiz}
            onAnswer={(id) => update((p) => ({ ...p, quiz: id }))}
            explain={k(`quiz.${mode}.explain`)}
            wrongHint={k(`quiz.${mode}.wrong`)}
            testId="vibe-quiz"
          />
          <MissionBoard
            t={t}
            missions={missions}
            onClaim={claim}
            claimed={claimed}
            insight={k(`ch.${mode}.insight`)}
            nextLabel={nextOpen ? t(`${Y}.goTo`, { name: k(`ch.${nextOpen}.title`) }) : null}
            onNext={nextOpen ? () => pick(nextOpen) : undefined}
          />
        </>
      ) : (
        <p className="rounded-xl bg-[#FFF8F1] px-3 py-2 text-xs text-[#7A3E0E]">🧪 {k("sandboxNote")}</p>
      )}

      <HistoryList k={k} versions={project.versions} current={code} onRestore={restore} />
    </div>
  );

  // ── Code panel ──────────────────────────────────────────────────────────
  const codePanel = (
    <div className="space-y-3" data-testid="vibe-code">
      <CodeEditor
        label={k("code.label")}
        linesLabel={k("code.lines", { n: code.split("\n").length })}
        value={code}
        onChange={setCode}
        onSelectText={setSelection}
      />
      {warnings.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-[#F5C2B0] bg-[#FFF1EA] px-3 py-2 text-xs text-[#8A2E07]" data-testid="vibe-warn">
          {warnings.map((w) => <li key={w}>⚠️ {k(`warn.${w}`)}</li>)}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={runAndSave}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F7B45] px-3 text-sm font-black text-white hover:bg-[#0B5A33] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
          data-testid="vibe-run-save"
        >
          <Play size={16} aria-hidden="true" /> {k("code.run")}
        </button>
        <button
          type="button"
          onClick={() => void explainCode()}
          disabled={explaining}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#2251A3] px-3 text-sm font-black text-white hover:bg-[#1B3A6B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2 disabled:opacity-60"
          data-testid="vibe-explain"
          data-part={selection.trim() ? "true" : "false"}
        >
          {explaining ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <BookOpen size={16} aria-hidden="true" />}
          {explaining ? k("code.explaining") : selection.trim() ? k("code.explainSel") : k("code.explainAll")}
        </button>
      </div>
      {flash && <p className="text-center text-xs font-bold text-[#0F7B45]" role="status" data-testid="vibe-flash">{flash}</p>}
      <p className="text-xs text-[var(--ink3)]">💡 {k("code.selHint")}</p>
      {errorBox}
      {explain && (
        <section className="rounded-2xl border border-[#BFD0EE] bg-[#EBF0FA] p-3 text-sm text-[#1B3A6B]" aria-live="polite" data-testid="vibe-explanation">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wide">📖 {k("code.explainTitle")}</h3>
            <button type="button" onClick={() => setExplain(null)} className="text-xs font-bold underline">{k("code.close")}</button>
          </div>
          <Prose text={explain.text} />
        </section>
      )}
      <button
        type="button"
        onClick={startOver}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#D2DCE8] bg-white px-3 text-xs font-bold text-[var(--ink2)] hover:border-[var(--ink3)]"
        data-testid="vibe-reset"
      >
        <RotateCcw size={13} aria-hidden="true" /> {k("code.reset")}
      </button>
    </div>
  );

  return (
    <div className="space-y-3" data-testid="vibe-studio" data-mode={mode} data-wide={wide ? "true" : "false"}>
      {toolbar}
      {header}
      {!wide && tabBar}
      <div className={wide ? "grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-4" : ""}>
        <div className={wide ? "min-w-0 space-y-3" : tab === "preview" ? "hidden" : "min-w-0"}>
          {wide && tabBar}
          {leftTab === "code" ? codePanel : buildPanel}
        </div>
        <div className={wide ? `min-w-0 ${embedded ? "" : "sticky top-20"}` : tab === "preview" ? "min-w-0" : "hidden"}>{previewPanel}</div>
      </div>
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────

type K = (s: string, v?: Record<string, string | number>) => string;

function TurnCard({
  k,
  turn,
  canUndo,
  onApply,
  onDiscard,
  onUndo,
}: {
  k: K;
  turn: Turn;
  canUndo: boolean;
  onApply: () => void;
  onDiscard: () => void;
  onUndo: () => void;
}) {
  const blocked = turn.blocked ?? [];
  return (
    <article className="overflow-hidden rounded-2xl border border-[#D2DCE8] bg-white text-sm" data-testid="vibe-turn" data-decision={turn.decision ?? (turn.proposal ? "pending" : "none")}>
      <p className="border-b border-[#E8EFF8] bg-[#F4F7FB] px-3 py-2 text-[var(--ink)]">
        <strong className="text-[var(--ink3)]">{k("chat.you")}:</strong> {turn.request}
      </p>
      <div className="space-y-2 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#B8500A]">
          <Sparkles size={13} aria-hidden="true" /> {k("chat.ai")}
        </p>
        {turn.summary && <p className="text-[var(--ink)]">{turn.summary}</p>}
        {turn.changes.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[var(--ink3)]">{k("chat.changes")}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[var(--ink2)]">
              {turn.changes.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}
        {turn.stat && (
          <p className="text-xs font-bold" data-testid="vibe-diffstat">
            <span className="text-[#0F7B45]">+{turn.stat.a}</span> / <span className="text-[#C2410C]">−{turn.stat.r}</span>{" "}
            <span className="font-normal text-[var(--ink3)]">{k("chat.lines", { a: turn.stat.a, r: turn.stat.r })}</span>
          </p>
        )}
        {turn.tryIt && (
          <p className="rounded-lg bg-[#FFF8E1] px-2.5 py-1.5 text-xs text-[#5C4300]">
            <strong>👉 {k("chat.try")}:</strong> {turn.tryIt}
          </p>
        )}
        {blocked.length > 0 && (
          <div className="rounded-lg border border-[#F5C2B0] bg-[#FFF1EA] px-2.5 py-2 text-xs text-[#8A2E07]" data-testid="vibe-blocked" data-reasons={blocked.join(",")}>
            <p className="font-bold">🛡️ {k("blocked.title")}</p>
            <ul className="mt-0.5 list-disc pl-4">
              {blocked.map((b) => <li key={b}>{k(`blocked.${b}`)}</li>)}
            </ul>
            <p className="mt-1">{k("blocked.retry")}</p>
          </div>
        )}
        {!turn.proposal && !turn.decision && blocked.length === 0 && <p className="text-xs text-[var(--ink3)]">{k("chat.noCode")}</p>}
      </div>
      {turn.proposal && !turn.decision && (
        <div className="flex gap-2 border-t border-[#E8EFF8] p-3">
          <button
            type="button"
            onClick={onApply}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0F7B45] px-4 text-sm font-black text-white hover:bg-[#0B5A33] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
            data-testid="vibe-apply"
          >
            <CheckCircle2 size={16} aria-hidden="true" /> {k("chat.apply")}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border-2 border-[#D2DCE8] bg-white px-4 text-sm font-bold text-[var(--ink2)] hover:border-[var(--ink3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
            data-testid="vibe-discard"
          >
            {k("chat.discard")}
          </button>
        </div>
      )}
      {turn.decision && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8EFF8] px-3 py-2 text-xs text-[var(--ink3)]">
          <span>
            {turn.decision === "applied" ? `✅ ${k("chat.applied")}` : turn.decision === "undone" ? `↩️ ${k("chat.undone")}` : k("chat.discarded")}
          </span>
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-[#D2DCE8] px-3 font-bold text-[var(--ink)] hover:border-[var(--ink3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
              data-testid="vibe-undo"
            >
              <Undo2 size={13} aria-hidden="true" /> {k("chat.undo")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function HistoryList({ k, versions, current, onRestore }: { k: K; versions: Version[]; current: string; onRestore: (i: number) => void }) {
  const KIND_ICON: Record<Kind, string> = { start: "🏁", ai: "✨", edit: "✍️", restore: "⏪", undo: "↩️" };
  return (
    <details className="rounded-2xl border border-[#D2DCE8] bg-white px-3 py-2 text-sm" data-testid="vibe-history" data-n={versions.length}>
      <summary className="flex min-h-[36px] cursor-pointer list-none items-center gap-2 font-bold text-[var(--ink)]">
        <History size={15} aria-hidden="true" /> {k("history.title", { n: versions.length })}
      </summary>
      {versions.length === 0 ? (
        <p className="py-2 text-xs text-[var(--ink3)]">{k("history.empty")}</p>
      ) : (
        <ol className="mt-1 max-h-[320px] space-y-1.5 overflow-auto pb-1">
          {versions
            .map((v, i) => ({ v, i }))
            .reverse()
            .map(({ v, i }) => {
              const isNow = v.code === current && i === versions.length - 1;
              return (
                <li key={`${v.at}-${i}`} className="flex items-center justify-between gap-2 rounded-xl border border-[#E8EFF8] px-2.5 py-2" data-testid="vibe-version" data-kind={v.kind}>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink3)]">
                      <span className="font-mono">#{i + 1}</span>
                      <span aria-hidden="true">{KIND_ICON[v.kind]}</span> {k(`history.kind.${v.kind}`)}
                    </span>
                    <span className="block truncate text-[var(--ink)]">{v.label}</span>
                  </span>
                  {isNow ? (
                    <span className="shrink-0 rounded-full bg-[#E8F7EF] px-2.5 py-1 text-[11px] font-bold text-[#0B5A33]">{k("history.current")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRestore(i)}
                      className="shrink-0 rounded-full border border-[#D2DCE8] px-3 py-1.5 text-xs font-bold text-[var(--blue2)] hover:border-[var(--ink3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
                      data-testid="vibe-restore"
                    >
                      {k("history.restore")}
                    </button>
                  )}
                </li>
              );
            })}
        </ol>
      )}
    </details>
  );
}

/** A code editor: a textarea with line numbers that scroll with it. */
function CodeEditor({
  label,
  linesLabel,
  value,
  onChange,
  onSelectText,
}: {
  label: string;
  linesLabel: string;
  value: string;
  onChange: (v: string) => void;
  onSelectText: (s: string) => void;
}) {
  const gutter = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const lines = useMemo(() => value.split("\n").length, [value]);
  const readSelection = (el: HTMLTextAreaElement) => onSelectText(el.value.slice(el.selectionStart, el.selectionEnd).slice(0, VIBE_MAX_SELECTION));
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0F172A]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#94A3B8]">
        <span>index.html</span>
        <span>{linesLabel}</span>
      </div>
      <div className="flex h-[min(60vh,460px)] font-mono text-[14px] leading-[22px] sm:text-[13px] sm:leading-[20px]">
        <div ref={gutter} aria-hidden="true" className="w-11 shrink-0 select-none overflow-hidden border-r border-white/5 py-3 pb-12 pr-2 text-right text-[#475569]">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={area}
          value={value}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          maxLength={VIBE_MAX_CODE}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop;
          }}
          onSelect={(e) => readSelection(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key !== "Tab" || e.shiftKey) return;
            e.preventDefault();
            const el = e.currentTarget;
            const s = el.selectionStart, end = el.selectionEnd;
            onChange(value.slice(0, s) + "  " + value.slice(end));
            requestAnimationFrame(() => {
              if (area.current) area.current.selectionStart = area.current.selectionEnd = s + 2;
            });
          }}
          className="min-w-0 flex-1 resize-none whitespace-pre bg-transparent py-3 pl-3 pr-3 text-[#E2E8F0] caret-[#F9A738] outline-none"
          data-testid="vibe-editor"
        />
      </div>
    </div>
  );
}

/** The explanation: plain text with "- " bullets and `code`. React escapes it. */
function Prose({ text }: { text: string }) {
  const inline = (s: string) =>
    s.split(/(`[^`]+`)/g).map((part, i) =>
      part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
        <code key={i} className="rounded bg-white/80 px-1 font-mono text-[12px] text-[#0D1B2A]">{part.slice(1, -1)}</code>
      ) : (
        <span key={i}>{part.replace(/\*\*/g, "")}</span>
      ),
    );
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      const items = list;
      blocks.push(
        <ul key={`u${blocks.length}`} className="list-disc space-y-1 pl-5">
          {items.map((l, i) => <li key={i}>{inline(l)}</li>)}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const m = /^(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (m) list.push(m[1]);
    else {
      flush();
      blocks.push(<p key={`p${blocks.length}`}>{inline(line.replace(/^#+\s*/, ""))}</p>);
    }
  }
  flush();
  return <div className="mt-2 space-y-2 leading-relaxed">{blocks}</div>;
}
