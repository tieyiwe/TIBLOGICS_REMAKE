import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { tutorTablesReady } from "@/lib/learn/tutor/db";
import { tutorDailyLimit } from "@/lib/learn/tutor/server";
import { Bot, MessageSquare, Users } from "lucide-react";
import { Card, EmptyState, Notice, PageHeader, StatCard, tableStyles } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { LEARN_TABS } from "../tabs";

export const dynamic = "force-dynamic";

// Tutor usage: learner messages per day, how many learners asked, which
// lessons draw the most questions, and which quick actions get used. Counts
// only; conversations themselves are not shown here.

const DAYS = 14;

export default async function TutorUsagePage() {
  await requireAdminPage();
  const ready = await tutorTablesReady();

  const since = new Date(Date.now() - DAYS * 86_400_000);
  const [perDay, topLessons, actions, totals] = ready
    ? await Promise.all([
        prisma.$queryRaw<Array<{ day: Date; messages: bigint; learners: bigint }>>`
          SELECT date_trunc('day', m."createdAt") AS day, COUNT(*) AS messages, COUNT(DISTINCT t."studentId") AS learners
          FROM "TutorMessage" m JOIN "TutorThread" t ON t."id" = m."threadId"
          WHERE m."role" = 'user' AND m."createdAt" >= ${since}
          GROUP BY 1 ORDER BY 1 DESC`,
        prisma.$queryRaw<Array<{ lessonId: string; title: string | null; track: string | null; messages: bigint; learners: bigint }>>`
          SELECT t."lessonId" AS "lessonId", l."title" AS title, tr."title" AS track,
                 COUNT(*) AS messages, COUNT(DISTINCT t."studentId") AS learners
          FROM "TutorMessage" m
          JOIN "TutorThread" t ON t."id" = m."threadId"
          LEFT JOIN "Lesson" l ON l."id" = t."lessonId"
          LEFT JOIN "LearnModule" mo ON mo."id" = l."moduleId"
          LEFT JOIN "LearnTrack" tr ON tr."id" = mo."trackId"
          WHERE m."role" = 'user' AND t."kind" = 'lesson' AND m."createdAt" >= ${since}
          GROUP BY t."lessonId", l."title", tr."title"
          ORDER BY messages DESC LIMIT 15`,
        prisma.$queryRaw<Array<{ action: string | null; messages: bigint }>>`
          SELECT m."action" AS action, COUNT(*) AS messages FROM "TutorMessage" m
          WHERE m."role" = 'user' AND m."createdAt" >= ${since}
          GROUP BY 1 ORDER BY 2 DESC`,
        prisma.$queryRaw<Array<{ kind: string; messages: bigint }>>`
          SELECT t."kind" AS kind, COUNT(*) AS messages
          FROM "TutorMessage" m JOIN "TutorThread" t ON t."id" = m."threadId"
          WHERE m."role" = 'user' AND m."createdAt" >= ${since}
          GROUP BY 1 ORDER BY 2 DESC`,
      ]).catch((err) => {
        console.error("[admin/tutor]", err);
        return [[], [], [], []] as const;
      })
    : ([[], [], [], []] as const);

  const n = (v: bigint | number) => Number(v);
  const total = perDay.reduce((s, r) => s + n(r.messages), 0);
  const peak = Math.max(1, ...perDay.map((r) => n(r.messages)));

  const learners = perDay.reduce((s, r) => Math.max(s, n(r.learners)), 0);
  const spark = [...perDay].reverse().map((r) => n(r.messages));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tutor usage"
        subtitle={`Learner messages to Tutor over the last ${DAYS} days. Limit per learner: ${tutorDailyLimit()} a day (TUTOR_DAILY_LIMIT), also counted toward the shared Learn AI budget (LEARN_AI_DAILY).`}
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Tutor" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/tutor"
        className="mb-0"
      />

      {!ready && <Notice tone="warn" title="Tutor tables unavailable">The Tutor tables could not be created. Check the database connection.</Notice>}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <StatCard label={`Messages, ${DAYS} days`} value={total.toLocaleString("en")} icon={MessageSquare} tone="navy" spark={spark} />
        <StatCard label="Peak learners in a day" value={learners} icon={Users} />
        <StatCard label="Lessons asked about" value={topLessons.length >= 15 ? "15+" : topLessons.length} icon={Bot} />
      </div>

      <Card title="Messages per day" subtitle={`${total.toLocaleString("en")} messages in total`} padded={false}>
        {perDay.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No Tutor messages yet" body="When ARFA learners ask Tutor a question, daily volume shows here." compact />
        ) : (
          <div className="relative overflow-x-auto">
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>Day</th>
                  <th className={cn(tableStyles.th, "text-right")}>Messages</th>
                  <th className={cn(tableStyles.th, "text-right")}>Learners</th>
                  <th className={cn(tableStyles.th, "w-1/2")} aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {perDay.map((r) => (
                  <tr key={new Date(r.day).toISOString()} className={tableStyles.tr}>
                    <td className={cn(tableStyles.td, "text-[var(--a-ink)]")}>
                      {new Date(r.day).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
                    </td>
                    <td className={cn(tableStyles.td, "text-right font-semibold tabular-nums text-[var(--a-ink)]")}>{n(r.messages)}</td>
                    <td className={cn(tableStyles.td, "text-right tabular-nums")}>{n(r.learners)}</td>
                    <td className={tableStyles.td} aria-hidden="true">
                      <div className="h-2 rounded-full bg-[var(--a-blue)]/80" style={{ width: `${(n(r.messages) / peak) * 100}%` }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Top lessons asked about" padded={false}>
        {topLessons.length === 0 ? (
          <EmptyState icon={Bot} title="No lesson questions yet" compact />
        ) : (
          <div className="relative overflow-x-auto">
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>Lesson</th>
                  <th className={tableStyles.th}>Track</th>
                  <th className={cn(tableStyles.th, "text-right")}>Messages</th>
                  <th className={cn(tableStyles.th, "text-right")}>Learners</th>
                </tr>
              </thead>
              <tbody>
                {topLessons.map((r) => (
                  <tr key={r.lessonId} className={tableStyles.tr}>
                    <td className={tableStyles.td}>
                      <Link href={`/admin_pro/learn/lessons/${r.lessonId}`} className="font-medium text-[var(--a-blue)] hover:underline">
                        {r.title ?? r.lessonId}
                      </Link>
                    </td>
                    <td className={cn(tableStyles.td, "text-[var(--a-ink-3)]")}>{r.track ?? ""}</td>
                    <td className={cn(tableStyles.td, "text-right font-semibold tabular-nums text-[var(--a-ink)]")}>{n(r.messages)}</td>
                    <td className={cn(tableStyles.td, "text-right tabular-nums")}>{n(r.learners)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="By page">
          <ul className="space-y-2 font-dm text-[13.5px]">
            {totals.map((r) => (
              <li key={r.kind} className="flex justify-between text-[var(--a-ink-2)]">
                <span className="capitalize">{r.kind}</span>
                <span className="font-semibold tabular-nums text-[var(--a-ink)]">{n(r.messages)}</span>
              </li>
            ))}
            {totals.length === 0 && <li className="text-[var(--a-ink-3)]">None yet.</li>}
          </ul>
        </Card>
        <Card title="Quick actions">
          <ul className="space-y-2 font-dm text-[13.5px]">
            {actions.map((r) => (
              <li key={r.action ?? "typed"} className="flex justify-between text-[var(--a-ink-2)]">
                <span>{r.action ? ACTION_LABEL[r.action] ?? r.action : "Typed question"}</span>
                <span className="font-semibold tabular-nums text-[var(--a-ink)]">{n(r.messages)}</span>
              </li>
            ))}
            {actions.length === 0 && <li className="text-[var(--a-ink-3)]">None yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

const ACTION_LABEL: Record<string, string> = {
  simpler: "Explain this simpler",
  example: "Example from my field",
  quiz: "Quiz me",
  system: "Connect to the whole system",
  stuck: "Stuck on Try it now",
  explain: "Ask Tutor on selected text",
};
