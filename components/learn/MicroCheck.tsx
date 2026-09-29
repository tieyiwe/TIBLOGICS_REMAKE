"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { bumpPractice, celebrate } from "@/lib/learn/game-client";
import ResultFlair from "./game/ResultFlair";

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
  const t = useT();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [pending, setPending] = useState(false);
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
      if (!res.ok) throw new Error(data.error ?? t("labs.micro.loadError"));
      setQuestions(data.questions);
      setPending(!!data.pending);
      setAnswers({});
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("labs.error.generic"));
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
      if (!res.ok) throw new Error(data.error ?? t("labs.micro.scoreError"));
      setResult(data);
      bumpPractice();
      celebrate({ points: data.pointsAwarded, reason: "micro", newBadges: data.newBadges, levelUp: data.levelUp });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("labs.error.generic"));
    } finally {
      setBusy(false);
    }
  }

  const allAnswered = questions?.every((q) => answers[q.id] !== undefined) ?? false;

  // ── Idle ────────────────────────────────────────────────────────────────
  if (!questions) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
        <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.micro.title")}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink2)]">{t("labs.micro.intro")}</p>
        <button
          onClick={load}
          disabled={busy}
          className="mt-4 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: accentColor }}
        >
          {busy ? t("labs.loading") : t("labs.micro.start")}
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
            {result.passed ? t("labs.micro.niceWork") : t("labs.micro.anotherLook")}
          </h2>
          <p className="text-sm font-bold" style={{ color: result.passed ? "#22A387" : "#E05F00" }}>
            {result.passed
              ? t("labs.micro.passedTag", { score: result.score })
              : t("labs.micro.toPassTag", { score: result.score, pass: passScore })}
            {result.pointsAwarded > 0 && (
              <span className="ml-2 text-[var(--orange2)]">{t("labs.pts", { n: result.pointsAwarded })}</span>
            )}
          </p>
        </div>
        <ResultFlair score={result.score} passScore={passScore} graded={result.graded} compact />

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
          {t("labs.micro.tryDifferent")}
        </button>
      </section>
    );
  }

  // ── Answering ───────────────────────────────────────────────────────────
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.micro.title")}</h2>
      {pending && <p className="mt-2 text-xs text-[var(--ink3)]">{t("common.translationPending")}</p>}
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
        {busy ? t("labs.checking") : allAnswered ? t("labs.micro.check") : t("labs.micro.answerAll")}
      </button>
    </section>
  );
}
