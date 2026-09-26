"use client";

import { useState } from "react";

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface Graded {
  id: string;
  question: string;
  options: string[];
  yourAnswer: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

// Tier 1 (Part E3). Low stakes on purpose — the value is the explanation,
// not the score, so a wrong answer is treated as a teaching moment.
export default function MicroCheck({
  microCheckId,
  passScore,
  accentColor,
}: {
  microCheckId: string;
  passScore: number;
  accentColor: string;
}) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; graded: Graded[]; pointsAwarded: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/learn/quiz/serve?mode=micro&id=${microCheckId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not load the check");
      setQuestions(data.questions);
      setAnswers({});
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!questions) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "micro", id: microCheckId, answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not score your answers");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const allAnswered = questions?.every((q) => answers[q.id] !== undefined) ?? false;

  // ── Idle ────────────────────────────────────────────────────────────────
  if (!questions) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
        <h2 className="text-base font-bold text-[var(--ink)]">Quick check</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink2)]">
          A couple of questions to make sure that landed. No pressure — you can retake it as many
          times as you like.
        </p>
        <button
          onClick={load}
          disabled={busy}
          className="mt-4 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: accentColor }}
        >
          {busy ? "Loading…" : "Start quick check"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────
  if (result) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[var(--ink)]">
            {result.passed ? "Nice work" : "Worth another look"}
          </h2>
          <p className="text-sm font-bold" style={{ color: result.passed ? "#22A387" : "#E05F00" }}>
            {result.score}% {result.passed ? "· passed" : `· ${passScore}% to pass`}
            {result.pointsAwarded > 0 && (
              <span className="ml-2 text-[var(--orange2)]">+{result.pointsAwarded} pts</span>
            )}
          </p>
        </div>

        <ol className="mt-5 space-y-5">
          {result.graded.map((g, i) => (
            <li key={g.id}>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {i + 1}. {g.question}
              </p>
              <ul className="mt-2 space-y-1.5">
                {g.options.map((o, oi) => {
                  const chosen = g.yourAnswer === oi;
                  const correct = g.correctIndex === oi;
                  return (
                    <li
                      key={oi}
                      className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                        correct
                          ? "bg-green-50 font-medium text-green-900"
                          : chosen
                          ? "bg-red-50 text-red-900"
                          : "text-[var(--ink2)]"
                      }`}
                    >
                      <span aria-hidden="true" className="shrink-0">
                        {correct ? "✓" : chosen ? "✗" : "·"}
                      </span>
                      <span>{o}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 rounded-lg bg-[var(--s2)] px-3 py-2 text-sm leading-relaxed text-[var(--ink2)]">
                {g.explanation}
              </p>
            </li>
          ))}
        </ol>

        <button
          onClick={load}
          disabled={busy}
          className="mt-5 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]"
        >
          Try a different set
        </button>
      </section>
    );
  }

  // ── Answering ───────────────────────────────────────────────────────────
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <h2 className="text-base font-bold text-[var(--ink)]">Quick check</h2>
      <ol className="mt-4 space-y-6">
        {questions.map((q, i) => (
          <li key={q.id}>
            <fieldset>
              <legend className="text-sm font-semibold text-[var(--ink)]">
                {i + 1}. {q.question}
              </legend>
              <div className="mt-2.5 space-y-2">
                {q.options.map((o, oi) => (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      answers[q.id] === oi
                        ? "border-[var(--blue3)] bg-[var(--blue-light)]"
                        : "border-[var(--border)] hover:border-[var(--ink3)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === oi}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className="mt-0.5"
                    />
                    <span className="text-[var(--ink2)]">{o}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={!allAnswered || busy}
        className="mt-5 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ background: accentColor }}
      >
        {busy ? "Checking…" : allAnswered ? "Check my answers" : "Answer every question"}
      </button>
    </section>
  );
}
