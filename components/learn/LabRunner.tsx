"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Markdown from "./Markdown";
import CodeStudio, { type StudioCheck, type StudioSubmission } from "./CodeStudio";
import { LAB_TYPE_META, type LabObjective, type LabType } from "@/lib/learn/labs/types";
import { useT } from "@/lib/i18n/client";
import { bumpPractice, celebrate } from "@/lib/learn/game-client";

interface Breakdown {
  objectiveId: string;
  label: string;
  met: boolean;
  score: number;
  comment: string;
}

interface Result {
  score: number;
  passed: boolean;
  passScore: number;
  feedbackMd: string;
  breakdown: Breakdown[];
  pointsAwarded: number;
  flaws?: Array<{ id: string; quote: string; explanation: string; category: string }>;
}

export interface LabView {
  id: string;
  slug: string;
  title: string;
  labType: LabType;
  briefMd: string;
  scenarioMd: string | null;
  objectives: LabObjective[];
  passScore: number;
  points: number;
  estimatedMinutes: number;
  // type-specific
  starterPrompt?: string;
  maxRuns?: number;
  contextMd?: string;
  answerMd?: string;
  candidates?: Array<{ id: string; text: string }>;
  steps?: Array<{ id: string; label: string; detail?: string }>;
  requireArtifact?: boolean;
  artifactLabel?: string;
  fields?: Array<{ id: string; label: string; prompt: string; placeholder?: string; minWords?: number }>;
  // code labs
  starterCode?: string;
  checks?: StudioCheck[];
}

