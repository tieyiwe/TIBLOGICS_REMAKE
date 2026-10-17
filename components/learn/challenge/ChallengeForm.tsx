"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { celebrate } from "@/lib/learn/game-client";

// This week's answer: write, submit for AI grading, then see the score, the
// feedback and what a good answer includes. One edit is allowed until the
// week ends (the server enforces it; this only mirrors it).

interface Entry {
  score: number;
  feedback: string;
  breakdown: Array<{ points: number; note: string }>;
  answer: string;
}

export default function ChallengeForm({
  week,
  minChars,
  maxChars,
  maxPoints,
  criterionPoints,
  include,
  initial,
  initialEditsLeft,
}: {
  week: string;
  minChars: number;
  maxChars: number;
  maxPoints: number;
  criterionPoints: number;
  include: string[];
  initial: Entry | null;
  initialEditsLeft: number;
}) {
  const t = useT();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(initial);
  const [editsLeft, setEditsLeft] = useState(initialEditsLeft);
  const [editing, setEditing] = useState(!initial);
  const [text, setText] = useState(initial?.answer ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awarded, setAwarded] = useState<number | null>(null);

  const len = text.trim().length;
  const tooShort = len < minChars;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || tooShort || text.length > maxChars) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/learn/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week, answer: text }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok || !d.entry) {
      setError(d.error ?? t("learn.challenge.api.failed"));
      if (d.code === "week_changed") router.refresh();
      return;
    }
    setEntry(d.entry);
    setEditsLeft(d.editsLeft ?? 0);
    setEditing(false);
    setAwarded(d.pointsAwarded ?? 0);
    if (d.pointsAwarded > 0) celebrate({ points: d.pointsAwarded });
    // The board on this page is server-rendered: refresh it.
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {editing ? (
        <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-white p-5" aria-labelledby="ch-answer-label">
          <label id="ch-answer-label" htmlFor="ch-answer" className="block text-sm font-bold text-[var(--ink)]">
            {t(entry ? "learn.challenge.editLabel" : "learn.challenge.answerLabel")}
          </label>
          <p id="ch-answer-hint" className="mt-1 text-xs text-[var(--ink3)]">
            {t("learn.challenge.answerHint", { min: minChars, max: maxChars })}
          </p>
          <textarea
            id="ch-answer"
            data-testid="challenge-answer"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxChars))}
            maxLength={maxChars}
            rows={9}
            aria-describedby="ch-answer-hint ch-answer-count"
            className="mt-3 w-full resize-y rounded-xl border border-[var(--border)] bg-white p-3 text-sm leading-relaxed text-[var(--ink)] focus:border-[var(--orange)] focus:outline-none focus:ring-2 focus:ring-[var(--orange)]/30"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p id="ch-answer-count" className="text-xs text-[var(--ink3)]" aria-live="polite">
              {t("learn.challenge.count", { n: text.length, max: maxChars })}
            </p>
            <div className="flex flex-wrap gap-2">
              {entry && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setText(entry.answer);
                    setError(null);
                  }}
                  className="min-h-[44px] rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink2)]"
                >
                  {t("learn.challenge.cancel")}
                </button>
              )}
              <button
                type="submit"
                disabled={busy || tooShort}
                data-testid="challenge-submit"
                className="min-h-[44px] rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-6 py-2.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? t("learn.challenge.grading") : t(entry ? "learn.challenge.resubmit" : "learn.challenge.submit")}
              </button>
            </div>
          </div>
          {entry && <p className="mt-3 text-xs font-semibold text-[var(--orange2)]">{t("learn.challenge.editWarning")}</p>}
          <p role="alert" className="mt-3 text-sm font-semibold text-red-700 empty:hidden" data-testid="challenge-error">
            {error ?? ""}
          </p>
        </form>
      ) : entry ? (
        <section aria-labelledby="ch-result-h" className="rounded-2xl border border-[var(--border)] bg-white p-5" data-testid="challenge-result">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="ch-result-h" className="text-lg font-bold text-[var(--ink)]">{t("learn.challenge.resultTitle")}</h2>
              <p className="mt-1 text-3xl font-black text-[var(--ink)]" data-testid="challenge-score">
                {t("learn.challenge.scoreOf", { n: entry.score, max: maxPoints })}
              </p>
              {awarded != null && (
                <p className="mt-1 text-sm font-semibold text-green-800" role="status">
                  {awarded > 0 ? t("learn.challenge.pointsAwarded", { n: awarded }) : t("learn.challenge.noNewPoints")}
                </p>
              )}
            </div>
            {editsLeft > 0 && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                data-testid="challenge-edit"
                className="min-h-[44px] rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)]"
              >
                {t("learn.challenge.edit")}
              </button>
            )}
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--ink2)]">{entry.feedback}</p>

          <h3 className="mt-5 text-sm font-bold text-[var(--ink)]">{t("learn.challenge.goodAnswer")}</h3>
          <ol className="mt-2 space-y-3">
            {include.map((c, i) => {
              const b = entry.breakdown[i];
              return (
                <li key={i} className="rounded-xl bg-[var(--s2)] p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-[var(--ink)]">{c}</span>
                    <span className="shrink-0 font-black text-[var(--ink)]">
                      {t("learn.challenge.criterionPoints", { n: b?.points ?? 0, max: criterionPoints })}
                    </span>
                  </div>
                  {b?.note && <p className="mt-1 text-xs leading-relaxed text-[var(--ink2)]">{b.note}</p>}
                </li>
              );
            })}
          </ol>

          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--blue2)]">{t("learn.challenge.yourAnswer")}</summary>
            <p className="mt-2 whitespace-pre-wrap rounded-xl border border-[var(--border)] p-3 text-sm text-[var(--ink2)] [overflow-wrap:anywhere]">
              {entry.answer}
            </p>
          </details>
          <p className="mt-4 text-xs text-[var(--ink3)]">
            {editsLeft > 0 ? t("learn.challenge.oneEditLeft") : t("learn.challenge.final")}
          </p>
        </section>
      ) : null}
    </div>
  );
}
