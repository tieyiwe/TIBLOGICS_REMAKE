"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface Graded extends Question {
  yourAnswer: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

// Tier 2 (Part E3). Unlimited retakes with a different question set each time —
// the goal is competence, not a single lucky run.
export default function QuizRunner({
  quizId,
  moduleTitle,
  passScore,
  questionsServed,
  accentColor,
  trackSlug,
  bestScore,
  alreadyPassed,
}: {
  quizId: string;
  moduleTitle: string;
  passScore: number;
  questionsServed: number;
  accentColor: string;
  trackSlug: string;
  bestScore: number | null;
  alreadyPassed: boolean;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    score: number; passed: boolean; graded: Graded[]; pointsAwarded: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/learn/quiz/serve?mode=quiz&id=${quizId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not load the quiz");
      setQuestions(data.questions);
      setAnswers({});
      setResult(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      const res = await fetch("/api/learn/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "quiz", id: quizId, answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not score the quiz");
      setResult(data);
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const answeredCount = questions?.filter((q) => answers[q.id] !== undefined).length ?? 0;
  const allAnswered = questions != null && answeredCount === questions.length;

  // ── Intro ───────────────────────────────────────────────────────────────
  if (!questions) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
        <h1 className="text-xl font-black text-[var(--ink)]">Module quiz</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--ink2)]">{moduleTitle}</p>

        <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-4 text-left">
          <div className="rounded-xl bg-[var(--s2)] p-3">
            <dt className="text-xs text-[var(--ink3)]">Questions</dt>
            <dd className="text-sm font-bold text-[var(--ink)]">{questionsServed}</dd>
          </div>
          <div className="rounded-xl bg-[var(--s2)] p-3">
            <dt className="text-xs text-[var(--ink3)]">To pass</dt>
            <dd className="text-sm font-bold text-[var(--ink)]">{passScore}%</dd>
          </div>
        </dl>

        {bestScore != null && (
          <p className="mt-4 text-sm text-[var(--ink2)]">
            Your best so far: <strong>{bestScore}%</strong>
            {alreadyPassed && <span className="ml-2 font-semibold text-green-700">✓ passed</span>}
          </p>
        )}

        <p className="mx-auto mt-4 max-w-md text-sm text-[var(--ink2)]">
          No time limit. Retake as often as you like — the questions are drawn from a larger bank, so
          you'll get a different set each time.
        </p>

        <button
          onClick={load}
          disabled={busy}
          className="mt-6 rounded-full px-7 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: accentColor }}
        >
          {busy ? "Loading…" : alreadyPassed ? "Retake for practice" : "Start the quiz"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────
  if (result) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-8">
        <div className="text-center">
          <p className="text-5xl font-black" style={{ color: result.passed ? "#22A387" : "#E05F00" }}>
            {result.score}%
          </p>
          <h1 className="mt-2 text-xl font-bold text-[var(--ink)]">
            {result.passed ? "Passed" : "Not quite yet"}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            {result.passed
              ? "This module is signed off. On to the next one."
              : `You need ${passScore}% to pass. Review the explanations below, then try a fresh set.`}
          </p>
          {result.pointsAwarded > 0 && (
            <p className="mt-2 text-sm font-bold text-[var(--orange2)]">
              +{result.pointsAwarded} points
            </p>
          )}
        </div>

        <ol className="mt-8 space-y-6">
          {result.graded.map((g, i) => (
            <li key={g.id} className="border-t border-[var(--border)] pt-5 first:border-t-0 first:pt-0">
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

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={load}
            disabled={busy}
            className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]"
          >
            {result.passed ? "Retake for practice" : "Try a fresh set"}
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
    );
  }

  // ── Answering ───────────────────────────────────────────────────────────
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
      <div className="sticky top-16 z-10 -mx-6 mb-6 border-b border-[var(--border)] bg-white/95 px-6 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-[var(--ink)]">{moduleTitle}</span>
          <span className="text-[var(--ink3)]">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--s3)]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(answeredCount / questions.length) * 100}%`,
              background: accentColor,
            }}
          />
        </div>
      </div>

      <ol className="space-y-8">
        {questions.map((q, i) => (
          <li key={q.id}>
            <fieldset>
              <legend className="text-sm font-semibold text-[var(--ink)]">
                {i + 1}. {q.question}
              </legend>
              <div className="mt-3 space-y-2">
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

      {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={!allAnswered || busy}
        className="mt-8 w-full rounded-full py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ background: accentColor }}
      >
        {busy
          ? "Scoring…"
          : allAnswered
          ? "Submit quiz"
          : `Answer all ${questions.length} questions to submit`}
      </button>
    </section>
  );
}
