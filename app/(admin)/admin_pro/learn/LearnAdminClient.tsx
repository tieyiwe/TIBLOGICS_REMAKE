"use client";

import Link from "next/link";
import { Database, Sprout } from "lucide-react";
import { Button, Notice, PageHeader, StatCard } from "@/components/admin/ui";
import { LEARN_TABS } from "./tabs";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TrackRow {
  id: string; slug: string; title: string; status: string; level: string;
  estimatedHours: number; moduleCount: number; lessonCount: number;
  /** One-time price in cents (level default or the track's override). */
  priceCents: number; priceOverridden: boolean;
}

interface PurchaseRow {
  id: string; email: string; trackTitle: string; amountCents: number; currency: string; createdAt: string;
}

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

interface QueueRow {
  id: string; status: string; createdAt: string;
  submissionUrl: string | null; submissionMd: string | null; aiPrereviewMd: string | null;
  studentName: string; studentEmail: string; trackTitle: string; passThreshold: number;
}

interface CertRow {
  id: string; verificationId: string; recipientName: string; certificateName: string;
  studentEmail: string; trackTitle: string; distinction: boolean; revoked: boolean; issuedAt: string;
}

export default function LearnAdminClient({
  learnersWidget,
  tablesReady,
  tracks,
  studentCount,
  subCounts,
  certificateCount,
  purchaseCount,
  purchaseCents,
  recentPurchases,
  waitlist,
  queue,
  recentCertificates,
}: {
  /** Sign-ups / activity / conversion panel (server-rendered LearnersWidget). */
  learnersWidget?: React.ReactNode;
  tablesReady: boolean;
  tracks: TrackRow[];
  studentCount: number;
  subCounts: Record<string, number>;
  certificateCount: number;
  purchaseCount: number;
  purchaseCents: number;
  recentPurchases: PurchaseRow[];
  waitlist: Array<{ trackSlug: string; count: number }>;
  queue: QueueRow[];
  recentCertificates: CertRow[];
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
      <PageHeader
        title="ARFA · AI Academy"
        subtitle="AI Readiness For All. Tracks, learners and capstone reviews."
        className="mb-0"
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn"
        actions={
          <>
            <Button onClick={() => run("sync")} disabled={busy !== null} loading={busy === "sync"} variant="secondary" icon={Database}>
              {busy === "sync" ? "Syncing" : "1. Sync database"}
            </Button>
            <Button onClick={() => run("seed")} disabled={busy !== null || !tablesReady} loading={busy === "seed"} variant="primary" icon={Sprout}>
              {busy === "seed" ? "Seeding" : "2. Seed content"}
            </Button>
          </>
        }
      />

      {!tablesReady && (
        <Notice tone="warn" title="Setup required">
          The ARFA tables do not exist yet. Click <strong>Sync database</strong>, then <strong>Seed content</strong>. Both are
          safe to re-run: seeding updates content in place and never touches learner progress.
        </Notice>
      )}

      {log.length > 0 && (
        <pre className="max-h-72 overflow-auto rounded-[var(--a-radius-control)] bg-[var(--ink)] p-4 text-xs leading-relaxed text-green-300">
          {log.join("\n")}
        </pre>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Students" value={studentCount} href="/admin_pro/learn/learners" />
        <StatCard label="Active subscriptions" value={active} tone="success" />
        <StatCard label="Tracks bought" value={purchaseCount} hint={`${usd(purchaseCents)} one-time`} />
        <StatCard label="Certificates issued" value={certificateCount} />
        <StatCard label="Awaiting review" value={queue.length} tone={queue.length > 0 ? "orange" : "default"} href="#capstone-queue" />
      </div>

      {learnersWidget}

      {/* Capstone review queue */}
      <section id="capstone-queue" className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)]">
        <h2 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">Capstone review queue</h2>
        {queue.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">Nothing awaiting review.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {queue.map((s) => (
              <li key={s.id} className="rounded-[var(--a-radius-control)] border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">{s.studentName}</p>
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

      {/* Certificates — manual issue/revoke override for support cases */}
      <CertificatesPanel tracks={tracks} recentCertificates={recentCertificates} />

      {/* Tracks */}
      <section className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">Tracks</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin_pro/learn/videos" className="text-xs font-semibold text-[var(--blue2)] underline">
              Lesson videos: which have one, which are missing
            </Link>
            <NewTrack />
          </div>
        </div>
        <p className="mt-1 text-xs text-[var(--ink3)]">
          Open a track to edit its lessons, videos, resources, quizzes, labs, final exam and capstone. Your edits are kept when the
          built-in content is re-seeded.
        </p>
        {tracks.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">
            No tracks yet. Run Seed content above.
          </p>
        ) : (
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink3)]">
                  <th className="pb-2">Track</th>
                  <th className="pb-2">Level</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Modules</th>
                  <th className="pb-2 text-right">Lessons</th>
                  <th className="pb-2 text-right">Hours</th>
                  <th className="pb-2 text-right">One-time price</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {tracks.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-4 font-medium text-[var(--ink)]">
                      <Link href={`/admin_pro/learn/tracks/${t.id}`} className="hover:text-[var(--blue2)] hover:underline">{t.title}</Link>
                    </td>
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
                    <td className="py-2.5 text-right text-[var(--ink2)]" title={t.priceOverridden ? "Set on this track" : "From the track level"}>
                      {usd(t.priceCents)}
                      {t.priceOverridden && <span className="ml-1 text-[10px] font-bold text-[var(--orange2)]">custom</span>}
                    </td>
                    <td className="py-2.5 pl-4 text-right whitespace-nowrap">
                      <Link href={`/admin_pro/learn/tracks/${t.id}`} className="mr-3 text-xs font-semibold text-[var(--blue2)] underline">
                        Edit content
                      </Link>
                      <Link
                        href={`/learning-box/${t.slug}`}
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

      {/* One-time track purchases */}
      <section className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)]">
        <h2 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">Track purchases (one-time, lifetime access)</h2>
        <p className="mt-1 text-xs text-[var(--ink3)]">
          Prices follow the track level ($297 starter/beginner, +$190 per level) unless a track sets its own in the track editor.
        </p>
        {recentPurchases.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No track purchases yet.</p>
        ) : (
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink3)]">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Learner</th>
                  <th className="pb-2">Track</th>
                  <th className="pb-2 text-right">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentPurchases.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4 text-[var(--ink2)]">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-[var(--ink2)]">{p.email}</td>
                    <td className="py-2 pr-4 text-[var(--ink)]">{p.trackTitle}</td>
                    <td className="py-2 text-right font-semibold text-[var(--ink)]">
                      {usd(p.amountCents)} {p.currency.toUpperCase()}
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
        <section className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)]">
          <h2 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">Waitlist</h2>
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

