"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowUp, Check as CheckIcon, EyeOff, FlaskConical, Lightbulb, Lock, Minus, Play, RotateCcw, Target, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { testBench } from "@/lib/learn/studio/tools/test-bench";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { useStudioLayout, type StudioGuide } from "../StudioFrame";
import { useStudioDraft } from "../useStudioDraft";
import {
  CASES,
  CASE_EMOJI,
  CHALLENGE_TASK,
  CHECKS,
  CUSTOM,
  PLANTED,
  PLANTED_MAX_CHECKS,
  TASKS,
  cellResult,
  checkResult,
  failingChecks,
  passRate,
  simulateCustom,
  type BenchTask,
  type Case,
  type Cell,
  type Check,
} from "./prompts/bench-data";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CHIP,
  ChallengeBar,
  CopyButton,
  Illustrative,
  LockedNotice,
  ResultCard,
  TryForReal,
  nextChallenge,
  useChallengeFlow,
  useDebounced,
} from "./prompts/ui";

const NS = "studio.test-bench";

export default function TestBench({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const flow = useChallengeFlow({ toolId: testBench.id, challenges: testBench.challenges, challengeId, progress, freePlay: true, onComplete });
  const [freeTask, setFreeTask] = useState("ticket");
  const [run, setRun] = useState(0);
  const toolbar = <ChallengeBar ns={NS} flow={flow} compact={embedded} />;
  const current = flow.current && CHALLENGE_TASK[flow.current] ? flow.current : null;
  if (current && flow.isLocked(current)) {
    return (
      <div className="space-y-3">
        {toolbar}
        <LockedNotice ns={NS} flow={flow} id={current} />
      </div>
    );
  }
  const taskId = current ? CHALLENGE_TASK[current] : freeTask;
  return (
    <Bench
      key={`${current ?? `free-${freeTask}`}-${run}`}
      challengeId={current}
      task={TASKS.find((x) => x.id === taskId)!}
      toolbar={toolbar}
      onRetry={() => setRun((r) => r + 1)}
      onNext={(id) => flow.pick(id)}
      onPickTask={setFreeTask}
      onComplete={flow.complete}
    />
  );
}

interface Setup {
  cases: Case[];
  checks: Check[];
  custom: string;
}

/** A saved bench setup, as restored from a draft. */
const isSetup = (v: unknown): v is Setup => {
  const r = v as Partial<Setup> | null;
  return (
    !!r &&
    Array.isArray(r.cases) && r.cases.every((c) => (CASES as readonly string[]).includes(c)) &&
    Array.isArray(r.checks) && r.checks.every((c) => (CHECKS as readonly string[]).includes(c)) &&
    typeof r.custom === "string"
  );
};

function Bench({
  challengeId,
  task,
  toolbar,
  onRetry,
  onNext,
  onPickTask,
  onComplete,
}: {
  challengeId: string | null;
  task: BenchTask;
  toolbar: ReactNode;
  onRetry: () => void;
  onNext: (id: string) => void;
  onPickTask: (id: string) => void;
  onComplete: StudioToolProps["onComplete"];
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const layout = useStudioLayout();
  const T = (s: string, v?: Record<string, string | number>) => t(`${NS}.task.${task.id}.${s}`, v);

  const maxCases = challengeId === "expose-weak" ? 4 : CASES.length;
  // "Catch the planted failure" is played blind: results stay hidden until the learner submits a test plan.
  const blind = challengeId === "catch-planted";
  const maxChecks = blind ? PLANTED_MAX_CHECKS : CHECKS.length;
  const checksFixed = challengeId === "expose-weak";
  // Challenges scored on a submitted run; the grid itself re-runs live (except while blind).
  const submits = challengeId === "catch-planted" || challengeId === "expose-weak";
  // 3 stars needs a focused plan: no more checks than the ones that actually fail on the planted cell.
  const focus = useMemo(() => failingChecks(task, PLANTED.variant, PLANTED.case).length, [task]);
  const [revealed, setRevealed] = useState(false);
  const [attempt, setAttempt] = useState<{ cases: Case[]; checks: Check[]; n: number; caught: boolean } | null>(null);

  const [cases, setCases] = useState<Case[]>(challengeId === "expose-weak" ? [] : [...CASES]);
  const [checks, setChecks] = useState<Check[]>(challengeId === "catch-planted" ? [] : [...CHECKS]);
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [openPrompt, setOpenPrompt] = useState<string | null>(null);
  const [runs, setRuns] = useState(0);
  const [detail, setDetail] = useState<{ v: string; c: Case } | null>(null);
  const [compare, setCompare] = useState<{ from: string; to: string } | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  // Challenge state
  const [pickTries, setPickTries] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [regTries, setRegTries] = useState(0);
  const [result, setResult] = useState<{ stars: 1 | 2 | 3; body: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // The live bench: the setup ~300ms after the last change.
  const setup = useMemo<Setup>(() => ({ cases, checks, custom }), [cases, checks, custom]);
  // The setup in progress follows the learner to any device.
  useStudioDraft<Setup>(testBench.id, challengeId ?? `free-${task.id}`, setup, (v) => {
    setCases(v.cases);
    setChecks(v.checks);
    setCustom(v.custom);
  }, { validate: isSetup });
  const liveSetup = useDebounced(setup, 300);
  const liveRan: Setup | null = liveSetup.cases.length && liveSetup.checks.length ? liveSetup : null;
  // Blind mode: until the challenge is won, the revealed grid shows exactly what was submitted.
  const hidden = blind && !revealed;
  const locked = blind && revealed && !result;
  const ran: Setup | null = useMemo(
    () => (locked && attempt ? { cases: attempt.cases, checks: attempt.checks, custom: liveSetup.custom } : liveRan),
    [locked, attempt, liveSetup.custom, liveRan],
  );

  // The task plus the learner's own variant, when written.
  const bench: BenchTask = useMemo(() => {
    const src = liveSetup.custom;
    if (!src.trim()) return task;
    return { ...task, variants: [...task.variants, CUSTOM], results: { ...task.results, [CUSTOM]: simulateCustom(task, src) } };
  }, [task, liveSetup.custom]);

  const vLabel = (v: string) => (v === CUSTOM ? t(`${NS}.custom.label`) : v.toUpperCase());

  function toggleCase(c: Case) {
    if (locked) return;
    setWarn(null);
    setCases((cs) => {
      if (cs.includes(c)) return cs.filter((x) => x !== c);
      if (cs.length >= maxCases) {
        setWarn(t(`${NS}.casesMax`, { n: maxCases }));
        return cs;
      }
      return CASES.filter((x) => cs.includes(x) || x === c);
    });
  }
  function toggleCheck(k: Check) {
    if (checksFixed || locked) return;
    setWarn(null);
    setChecks((ks) => {
      if (ks.includes(k)) return ks.filter((x) => x !== k);
      if (ks.length >= maxChecks) {
        setWarn(t(`${NS}.checksMax`, { n: maxChecks }));
        return ks;
      }
      return CHECKS.filter((x) => ks.includes(x) || x === k);
    });
  }

  function runBench() {
    if (cases.length === 0 || checks.length === 0) {
      setWarn(t(`${NS}.noChecks`));
      return;
    }
    setWarn(null);
    setDetail(null);
    const snapshot = { cases: [...cases], checks: [...checks] };
    const n = runs + 1;
    setRuns(n);
    if (result) return;

    if (challengeId === "catch-planted") {
      // Each submission reveals the grid; a miss can be retried with the results hidden again.
      const sub = (attempt?.n ?? 0) + 1;
      const caught = snapshot.cases.includes(PLANTED.case) && cellResult(task, PLANTED.variant, PLANTED.case, snapshot.checks) === "fail";
      setAttempt({ ...snapshot, n: sub, caught });
      setRevealed(true);
      setCompare(null);
      if (snapshot.cases.includes(PLANTED.case)) setDetail({ v: PLANTED.variant, c: PLANTED.case });
      if (caught) {
        const k = snapshot.checks.length;
        const stars = (sub === 1 && k <= focus ? 3 : sub <= 2 ? 2 : 1) as 1 | 2 | 3;
        const note = stars === 3 ? t(`${NS}.catch.score3`, { k }) : sub === 1 ? t(`${NS}.catch.scoreWide`, { k, n: focus }) : t(`${NS}.catch.scoreLater`, { n: sub });
        setFeedback(null);
        setResult({ stars, body: `${t(`${NS}.catch.hit`)} ${note}` });
        onComplete({ challengeId: "catch-planted", stars });
      }
    }
    if (challengeId === "expose-weak") {
      const exposing = snapshot.cases.filter((c) => cellResult(task, "v2", c, snapshot.checks) === "fail" && cellResult(task, "v3", c, snapshot.checks) === "pass").length;
      const hasNormal = snapshot.cases.includes("normal");
      const stars = exposing >= 3 && hasNormal ? 3 : exposing >= 2 ? 2 : exposing >= 1 ? 1 : 0;
      const body = t(`${NS}.expose.result`, { n: exposing, normal: hasNormal ? t(`${NS}.yes`) : t(`${NS}.no`) });
      if (stars === 0) setFeedback(t(`${NS}.expose.none`));
      else {
        setFeedback(null);
        setResult({ stars: stars as 1 | 2 | 3, body: `${body} ${t(`${NS}.expose.lesson`)}` });
        onComplete({ challengeId: "expose-weak", stars: stars as 1 | 2 | 3 });
      }
    }
  }

  // catch-planted: hide the results again so the learner can plan the next submission.
  function tryAgain() {
    setRevealed(false);
    setDetail(null);
    setCompare(null);
    setWarn(null);
  }

  // pick-best: choose the variant to ship, then find the regression.
  const best = useMemo(() => {
    let top = "v1";
    let rate = -1;
    for (const v of task.variants) {
      const r = passRate(task, v, [...CASES], [...CHECKS]);
      if (r.pass / r.total > rate) {
        rate = r.pass / r.total;
        top = v;
      }
    }
    return top;
  }, [task]);

  function pick(v: string) {
    if (v === best) {
      setPicked(v);
      setFeedback(t(`${NS}.pick.right`, { v: v.toUpperCase() }));
    } else {
      setPickTries((n) => n + 1);
      setFeedback(t(`${NS}.pick.wrong`));
    }
  }

  function onCell(v: string, c: Case) {
    if (challengeId === "pick-best" && picked && !result && compare) {
      const before = cellResult(task, compare.from, c, ran?.checks ?? []);
      const after = cellResult(task, compare.to, c, ran?.checks ?? []);
      if (compare.from === "v2" && compare.to === "v3" && before === "pass" && after === "fail") {
        const stars = (1 + (pickTries === 0 ? 1 : 0) + (regTries === 0 ? 1 : 0)) as 1 | 2 | 3;
        setFeedback(null);
        setResult({ stars, body: t(`${NS}.reg.found`) });
        onComplete({ challengeId: "pick-best", stars });
        return;
      }
      if (compare.from === "v2" && compare.to === "v3") {
        setRegTries((n) => n + 1);
        setFeedback(t(`${NS}.reg.hint`));
      }
    }
    setDetail({ v, c });
  }

  // Regressions between consecutive versions: green before, red after.
  const regressions = useMemo(() => {
    if (!ran) return [];
    const out: Array<{ from: string; to: string; c: Case }> = [];
    for (let i = 1; i < bench.variants.length; i++) {
      const from = bench.variants[i - 1];
      const to = bench.variants[i];
      for (const c of ran.cases) if (cellResult(bench, from, c, ran.checks) === "pass" && cellResult(bench, to, c, ran.checks) === "fail") out.push({ from, to, c });
    }
    return out;
  }, [bench, ran]);
  // In "pick the variant to ship" finding the regression is the puzzle, so the alert does not name it.
  const hideRegression = challengeId === "pick-best" && !result;

  const next = nextChallenge(testBench.challenges, challengeId);
  const aiCases = t(`${NS}.ai.cases`, { task: T("name"), prompt: T("var.v3") });
  const aiRubric = t(`${NS}.ai.rubric`, { task: T("name"), prompt: T("var.v3") });
  const G = `${NS}.guide`;
  const gid = challengeId ?? "free";
  const guide: StudioGuide = {
    goal: t(`${G}.${gid}.goal`),
    steps: [1, 2, 3, 4, 5].map((i) => t(`${G}.${gid}.step${i}`)),
    stars: challengeId ? [t(`${G}.${gid}.star1`, { n: focus }), t(`${G}.${gid}.star2`, { n: focus }), t(`${G}.${gid}.star3`, { n: focus })] : undefined,
    tips: [t(`${G}.${gid}.tip`), blind ? t(`${G}.tip.blind`) : t(`${G}.tip.live`)],
  };

  const challengeBox = (
    <>
      {feedback && !result && (
        <p role="status" className="rounded-xl bg-[var(--s2)] p-3 text-sm text-[var(--ink)]">
          {feedback}
        </p>
      )}
      {result && <ResultCard stars={result.stars} body={<p>{result.body}</p>} onRetry={onRetry} onNext={next ? () => onNext(next) : undefined} />}
      {blind && revealed && attempt && <PlantedReport task={task} attempt={attempt} won={!!result} onTryAgain={tryAgain} />}
    </>
  );

  // catch-planted, before submitting: the learner's plan and a grid of hidden cells.
  const blindLive = (
    <div className="space-y-3">
      <div role="note" className="flex gap-2 rounded-2xl border-2 border-[#1B3A6B]/30 bg-[#EEF3FA] p-3 text-sm text-[#1B3A6B]">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>{t(`${NS}.blind.banner`)}</p>
      </div>

      <section aria-labelledby="tb-plan" className="rounded-2xl border border-[var(--border)] bg-white p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p id="tb-plan" className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
            {t(`${NS}.plan.title`)}
          </p>
          <p className="text-xs font-semibold text-[var(--ink2)]">{t(`${NS}.plan.submission`, { n: (attempt?.n ?? 0) + 1 })}</p>
        </div>
        <p className="mt-2 text-xs font-bold text-[var(--ink)]">{t(`${NS}.plan.checks`, { n: checks.length, max: maxChecks })}</p>
        {checks.length ? (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {checks.map((k) => (
              <li key={k} className="rounded-full border-2 border-[var(--blue2)] bg-white px-2.5 py-0.5 text-xs font-semibold text-[var(--ink)]">
                {t(`${NS}.check.${k}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-[var(--ink3)]">{t(`${NS}.plan.noChecks`)}</p>
        )}
        <p className="mt-2 text-xs font-bold text-[var(--ink)]">{t(`${NS}.plan.cases`, { n: cases.length, total: CASES.length })}</p>
        {cases.length ? (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {cases.map((c) => (
              <li key={c} className="rounded-full border-2 border-[#F47C20] bg-white px-2.5 py-0.5 text-xs font-semibold text-[var(--ink)]">
                <span aria-hidden="true">{CASE_EMOJI[c]}</span> {t(`${NS}.case.${c}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-[var(--ink3)]">{t(`${NS}.plan.noCases`)}</p>
        )}
        {attempt && !attempt.caught && <p className="mt-2 text-xs text-amber-800">{t(`${NS}.plan.lastMiss`)}</p>}
      </section>

      {cases.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border-2 border-[var(--border)] bg-white p-2">
          <table className="w-full border-separate border-spacing-1 text-sm">
            <caption className="px-1 pb-1 text-left text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
              <EyeOff className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              {t(`${NS}.blind.caption`)}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="sr-only">{t(`${NS}.step.cases`)}</th>
                {task.variants.map((v) => (
                  <th key={v} scope="col" className="px-1 text-center text-xs font-black text-[var(--ink)]">
                    {vLabel(v)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c}>
                  <th scope="row" className="max-w-[110px] truncate pr-1 text-left text-xs font-semibold text-[var(--ink2)]">
                    <span aria-hidden="true">{CASE_EMOJI[c]}</span> {t(`${NS}.case.${c}`)}
                  </th>
                  {task.variants.map((v) => (
                    <td key={v} className="p-0">
                      <button
                        type="button"
                        onClick={() => setDetail({ v, c })}
                        aria-label={t(`${NS}.blind.cellLabel`, { variant: vLabel(v), case: t(`${NS}.case.${c}`) })}
                        className={`flex h-10 w-full min-w-[44px] items-center justify-center rounded-lg bg-[var(--s2)] font-black text-[var(--ink3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${detail?.v === v && detail.c === c ? "ring-2 ring-[var(--ink)]" : ""}`}
                      >
                        ?
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="rounded-2xl border-2 border-[var(--ink)] bg-white p-3" role="region" aria-label={t(`${NS}.detail.title`)}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-[var(--ink)]">
              {vLabel(detail.v)} · {t(`${NS}.case.${detail.c}`)}
            </p>
            <button type="button" onClick={() => setDetail(null)} aria-label={t(`${NS}.detail.close`)} className="rounded-lg p-1 hover:bg-[var(--s2)]">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.detail.input`)}</p>
          <p className="whitespace-pre-line rounded-lg bg-[var(--s2)] p-2 text-xs text-[var(--ink)]">{T(`case.${detail.c}`) || t(`${NS}.emptyInput`)}</p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.blind.prompt`, { variant: vLabel(detail.v) })}</p>
          <p className="whitespace-pre-line rounded-lg bg-[var(--s2)] p-2 text-xs text-[var(--ink)]">{T(`var.${detail.v}`)}</p>
          <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] p-2 text-xs text-[var(--ink3)]">
            <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t(`${NS}.blind.outputHidden`)}
          </p>
          {checks.length > 0 && (
            <>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.blind.willCheck`)}</p>
              <ul className="mt-1 space-y-0.5 text-xs text-[var(--ink)]">
                {checks.map((k) => (
                  <li key={k}>
                    <span aria-hidden="true">?</span> {t(`${NS}.check.${k}`)}: <span className="text-[var(--ink3)]">{T(`check.${k}`)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <Illustrative />
    </div>
  );

  const live = hidden ? (
    blindLive
  ) : (
    <div className="space-y-3">
      {/* catch-planted, after submitting: what this submission revealed */}
      {blind && attempt && (
        <motion.p
          key={`verdict-${attempt.n}`}
          role="status"
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.9 }}
          className={`flex items-start gap-2 rounded-2xl border-2 p-3 text-sm font-semibold ${attempt.caught ? "border-green-300 bg-green-50 text-green-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}
        >
          <Target className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {t(`${NS}.reveal.${attempt.caught ? "caught" : "missed"}`, { n: attempt.n })} {t(`${NS}.reveal.seeCard`)}
          </span>
        </motion.p>
      )}
      {!ran ? (
        <p className="rounded-2xl border-2 border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--ink3)]">{t(`${NS}.live.empty`)}</p>
      ) : (
        <>
          {/* Pass rate per variant */}
          <section aria-label={t(`${NS}.rate`)} className="rounded-2xl border border-[var(--border)] bg-white p-3">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.live.rates`)}</p>
            <ul className="space-y-1.5">
              {bench.variants.map((v) => {
                const r = passRate(bench, v, ran.cases, ran.checks);
                const pct = r.total ? Math.round((r.pass / r.total) * 100) : 0;
                const color = pct >= 90 ? "#16a34a" : pct >= 60 ? "#F47C20" : "#dc2626";
                return (
                  <li key={v} className="flex items-center gap-2 text-xs">
                    <span className="w-10 shrink-0 font-black text-[var(--ink)]">{vLabel(v)}</span>
                    <span className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--s2)]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${vLabel(v)} ${t(`${NS}.rate`)}`}>
                      <span className="block h-full rounded-full transition-all duration-500 motion-reduce:transition-none" style={{ width: `${pct}%`, background: color }} />
                    </span>
                    <span className="w-16 shrink-0 text-right tabular-nums text-[var(--ink2)]">
                      <b className="text-[var(--ink)]">{pct}%</b> {r.pass}/{r.total}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Regression alert */}
          {regressions.length > 0 ? (
            <div role="alert" className="flex gap-2 rounded-2xl border-2 border-red-300 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-black">{t(`${NS}.live.regTitle`)}</p>
                {hideRegression ? (
                  <p>{t(`${NS}.live.regHidden`)}</p>
                ) : (
                  <ul>
                    {regressions.map((g) => (
                      <li key={`${g.from}-${g.to}-${g.c}`}>{t(`${NS}.live.regLine`, { to: vLabel(g.to), from: vLabel(g.from), case: t(`${NS}.case.${g.c}`) })}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-2xl bg-green-50 p-2.5 text-xs font-semibold text-green-800">{t(`${NS}.live.noReg`)}</p>
          )}

          <div className="overflow-x-auto rounded-2xl border-2 border-[var(--border)] bg-white p-2">
            <table className="w-full border-separate border-spacing-1 text-sm">
              <caption className="px-1 pb-1 text-left text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
                <FlaskConical className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {t(`${NS}.grid.caption`)}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="sr-only">{t(`${NS}.step.cases`)}</th>
                  {bench.variants.map((v) => (
                    <th key={v} scope="col" className="px-1 text-center text-xs font-black text-[var(--ink)]">
                      {vLabel(v)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ran.cases.map((c, ri) => (
                  <tr key={c}>
                    <th scope="row" className="max-w-[110px] truncate pr-1 text-left text-xs font-semibold text-[var(--ink2)]">
                      <span aria-hidden="true">{CASE_EMOJI[c]}</span> {t(`${NS}.case.${c}`)}
                    </th>
                    {bench.variants.map((v, ci) => {
                      const r: Cell = cellResult(bench, v, c, ran.checks);
                      let delta: "up" | "down" | null = null;
                      if (compare && v === compare.to) {
                        const b = cellResult(bench, compare.from, c, ran.checks);
                        if (b === "fail" && r === "pass") delta = "up";
                        if (b === "pass" && r === "fail") delta = "down";
                      }
                      const color = r === "pass" ? "bg-green-500 text-white" : r === "fail" ? "bg-red-500 text-white" : "bg-[var(--s2)] text-[var(--ink3)]";
                      const dim = compare && v !== compare.to && v !== compare.from ? "opacity-40" : "";
                      const sel = detail?.v === v && detail.c === c ? "ring-2 ring-[var(--ink)]" : "";
                      // catch-planted: the reveal sweeps across the grid and marks where the failure was planted.
                      const sweep = blind && !!attempt;
                      const planted = sweep && v === PLANTED.variant && c === PLANTED.case;
                      const label = t(`${NS}.cellLabel`, { variant: vLabel(v), case: t(`${NS}.case.${c}`), result: t(`${NS}.${r}`) });
                      return (
                        <td key={v} className={planted ? "rounded-[10px] p-0 outline-dashed outline-2 outline-offset-1 outline-amber-500" : "p-0"}>
                          <motion.button
                            key={`${runs}-${v}-${c}-${r}`}
                            type="button"
                            initial={reduce ? false : sweep ? { rotateY: 90, opacity: 0.3 } : { scale: 0.6, opacity: 0 }}
                            animate={sweep ? { rotateY: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
                            transition={{ delay: reduce ? 0 : sweep ? (ri + ci) * 0.1 : Math.min(0.5, (ri * bench.variants.length + ci) * 0.03), duration: sweep ? 0.35 : undefined }}
                            onClick={() => onCell(v, c)}
                            aria-label={planted ? `${label}. ${t(`${NS}.reveal.planted`)}` : label}
                            className={`relative flex h-10 w-full min-w-[44px] items-center justify-center rounded-lg font-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${color} ${dim} ${sel}`}
                          >
                            {planted && <Target className="absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white text-amber-600" aria-hidden="true" />}
                            {r === "pass" ? <CheckIcon className="h-4 w-4" aria-hidden="true" /> : r === "fail" ? <X className="h-4 w-4" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />}
                            {delta === "up" && <ArrowUp className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white text-green-700" aria-label={t(`${NS}.compare.fixed`)} />}
                            {delta === "down" && <ArrowDown className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white text-red-700" aria-label={t(`${NS}.compare.regressed`)} />}
                          </motion.button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Regression view */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.compare.title`)}</p>
              <button type="button" onClick={() => setCompare((c) => (c ? null : { from: "v2", to: "v3" }))} className="text-xs font-semibold text-[var(--blue2)] underline">
                {compare ? t(`${NS}.compare.off`) : t(`${NS}.compare.on`)}
              </button>
            </div>
            {compare && (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <label className="flex items-center gap-1">
                    {t(`${NS}.compare.from`)}
                    <select value={compare.from} onChange={(e) => setCompare({ ...compare, from: e.target.value })} className="rounded-lg border border-[var(--border)] bg-white px-2 py-1">
                      {bench.variants.map((v) => (
                        <option key={v} value={v}>
                          {vLabel(v)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1">
                    {t(`${NS}.compare.to`)}
                    <select value={compare.to} onChange={(e) => setCompare({ ...compare, to: e.target.value })} className="rounded-lg border border-[var(--border)] bg-white px-2 py-1">
                      {bench.variants.map((v) => (
                        <option key={v} value={v}>
                          {vLabel(v)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="text-xs text-[var(--ink2)]">{t(`${NS}.compare.legend`)}</p>
              </div>
            )}
          </div>

          {/* Cell detail */}
          {detail && (
            <div className="rounded-2xl border-2 border-[var(--ink)] bg-white p-3" role="region" aria-label={t(`${NS}.detail.title`)}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-[var(--ink)]">
                  {vLabel(detail.v)} · {t(`${NS}.case.${detail.c}`)}
                </p>
                <button type="button" onClick={() => setDetail(null)} aria-label={t(`${NS}.detail.close`)} className="rounded-lg p-1 hover:bg-[var(--s2)]">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.detail.input`)}</p>
              <p className="whitespace-pre-line rounded-lg bg-[var(--s2)] p-2 text-xs text-[var(--ink)]">{T(`case.${detail.c}`) || t(`${NS}.emptyInput`)}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
                <span aria-hidden="true">🤖</span> {t(`${NS}.detail.output`)}
              </p>
              <p className="whitespace-pre-line rounded-lg bg-[var(--s2)] p-2 text-xs text-[var(--ink)]">{detail.v === CUSTOM ? t(`${NS}.custom.out`) : T(`out.${detail.v}.${detail.c}`)}</p>
              <ul className="mt-2 space-y-1 text-xs">
                {ran.checks.map((k) => {
                  const r = checkResult(bench, detail.v, detail.c, k);
                  return (
                    <li key={k} className="flex items-center gap-1.5">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white ${r === "pass" ? "bg-green-500" : r === "fail" ? "bg-red-500" : "bg-[var(--ink3)]"}`} aria-hidden="true">
                        {r === "pass" ? "✓" : r === "fail" ? "✗" : "–"}
                      </span>
                      <span className="text-[var(--ink)]">{t(`${NS}.check.${k}`)}</span>
                      <span className="text-[var(--ink3)]">({t(`${NS}.${r}`)})</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* pick-best: choose, then find the regression */}
          {challengeId === "pick-best" && !result && (
            <div className="rounded-2xl border-2 border-[#F47C20] bg-[#FFF6EE] p-3">
              {!picked ? (
                <>
                  <p className="text-sm font-bold text-[var(--ink)]">{t(`${NS}.pick.question`)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {task.variants.map((v) => (
                      <button key={v} type="button" onClick={() => pick(v)} className={BTN_SECONDARY}>
                        {v.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-[var(--ink)]">{t(`${NS}.reg.task`)}</p>
                  {!compare && (
                    <button type="button" onClick={() => setCompare({ from: "v2", to: "v3" })} className={`${BTN_PRIMARY} mt-2`}>
                      {t(`${NS}.compare.on`)}: V2 → V3
                    </button>
                  )}
                  {!(ran.checks.includes("length") && ran.cases.includes("long")) && <p className="mt-2 text-xs text-amber-800">{t(`${NS}.reg.needAll`)}</p>}
                </>
              )}
            </div>
          )}
        </>
      )}
      {!submits && challengeBox}
      <Illustrative />
    </div>
  );

  return (
    <StudioFrame toolbar={toolbar} guide={guide} live={live} liveTitle={t(`${NS}.live.title`)}>
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-[#F47C20]/40 bg-[#FFF6EE] p-4">
          {!challengeId && (
            <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label={t(`${NS}.pickTask`)}>
              {TASKS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={x.id === task.id}
                  onClick={() => onPickTask(x.id)}
                  className={`${CHIP} ${x.id === task.id ? "border-[#F47C20] bg-white text-[var(--ink)]" : "border-[var(--border)] bg-white/60 text-[var(--ink2)]"}`}
                >
                  {t(`${NS}.task.${x.id}.name`)}
                </button>
              ))}
            </div>
          )}
          <p className="font-bold text-[var(--ink)]">{T("name")}</p>
          <p className="text-sm text-[var(--ink2)]">{T("desc")}</p>
          {challengeId && <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{t(`${NS}.ch.${challengeId}.task`)}</p>}
        </div>

        <section aria-labelledby="tb-variants">
          <h3 id="tb-variants" className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.step.variants`)}</h3>
          <ul className="space-y-1.5">
            {task.variants.map((v) => (
              <li key={v} className="rounded-xl border border-[var(--border)] bg-white">
                <button type="button" aria-expanded={openPrompt === v} onClick={() => setOpenPrompt((o) => (o === v ? null : v))} className="flex w-full items-center justify-between gap-2 p-2.5 text-left text-sm">
                  <span className="min-w-0">
                    <span className="font-black text-[var(--ink)]">{v.toUpperCase()}</span> <span className="text-[var(--ink2)]">{T(`var.${v}.short`)}</span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--blue2)] underline">{openPrompt === v ? t(`${NS}.hidePrompt`) : t(`${NS}.showPrompt`)}</span>
                </button>
                {openPrompt === v && (
                  <div className="border-t border-[var(--border)] p-2.5">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-[var(--ink)]">{T(`var.${v}`)}</pre>
                    <div className="mt-2">
                      <CopyButton text={T(`var.${v}`)} />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {!(blind && !result) && (
            <button type="button" onClick={() => setShowCustom((s) => !s)} className="mt-2 text-xs font-semibold text-[var(--blue2)] underline" aria-expanded={showCustom}>
              {showCustom ? t(`${NS}.custom.hide`) : t(`${NS}.custom.title`)}
            </button>
          )}
          {showCustom && !(blind && !result) && (
            <div className="mt-2 rounded-xl border border-dashed border-[var(--border)] bg-white p-2.5">
              <label className="block text-xs font-bold text-[var(--ink)]" htmlFor="tb-custom">
                {t(`${NS}.custom.title`)}
              </label>
              <textarea
                id="tb-custom"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                rows={4}
                placeholder={T("var.v2")}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--s2)] p-2 text-xs text-[var(--ink)] focus:border-[#F47C20] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-[var(--ink3)]">{t(`${NS}.custom.note`)}</p>
            </div>
          )}
        </section>

        {/* catch-planted: questions that nudge without naming the answer */}
        {blind && !result && (
          <section aria-labelledby="tb-think" className="rounded-2xl border-2 border-dashed border-[#1B3A6B]/30 bg-[#EEF3FA] p-3">
            <h3 id="tb-think" className="flex items-center gap-1.5 text-sm font-black text-[#1B3A6B]">
              <Lightbulb className="h-4 w-4" aria-hidden="true" /> {t(`${NS}.think.title`)}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--ink2)]">{t(`${NS}.think.intro`)}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-[var(--ink)]">
              {[1, 2, 3, 4].map((i) => (
                <li key={i}>{t(`${NS}.think.q${i}`)}</li>
              ))}
            </ul>
          </section>
        )}
        {locked && (
          <p role="note" className="flex items-center gap-2 rounded-xl bg-[var(--s2)] p-2.5 text-xs font-semibold text-[var(--ink2)]">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {t(`${NS}.blind.locked`)}
          </p>
        )}

        <div className={`grid grid-cols-1 gap-4 ${layout === "overlay" ? "xl:grid-cols-2" : "2xl:grid-cols-2"}`}>
          <section aria-labelledby="tb-cases">
            <h3 id="tb-cases" className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.step.cases`)}</h3>
            <p className="mb-1.5 text-xs text-[var(--ink3)]">{maxCases < CASES.length ? t(`${NS}.casesMax`, { n: maxCases }) : t(`${NS}.casesHelp`)}</p>
            <ul className="space-y-1.5">
              {CASES.map((c) => {
                const on = cases.includes(c);
                return (
                  <li key={c}>
                    <button
                      type="button"
                      aria-pressed={on}
                      disabled={locked}
                      onClick={() => toggleCase(c)}
                      className={`flex w-full items-start gap-2 rounded-xl border-2 p-2 text-left text-sm focus:outline-none disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#F47C20] ${on ? "border-[#F47C20] bg-white" : "border-[var(--border)] bg-[var(--s2)] opacity-70"}`}
                    >
                      <span aria-hidden="true">{on ? "☑" : "☐"}</span>
                      <span className="min-w-0">
                        <span className="block font-bold text-[var(--ink)]">
                          <span aria-hidden="true">{CASE_EMOJI[c]}</span> {t(`${NS}.case.${c}`)}
                        </span>
                        <span className={`block text-xs text-[var(--ink3)] ${blind ? "break-words" : "truncate"}`}>{T(`case.${c}`) || t(`${NS}.emptyInput`)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="tb-checks">
            <h3 id="tb-checks" className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.step.checks`)}</h3>
            <p className="mb-1.5 text-xs text-[var(--ink3)]">
              {checksFixed ? t(`${NS}.checksFixed`) : maxChecks < CHECKS.length ? t(`${NS}.checksMax`, { n: maxChecks }) : t(`${NS}.checksHelp`)}
            </p>
            <ul className="space-y-1.5">
              {CHECKS.map((k) => {
                const on = checks.includes(k);
                return (
                  <li key={k}>
                    <button
                      type="button"
                      aria-pressed={on}
                      disabled={checksFixed || locked}
                      onClick={() => toggleCheck(k)}
                      className={`flex w-full items-start gap-2 rounded-xl border-2 p-2 text-left text-sm focus:outline-none disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#F47C20] ${on ? "border-[var(--blue2)] bg-white" : "border-[var(--border)] bg-[var(--s2)] opacity-70"}`}
                    >
                      <span aria-hidden="true">{on ? "☑" : "☐"}</span>
                      <span className="min-w-0">
                        <span className="block font-bold text-[var(--ink)]">{t(`${NS}.check.${k}`)}</span>
                        <span className="block text-xs text-[var(--ink3)]">{T(`check.${k}`)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {warn && (
          <p role="alert" className="rounded-xl bg-amber-50 p-2.5 text-sm text-amber-800">
            {warn}
          </p>
        )}
        {!locked && (
          <div className="space-y-1.5">
            <button type="button" onClick={runBench} className={`${BTN_PRIMARY} w-full`}>
              <Play className="h-4 w-4" aria-hidden="true" /> {submits ? t(`${NS}.live.submit`) : runs ? t(`${NS}.rerun`) : t(`${NS}.run`)}
            </button>
            <p className="text-xs text-[var(--ink3)]">{hidden ? t(`${NS}.blind.submitHint`) : submits ? t(`${NS}.live.submitHint`) : t(`${NS}.live.autoHint`)}</p>
          </div>
        )}
        {submits && challengeBox}

        {/* Have the AI test against you */}
        <section aria-labelledby="tb-ai" className="rounded-2xl border border-[var(--border)] bg-white p-3">
          <h3 id="tb-ai" className="text-sm font-black text-[var(--ink)]">
            <span aria-hidden="true">🧠</span> {t(`${NS}.ai.title`)}
          </h3>
          <p className="mt-1 text-xs text-[var(--ink2)]">{t(`${NS}.ai.body`)}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-[var(--ink)]">{t(`${NS}.ai.rubricTitle`)}</p>
            <CopyButton text={aiRubric} />
          </div>
          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--s2)] p-2 text-xs text-[var(--ink)]">{aiRubric}</pre>
        </section>
        <TryForReal prompt={aiCases} intro={t(`${NS}.realIntro`)} />
      </div>
    </StudioFrame>
  );
}

/** Wraps each needle found in `text` in a highlight. */
function highlight(text: string, needles: string[]): ReactNode[] {
  const found = needles.filter((n) => n && text.includes(n));
  if (!found.length) return [text];
  const re = new RegExp(`(${found.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return text.split(re).map((part, i) =>
    found.includes(part) ? (
      <mark key={i} className="rounded bg-red-200 px-0.5 font-bold text-red-900">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/** catch-planted, after a submission: what was planted, what the learner's checks saw, and why it matters. */
function PlantedReport({
  task,
  attempt,
  won,
  onTryAgain,
}: {
  task: BenchTask;
  attempt: { cases: Case[]; checks: Check[]; n: number; caught: boolean };
  won: boolean;
  onTryAgain: () => void;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const T = (s: string) => t(`${NS}.task.${task.id}.${s}`);
  const X_ = `${NS}.catch.x`;
  const { variant: v, case: c } = PLANTED;
  const covered = attempt.cases.includes(c);
  const catchers = failingChecks(task, v, c);
  const caughtBy = covered ? attempt.checks.filter((k) => catchers.includes(k)) : [];
  const why = caughtBy.length ? caughtBy : catchers;
  const checkName = (k: Check) => t(`${NS}.check.${k}`);
  return (
    <motion.section
      key={`report-${attempt.n}`}
      aria-labelledby="tb-report"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : 1, duration: 0.35 }}
      className={`rounded-2xl border-2 bg-white p-4 ${attempt.caught ? "border-green-400" : "border-amber-400"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 id="tb-report" className="flex items-center gap-1.5 text-base font-black text-[var(--ink)]">
          <Target className={`h-5 w-5 shrink-0 ${attempt.caught ? "text-green-600" : "text-amber-600"}`} aria-hidden="true" />
          {t(`${X_}.${attempt.caught ? "titleHit" : "titleMiss"}`)}
        </h3>
        <span className="rounded-full bg-[var(--s2)] px-2.5 py-0.5 text-xs font-bold text-[var(--ink2)]">{t(`${X_}.submission`, { n: attempt.n })}</span>
      </div>

      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${X_}.whatTitle`)}</p>
      <p className="text-sm font-semibold text-[var(--ink)]">{t(`${X_}.where`, { variant: v.toUpperCase(), case: t(`${NS}.case.${c}`) })}</p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.detail.input`)}</p>
      <p className="rounded-lg bg-[var(--s2)] p-2 text-xs text-[var(--ink)]">{T(`case.${c}`)}</p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
        <span aria-hidden="true">🤖</span> {t(`${X_}.output`, { variant: v.toUpperCase() })}
      </p>
      <p className="whitespace-pre-line rounded-lg border-2 border-red-200 bg-red-50 p-2 text-xs text-[var(--ink)]">
        {highlight(T(`out.${v}.${c}`), [t(`${X_}.excerpt1`), t(`${X_}.excerpt2`)])}
      </p>
      <p className="mt-2 text-sm text-[var(--ink2)]">{t(`${X_}.wrong`)}</p>

      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${X_}.yoursTitle`)}</p>
      {!covered ? (
        <p className="text-sm text-amber-800">{t(`${X_}.noCase`, { case: t(`${NS}.case.${c}`) })}</p>
      ) : (
        <ul className="mt-1 space-y-1 text-sm">
          {attempt.checks.map((k) => {
            const r = checkResult(task, v, c, k);
            return (
              <li key={k} className="flex items-start gap-1.5">
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white ${r === "fail" ? "bg-green-600" : "bg-[var(--ink3)]"}`}
                  aria-hidden="true"
                >
                  {r === "fail" ? "✓" : "–"}
                </span>
                <span className="text-[var(--ink)]">
                  <b>{checkName(k)}</b>: {t(`${X_}.${r === "fail" ? "caught" : r === "pass" ? "missed" : "na"}`)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {caughtBy.length === 0 && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm font-semibold text-amber-900">{t(`${X_}.would`, { checks: catchers.map(checkName).join(", ") })}</p>
      )}

      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${X_}.whyTitle`)}</p>
      <ul className="mt-1 space-y-1.5 text-sm text-[var(--ink2)]">
        {why.map((k) => (
          <li key={k}>
            <b className="text-[var(--ink)]">{checkName(k)}</b>: {t(`${X_}.why.${k}`)}
          </li>
        ))}
      </ul>

      {!won && (
        <div className="mt-4 space-y-1.5">
          <button type="button" onClick={onTryAgain} className={`${BTN_PRIMARY} w-full`}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> {t(`${X_}.retry`)}
          </button>
          <p className="text-xs text-[var(--ink3)]">{t(`${X_}.retryHint`)}</p>
        </div>
      )}
    </motion.section>
  );
}
