"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import { formatMinutes } from "@/lib/learn/types";

interface Question {
  id: string;
  question: string;
  options: string[];
  moduleId?: string | null;
}

interface Graded extends Question {
  yourAnswer: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

interface ExamConfig {
  title: string;
  timeLimitMinutes: number;
  questionsServed: number;
  passScore: number;
  distinctionScore: number;
  maxAttempts: number;
  cooldownHours: number;
  instructionsMd: string;
}

type Phase = "intro" | "running" | "results";

export default function ExamRunner({
  trackSlug,
  accentColor,
  exam,
  history,
  alreadyPassed,
  hasInProgress,
  attemptsLeft,
  cooldownUntil,
  extendedTime,
}: {
  trackSlug: string;
  accentColor: string;
  exam: ExamConfig;
  history: Array<{ attemptNumber: number; score: number | null; passed: boolean | null; status: string; submittedAt: string | null }>;
  alreadyPassed: boolean;
  hasInProgress: boolean;
  attemptsLeft: number;
  cooldownUntil: string | null;
  extendedTime: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [result, setResult] = useState<{
    score: number; passed: boolean; distinction: boolean; graded: Graded[];
    perModuleScores: Record<string, number>; pointsAwarded: number; expired: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const submittingRef = useRef(false);

  // ── Server-authoritative countdown ──────────────────────────────────────
  // We derive remaining time from the server's expiresAt and the offset
  // measured at start. Changing the device clock does not extend the exam.
  useEffect(() => {
    if (phase !== "running" || expiresAt == null) return;
    const tick = () => {
      const left = Math.max(0, expiresAt - Date.now());
      setRemaining(left);
      if (left === 0) void submit(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, expiresAt]);

  // Warn before closing the tab mid-exam
  useEffect(() => {
    if (phase !== "running") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackSlug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not start the exam");

      setSessionId(data.sessionId);
      setQuestions(data.questions ?? []);
      setAnswers(data.answers ?? {});
      // Trust the server's clock: convert its expiry into a local deadline
      // using the offset between server and browser time.
      const skew = Date.now() - new Date(data.serverNow).getTime();
      setExpiresAt(new Date(data.expiresAt).getTime() + skew);
      setPhase("running");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // Autosave each answer so a crash or disconnect never loses work
  const saveAnswer = useCallback(
    async (questionId: string, answer: number) => {
      if (!sessionId) return;
      setSaveState("saving");
      try {
        const res = await fetch("/api/learn/exam/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, questionId, answer }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    },
    [sessionId],
  );

  function choose(questionId: string, answer: number) {
    setAnswers((a) => ({ ...a, [questionId]: answer }));
    void saveAnswer(questionId, answer);
  }

  async function submit(auto = false) {
    if (!sessionId || submittingRef.current) return;
    if (!auto && !confirm("Submit your exam? You can't change answers afterwards.")) return;

    submittingRef.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not submit the exam");
      setResult(data);
      setPhase("results");
      router.refresh();
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      submittingRef.current = false;
    } finally {
      setBusy(false);
    }
  }

  // ── Results ─────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-8">
        <div className="text-center">
          <p
            className="text-6xl font-black"
            style={{ color: result.passed ? "#22A387" : "#E05F00" }}
          >
            {result.score}%
          </p>
          <h1 className="mt-3 text-2xl font-black text-[var(--ink)]">
            {result.distinction ? "Passed with Distinction" : result.passed ? "Passed" : "Not this time"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--ink2)]">
            {result.passed
              ? "The exam is behind you. The capstone is the last step to your certificate."
              : `You needed ${exam.passScore}%. The breakdown below shows exactly which modules to revisit before your next attempt.`}
          </p>
          {result.expired && (
            <p className="mx-auto mt-3 max-w-md rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
              Time ran out, so we scored the answers you'd saved. Nothing was lost.
            </p>
          )}
          {result.pointsAwarded > 0 && (
            <p className="mt-3 text-sm font-bold text-[var(--orange2)]">
              +{result.pointsAwarded} points
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/learn/track/${trackSlug}`}
            className="rounded-full px-6 py-2.5 text-sm font-bold text-white"
            style={{ background: accentColor }}
          >
            Back to the track →
          </Link>
          {result.passed && (
            <Link
              href={`/learn/capstone/${trackSlug}`}
              className="rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-bold text-white"
            >
              Start the capstone →
            </Link>
          )}
        </div>

        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--blue2)]">
            Review every question and explanation
          </summary>
          <ol className="mt-5 space-y-6">
            {result.graded.map((g, i) => (
              <li key={g.id} className="border-t border-[var(--border)] pt-5">
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
                        <span aria-hidden="true">{correct ? "✓" : chosen ? "✗" : "·"}</span>
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
        </details>
      </section>
    );
  }

  // ── Running ─────────────────────────────────────────────────────────────
  if (phase === "running") {
    const answered = questions.filter((q) => answers[q.id] !== undefined).length;
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const urgent = remaining < 5 * 60_000;

    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
        {/* Sticky clock */}
        <div className="sticky top-16 z-10 -mx-6 mb-6 border-b border-[var(--border)] bg-white/95 px-6 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`font-mono text-xl font-black tabular-nums ${
                urgent ? "learn-urgent text-red-600" : "text-[var(--ink)]"
              }`}
              role="timer"
              aria-live={urgent ? "assertive" : "off"}
            >
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="text-sm text-[var(--ink3)]">
              {answered}/{questions.length} answered
              {saveState === "saving" && <span className="ml-2 text-xs">saving…</span>}
              {saveState === "saved" && <span className="ml-2 text-xs text-green-700">saved</span>}
              {saveState === "error" && (
                <span className="ml-2 text-xs text-red-600">save failed — retrying on next answer</span>
              )}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--s3)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(answered / questions.length) * 100}%`, background: accentColor }}
            />
          </div>
        </div>

        {urgent && (
          <p role="alert" className="mb-5 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800">
            Under five minutes left. Your answers are already saved — if the clock runs out we'll
            score what you have.
          </p>
        )}

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
                        onChange={() => choose(q.id, oi)}
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
          onClick={() => submit(false)}
          disabled={busy}
          className="mt-8 w-full rounded-full py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: accentColor }}
        >
          {busy ? "Submitting…" : `Submit exam (${answered}/${questions.length} answered)`}
        </button>
      </section>
    );
  }

  // ── Intro ───────────────────────────────────────────────────────────────
  const cooldownDate = cooldownUntil ? new Date(cooldownUntil) : null;
  const blocked = alreadyPassed || attemptsLeft === 0 || (cooldownDate != null && !hasInProgress);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-8">
      <h1 className="text-xl font-black text-[var(--ink)]">{exam.title}</h1>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Questions", String(exam.questionsServed)],
          ["Time limit", formatMinutes(extendedTime ? Math.round(exam.timeLimitMinutes * 1.5) : exam.timeLimitMinutes)],
          ["To pass", `${exam.passScore}%`],
          ["Distinction", `${exam.distinctionScore}%`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-[var(--s2)] p-3">
            <dt className="text-xs text-[var(--ink3)]">{k}</dt>
            <dd className="mt-0.5 text-sm font-bold text-[var(--ink)]">{v}</dd>
          </div>
        ))}
      </dl>

      {extendedTime && (
        <p className="mt-3 rounded-lg bg-[var(--blue-light)] px-4 py-2.5 text-sm text-[var(--blue)]">
          Accessibility mode is on, so you have 1.5× the standard time.
        </p>
      )}

      {exam.instructionsMd && (
        <div className="mt-6 rounded-xl bg-[var(--s2)] p-5">
          <Markdown source={exam.instructionsMd} />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-[var(--border)] p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Before you begin</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ink2)]">
          <li>• The clock runs on our server. Closing this tab won't pause it.</li>
          <li>• Every answer is saved the moment you pick it — a dropped connection won't cost you.</li>
          <li>• If time runs out, we score what you've saved. You never get a zero for a technical failure.</li>
          <li>• You have {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left, each with a different set of questions.</li>
        </ul>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {alreadyPassed ? (
        <p className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800">
          You've already passed this exam.
        </p>
      ) : attemptsLeft === 0 ? (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          You've used all {exam.maxAttempts} attempts.{" "}
          <Link href="/contact" className="font-semibold underline">
            Contact us
          </Link>{" "}
          — we can reset it after a conversation about where it went wrong.
        </p>
      ) : cooldownDate && !hasInProgress ? (
        <p className="mt-6 rounded-lg bg-[var(--s2)] px-4 py-3 text-center text-sm text-[var(--ink2)]">
          Your next attempt unlocks {cooldownDate.toLocaleString()}. Use the time to review — the
          cooldown exists so retries are studied, not spammed.
        </p>
      ) : (
        <button
          onClick={start}
          disabled={busy || blocked}
          className="mt-6 w-full rounded-full py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: accentColor }}
        >
          {busy ? "Preparing…" : hasInProgress ? "Resume your exam →" : "Start the exam →"}
        </button>
      )}
    </section>
  );
}