export default function LabRunner({
  lab,
  trackSlug,
  accentColor,
  priorAttempt,
  pending = false,
}: {
  lab: LabView;
  /** The lab's texts are still being translated; English is shown meanwhile. */
  pending?: boolean;
  trackSlug: string;
  accentColor: string;
  priorAttempt: {
    status: string;
    score: number | null;
    passed: boolean;
    feedbackMd: string | null;
    breakdown: Breakdown[] | null;
    submission: Record<string, unknown>;
    transcript: Array<{ prompt: string; response: string }>;
    runCount: number;
  } | null;
}) {
  const router = useRouter();
  const t = useT();
  const meta = LAB_TYPE_META[lab.labType] ?? LAB_TYPE_META.prompt;
  const typeLabel = t(`labs.type.${lab.labType in LAB_TYPE_META ? lab.labType : "prompt"}.label`);
  // Criterion names in the current language, whatever language the attempt
  // was graded in; the grader's comments stay as written.
  const rowLabel = (b: Breakdown) =>
    lab.objectives.find((o) => o.id === b.objectiveId)?.label ??
    (b.objectiveId === "automated-checks" ? t("labs.eval.code.checks") : b.label);

  const submitted = priorAttempt?.status === "submitted" && priorAttempt.score != null;

  // ── shared state ────────────────────────────────────────────────────────
  const [result, setResult] = useState<Result | null>(
    submitted
      ? {
          score: priorAttempt!.score!,
          passed: priorAttempt!.passed,
          passScore: lab.passScore,
          feedbackMd: priorAttempt!.feedbackMd ?? "",
          breakdown: priorAttempt!.breakdown ?? [],
          pointsAwarded: 0,
        }
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // ── prompt lab ──────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState(
    (priorAttempt?.submission?.prompt as string) ?? lab.starterPrompt ?? "",
  );
  const [transcript, setTranscript] = useState(priorAttempt?.transcript ?? []);
  const [runsUsed, setRunsUsed] = useState(priorAttempt?.runCount ?? 0);
  const maxRuns = lab.maxRuns ?? 8;

  // ── critique lab ────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(
    new Set((priorAttempt?.submission?.selections as string[]) ?? []),
  );

  // ── build lab ───────────────────────────────────────────────────────────
  const [checked, setChecked] = useState<Set<string>>(
    new Set((priorAttempt?.submission?.checked as string[]) ?? []),
  );
  const [artifactUrl, setArtifactUrl] = useState(
    (priorAttempt?.submission?.artifactUrl as string) ?? "",
  );
  const [reflection, setReflection] = useState(
    (priorAttempt?.submission?.reflection as string) ?? "",
  );

  // ── workbench lab ───────────────────────────────────────────────────────
  // Drafts are kept in the browser as well, so a long piece of work survives a
  // refresh or a closed tab before it is submitted. Per-viewer convenience
  // only; the submitted version is what the server stores.
  const draftKey = `tiblogics:lab-draft:${lab.id}`;
  const [answers, setAnswers] = useState<Record<string, string>>(
    () => (priorAttempt?.submission?.answers as Record<string, string>) ?? {},
  );
  // Loaded after mount, not in the initial state: the server cannot see the
  // browser's storage, so reading it during the first render made the server
  // and client HTML disagree (React hydration error #418).
  useEffect(() => {
    if (lab.labType !== "workbench") return;
    try {
      const saved = window.localStorage.getItem(draftKey);
      if (saved) setAnswers((a) => ({ ...a, ...JSON.parse(saved) }));
    } catch {
      // Storage unavailable or corrupt: start from the submitted version.
    }
  }, [draftKey, lab.labType]);
  function setAnswer(id: string, value: string) {
    setAnswers((a) => {
      const next = { ...a, [id]: value };
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode, blocked): the draft just isn't kept.
      }
      return next;
    });
  }
  const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

  async function runSandbox() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/lab/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labId: lab.id, prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("labs.error.sandbox"));
      setTranscript((t) => [...t, { prompt, response: data.response }]);
      setRunsUsed(data.runsUsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("labs.error.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function submit(extra?: StudioSubmission) {
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = { labId: lab.id, ...(extra ?? {}) };
      if (lab.labType === "prompt") body.prompt = prompt;
      if (lab.labType === "critique") body.selections = [...selected];
      if (lab.labType === "workbench") body.answers = answers;
      if (lab.labType === "build") {
        body.checked = [...checked];
        body.artifactUrl = artifactUrl || null;
        body.reflection = reflection || null;
      }

      const res = await fetch("/api/learn/lab/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("labs.error.score"));
      setResult(data);
      bumpPractice();
      celebrate({ points: data.pointsAwarded, reason: "lab", newBadges: data.newBadges, levelUp: data.levelUp });
      if (lab.labType === "workbench" || lab.labType === "code") {
        try {
          window.localStorage.removeItem(lab.labType === "code" ? `tiblogics:code-lab:${lab.id}` : draftKey);
        } catch {
          /* nothing to clear */
        }
      }
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("labs.error.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    setBusy(true);
    try {
      await fetch("/api/learn/lab/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labId: lab.id }),
      });
      setResult(null);
      setTranscript([]);
      setRunsUsed(0);
      setError("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--ink3)]">
        <Link href={`/learn/track/${trackSlug}`} className="hover:text-[var(--ink)]">
          {t("labs.backToTrack")}
        </Link>
      </nav>

      {pending && (
        <p className="mb-4 rounded-lg bg-[var(--s2)] px-4 py-2.5 text-sm text-[var(--ink2)]">
          {t("common.translationPending")}
        </p>
      )}

      {/* Header */}
      <header className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            <span aria-hidden="true">{meta.icon}</span> {typeLabel}
          </span>
          <span className="text-xs text-[var(--ink3)]">
            {t("labs.meta", { min: lab.estimatedMinutes, points: lab.points, pass: lab.passScore })}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-black text-[var(--ink)]">{lab.title}</h1>

        <div className="mt-4">
          <Markdown source={lab.briefMd} />
        </div>

        {/* Objectives, published up front */}
        {lab.objectives.length > 0 && (
          <div className="mt-5 rounded-xl bg-[var(--s2)] p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
              {t("labs.scoredOn")}
            </h2>
            <ul className="mt-2 space-y-1.5">
              {lab.objectives.map((o) => (
                <li key={o.id} className="flex gap-2 text-sm text-[var(--ink2)]">
                  <span aria-hidden="true" style={{ color: accentColor }}>
                    ◆
                  </span>
                  {o.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* ── Result ──────────────────────────────────────────────────────── */}
      {result && (
        <section className="mt-6 rounded-2xl border-2 bg-white p-6 sm:p-8"
          style={{ borderColor: result.passed ? "#22A387" : "#F9A738" }}
        >
          <div className="text-center">
            <p className="text-5xl font-black" style={{ color: result.passed ? "#22A387" : "#E05F00" }}>
              {result.score}%
            </p>
            <h2 className="mt-2 text-xl font-bold text-[var(--ink)]">
              {result.passed ? t("labs.result.passed") : t("labs.result.notYet")}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {result.passed
                ? t("labs.result.passedBody")
                : t("labs.result.failBody", { pass: result.passScore })}
            </p>
            {result.pointsAwarded > 0 && (
              <p className="mt-2 text-sm font-bold text-[var(--orange2)]">
                {t("labs.points", { n: result.pointsAwarded })}
              </p>
            )}
          </div>

          {result.breakdown.length > 0 && (
            <ul className="mt-6 space-y-3">
              {result.breakdown.map((b) => (
                <li key={b.objectiveId} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--ink)]">{rowLabel(b)}</p>
                    <span
                      className="shrink-0 text-sm font-bold"
                      style={{ color: b.met ? "#22A387" : "#E05F00" }}
                    >
                      {b.score}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink2)]">{b.comment}</p>
                </li>
              ))}
            </ul>
          )}

          {result.feedbackMd && (
            <div className="mt-6 rounded-xl bg-[var(--s2)] p-5">
              <Markdown source={result.feedbackMd} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={retry}
              disabled={busy}
              className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] disabled:opacity-50"
            >
              {result.passed ? t("labs.result.retryPractice") : t("labs.result.retry")}
            </button>
            <Link
              href={`/learn/track/${trackSlug}`}
              className="rounded-full px-6 py-2.5 text-sm font-bold text-white"
              style={{ background: accentColor }}
            >
              {t("labs.backToTrackCta")}
            </Link>
          </div>
        </section>
      )}

      {/* ── Working area ────────────────────────────────────────────────── */}
      {!result && (
        <>
          {lab.scenarioMd && (
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
              <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.scenario")}</h2>
              <div className="mt-3">
                <Markdown source={lab.scenarioMd} />
              </div>
            </section>
          )}

          {/* CODE STUDIO */}
          {lab.labType === "code" && (
            <CodeStudio
              labId={lab.id}
              starterCode={lab.starterCode ?? ""}
              checks={lab.checks ?? []}
              fields={lab.fields ?? []}
              maxRuns={lab.maxRuns ?? 12}
              initialCode={(priorAttempt?.submission?.code as string) || undefined}
              initialRuns={priorAttempt?.status === "in_progress" ? priorAttempt.runCount : 0}
              accentColor={accentColor}
              busy={busy}
              onSubmit={(s) => submit(s)}
            />
          )}

          {/* PROMPT LAB */}
          {lab.labType === "prompt" && (
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.prompt.title")}</h2>
                <span className="text-xs text-[var(--ink3)]">
                  {t("labs.prompt.runsLeft", { left: Math.max(0, maxRuns - runsUsed), max: maxRuns })}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--ink2)]">{t("labs.prompt.intro")}</p>

              {lab.contextMd && (
                <details className="mt-4 rounded-xl bg-[var(--s2)] p-4" open>
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">{t("labs.prompt.context")}</summary>
                  <div className="mt-2 max-h-72 overflow-auto"><Markdown source={lab.contextMd} /></div>
                </details>
              )}

              <textarea
                rows={8}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("labs.prompt.placeholder")}
                className="mt-4 w-full rounded-xl border border-[var(--border)] px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
              />

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  onClick={runSandbox}
                  disabled={busy || !prompt.trim() || runsUsed >= maxRuns}
                  className="rounded-full border-2 px-5 py-2.5 text-sm font-bold disabled:opacity-40"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  {busy ? t("labs.prompt.running") : runsUsed >= maxRuns ? t("labs.prompt.noRuns") : t("labs.prompt.run")}
                </button>
                <button
                  onClick={() => submit()}
                  disabled={busy || !prompt.trim()}
                  className="rounded-full px-6 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: accentColor }}
                >
                  {busy ? t("labs.scoring") : t("labs.prompt.submit")}
                </button>
              </div>

              {transcript.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
                    {t("labs.prompt.history")}
                  </h3>
                  <ol className="mt-3 space-y-4">
                    {transcript.map((run, i) => (
                      <li key={i} className="rounded-xl border border-[var(--border)] p-4">
                        <p className="text-xs font-bold text-[var(--ink3)]">{t("labs.prompt.runLabel", { n: i + 1 })}</p>
                        <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-[var(--ink2)]">
                          {run.prompt}
                        </pre>
                        <p className="mt-3 text-xs font-bold text-[var(--ink3)]">{t("labs.prompt.response")}</p>
                        <div className="mt-1 max-h-72 overflow-auto rounded-lg bg-[var(--s2)] p-3">
                          <Markdown source={run.response} />
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          )}

          {/* CRITIQUE LAB */}
          {lab.labType === "critique" && (
            <>
              <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
                <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.critique.answerTitle")}</h2>
                <p className="mt-1 text-sm text-[var(--ink2)]">{t("labs.critique.answerIntro")}</p>
                <div className="mt-4 rounded-xl border-l-4 bg-[var(--s2)] p-5" style={{ borderColor: accentColor }}>
                  <Markdown source={lab.answerMd ?? ""} />
                </div>
              </section>

              <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
                <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.critique.question")}</h2>
                <p className="mt-1 text-sm text-[var(--ink2)]">{t("labs.critique.instructions")}</p>
                <ul className="mt-4 space-y-2">
                  {(lab.candidates ?? []).map((c) => (
                    <li key={c.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                          selected.has(c.id)
                            ? "border-[var(--blue3)] bg-[var(--blue-light)]"
                            : "border-[var(--border)] hover:border-[var(--ink3)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggle(selected, setSelected, c.id)}
                          className="mt-0.5"
                        />
                        <span className="text-[var(--ink2)]">{c.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => submit()}
                  disabled={busy || selected.size === 0}
                  className="mt-5 w-full rounded-full py-3.5 text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: accentColor }}
                >
                  {busy
                    ? t("labs.scoring")
                    : selected.size === 0
                      ? t("labs.critique.selectOne")
                      : selected.size === 1
                        ? t("labs.critique.submitOne")
                        : t("labs.critique.submitMany", { n: selected.size })}
                </button>
              </section>
            </>
          )}

          {/* BUILD LAB */}
          {lab.labType === "workbench" && (
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
              <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.workbench.title")}</h2>
              <p className="mt-1 text-sm text-[var(--ink2)]">{t("labs.workbench.intro")}</p>
              <ol className="mt-5 space-y-6">
                {(lab.fields ?? []).map((f, i) => {
                  const n = wordCount(answers[f.id] ?? "");
                  const min = f.minWords ?? 30;
                  return (
                    <li key={f.id}>
                      <label htmlFor={`wb-${f.id}`} className="flex items-baseline gap-2 text-sm font-semibold text-[var(--ink)]">
                        <span
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: accentColor }}
                        >
                          {i + 1}
                        </span>
                        {f.label}
                      </label>
                      <p className="ml-8 mt-1 text-sm leading-relaxed text-[var(--ink2)]">{f.prompt}</p>
                      <textarea
                        id={`wb-${f.id}`}
                        rows={6}
                        value={answers[f.id] ?? ""}
                        onChange={(e) => setAnswer(f.id, e.target.value)}
                        placeholder={f.placeholder}
                        className="ml-8 mt-2 w-[calc(100%-2rem)] rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
                      />
                      <p className={`ml-8 mt-1 text-right text-xs ${n >= min ? "text-[#0F6E56]" : "text-[var(--ink3)]"}`}>
                        {n < min ? t("labs.wordsAim", { n, min }) : t("labs.wordsDone", { n })}
                      </p>
                    </li>
                  );
                })}
              </ol>

              <button
                onClick={() => submit()}
                disabled={busy || (lab.fields ?? []).some((f) => !(answers[f.id] ?? "").trim())}
                className="mt-6 w-full rounded-full py-3.5 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: accentColor }}
              >
                {busy ? t("labs.workbench.assessing") : t("labs.workbench.submit")}
              </button>
              {(lab.fields ?? []).some((f) => !(answers[f.id] ?? "").trim()) && (
                <p className="mt-2 text-center text-xs text-[var(--ink3)]">{t("labs.workbench.needAll")}</p>
              )}
            </section>
          )}

          {lab.labType === "build" && (
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
              <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.build.steps")}</h2>
              <p className="mt-1 text-sm text-[var(--ink2)]">{t("labs.build.intro")}</p>
              <ul className="mt-4 space-y-2">
                {(lab.steps ?? []).map((s) => (
                  <li key={s.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                        checked.has(s.id)
                          ? "border-[var(--blue3)] bg-[var(--blue-light)]"
                          : "border-[var(--border)] hover:border-[var(--ink3)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(s.id)}
                        onChange={() => toggle(checked, setChecked, s.id)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-medium text-[var(--ink)]">{s.label}</span>
                        {s.detail && (
                          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--ink3)]">
                            {s.detail}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              {lab.requireArtifact !== false && (
                <div className="mt-5">
                  <label htmlFor="artifact" className="block text-sm font-semibold text-[var(--ink)]">
                    {lab.artifactLabel ?? t("labs.build.link")}
                  </label>
                  <input
                    id="artifact"
                    type="url"
                    value={artifactUrl}
                    onChange={(e) => setArtifactUrl(e.target.value)}
                    placeholder="https://…"
                    className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
                  />
                  <p className="mt-1 text-xs text-[var(--ink3)]">{t("labs.build.linkHelp")}</p>
                </div>
              )}

              <div className="mt-5">
                <label htmlFor="reflection" className="block text-sm font-semibold text-[var(--ink)]">
                  {t("labs.build.reflection")}
                </label>
                <p className="text-xs text-[var(--ink3)]">{t("labs.build.reflectionHelp")}</p>
                <textarea
                  id="reflection"
                  rows={7}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
                />
                <p className="mt-1 text-right text-xs text-[var(--ink3)]">
                  {t("labs.words", { n: wordCount(reflection) })}
                </p>
              </div>

              <button
                onClick={() => submit()}
                disabled={busy}
                className="mt-5 w-full rounded-full py-3.5 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: accentColor }}
              >
                {busy ? t("labs.saving") : t("labs.build.submit")}
              </button>
            </section>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
