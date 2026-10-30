"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { PostItem, ThreadSummary } from "@/lib/learn/community/discussion";
import { LIMITS, REPORT_REASONS } from "@/lib/learn/community/shared";
import PostBody from "./PostBody";
import { api, ghostBtn, inputCls, linkBtn, primaryBtn, timeAgo } from "./client-utils";

// One thread with its replies: upvotes, edit/delete own posts, report,
// "accepted answer" for the asker, and the reply box.

function Vote({
  type,
  id,
  score,
  voted,
  mine,
}: {
  type: "thread" | "post";
  id: string;
  score: number;
  voted: boolean;
  mine: boolean;
}) {
  const t = useT();
  const [state, setState] = useState({ score, voted });
  const [busy, setBusy] = useState(false);
  async function toggle() {
    if (mine || busy) return;
    setBusy(true);
    const r = await api<{ voted: boolean; score: number }>("/api/learn/community/actions", "POST", { action: "vote", targetType: type, targetId: id });
    if (r.ok) setState({ score: r.data.score, voted: r.data.voted });
    setBusy(false);
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={mine || busy}
      aria-pressed={state.voted}
      aria-label={t(state.voted ? "community.vote.remove" : "community.vote.add")}
      title={mine ? t("community.vote.own") : undefined}
      className={`inline-flex min-h-[32px] items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors ${
        state.voted ? "border-[var(--orange)] bg-[var(--orange)]/10 text-[var(--ink)]" : "border-[var(--border)] text-[var(--ink3)]"
      } ${mine ? "cursor-default opacity-70" : "hover:border-[var(--ink3)]"}`}
    >
      <span aria-hidden="true">▲</span> {state.score}
    </button>
  );
}

function ReportForm({ type, id, onDone }: { type: "thread" | "post"; id: string; onDone: (msg: string) => void }) {
  const t = useT();
  const [reason, setReason] = useState<string>("spam");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function send() {
    setBusy(true);
    setError(null);
    const r = await api<{ already?: boolean }>("/api/learn/community/actions", "POST", { action: "report", targetType: type, targetId: id, reason, note });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    onDone(t(r.data.already ? "community.report.already" : "community.report.thanks"));
  }
  return (
    <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--s2)] p-3">
      <label className="block text-xs font-semibold text-[var(--ink2)]">
        {t("community.report.why")}
        <select value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} mt-1`}>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`community.report.reason.${r}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-2 block text-xs font-semibold text-[var(--ink2)]">
        {t("community.report.note")}
        <input value={note} maxLength={LIMITS.reportReasonMax} onChange={(e) => setNote(e.target.value)} className={`${inputCls} mt-1`} />
      </label>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
      <button type="button" onClick={send} disabled={busy} className={`${ghostBtn} mt-2`}>
        {t("community.report.send")}
      </button>
    </div>
  );
}

function PostActions({
  type,
  id,
  mine,
  onEdit,
  onDelete,
}: {
  type: "thread" | "post";
  id: string;
  mine: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [reporting, setReporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (mine) {
    return (
      <span className="flex items-center gap-3">
        <button type="button" onClick={onEdit} className={linkBtn}>
          {t("community.edit")}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(t("community.deleteConfirm"))) onDelete();
          }}
          className={linkBtn}
        >
          {t("community.delete")}
        </button>
      </span>
    );
  }
  return (
    <span className="block">
      {msg ? (
        <span role="status" className="text-xs text-[var(--ink3)]">{msg}</span>
      ) : (
        <button type="button" onClick={() => setReporting((v) => !v)} aria-expanded={reporting} className={linkBtn}>
          {t("community.report.button")}
        </button>
      )}
      {reporting && !msg && (
        <ReportForm
          type={type}
          id={id}
          onDone={(m) => {
            setMsg(m);
            setReporting(false);
          }}
        />
      )}
    </span>
  );
}

function Byline({ author, createdAt, editedAt, extra }: { author: string; createdAt: string; editedAt: string | null; extra?: React.ReactNode }) {
  const t = useT();
  const locale = useLocale();
  return (
    <p className="text-xs text-[var(--ink3)]">
      <span className="font-semibold text-[var(--ink2)]">{author || t("community.learner")}</span> · {timeAgo(createdAt, locale)}
      {editedAt && <span> · {t("community.edited")}</span>}
      {extra}
    </p>
  );
}

