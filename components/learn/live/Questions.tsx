"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { api, inputCls, linkBtn, primaryBtn, timeAgo } from "@/components/learn/community/client-utils";
import { LIVE_LIMITS } from "@/lib/learn/live/shared";
import type { QuestionItem } from "@/lib/learn/live/sessions";

// Questions for the expert: ask (before the start), upvote, delete your own.
// Most upvoted first; staff mark the ones answered during the session.
export default function Questions({
  sessionId,
  initial,
  canAsk,
  canVote,
  myCount,
}: {
  sessionId: string;
  initial: QuestionItem[];
  canAsk: boolean;
  canVote: boolean;
  myCount: number;
}) {
  const t = useT();
  const locale = useLocale();
  const [items, setItems] = useState(initial);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState(myCount);
  // Relative times depend on the clock: shown once in the browser only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function reload() {
    const r = await api<{ questions: QuestionItem[] }>(`/api/learn/live/${sessionId}/questions`);
    if (r.ok) setItems(r.data.questions);
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api(`/api/learn/live/${sessionId}/questions`, "POST", { action: "ask", body });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setBody("");
    setMine((n) => n + 1);
    await reload();
  }

  async function vote(id: string) {
    setError(null);
    const r = await api<{ voted: boolean; score: number }>(`/api/learn/live/${sessionId}/questions`, "POST", { action: "vote", questionId: id });
    if (!r.ok) return setError(r.error);
    setItems((xs) =>
      xs
        .map((q) => (q.id === id ? { ...q, voted: r.data.voted, score: r.data.score } : q))
        .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt)),
    );
  }

  async function remove(id: string) {
    if (!confirm(t("live.q.deleteConfirm"))) return;
    const r = await api(`/api/learn/live/${sessionId}/questions`, "POST", { action: "delete", questionId: id });
    if (!r.ok) return setError(r.error);
    setItems((xs) => xs.filter((q) => q.id !== id));
    setMine((n) => Math.max(0, n - 1));
  }

  const left = LIVE_LIMITS.questionsPerSession - mine;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5" aria-labelledby="live-questions">
      <h2 id="live-questions" className="text-sm font-bold text-[var(--ink)]">
        {t("live.q.title")}
      </h2>
      <p className="mt-1 text-xs text-[var(--ink3)]">{canAsk ? t("live.q.intro") : t("live.q.closed")}</p>

      {canAsk && left > 0 && (
        <form onSubmit={ask} className="mt-3 space-y-2">
          <label htmlFor="live-q" className="sr-only">
            {t("live.q.label")}
          </label>
          <textarea
            id="live-q"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={LIVE_LIMITS.questionMax}
            placeholder={t("live.q.placeholder")}
            className={inputCls}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-[var(--ink3)]">{t("live.q.left", { n: left })}</span>
            <button type="submit" disabled={busy || body.trim().length < LIVE_LIMITS.questionMin} className={primaryBtn}>
              {t("live.q.submit")}
            </button>
          </div>
        </form>
      )}
      {canAsk && left <= 0 && <p className="mt-3 text-xs text-[var(--ink3)]">{t("live.err.questionCap", { n: LIVE_LIMITS.questionsPerSession })}</p>}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink3)]">{t("live.q.empty")}</p>
      ) : (
        <ul className="mt-4 space-y-2" data-testid="questions">
          {items.map((q) => (
            <li key={q.id} className="flex gap-3 rounded-xl bg-[var(--s2)] p-3">
              <button
                type="button"
                onClick={() => vote(q.id)}
                disabled={!canVote || q.mine || q.hidden}
                aria-pressed={q.voted}
                aria-label={q.mine ? t("live.q.ownVote") : q.voted ? t("live.q.unvote") : t("live.q.vote")}
                title={q.mine ? t("live.q.ownVote") : undefined}
                className={`flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-lg border text-xs font-bold ${
                  q.voted ? "border-[#F47C20] bg-[#F47C20]/10 text-[#B45309]" : "border-[var(--border)] bg-white text-[var(--ink2)]"
                } disabled:opacity-60`}
              >
                <span aria-hidden="true">▲</span>
                <span data-testid="score">{q.score}</span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm text-[var(--ink)] [overflow-wrap:anywhere]">{q.body}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[var(--ink3)]">
                  <span>{q.author || t("community.learner")}{q.mine && ` (${t("community.you")})`}</span>
                  {mounted && (
                    <>
                      <span>·</span>
                      <span>{timeAgo(q.createdAt, locale)}</span>
                    </>
                  )}
                  {q.answered && <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">✓ {t("live.q.answered")}</span>}
                  {q.hidden && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">{t("live.q.hiddenOwn")}</span>}
                  {q.mine && canAsk && (
                    <button type="button" onClick={() => remove(q.id)} className={linkBtn}>
                      {t("community.delete")}
                    </button>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
