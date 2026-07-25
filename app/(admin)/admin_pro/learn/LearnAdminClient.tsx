"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TrackRow {
  id: string; slug: string; title: string; status: string; level: string;
  estimatedHours: number; moduleCount: number; lessonCount: number;
}

interface QueueRow {
  id: string; status: string; createdAt: string;
  submissionUrl: string | null; submissionMd: string | null; aiPrereviewMd: string | null;
  studentName: string; studentEmail: string; trackTitle: string; passThreshold: number;
}

export default function LearnAdminClient({
  tablesReady,
  tracks,
  studentCount,
  subCounts,
  certificateCount,
  waitlist,
  queue,
}: {
  tablesReady: boolean;
  tracks: TrackRow[];
  studentCount: number;
  subCounts: Record<string, number>;
  certificateCount: number;
  waitlist: Array<{ trackSlug: string; count: number }>;
  queue: QueueRow[];
}) {
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [openReview, setOpenReview] = useState<string | null>(null);

  async function run(action: "sync" | "seed") {
    setBusy(action);
    setLog([`Running ${action}…`]);
    try {
      const res = await fetch(`/api/admin/learn/${action === "sync" ? "sync-db" : "seed"}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `${action} failed`);

      if (action === "sync") {
        setLog(data.log ?? ["Done."]);
      } else {
        const lines: string[] = [];
        for (const r of data.reports ?? []) {
          lines.push(
            `${r.created ? "＋" : "↻"} ${r.track} — ${r.modules} modules, ${r.lessons} lessons, ` +
              `${r.microQuestions + r.quizQuestions + r.examQuestions} questions, ${Math.round(r.minutes / 60)}h`,
          );
          for (const w of r.warnings ?? []) lines.push(`   ⚠ ${w}`);
        }
        lines.push(
          `\nTotal: ${data.totals?.lessons ?? 0} lessons · ${data.totals?.questions ?? 0} questions`,
        );
        setLog(lines);
      }
      router.refresh();
    } catch (err) {
      setLog([`❌ ${err instanceof Error ? err.message : "Failed"}`]);
    } finally {
      setBusy(null);
    }
  }

  const active = (subCounts.active ?? 0) + (subCounts.trialing ?? 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--ink)]">TIBLOGICS Learn</h1>
          <p className="mt-1 text-sm text-[var(--ink3)]">
            Course platform — content, learners and capstone reviews.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => run("sync")}
            disabled={busy !== null}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] disabled:opacity-50"
          >
            {busy === "sync" ? "Syncing…" : "1 · Sync Database"}
          </button>
          <button
            onClick={() => run("seed")}
            disabled={busy !== null || !tablesReady}
            className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy === "seed" ? "Seeding…" : "2 · Seed Course Content"}
          </button>
        </div>
      </header>

      {!tablesReady && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-bold text-amber-900">Setup required</h2>
          <p className="mt-1 text-sm text-amber-900">
            The Learn tables don't exist yet. Click <strong>Sync Database</strong>, then{" "}
            <strong>Seed Course Content</strong>. Both are safe to re-run — seeding updates content
            in place and never touches learner progress.
          </p>
        </div>
      )}

      {log.length > 0 && (
        <pre className="max-h-72 overflow-auto rounded-xl bg-[var(--ink)] p-4 text-xs leading-relaxed text-green-300">
          {log.join("\n")}
        </pre>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Students", studentCount],
          ["Active subscriptions", active],
          ["Certificates issued", certificateCount],
          ["Awaiting review", queue.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{label}</p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Capstone review queue */}
      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Capstone review queue</h2>
        {queue.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">Nothing awaiting review.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {queue.map((s) => (
              <li key={s.id} className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--ink)]">{s.studentName}</p>
                    <p className="text-xs text-[var(--ink3)]">
                      {s.trackTitle} · submitted {new Date(s.createdAt).toLocaleDateString()} ·{" "}
                      <span className="capitalize">{s.status.replace("_", " ")}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenReview(openReview === s.id ? null : s.id)}
                    className="rounded-lg bg-[var(--ink)] px-4 py-2 text-xs font-bold text-white"
                  >
                    {openReview === s.id ? "Close" : "Review"}
                  </button>
                </div>

                {openReview === s.id && <ReviewPanel submission={s} onDone={() => router.refresh()} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tracks */}
      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Tracks</h2>
        {tracks.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">
            No tracks yet — run Seed Course Content.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink3)]">
                  <th className="pb-2">Track</th>
                  <th className="pb-2">Level</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Modules</th>
                  <th className="pb-2 text-right">Lessons</th>
                  <th className="pb-2 text-right">Hours</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {tracks.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-4 font-medium text-[var(--ink)]">{t.title}</td>
                    <td className="py-2.5 pr-4 capitalize text-[var(--ink2)]">{t.level}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          t.status === "live"
                            ? "bg-green-50 text-green-700"
                            : t.status === "coming_soon"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-[var(--s2)] text-[var(--ink3)]"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[var(--ink2)]">{t.moduleCount}</td>
                    <td className="py-2.5 text-right text-[var(--ink2)]">{t.lessonCount}</td>
                    <td className="py-2.5 text-right text-[var(--ink2)]">{t.estimatedHours}</td>
                    <td className="py-2.5 pl-4 text-right">
                      <Link
                        href={`/courses/${t.slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-[var(--blue2)] underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">Waitlist</h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {waitlist.map((w) => (
              <li key={w.trackSlug} className="flex justify-between py-2 text-sm">
                <span className="text-[var(--ink2)]">{w.trackSlug}</span>
                <span className="font-bold text-[var(--ink)]">{w.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ── Review panel ────────────────────────────────────────────────────────────
function ReviewPanel({ submission, onDone }: { submission: QueueRow; onDone: () => void }) {
  const [status, setStatus] = useState(submission.status);
  const [score, setScore] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [prereview, setPrereview] = useState(submission.aiPrereviewMd);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/learn/capstone/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          score: score === "" ? null : Number(score),
          reviewerNotes: notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/learn/capstone/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: submission.status, regeneratePreReview: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.aiPrereviewMd) setPrereview(data.aiPrereviewMd);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
      {/* Submission */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">Submission</h3>
        {submission.submissionUrl && (
          <a
            href={submission.submissionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-sm font-medium text-[var(--blue2)] underline break-all"
          >
            {submission.submissionUrl} ↗
          </a>
        )}
        {submission.submissionMd && (
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--s2)] p-3 text-xs leading-relaxed text-[var(--ink2)]">
            {submission.submissionMd}
          </pre>
        )}
      </div>

      {/* AI pre-review — reviewer-only */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
            AI pre-review · internal draft, never shown to the learner
          </h3>
          <button
            onClick={regenerate}
            disabled={busy}
            className="text-xs font-semibold text-[var(--blue2)] underline disabled:opacity-50"
          >
            {prereview ? "Regenerate" : "Generate"}
          </button>
        </div>
        {prereview ? (
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-dashed border-[var(--border)] bg-white p-3 text-xs leading-relaxed text-[var(--ink2)]">
            {prereview}
          </pre>
        ) : (
          <p className="mt-2 text-xs text-[var(--ink3)]">
            No draft yet. This is a starting point for your own reading, not a verdict.
          </p>
        )}
      </div>

      {/* Decision */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)]">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="submitted">Submitted</option>
            <option value="in_review">In review</option>
            <option value="revisions_requested">Revisions requested</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            Score % (pass ≥ {submission.passThreshold})
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--ink)]">
          Feedback for the learner (sent by email)
        </label>
        <textarea
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Be specific. Reference the rubric criteria and say what would move each one up."
          className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-[var(--ink)] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save decision"}
        </button>
        {status === "passed" && (
          <p className="text-xs text-green-700">
            Saving as passed issues the certificate automatically if all other gates are met.
          </p>
        )}
      </div>
    </div>
  );
}
