"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Questions (mark answered, hide, delete) and the RSVP / attendance list of
// one live session (admin, English).

const small = "text-xs font-semibold underline disabled:opacity-50";

export default function LiveManage({
  sessionId,
  questions,
  people,
}: {
  sessionId: string;
  questions: Array<{ id: string; body: string; authorName: string; authorEmail: string; score: number; hidden: boolean; answeredAt: string | null; createdAt: string }>;
  people: Array<{ studentId: string; name: string; email: string; status: string; createdAt: string; joinedAt: string | null }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/learn/live/${sessionId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Failed");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this session, its RSVPs and questions?")) return;
    const res = await fetch(`/api/admin/learn/live/${sessionId}`, { method: "DELETE" });
    if (res.ok) router.push("/admin_pro/learn/live");
  }

  const going = people.filter((p) => p.status === "going");
  const waiting = people.filter((p) => p.status === "waitlist");
  const dt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Questions ({questions.length})</h2>
        <p className="text-xs text-[var(--ink3)]">Most upvoted first. Mark the ones the expert answered; learners see the mark.</p>
        {questions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No questions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="admin-questions">
            {questions.map((q) => (
              <li key={q.id} className={`rounded-lg p-3 text-sm ${q.hidden ? "bg-amber-50" : "bg-[var(--s2)]"}`}>
                <p className="whitespace-pre-wrap">{q.body}</p>
                <p className="mt-1 text-xs text-[var(--ink3)]">
                  ▲ {q.score} · {q.authorName} ({q.authorEmail}) · {dt(q.createdAt)}
                  {q.answeredAt && " · answered"}
                  {q.hidden && " · hidden"}
                </p>
                <div className="mt-1 flex flex-wrap gap-3">
                  <button disabled={busy} onClick={() => post({ action: q.answeredAt ? "unanswered" : "answered", questionId: q.id })} className={`${small} text-green-700`}>
                    {q.answeredAt ? "Mark unanswered" : "Mark answered"}
                  </button>
                  <button disabled={busy} onClick={() => post({ action: q.hidden ? "unhide" : "hide", questionId: q.id })} className={`${small} text-amber-800`}>
                    {q.hidden ? "Unhide" : "Hide"}
                  </button>
                  <button disabled={busy} onClick={() => confirm("Delete this question?") && post({ action: "deleteQuestion", questionId: q.id })} className={`${small} text-red-600`}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[var(--ink)]">
            Attendance: {going.length} with a seat, {waiting.length} waiting, {people.filter((p) => p.joinedAt).length} attended
          </h2>
          <a href={`/api/admin/learn/live/${sessionId}/export`} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold">
            Export CSV
          </a>
        </div>
        {people.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No RSVPs yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-attendance">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--ink3)]">
                  <th className="py-2 pr-3">Learner</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">RSVP</th>
                  <th className="py-2 pr-3">Joined</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {people.map((p, i) => (
                  <tr key={p.studentId}>
                    <td className="py-2 pr-3">{p.name}</td>
                    <td className="py-2 pr-3">{p.email}</td>
                    <td className="py-2 pr-3">{p.status === "going" ? "Seat" : `Waitlist #${i - going.length + 1}`}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{dt(p.createdAt)}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{p.joinedAt ? dt(p.joinedAt) : ""}</td>
                    <td className="py-2">
                      <button disabled={busy} onClick={() => confirm(`Remove ${p.name}?`) && post({ action: "removeAttendee", studentId: p.studentId })} className={`${small} text-red-600`}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <button onClick={remove} className="text-sm font-semibold text-red-600 underline">
        Delete this session
      </button>
    </div>
  );
}
