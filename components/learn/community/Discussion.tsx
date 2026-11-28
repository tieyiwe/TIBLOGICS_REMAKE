"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { ThreadSummary } from "@/lib/learn/community/discussion";
import { LIMITS } from "@/lib/learn/community/shared";
import ThreadView, { AnsweredBadge } from "./ThreadView";
import { api, ghostBtn, inputCls, primaryBtn, timeAgo } from "./client-utils";

// The "Discussion" section: under every lesson, on cohort pages and on the
// per-track community page. Lists threads (recent, unanswered, top), opens
// one in place, and starts new ones. Everything is checked again on the
// server; this component only shows what the API returns.

type Filter = "recent" | "unanswered" | "top";

export default function Discussion({
  scope,
  cohortOptions = [],
  lessonTitles,
  showContext = false,
  heading,
  suspendedUntil,
  newAccount = false,
  initialOpen,
  readOnly = false,
}: {
  /** Which threads: one lesson's, one cohort's, or a whole track's. */
  scope: { trackId?: string; lessonId?: string; cohortId?: string };
  /** Cohorts the learner is in for this track: may post cohort-only. */
  cohortOptions?: Array<{ id: string; name: string }>;
  /** Localized lesson titles, for the track page's thread context. */
  lessonTitles?: Record<string, string>;
  showContext?: boolean;
  heading?: string;
  /** ISO date while the learner is suspended from posting. */
  suspendedUntil?: string | null;
  /** Account too new to post links (anti-spam). */
  newAccount?: boolean;
  initialOpen?: string;
  /** Under 16 (AI-Empowered Youth): reading only, no posting. */
  readOnly?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("recent");
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(initialOpen ?? null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cohortId, setCohortId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [more, setMore] = useState(false);

  const query = new URLSearchParams(
    Object.entries({ ...scope, filter }).filter(([, v]) => !!v) as Array<[string, string]>,
  ).toString();

  const load = useCallback(
    async (append = false) => {
      const offset = append ? threads?.length ?? 0 : 0;
      const r = await api<{ threads: ThreadSummary[] }>(`/api/learn/community/threads?${query}&offset=${offset}`);
      if (!r.ok) return setError(r.error);
      setError(null);
      setThreads((prev) => (append && prev ? [...prev, ...r.data.threads] : r.data.threads));
      setMore(r.data.threads.length === 20);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const suspended = readOnly || (suspendedUntil && new Date(suspendedUntil).getTime() > Date.now());

  async function create() {
    setBusy(true);
    setFormError(null);
    const r = await api<{ id: string }>("/api/learn/community/threads", "POST", {
      ...scope,
      cohortId: scope.cohortId ?? (cohortId || undefined),
      title,
      bodyMd: body,
    });
    setBusy(false);
    if (!r.ok) return setFormError(r.error);
    setTitle("");
    setBody("");
    setComposing(false);
    setFilter("recent");
    await load();
    setOpen(r.data.id);
  }

  const tabs: Filter[] = ["recent", "unanswered", "top"];

  return (
    <section aria-labelledby="discussion-heading" className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="discussion-heading" className="text-base font-bold text-[var(--ink)]">
          <span aria-hidden="true">💬 </span>
          {heading ?? t("community.discussion")}
        </h2>
        {!suspended && (
          <button type="button" onClick={() => setComposing((v) => !v)} aria-expanded={composing} className={primaryBtn}>
            {composing ? t("community.cancel") : t("community.ask")}
          </button>
        )}
      </div>

      {readOnly && (
        <p role="status" className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900" data-testid="community-youth-readonly">
          {t("community.youthReadOnlyNotice")}
        </p>
      )}

      {suspended && !readOnly && (
        <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t("community.suspendedNotice", { date: new Date(suspendedUntil!).toLocaleDateString(locale, { dateStyle: "medium" }) })}
        </p>
      )}

      {composing && !suspended && (
        <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--s2)] p-4">
          <label className="block text-xs font-semibold text-[var(--ink2)]">
            {t("community.form.title")}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={LIMITS.titleMax}
              placeholder={t("community.form.titlePlaceholder")}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink2)]">
            {t("community.form.body")}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={LIMITS.bodyMax}
              rows={5}
              placeholder={t("community.form.bodyPlaceholder")}
              className={`${inputCls} mt-1`}
            />
          </label>
          <p className="text-[11px] text-[var(--ink3)]">
            {t("community.form.markdownHint")} {newAccount && t("community.form.noLinksHint", { days: LIMITS.newAccountDays })}
          </p>
          {!scope.cohortId && cohortOptions.length > 0 && (
            <label className="block text-xs font-semibold text-[var(--ink2)]">
              {t("community.form.visibility")}
              <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className={`${inputCls} mt-1`}>
                <option value="">{t("community.form.everyone")}</option>
                {cohortOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t("community.form.cohortOnly", { cohort: c.name })}
                  </option>
                ))}
              </select>
            </label>
          )}
          {scope.cohortId && <p className="text-xs text-[var(--ink3)]">{t("community.form.cohortScoped")}</p>}
          {formError && <p role="alert" className="text-xs text-red-700">{formError}</p>}
          <button
            type="button"
            onClick={create}
            disabled={busy || title.trim().length < LIMITS.titleMin || body.trim().length < LIMITS.threadBodyMin}
            className={primaryBtn}
          >
            {t("community.form.post")}
          </button>
        </div>
      )}

      <div role="tablist" aria-label={t("community.filter.label")} className="mt-4 flex flex-wrap gap-2">
        {tabs.map((f) => (
          <button
            key={f}
            role="tab"
            type="button"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === f ? "bg-[var(--ink)] text-white" : "bg-[var(--s2)] text-[var(--ink2)] hover:bg-[var(--s3)]"
            }`}
          >
            {t(`community.filter.${f}`)}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {!threads && !error && <p className="mt-4 text-sm text-[var(--ink3)]">{t("community.loading")}</p>}
      {threads && threads.length === 0 && (
        <p className="mt-4 rounded-xl bg-[var(--s2)] px-4 py-6 text-center text-sm text-[var(--ink3)]">
          {filter === "unanswered" ? t("community.emptyUnanswered") : t("community.empty")}
        </p>
      )}

      {threads && threads.length > 0 && (
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {threads.map((th) => {
            const isOpen = open === th.id;
            const lessonTitle = th.lessonId ? lessonTitles?.[th.lessonId] ?? th.lessonTitle : null;
            return (
              <li key={th.id} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : th.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span
                    className="mt-0.5 flex min-w-[40px] flex-col items-center rounded-lg bg-[var(--s2)] px-2 py-1 text-xs font-bold text-[var(--ink2)]"
                    aria-label={t("community.votes", { n: th.score })}
                  >
                    <span aria-hidden="true">▲</span>
                    {th.score}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[var(--ink)] [overflow-wrap:anywhere]">
                      {th.title}
                      {th.answered && <AnsweredBadge />}
                      {th.hidden && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                          {t("community.hiddenTag")}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--ink3)]">
                      {th.author || t("community.learner")} · {timeAgo(th.lastPostAt, locale)} ·{" "}
                      {t(th.replyCount === 1 ? "community.replies.one" : "community.replies.other", { n: th.replyCount })}
                      {th.cohortName && <> · {t("community.cohortOnlyTag", { cohort: th.cohortName })}</>}
                      {showContext && lessonTitle && <> · {lessonTitle}</>}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-xs text-[var(--ink3)]">
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>
                {isOpen && (
                  <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--s2)]/50 p-3 sm:ml-[52px] sm:p-4">
                    {showContext && th.lessonId && (
                      <p className="mb-2 text-xs">
                        <Link href={`/learn/lesson/${th.lessonId}`} className="font-semibold text-[var(--blue2)] underline">
                          {lessonTitle ?? t("community.openLesson")} →
                        </Link>
                      </p>
                    )}
                    <ThreadView threadId={th.id} onChanged={() => void load()} />
                    <p className="mt-3 text-right">
                      <Link href={`/learn/community/thread/${th.id}`} className="text-xs font-semibold text-[var(--ink3)] underline">
                        {t("community.permalink")}
                      </Link>
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {more && (
        <button type="button" onClick={() => void load(true)} className={`${ghostBtn} mt-3`}>
          {t("community.loadMore")}
        </button>
      )}
    </section>
  );
}
