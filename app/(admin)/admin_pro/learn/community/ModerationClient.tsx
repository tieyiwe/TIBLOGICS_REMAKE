"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirm, useToast } from "@/components/admin/ui";

// Community moderation (admin, English): report queue, thread inspector with
// hide / delete / mark answer, suspensions, and peer review visibility.

type Json = Record<string, unknown>;

const btn =
  "inline-flex h-8 items-center rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[12.5px] font-semibold text-[var(--a-ink)] transition-colors duration-150 hover:bg-[var(--a-surface-2)] disabled:opacity-50";
const danger =
  "inline-flex h-8 items-center rounded-[var(--a-radius-control)] bg-[var(--a-danger)] px-3 font-dm text-[12.5px] font-semibold text-white transition-colors duration-150 hover:bg-[#991b1b] disabled:opacity-50";

export function useModerate() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmFn = useConfirm();
  const toast = useToast();
  async function act(body: Json) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/learn/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      toast.error("Moderation failed", data.error ?? "Please try again.");
    } else {
      toast.success("Done", typeof body.action === "string" ? `Action: ${body.action}` : undefined);
      router.refresh();
    }
  }
  /** Kit confirm dialog for destructive moderation. */
  const confirmDelete = (title: string) =>
    confirmFn({ title, body: "Learners will no longer see it. This cannot be undone.", confirmLabel: "Delete" });
  return { act, busy, error, confirmDelete };
}

function Suspend({ studentId, name }: { studentId: string; name: string }) {
  const { act, busy } = useModerate();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  if (!open) return <button onClick={() => setOpen(true)} className={btn}>Suspend {name.split(" ")[0]}…</button>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs">
        <option value={1}>1 day</option>
        <option value={7}>7 days</option>
        <option value={30}>30 days</option>
        <option value={36500}>Indefinitely</option>
      </select>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (internal)" className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs" />
      <button disabled={busy} onClick={() => act({ action: "suspend", studentId, days, reason })} className={danger}>Suspend posting</button>
      <button onClick={() => setOpen(false)} className={btn}>Cancel</button>
    </span>
  );
}

export function ReportRow({
  r,
}: {
  r: { targetType: "thread" | "post"; targetId: string; threadId: string; title: string; bodyMd: string; hidden: boolean; deleted: boolean; authorId: string; authorName: string; authorEmail: string; reports: number; reasons: string[]; firstAt: string };
}) {
  const { act, busy, error, confirmDelete } = useModerate();
  return (
    <li className="rounded-[12px] border border-[var(--a-border)] p-4 font-dm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-[var(--ink)]">
          {r.targetType === "thread" ? "Thread" : "Reply"} in “{r.title}”
          {r.hidden && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">hidden</span>}
          {r.deleted && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px]">deleted</span>}
        </p>
        <p className="text-xs text-[var(--ink3)]">
          {r.reports} report{r.reports === 1 ? "" : "s"} · since {new Date(r.firstAt).toLocaleString()}
        </p>
      </div>
      <p className="mt-1 text-xs text-[var(--ink3)]">
        By {r.authorName} ({r.authorEmail}) · reasons: {r.reasons.join(" | ")}
      </p>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--s2)] p-3 text-xs">{r.bodyMd}</pre>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {r.hidden ? (
          <button disabled={busy} onClick={() => act({ action: "unhide", targetType: r.targetType, targetId: r.targetId })} className={btn}>Unhide</button>
        ) : (
          <button disabled={busy} onClick={() => act({ action: "hide", targetType: r.targetType, targetId: r.targetId })} className={btn}>Hide</button>
        )}
        <button disabled={busy} onClick={async () => (await confirmDelete("Delete this for everyone?")) && act({ action: "delete", targetType: r.targetType, targetId: r.targetId })} className={danger}>Delete</button>
        <button disabled={busy} onClick={() => act({ action: "dismiss", targetId: r.targetId })} className={btn}>Dismiss reports</button>
        <Link href={`/admin_pro/learn/community?thread=${r.threadId}`} className="text-xs font-semibold underline">Open thread</Link>
        <Suspend studentId={r.authorId} name={r.authorName} />
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </li>
  );
}

