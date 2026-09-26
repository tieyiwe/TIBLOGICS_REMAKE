"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Markdown from "./Markdown";
import { LAB_TYPE_META, type LabObjective, type LabType } from "@/lib/learn/labs/types";

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
}

export default function LabRunner({
  lab,
  trackSlug,
  accentColor,
  priorAttempt,
}: {
  lab: LabView;
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
  const meta = LAB_TYPE_META[lab.labType];

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
      if (!res.ok) throw new Error(data.error ?? "The sandbox didn't respond");
      setTranscript((t) => [...t, { prompt, response: data.response }]);
      setRunsUsed(data.runsUsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = { labId: lab.id };
      if (lab.labType === "prompt") body.prompt = prompt;
      if (lab.labType === "critique") body.selections = [...selected];
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
      if (!res.ok) throw new Error(data.error ?? "Could not score your lab");
      setResult(data);
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
          ← Back to track
        </Link>
      </nav>

      {/* Header */}
      <header className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            <span aria-hidden="true">{meta.icon}</span> {meta.label}
          </span>
          <span className="text-xs text-[var(--ink3)]">
            ~{lab.estimatedMinutes} min · {lab.points} pts · {lab.passScore}% to pass
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
              What you're scored on
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
              {result.passed ? "Lab passed" : "Not yet"}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {result.passed
                ? "Nice work — this one's logged."
                : `You need ${result.passScore}%. Read the feedback, then try again.`}
            </p>
            {result.pointsAwarded > 0 && (
              <p className="mt-2 text-sm font-bold text-[var(--orange2)]">
                +{result.pointsAwarded} points
              </p>
            )}
          </div>

          {result.breakdown.length > 0 && (
            <ul className="mt-6 space-y-3">
              {result.breakdown.map((b) => (
                <li key={b.objectiveId} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--ink)]">{b.label}</p>
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
              {result.passed ? "Try again for practice" : "Try again"}
            </button>
            <Link
              href={`/learn/track/${trackSlug}`}
              className="rounded-full px-6 py-2.5 text-sm font-bold text-white"
              style={{ background: accentColor }}
            >
              Back to track →
            </Link>
          </div>
        </section>
      )}

      {/* ── Working area ────────────────────────────────────────────────── */}
      {!result && (
        <>
          {lab.scenarioMd && (
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
              <h2 className="text-base font-bold text-[var(--ink)]">The scenario</h2>
              <div className="mt-3">
                <Markdown source={lab.scenarioMd} />
              </div>
            </section>
          )}

          {/* PROMPT LAB */}
          {lab.labType === "prompt" && (
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ink)]">Your prompt</h2>
                <span className="text-xs text-[var(--ink3)]">
                  {maxRuns - runsUsed} of {maxRuns} sandbox runs left
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--ink2)]">
                Write your prompt, run it against a real model, and refine it. You're graded on the
                prompt — not on how good the model's answer happened to be.
              </p>

              <textarea
                rows={8}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Write your prompt here…"
                className="mt-4 w-full rounded-xl border border-[var(--border)] px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
              />

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  onClick={runSandbox}
                  disabled={busy || !prompt.trim() || runsUsed >= maxRuns}
                  className="rounded-full border-2 px-5 py-2.5 text-sm font-bold disabled:opacity-40"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  {busy ? "Running…" : runsUsed >= maxRuns ? "No runs left" : "▶ Run in sandbox"}
                </button>
                <button
                  onClick={submit}
                  disabled={busy || !prompt.trim()}
                  className="rounded-full px-6 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: accentColor }}
                >
                  {busy ? "Scoring…" : "Submit for grading"}
                </button>
              </div>

              {transcript.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
                    Sandbox history
                  </h3>
                  <ol className="mt-3 space-y-4">
                    {transcript.map((t, i) => (
                      <li key={i} className="rounded-xl border border-[var(--border)] p-4">
                        <p className="text-xs font-bold text-[var(--ink3)]">Run {i + 1} — your prompt</p>
                        <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-[var(--ink2)]">
                          {t.prompt}
                        </pre>
                        <p className="mt-3 text-xs font-bold text-[var(--ink3)]">Response</p>
                        <div className="mt-1 max-h-72 overflow-auto rounded-lg bg-[var(--s2)] p-3">
                          <Markdown source={t.response} />
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
                <h2 className="text-base font-bold text-[var(--ink)]">The AI's answer</h2>
                <p className="mt-1 text-sm text-[var(--ink2)]">
                  Read it carefully. Some of this is wrong.
                </p>
                <div className="mt-4 rounded-xl border-l-4 bg-[var(--s2)] p-5" style={{ borderColor: accentColor }}>
                  <Markdown source={lab.answerMd ?? ""} />
                </div>
              </section>

              <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
                <h2 className="text-base font-bold text-[var(--ink)]">What's wrong with it?</h2>
                <p className="mt-1 text-sm text-[var(--ink2)]">
                  Select every statement that's a genuine problem. Some of these are perfectly fine —
                  flagging those counts against you, because knowing what's <em>acceptable</em> is
                  half the skill.
                </p>
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
                  onClick={submit}
                  disabled={busy || selected.size === 0}
                  className="mt-5 w-full rounded-full py-3.5 text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: accentColor }}
                >
                  {busy ? "Scoring…" : selected.size === 0 ? "Select at least one" : `Submit ${selected.size} selection${selected.size === 1 ? "" : "s"}`}
                </button>
              </section>
            </>
          )}

          {/* BUILD LAB */}
          {lab.labType === "build" && (
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
              <h2 className="text-base font-bold text-[var(--ink)]">Steps</h2>
              <p className="mt-1 text-sm text-[var(--ink2)]">
                Do these for real, then tick them off. This one's on your honour — we can't see
                inside another tool, and we're not pretending to.
              </p>
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
                    {lab.artifactLabel ?? "Link to your work"}
                  </label>
                  <input
                    id="artifact"
                    type="url"
                    value={artifactUrl}
                    onChange={(e) => setArtifactUrl(e.target.value)}
                    placeholder="https://…"
                    className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
                  />
                  <p className="mt-1 text-xs text-[var(--ink3)]">Make sure it's publicly viewable.</p>
                </div>
              )}

              <div className="mt-5">
                <label htmlFor="reflection" className="block text-sm font-semibold text-[var(--ink)]">
                  What happened?
                </label>
                <p className="text-xs text-[var(--ink3)]">
                  At least 60 words. What did you try, what surprised you, what would you do
                  differently? The writing is where it sticks.
                </p>
                <textarea
                  id="reflection"
                  rows={7}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
                />
                <p className="mt-1 text-right text-xs text-[var(--ink3)]">
                  {reflection.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              </div>

              <button
                onClick={submit}
                disabled={busy}
                className="mt-5 w-full rounded-full py-3.5 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: accentColor }}
              >
                {busy ? "Saving…" : "Submit lab"}
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
