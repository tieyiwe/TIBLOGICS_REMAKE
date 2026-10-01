"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { bumpPractice, celebrate, localDay } from "@/lib/learn/game-client";

// Daily Review: one card at a time, instant feedback, a combo counter, and a
// finish screen with what is due next and memory strength per track.
// The session payload holds only questions and shuffled options; the right
// answer and the explanation arrive in the reply to each answer.

interface Card {
  id: string;
  question: string;
  options: string[];
  box: number;
  isNew: boolean;
  /** A wrong card asked once more at the end (practice only). */
  retry?: boolean;
}

interface Feedback {
  choice: number;
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
  box: number;
  previousBox: number;
  dueAt: string;
  counted: boolean;
}

interface Summary {
  dueNow: number;
  dueTomorrow: number;
  dueThisWeek: number;
  totalCards: number;
  nextDueAt: string | null;
  tracks: Array<{ trackId: string; title: string; strength: number; cards: number; mastered: number }>;
}

type Phase = "intro" | "loading" | "card" | "finishing" | "done" | "empty" | "clear" | "error";

const TOP_BOX = 5;

export default function DailyReview({
  initialDue,
  available,
  doneToday,
  minForComplete,
  focusModuleId = null,
}: {
  initialDue: number;
  available: boolean;
  doneToday: boolean;
  minForComplete: number;
  /** Mastery paths: a focused review limited to one module's questions. */
  focusModuleId?: string | null;
}) {
  const t = useT();
  const locale = useLocale();
  const [phase, setPhase] = useState<Phase>(available ? "intro" : "empty");
  const [round, setRound] = useState("");
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [firstRight, setFirstRight] = useState(0);
  const [firstTotal, setFirstTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [result, setResult] = useState<{ counted: boolean; points: number } | null>(null);
  const [countedToday, setCountedToday] = useState(doneToday);

  const heading = useRef<HTMLHeadingElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const card = queue[idx];

  const fmtDue = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  const load = useCallback(async () => {
    setPhase("loading");
    setError(null);
    const res = await fetch(
      focusModuleId ? `/api/learn/review/session?module=${encodeURIComponent(focusModuleId)}` : "/api/learn/review/session",
      { cache: "no-store" },
    ).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) {
      setError(d.error ?? t("method.review.error"));
      setPhase("error");
      return;
    }
    const qs = (d.questions ?? []) as Card[];
    setRound(String(d.round ?? ""));
    setPending(!!d.pending);
    setRemaining(Number(d.remaining ?? 0));
    setQueue(qs);
    setIdx(0);
    setFeedback(null);
    setCombo(0);
    setBestCombo(0);
    setFirstRight(0);
    setFirstTotal(0);
    setResult(null);
    setPhase(qs.length ? "card" : "clear");
  }, [t, focusModuleId]);

  // Move focus to the new question so screen readers and keyboards follow.
  useEffect(() => {
    if (phase === "card" && !feedback) heading.current?.focus();
  }, [phase, idx, feedback]);
  useEffect(() => {
    if (feedback) nextBtn.current?.focus();
  }, [feedback]);

  const answer = useCallback(
    async (choice: number) => {
      if (!card || feedback || busy) return;
      setBusy(true);
      setError(null);
      const res = await fetch("/api/learn/review/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: card.id, choice, round }),
      }).catch(() => null);
      const d = res ? await res.json().catch(() => ({})) : {};
      setBusy(false);
      if (!res?.ok) {
        setError(d.error ?? t("method.review.error"));
        return;
      }
      const fb: Feedback = { choice, ...d };
      setFeedback(fb);
      if (!card.retry) {
        setFirstTotal((n) => n + 1);
        if (fb.isCorrect) setFirstRight((n) => n + 1);
        const c = fb.isCorrect ? combo + 1 : 0;
        setCombo(c);
        setBestCombo((b) => Math.max(b, c));
        // Missed cards come back once at the end of the session.
        if (!fb.isCorrect) setQueue((q) => [...q, { ...card, retry: true }]);
      }
    },
    [card, feedback, busy, round, combo, t],
  );

  const finish = useCallback(async () => {
    setPhase("finishing");
    const res = await fetch("/api/learn/review/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: localDay() }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setSummary(d.summary ?? null);
      setResult({ counted: !!d.counted, points: Number(d.pointsAwarded ?? 0) });
      if (d.counted) {
        if (!countedToday) bumpPractice();
        setCountedToday(true);
      }
      celebrate({ points: d.pointsAwarded, reason: "review", newBadges: d.newBadges, levelUp: d.levelUp });
    }
    setPhase("done");
  }, [countedToday]);

  const next = useCallback(() => {
    setFeedback(null);
    if (idx + 1 < queue.length) setIdx(idx + 1);
    else void finish();
  }, [idx, queue.length, finish]);

  // Number keys answer; Enter on the focused Next button moves on.
  useEffect(() => {
    if (phase !== "card" || feedback || !card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= card.options.length) {
        e.preventDefault();
        void answer(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, feedback, card, answer]);

  const shell = "rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-7";
  const primary =
    "inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-6 py-2.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90 disabled:opacity-50";
  const secondary =
    "inline-flex min-h-[44px] items-center rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]";

  // ── Nothing to review at all ────────────────────────────────────────────
  if (phase === "empty") {
    return (
      <section className={`${shell} text-center`}>
        <p aria-hidden="true" className="text-4xl">🗂️</p>
        <h2 className="mt-3 text-lg font-bold text-[var(--ink)]">{t("method.review.emptyTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--ink2)]">{t("method.review.emptyBody")}</p>
        <Link href="/learn/tracks" className={`${primary} mt-5`}>
          {t("method.review.emptyCta")} →
        </Link>
      </section>
    );
  }

  // ── Start ───────────────────────────────────────────────────────────────
  if (phase === "intro" || phase === "loading" || phase === "error") {
    return (
      <section className={shell}>
        <p className="text-sm font-bold text-[var(--ink)]">
          {initialDue > 0
            ? t(initialDue === 1 ? "method.dash.review.due.one" : "method.dash.review.due.other", { n: initialDue })
            : t("method.dash.review.none")}
          {doneToday && <span className="ml-2 font-semibold text-green-700">✓ {t("method.dash.review.done")}</span>}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={load} disabled={phase === "loading"} className={primary}>
            {phase === "loading" ? t("method.review.loading") : phase === "error" ? t("method.review.tryAgain") : t("method.review.start")}
          </button>
        </div>
        <p role="alert" className="mt-3 text-sm text-red-600">
          {phase === "error" ? error : ""}
        </p>
        <details className="mt-4 rounded-xl bg-[var(--s2)] p-4 text-sm">
          <summary className="cursor-pointer font-semibold text-[var(--ink)]">{t("method.review.whyTitle")}</summary>
          <p className="mt-2 leading-relaxed text-[var(--ink2)]">{t("method.review.whyBody")}</p>
        </details>
      </section>
    );
  }

  // ── Nothing due ─────────────────────────────────────────────────────────
  if (phase === "clear") {
    return (
      <section className={`${shell} text-center`}>
        <p aria-hidden="true" className="text-4xl">🌿</p>
        <h2 className="mt-3 text-lg font-bold text-[var(--ink)]">{t("method.review.clearTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--ink2)]">{t("method.review.clearBody")}</p>
        <Link href="/learn" className={`${secondary} mt-5`}>
          {t("method.review.back")}
        </Link>
      </section>
    );
  }

  // ── Finish screen ───────────────────────────────────────────────────────
  if (phase === "done" || phase === "finishing") {
    return (
      <section className={shell} aria-busy={phase === "finishing"}>
        <h2 tabIndex={-1} className="text-xl font-black text-[var(--ink)]">
          <span aria-hidden="true">🎉 </span>
          {t("method.review.doneTitle")}
        </h2>
        <p className="mt-2 text-sm text-[var(--ink2)]">
          {t("method.review.doneBody", { right: firstRight, total: firstTotal })}
          {bestCombo >= 2 && <span className="ml-2 font-bold text-[var(--orange2)]">{t("game.combo.best", { n: bestCombo })}</span>}
        </p>
        <p role="status" aria-live="polite" className="mt-2 text-sm font-semibold text-[var(--ink)]">
          {phase === "finishing"
            ? t("method.review.loading")
            : result?.counted
            ? result.points > 0
              ? `${t("method.review.counted")} +${result.points} XP`
              : t("method.review.alreadyCounted")
            : t("method.review.notCounted", { n: minForComplete })}
        </p>

        {summary && (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--s2)] p-4">
              <h3 className="text-sm font-bold text-[var(--ink)]">{t("method.review.nextTitle")}</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--ink2)]">
                {summary.dueNow > 0 && (
                  <li>{t(summary.dueNow === 1 ? "method.review.dueNow.one" : "method.review.dueNow.other", { n: summary.dueNow })}</li>
                )}
                <li>{t(summary.dueTomorrow === 1 ? "method.review.dueTomorrow.one" : "method.review.dueTomorrow.other", { n: summary.dueTomorrow })}</li>
                <li>{t(summary.dueThisWeek === 1 ? "method.review.dueWeek.one" : "method.review.dueWeek.other", { n: summary.dueThisWeek })}</li>
                {summary.nextDueAt && <li>{t("method.review.nextDue", { date: fmtDue(summary.nextDueAt) })}</li>}
              </ul>
            </div>
            <div className="rounded-xl bg-[var(--s2)] p-4">
              <h3 className="text-sm font-bold text-[var(--ink)]">{t("method.review.strengthTitle")}</h3>
              <p className="mt-0.5 text-xs text-[var(--ink3)]">{t("method.review.strengthHint")}</p>
              <ul className="mt-3 space-y-3">
                {summary.tracks.map((tr) => {
                  const pct = Math.round(tr.strength * 100);
                  return (
                    <li key={tr.trackId}>
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="min-w-0 truncate font-semibold text-[var(--ink)]">{tr.title}</span>
                        <span className="shrink-0 font-bold text-[var(--ink)]">{pct}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pct}
                        aria-label={t("method.review.strengthLabel", { track: tr.title, pct })}
                        className="mt-1 h-2 overflow-hidden rounded-full bg-white"
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#22A387] to-[#3B82F6] transition-[width] duration-700 motion-reduce:transition-none"
                          style={{ width: `${Math.max(3, pct)}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[11px] text-[var(--ink3)]">
                        {t("method.review.strengthCards", { n: tr.cards, m: tr.mastered })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {(summary?.dueNow ?? remaining) > 0 && (
            <button type="button" onClick={load} className={primary}>
              {t("method.review.more", { n: summary?.dueNow ?? remaining })}
            </button>
          )}
          <Link href="/learn" className={secondary}>
            {t("method.review.back")}
          </Link>
        </div>
      </section>
    );
  }

  // ── A card ──────────────────────────────────────────────────────────────
  if (!card) return null;
  const total = queue.length;
  return (
    <section className={shell}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--ink3)]">
        <span>{t("method.review.progress", { n: idx + 1, total })}</span>
        <span className="flex items-center gap-2">
          {card.retry ? (
            <span className="rounded-full bg-[var(--s2)] px-2 py-0.5">{t("method.review.retry")}</span>
          ) : card.isNew ? (
            <span className="rounded-full bg-[var(--blue-light)] px-2 py-0.5 text-[var(--blue)]">{t("method.review.new")}</span>
          ) : (
            <span className="rounded-full bg-[var(--s2)] px-2 py-0.5">{t("method.review.box", { n: card.box })}</span>
          )}
          <span
            aria-label={t("method.review.comboLabel", { n: combo })}
            className={`rounded-full px-2 py-0.5 font-black ${combo >= 2 ? "bg-[var(--orange-light)] text-[var(--orange2)]" : "bg-[var(--s2)]"}`}
          >
            <span aria-hidden="true">🔥 </span>
            {t("method.review.combo", { n: combo })}
          </span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--s3)]" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${Math.round(((idx + (feedback ? 1 : 0)) / total) * 100)}%` }}
        />
      </div>
      {pending && <p className="mt-2 text-xs text-[var(--ink3)]">{t("common.translationPending")}</p>}

      <h2 ref={heading} tabIndex={-1} className="mt-5 text-lg font-bold leading-snug text-[var(--ink)] focus:outline-none">
        {card.question}
      </h2>

      <div role="group" aria-label={t("method.review.optionsLabel")} className="mt-4 space-y-2">
        {card.options.map((o, i) => {
          const chosen = feedback?.choice === i;
          const right = feedback && feedback.correctIndex === i;
          const cls = feedback
            ? right
              ? "border-green-600 bg-green-50 text-green-900"
              : chosen
              ? "border-red-400 bg-red-50 text-red-900"
              : "border-[var(--border)] text-[var(--ink3)]"
            : "border-[var(--border)] text-[var(--ink2)] hover:border-[var(--ink3)] hover:bg-[var(--s2)]";
          return (
            <button
              key={i}
              type="button"
              onClick={() => answer(i)}
              disabled={!!feedback || busy}
              aria-pressed={chosen || undefined}
              className={`flex min-h-[48px] w-full items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-colors motion-reduce:transition-none disabled:cursor-default ${cls}`}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--s2)] text-xs font-bold text-[var(--ink2)]"
              >
                {feedback ? (right ? "✓" : chosen ? "✗" : i + 1) : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                {o}
                {feedback && right && <span className="sr-only"> ({t("method.review.rightAnswer")})</span>}
                {feedback && chosen && !right && <span className="sr-only"> ({t("method.review.yourAnswer")})</span>}
              </span>
            </button>
          );
        })}
      </div>

      {!feedback && <p className="mt-3 hidden text-xs text-[var(--ink3)] sm:block">{t("method.review.keysHint", { n: card.options.length })}</p>}

      <div aria-live="polite" role="status">
        {feedback && (
          <div
            className={`mt-5 rounded-xl border-l-4 p-4 text-sm ${
              feedback.isCorrect ? "border-green-600 bg-green-50" : "border-[var(--orange)] bg-[var(--orange-light)]"
            }`}
          >
            <p className="font-bold text-[var(--ink)]">
              {feedback.isCorrect ? `✓ ${t("method.review.correct")}` : t("method.review.wrong")}
            </p>
            <p className="mt-1 leading-relaxed text-[var(--ink2)]">{feedback.explanation}</p>
            <p className="mt-2 text-xs font-semibold text-[var(--ink2)]">
              {!feedback.counted
                ? t("method.review.practiceOnly")
                : !feedback.isCorrect
                ? t("method.review.movedBack")
                : feedback.previousBox === TOP_BOX
                ? t("method.review.stayedTop", { date: fmtDue(feedback.dueAt) })
                : t("method.review.movedUp", { n: feedback.box, date: fmtDue(feedback.dueAt) })}
            </p>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {feedback && (
        <button ref={nextBtn} type="button" onClick={next} className={`${primary} mt-5`}>
          {idx + 1 < queue.length ? t("method.review.next") : t("method.review.finish")} →
        </button>
      )}
    </section>
  );
}
