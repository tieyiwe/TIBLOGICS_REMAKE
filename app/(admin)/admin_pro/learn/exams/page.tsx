import Link from "next/link";
import { ClipboardCheck, Download } from "lucide-react";
import prisma from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, StatCard, type BadgeTone } from "@/components/admin/ui";
import { requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { examResults, OUTCOME_LABEL, OUTCOMES, type ExamOutcome } from "@/lib/learn/admin/assessments";
import { LEARN_TABS } from "../tabs";

export const dynamic = "force-dynamic";

// Every learner's final exam attempts in one place: who sat which exam, when,
// how long it took, the score and the outcome, with pass rates per track and
// a CSV download. Click a learner for their full history (quizzes too).

const TONE: Record<ExamOutcome, BadgeTone> = { distinction: "success", passed: "success", failed: "danger", expired: "warn", in_progress: "info" };
const dt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const input =
  "h-9 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13.5px] text-[var(--a-ink)]";

export default async function ExamResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireLearnerPage("read");
  const sp = await searchParams;
  const filters = {
    trackId: one(sp.track) || null,
    outcome: one(sp.outcome) || null,
    q: one(sp.q) || null,
    days: Number(one(sp.days)) || null,
  };
  const [{ rows, trackStats }, tracks] = await Promise.all([
    examResults({ ...filters, take: 1000 }),
    prisma.learnTrack.findMany({ where: { finalExam: { isNot: null } }, orderBy: { sortOrder: "asc" }, select: { id: true, title: true } }),
  ]);
  const learners = new Set(rows.map((r) => r.studentId)).size;
  const passedLearners = new Set(rows.filter((r) => r.outcome === "passed" || r.outcome === "distinction").map((r) => r.studentId)).size;
  const scored = rows.filter((r) => r.score != null && r.outcome !== "in_progress");
  const avg = scored.length ? Math.round(scored.reduce((n, r) => n + (r.score ?? 0), 0) / scored.length) : null;
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k === "trackId" ? "track" : k, String(v)]));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Exam results"
        subtitle="Every final exam attempt by every learner: score, time taken and outcome. Open a learner for their full history, including module quizzes."
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Exams" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/exams"
        actions={
          <a href={`/api/admin/learn/learners/exams?${qs}`} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 font-dm text-[13px] font-semibold text-[var(--a-ink)] hover:bg-[var(--a-surface-2)]" data-testid="exams-csv">
            <Download size={14} aria-hidden /> Download CSV
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Attempts" value={rows.length} />
        <StatCard label="Learners who sat an exam" value={learners} />
        <StatCard label="Learners who passed" value={passedLearners} />
        <StatCard label="Average score" value={avg != null ? `${avg}%` : "–"} />
      </div>

      <form className="flex flex-wrap items-end gap-2" method="get">
        <label className="font-dm text-[12px] font-semibold text-[var(--a-ink-2)]">
          Track
          <select name="track" defaultValue={filters.trackId ?? ""} className={`${input} mt-1 block w-full sm:w-56`}>
            <option value="">All tracks</option>
            {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>
        <label className="font-dm text-[12px] font-semibold text-[var(--a-ink-2)]">
          Outcome
          <select name="outcome" defaultValue={filters.outcome ?? ""} className={`${input} mt-1 block w-full sm:w-48`}>
            <option value="">Any</option>
            {OUTCOMES.filter((o) => o !== "distinction").map((o) => <option key={o} value={o}>{o === "passed" ? "Passed (incl. distinction)" : OUTCOME_LABEL[o]}</option>)}
          </select>
        </label>
        <label className="font-dm text-[12px] font-semibold text-[var(--a-ink-2)]">
          Period
          <select name="days" defaultValue={filters.days ? String(filters.days) : ""} className={`${input} mt-1 block w-full sm:w-36`}>
            <option value="">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>
        <label className="min-w-0 flex-1 font-dm text-[12px] font-semibold text-[var(--a-ink-2)]">
          Learner
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Name or email" className={`${input} mt-1 block w-full`} />
        </label>
        <button className="h-9 rounded-[var(--a-radius-control)] bg-[var(--a-navy)] px-4 font-dm text-[13px] font-semibold text-white">Filter</button>
      </form>

      {trackStats.length > 0 && (
        <Card title="By track">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] font-dm text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[.06em] text-[var(--a-ink-3)]">
                  <th className="py-2 pr-3">Track</th><th className="py-2 pr-3">Attempts</th><th className="py-2 pr-3">Learners</th><th className="py-2 pr-3">Passed</th><th className="py-2 pr-3">Pass rate</th><th className="py-2 pr-3">Avg score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border)]">
                {trackStats.map((s) => (
                  <tr key={s.trackId}>
                    <td className="py-2 pr-3 font-semibold text-[var(--a-ink)]">{s.trackTitle}</td>
                    <td className="py-2 pr-3">{s.attempts}</td>
                    <td className="py-2 pr-3">{s.learners}</td>
                    <td className="py-2 pr-3">{s.passed}</td>
                    <td className="py-2 pr-3">{s.passRate != null ? `${s.passRate}%` : "–"}</td>
                    <td className="py-2 pr-3">{s.averageScore != null ? `${s.averageScore}%` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title={`Attempts (${rows.length})`} padded={false}>
        {rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={ClipboardCheck} title="No exam attempts match" compact /></div>
        ) : (
          <div className="overflow-x-auto" data-testid="exam-results">
            <table className="w-full min-w-[760px] font-dm text-[13px]">
              <thead className="bg-[var(--a-surface-2)]">
                <tr className="whitespace-nowrap text-left text-[11px] uppercase tracking-[.06em] text-[var(--a-ink-3)]">
                  <th className="px-4 py-2">Learner</th><th className="px-4 py-2">Track</th><th className="px-4 py-2">#</th><th className="px-4 py-2">Started (UTC)</th><th className="px-4 py-2">Time</th><th className="px-4 py-2">Score</th><th className="px-4 py-2">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border)]">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">
                      <Link href={`/admin_pro/learn/learners/${r.studentId}?tab=progress`} className="font-semibold text-[var(--a-ink)] hover:underline">{r.name}</Link>
                      <span className="block text-[11.5px] text-[var(--a-ink-3)] break-all">{r.email}</span>
                    </td>
                    <td className="px-4 py-2">{r.trackTitle}</td>
                    <td className="px-4 py-2">{r.attempt}</td>
                    <td className="whitespace-nowrap px-4 py-2">{dt(r.startedAt)}</td>
                    <td className="whitespace-nowrap px-4 py-2">{r.minutes != null ? `${r.minutes} min` : "–"}</td>
                    <td className="px-4 py-2 font-semibold text-[var(--a-ink)]">{r.score != null ? `${r.score}%` : "–"}</td>
                    <td className="px-4 py-2"><Badge tone={TONE[r.outcome]}>{OUTCOME_LABEL[r.outcome]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