export function StaffThread({
  data,
}: {
  data: {
    thread: { id: string; title: string; bodyMd: string; hidden: boolean; answerPostId: string | null; authorId: string; authorName: string; authorEmail: string; createdAt: string };
    posts: Array<{ id: string; bodyMd: string; hidden: boolean; authorId: string; authorName: string; authorEmail: string; createdAt: string }>;
  };
}) {
  const { act, busy, error, confirmDelete } = useModerate();
  const { thread, posts } = data;
  return (
    <section className="rounded-[var(--a-radius-card)] border border-[var(--a-blue)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)] ring-2 ring-[var(--a-blue)]/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[var(--ink)]">
          {thread.title} {thread.hidden && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">hidden</span>}
        </h2>
        <Link href="/admin_pro/learn/community" className="text-xs underline">Close</Link>
      </div>
      <p className="text-xs text-[var(--ink3)]">{thread.authorName} ({thread.authorEmail}) · {new Date(thread.createdAt).toLocaleString()}</p>
      <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--s2)] p-3 text-xs">{thread.bodyMd}</pre>
      <div className="mt-2 flex flex-wrap gap-2">
        <button disabled={busy} onClick={() => act({ action: thread.hidden ? "unhide" : "hide", targetType: "thread", targetId: thread.id })} className={btn}>
          {thread.hidden ? "Unhide thread" : "Hide thread"}
        </button>
        <button disabled={busy} onClick={async () => (await confirmDelete("Delete this thread?")) && act({ action: "delete", targetType: "thread", targetId: thread.id })} className={danger}>Delete thread</button>
        <Suspend studentId={thread.authorId} name={thread.authorName} />
      </div>
      <ul className="mt-4 space-y-2">
        {posts.map((p) => {
          const answer = p.id === thread.answerPostId;
          return (
            <li key={p.id} className={`rounded-lg border p-3 ${answer ? "border-green-400 bg-green-50" : "border-[var(--border)]"}`}>
              <p className="text-xs text-[var(--ink3)]">
                {p.authorName} ({p.authorEmail}) · {new Date(p.createdAt).toLocaleString()}
                {answer && <strong className="ml-2 text-green-700">✓ accepted answer</strong>}
                {p.hidden && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">hidden</span>}
              </p>
              <pre className="mt-1 whitespace-pre-wrap text-xs">{p.bodyMd}</pre>
              <div className="mt-2 flex flex-wrap gap-2">
                <button disabled={busy} onClick={() => act({ action: "answer", threadId: thread.id, postId: answer ? null : p.id })} className={btn}>
                  {answer ? "Unmark answer" : "Mark as answer"}
                </button>
                <button disabled={busy} onClick={() => act({ action: p.hidden ? "unhide" : "hide", targetType: "post", targetId: p.id })} className={btn}>
                  {p.hidden ? "Unhide" : "Hide"}
                </button>
                <button disabled={busy} onClick={async () => (await confirmDelete("Delete this reply?")) && act({ action: "delete", targetType: "post", targetId: p.id })} className={danger}>Delete</button>
                <Suspend studentId={p.authorId} name={p.authorName} />
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  );
}

export function LiftSuspension({ studentId }: { studentId: string }) {
  const { act, busy } = useModerate();
  return (
    <button disabled={busy} onClick={() => act({ action: "suspend", studentId, days: 0 })} className={btn}>
      Lift suspension
    </button>
  );
}

export function PeerToggle({ reviewId, hidden }: { reviewId: string; hidden: boolean }) {
  const { act, busy } = useModerate();
  return (
    <button disabled={busy} onClick={() => act({ action: hidden ? "unhidePeer" : "hidePeer", reviewId })} className={hidden ? btn : danger}>
      {hidden ? "Unhide" : "Hide from recipient"}
    </button>
  );
}