// ── Certificates: support override + revoke ─────────────────────────────────
function CertificatesPanel({
  tracks,
  recentCertificates,
}: {
  tracks: TrackRow[];
  recentCertificates: CertRow[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [trackSlug, setTrackSlug] = useState(tracks[0]?.slug ?? "");
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function issue() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/learn/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentEmail: email, trackSlug, force }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const gateText = data.gates
          ? ` Missing: ${Object.entries(data.gates).filter(([, v]) => !v).map(([k]) => k).join(", ")}.`
          : "";
        throw new Error((data.error ?? "Could not issue certificate") + gateText);
      }
      setMessage({
        text: data.created ? `Issued — verification ID ${data.verificationId}` : "Already had a certificate for this track.",
        ok: true,
      });
      setEmail("");
      router.refresh();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed", ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function toggleRevoke(id: string, revoked: boolean) {
    await fetch(`/api/admin/learn/certificate/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revoked }),
    });
    router.refresh();
  }

  return (
    <section className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)]">
      <h2 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">Certificates</h2>
      <p className="mt-1 text-xs text-[var(--ink3)]">
        Certificates normally issue automatically once all four gates are met. Use this only for
        support cases — a data issue that blocked automatic issuance, or correcting a mistake.
      </p>

      {/* Manual issue */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-[var(--s2)] p-4">
        <div className="min-w-0 max-w-full">
          <label className="block text-xs font-semibold text-[var(--ink)]">Student email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="learner@example.com"
            className="mt-1 w-56 max-w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-0 max-w-full">
          <label className="block text-xs font-semibold text-[var(--ink)]">Track</label>
          <select
            value={trackSlug}
            onChange={(e) => setTrackSlug(e.target.value)}
            className="mt-1 w-full max-w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm sm:w-auto"
          >
            {tracks.map((t) => (
              <option key={t.slug} value={t.slug}>{t.title}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-xs text-[var(--ink2)]">
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
          Force (bypass the four gates; use with care)
        </label>
        <button
          onClick={issue}
          disabled={busy || !email.trim() || !trackSlug}
          className="rounded-lg bg-[var(--ink)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy ? "Issuing" : "Issue certificate"}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
      )}

      {/* Recent certificates */}
      {recentCertificates.length > 0 && (
        <div className="relative mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink3)]">
                <th className="pb-2">Recipient</th>
                <th className="pb-2">Track</th>
                <th className="pb-2">Issued</th>
                <th className="pb-2">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {recentCertificates.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-4">
                    <span className="font-medium text-[var(--ink)]">{c.recipientName}</span>
                    <span className="block text-xs text-[var(--ink3)]">{c.studentEmail}</span>
                  </td>
                  <td className="py-2 pr-4 text-[var(--ink2)]">{c.trackTitle}</td>
                  <td className="py-2 pr-4 text-[var(--ink2)]">
                    {new Date(c.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4">
                    {c.revoked ? (
                      <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">Revoked</span>
                    ) : c.distinction ? (
                      <span className="rounded bg-[var(--orange-light)] px-2 py-0.5 text-xs font-bold text-[var(--orange2)]">
                        Distinction
                      </span>
                    ) : (
                      <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">Active</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/certificates/${c.verificationId}`}
                        target="_blank"
                        className="text-xs font-semibold text-[var(--blue2)] underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => toggleRevoke(c.id, !c.revoked)}
                        className="text-xs font-semibold text-red-600 underline"
                      >
                        {c.revoked ? "Restore" : "Revoke"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Creates an empty draft track and opens it in the editor. */
function NewTrack() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 70);

  async function create() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/learn/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "track.create", title, slug }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && d.id) {
      window.location.href = `/admin_pro/learn/tracks/${d.id}`;
      return;
    }
    setError(d.error ?? "Could not create the track.");
    setBusy(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-bold text-white">
        + New track
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Track title"
        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
      />
      <button onClick={create} disabled={busy || title.trim().length < 3} className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
        {busy ? "Creating…" : "Create draft"}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-[var(--ink3)] underline">Cancel</button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
