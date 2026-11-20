"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { LEVEL_STYLE } from "./styles";

// The placement diagnostic, one question at a time. The server sends only the
// question text and shuffled options; it never says whether an answer was
// right, only the per-module results at the end.

interface Question {
  id: string;
  question: string;
  options: string[];
  moduleId: string;
}

interface Result {
  moduleId: string;
  level: "mastered" | "partial" | "new";
  correct: number;
  asked: number;
  score: number;
}

interface State {
  sessionId: string;
  question: Question | null;
  answered: number;
  planned: number;
  pending: boolean;
  done: boolean;
  results: Result[] | null;
}

type Phase = "intro" | "loading" | "question" | "done" | "error";

export default function DiagnosticRunner({
  trackSlug,
  moduleTitles,
  estimatedQuestions,
  minutes,
  resuming,
  accent,
}: {
  trackSlug: string;
  moduleTitles: Record<string, { title: string; number: number }>;
  estimatedQuestions: number;
  minutes: { low: number; high: number };
  resuming: boolean;
  accent: string;
}) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [state, setState] = useState<State | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);

  const apply = useCallback((s: State) => {
    setState(s);
    setChoice(null);
    setPhase(s.done ? "done" : "question");
  }, []);

  const start = useCallback(async () => {
    setPhase("loading");
    setError(null);
    const res = await fetch("/api/learn/mastery/diagnostic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackSlug }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) {
      setError(d.error ?? t("mastery.diag.error"));
      setPhase("error");
      return;
    }
    apply(d as State);
  }, [trackSlug, t, apply]);

  const submit = useCallback(
    async (picked: number) => {
      if (!state?.question || busy) return;
      setBusy(true);
      setError(null);
      const res = await fetch("/api/learn/mastery/diagnostic/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId, questionId: state.question.id, choice: picked }),
      }).catch(() => null);
      const d = res ? await res.json().catch(() => ({})) : {};
      setBusy(false);
      if (res?.status === 409 && d.stale) {
        // Answered elsewhere (another tab): pick up where the session is.
        void start();
        return;
      }
      if (!res?.ok) {
        setError(d.error ?? t("mastery.diag.error"));
        return;
      }
      apply(d as State);
    },
    [state, busy, t, apply, start],
  );

  useEffect(() => {
    if (phase === "question") heading.current?.focus();
    if (phase === "done") resultsHeading.current?.focus();
  }, [phase, state?.question?.id]);

  const shell = "rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-7";
  const primary =
    "inline-flex min-h-[44px] items-center rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50";
  const secondary =
    "inline-flex min-h-[44px] items-center rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] disabled:opacity-50";

  if (phase === "intro" || phase === "loading" || phase === "error") {
    return (
      <section className={shell}>
        <ul className="space-y-2 text-sm leading-relaxed text-[var(--ink2)]">
          <li>• {t("mastery.diag.introQuestions", { n: estimatedQuestions, low: minutes.low, high: minutes.high })}</li>
          <li>• {t("mastery.diag.introAdaptive")}</li>
          <li>• {t("mastery.diag.introNoFeedback")}</li>
          <li>• {t("mastery.diag.introNotSure")}</li>
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={start} disabled={phase === "loading"} className={primary} style={{ background: accent }}>
            {phase === "loading"
              ? t("mastery.diag.loading")
              : phase === "error"
              ? t("mastery.diag.tryAgain")
              : resuming
              ? t("mastery.diag.resume")
              : t("mastery.diag.start")}
          </button>
          <Link href={`/learn/track/${trackSlug}`} className={secondary}>
            {t("mastery.diag.back")}
          </Link>
        </div>
        <p role="alert" className="mt-3 text-sm text-red-700">
          {phase === "error" ? error : ""}
        </p>
      </section>
    );
  }

  if (phase === "done" && state?.results) {
    const results = state.results;
    const count = (l: Result["level"]) => results.filter((r) => r.level === l).length;
    return (
      <section className={shell} aria-labelledby="diag-results">
        <h2 id="diag-results" ref={resultsHeading} tabIndex={-1} className="text-xl font-black text-[var(--ink)] focus:outline-none">
          {t("mastery.diag.resultsTitle")}
        </h2>
        <p className="mt-2 text-sm text-[var(--ink2)]">
          {t("mastery.diag.resultsSummary", { m: count("mastered"), p: count("partial"), n: count("new") })}
        </p>
        <ul className="mt-5 space-y-3">
          {results.map((r) => {
            const mod = moduleTitles[r.moduleId];
            const st = LEVEL_STYLE[r.level];
            return (
              <li key={r.moduleId} className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 text-sm font-bold text-[var(--ink)]">
                    {mod ? `${mod.number}. ${mod.title}` : r.moduleId}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>
                    <span aria-hidden="true">{st.mark}</span>
                    {t(`mastery.level.${r.level}`)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink2)]">
                  {t(`mastery.why.${r.level}`, { c: r.correct, n: r.asked })}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/learn/track/${trackSlug}#your-path`} className={primary} style={{ background: accent }}>
            {t("mastery.diag.seePath")} →
          </Link>
        </div>
      </section>
    );
  }

  const q = state?.question;
  if (!state || !q) return null;
  const mod = moduleTitles[q.moduleId];
  const pct = Math.round((state.answered / Math.max(1, state.planned)) * 100);
  return (
    <section className={shell}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--ink3)]">
        <span>{t("mastery.diag.progress", { n: state.answered + 1, total: Math.max(state.planned, state.answered + 1) })}</span>
        {mod && <span>{t("mastery.diag.moduleOf", { n: mod.number })}</span>}
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--s3)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={t("mastery.diag.progressLabel")}
      >
        <div className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${pct}%`, background: accent }} />
      </div>
      {state.pending && <p className="mt-2 text-xs text-[var(--ink3)]">{t("common.translationPending")}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (choice != null) void submit(choice);
        }}
      >
        <fieldset className="mt-5" disabled={busy}>
          <legend className="w-full">
            <h2 ref={heading} tabIndex={-1} className="text-lg font-bold leading-snug text-[var(--ink)] focus:outline-none">
              {q.question}
            </h2>
          </legend>
          <div className="mt-4 space-y-2">
            {q.options.map((o, i) => (
              <label
                key={i}
                className={`flex min-h-[48px] cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-sm transition-colors motion-reduce:transition-none ${
                  choice === i ? "bg-[var(--s2)] text-[var(--ink)]" : "border-[var(--border)] text-[var(--ink2)] hover:bg-[var(--s2)]"
                }`}
                style={choice === i ? { borderColor: accent } : undefined}
              >
                <input
                  type="radio"
                  name="diag-option"
                  value={i}
                  checked={choice === i}
                  onChange={() => setChoice(i)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span className="min-w-0 flex-1">{o}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={choice == null || busy} className={primary} style={{ background: accent }}>
            {busy ? t("mastery.diag.saving") : t("mastery.diag.next")} →
          </button>
          <button type="button" onClick={() => submit(-1)} disabled={busy} className={secondary}>
            {t("mastery.diag.notSure")}
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