export default function ThreadView({
  threadId,
  onChanged,
  standalone = false,
}: {
  threadId: string;
  /** Called after anything that changes the thread list (reply, delete, answer). */
  onChanged?: () => void;
  standalone?: boolean;
}) {
  const t = useT();
  const [data, setData] = useState<{ thread: ThreadSummary; posts: PostItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const load = useCallback(async () => {
    const r = await api<{ thread: ThreadSummary; posts: PostItem[] }>(`/api/learn/community/threads/${threadId}`);
    if (r.ok) setData(r.data);
    else setError(r.error);
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p role="alert" className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--ink3)]">{t("community.loading")}</p>;
  const { thread, posts } = data;

  async function send() {
    setBusy(true);
    setFormError(null);
    const r = await api(`/api/learn/community/threads/${threadId}`, "POST", { bodyMd: reply });
    setBusy(false);
    if (!r.ok) return setFormError(r.error);
    setReply("");
    await load();
    onChanged?.();
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    const r =
      editing === thread.id
        ? await api(`/api/learn/community/threads/${thread.id}`, "PATCH", { title: editTitle, bodyMd: editBody })
        : await api(`/api/learn/community/posts/${editing}`, "PATCH", { bodyMd: editBody });
    setBusy(false);
    if (!r.ok) return setFormError(r.error);
    setEditing(null);
    await load();
    onChanged?.();
  }

  async function remove(kind: "thread" | "post", id: string) {
    const r = await api(kind === "thread" ? `/api/learn/community/threads/${id}` : `/api/learn/community/posts/${id}`, "DELETE");
    if (!r.ok) return setFormError(r.error);
    if (kind === "thread") {
      if (standalone) window.history.back();
      onChanged?.();
      return;
    }
    await load();
    onChanged?.();
  }

  async function answer(postId: string | null) {
    const r = await api("/api/learn/community/actions", "POST", { action: "answer", threadId: thread.id, postId });
    if (!r.ok) return setFormError(r.error);
    await load();
    onChanged?.();
  }

  const editor = (withTitle: boolean) => (
    <div className="mt-2 space-y-2">
      {withTitle && (
        <input
          value={editTitle}
          maxLength={LIMITS.titleMax}
          onChange={(e) => setEditTitle(e.target.value)}
          aria-label={t("community.form.title")}
          className={inputCls}
        />
      )}
      <textarea
        value={editBody}
        maxLength={LIMITS.bodyMax}
        onChange={(e) => setEditBody(e.target.value)}
        rows={4}
        aria-label={t("community.form.body")}
        className={inputCls}
      />
      <div className="flex gap-2">
        <button type="button" onClick={saveEdit} disabled={busy} className={primaryBtn}>
          {t("community.save")}
        </button>
        <button type="button" onClick={() => setEditing(null)} className={ghostBtn}>
          {t("community.cancel")}
        </button>
      </div>
    </div>
  );

  const ordered = thread.answerPostId
    ? [...posts.filter((p) => p.id === thread.answerPostId), ...posts.filter((p) => p.id !== thread.answerPostId)]
    : posts;

  return (
    <div id={`thread-${thread.id}`}>
      {/* The question */}
      <div>
        {standalone && (
          <h1 className="text-xl font-black text-[var(--ink)]">
            {thread.title}
            {thread.answered && <AnsweredBadge />}
          </h1>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Byline
            author={thread.author}
            createdAt={thread.createdAt}
            editedAt={thread.editedAt}
            extra={
              <>
                {thread.cohortName && <span> · {t("community.cohortOnlyTag", { cohort: thread.cohortName })}</span>}
                {thread.lessonId && thread.lessonTitle && standalone && (
                  <>
                    {" · "}
                    <Link href={`/learn/lesson/${thread.lessonId}`} className="underline">
                      {thread.lessonTitle}
                    </Link>
                  </>
                )}
              </>
            }
          />
        </div>
        {thread.hidden && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{t("community.hiddenOwn")}</p>}
        {editing === thread.id ? (
          editor(true)
        ) : (
          <div className="mt-2">
            <PostBody source={thread.bodyMd} />
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Vote type="thread" id={thread.id} score={thread.score} voted={thread.voted} mine={thread.mine} />
          <PostActions
            type="thread"
            id={thread.id}
            mine={thread.mine}
            onEdit={() => {
              setEditing(thread.id);
              setEditTitle(thread.title);
              setEditBody(thread.bodyMd);
            }}
            onDelete={() => remove("thread", thread.id)}
          />
        </div>
      </div>

      {/* Replies */}
      <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
        {t(posts.length === 1 ? "community.replies.one" : "community.replies.other", { n: posts.length })}
      </h3>
      <ul className="mt-2 space-y-3">
        {ordered.map((p) => {
          const accepted = p.id === thread.answerPostId;
          return (
            <li
              key={p.id}
              className={`rounded-xl border p-3 ${accepted ? "border-green-300 bg-green-50/60" : "border-[var(--border)] bg-white"}`}
            >
              <Byline
                author={p.author}
                createdAt={p.createdAt}
                editedAt={p.editedAt}
                extra={
                  <>
                    {p.isAsker && <span> · {t("community.asker")}</span>}
                    {accepted && <span className="ml-2 font-bold text-green-700">✓ {t("community.acceptedAnswer")}</span>}
                  </>
                }
              />
              {p.hidden && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{t("community.hiddenOwn")}</p>}
              {editing === p.id ? (
                editor(false)
              ) : (
                <div className="mt-1.5">
                  <PostBody source={p.bodyMd} />
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Vote type="post" id={p.id} score={p.score} voted={p.voted} mine={p.mine} />
                {thread.mine && !p.mine && (
                  <button type="button" onClick={() => answer(accepted ? null : p.id)} className={linkBtn}>
                    {accepted ? t("community.unmarkAnswer") : t("community.markAnswer")}
                  </button>
                )}
                <PostActions
                  type="post"
                  id={p.id}
                  mine={p.mine}
                  onEdit={() => {
                    setEditing(p.id);
                    setEditBody(p.bodyMd);
                  }}
                  onDelete={() => remove("post", p.id)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Reply box */}
      {!thread.hidden && (
        <div className="mt-4">
          <label className="block text-xs font-semibold text-[var(--ink2)]">
            {t("community.form.reply")}
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={LIMITS.bodyMax}
              rows={3}
              placeholder={t("community.form.replyPlaceholder")}
              className={`${inputCls} mt-1`}
            />
          </label>
          <p className="mt-1 text-[11px] text-[var(--ink3)]">{t("community.form.markdownHint")}</p>
          {formError && <p role="alert" className="mt-2 text-xs text-red-700">{formError}</p>}
          <button type="button" onClick={send} disabled={busy || reply.trim().length < LIMITS.replyMin} className={`${primaryBtn} mt-2`}>
            {t("community.form.sendReply")}
          </button>
        </div>
      )}
    </div>
  );
}

export function AnsweredBadge() {
  const t = useT();
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 align-middle text-[11px] font-bold text-green-800">
      ✓ {t("community.answered")}
    </span>
  );
}
