import Link from "next/link";
import { ClipboardCheck, ListChecks } from "lucide-react";
import { Badge, Card, EmptyState, type BadgeTone } from "@/components/admin/ui";
import { learnerAssessments, OUTCOME_LABEL, type ExamOutcome } from "@/lib/learn/admin/assessments";

// Every final exam attempt (score, time taken, outcome, per-module scores,
// attempts left and cooldown) and every module quiz attempt of one learner.
// Answers stay private: scores and outcomes only.

const TONE: Record<ExamOutcome, BadgeTone> = { distinction: "success", passed: "success", failed: "danger", expired: "warn", in_progress: "info" };
const dt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }) + " UTC";
const th = "whitespace-nowrap px-3 py-2 text-left font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]";
const td = "px-3 py-2 align-top font-dm text-[13px] text-[var(--a-ink-2)]";

export default async function Assessments({ studentId }: { studentId: string }) {
  const { exams, quizzes } = await learnerAssessments(studentId);
  return (
    <>
      <Card title={`Final exams (${exams.reduce((n, e) => n + e.attempts.length, 0)} attempts)`} icon={ClipboardCheck} subtitle="Every attempt with its score, time taken and outcome. Answers are not shown.">
        {exams.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No final exam attempted yet" compact />
        ) : (
          <div className="space-y-6" data-testid="learner-exams">
            {exams.map((e) => (
              <div key={e.trackId}>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/learning-box/${e.trackSlug}`} className="font-dm text-[14px] font-semibold text-[var(--a-ink)] hover:underline">{e.trackTitle}</Link>
                  {e.passed ? <Badge tone="success">Passed</Badge> : <Badge tone="neutral">Not passed yet</Badge>}
                  <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">
                    Best {e.best ?? "–"}% · pass {e.passScore}% · distinction {e.distinctionScore}% · {e.used} of {e.maxAttempts} attempts used
                    {!e.passed && ` · ${e.attemptsLeft} left`}
                    {e.nextAttemptAt && ` · next attempt from ${dt(e.nextAttemptAt)}`}
                  </span>
                </div>
                <div className="mt-2 overflow-x-auto rounded-[10px] border border-[var(--a-border)]">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-[var(--a-surface-2)]">
                      <tr><th className={th}>#</th><th className={th}>Started</th><th className={th}>Time</th><th className={th}>Score</th><th className={th}>Outcome</th><th className={th}>By module</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--a-border)]">
                      {e.attempts.map((a) => (
                        <tr key={a.id}>
                          <td className={td}>{a.attempt}</td>
                          <td className={`${td} whitespace-nowrap`}>{dt(a.startedAt)}</td>
                          <td className={`${td} whitespace-nowrap`}>{a.minutes != null ? `${a.minutes} min` : "–"}</td>
                          <td className={`${td} font-semibold text-[var(--a-ink)]`}>{a.score != null ? `${a.score}%` : "–"}</td>
                          <td className={td}><Badge tone={TONE[a.outcome]}>{OUTCOME_LABEL[a.outcome]}</Badge></td>
                          <td className={td}>
                            {a.modules.length ? (
                              <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                                {a.modules.map((m) => (
                                  <span key={m.title} className={m.score < e.passScore ? "text-red-600" : ""}>{m.title}: {m.score}%</span>
                                ))}
                              </span>
                            ) : "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title={`Module quizzes (${quizzes.length} attempts)`} icon={ListChecks}>
        {quizzes.length === 0 ? (
          <EmptyState icon={ListChecks} title="No quiz attempted yet" compact />
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-[var(--a-border)]" data-testid="learner-quizzes">
            <table className="w-full min-w-[560px]">
              <thead className="bg-[var(--a-surface-2)]">
                <tr><th className={th}>When</th><th className={th}>Track</th><th className={th}>Module</th><th className={th}>Score</th><th className={th}>Result</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border)]">
                {quizzes.map((q) => (
                  <tr key={q.id}>
                    <td className={`${td} whitespace-nowrap`}>{dt(q.at)}</td>
                    <td className={td}>{q.trackTitle}</td>
                    <td className={td}>{q.moduleTitle}</td>
                    <td className={`${td} font-semibold text-[var(--a-ink)]`}>{q.score}%</td>
                    <td className={td}>{q.passed ? <Badge tone="success">Passed</Badge> : <Badge tone="danger">Below {q.passScore}%</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
