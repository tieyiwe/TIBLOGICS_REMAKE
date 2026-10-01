import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { tutorTablesReady } from "@/lib/learn/tutor/db";
import { tutorDailyLimit } from "@/lib/learn/tutor/server";

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

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin_pro/learn" className="text-sm text-[var(--blue2)] hover:underline">
          ← TIBLOGICS Learn
        </Link>
        <h1 className="mt-2 text-2xl font-black text-[var(--ink)]">Tutor usage</h1>
        <p className="mt-1 text-sm text-[var(--ink3)]">
          Learner messages to Tutor over the last {DAYS} days. Limit per learner: {tutorDailyLimit()} a day (TUTOR_DAILY_LIMIT), also counted
          toward the shared Learn AI budget (LEARN_AI_DAILY).
        </p>
      </header>

      {!ready && (
        <p className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          The Tutor tables could not be created. Check the database connection.
        </p>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">Messages per day</h2>
          <p className="text-xs text-[var(--ink3)]">{total.toLocaleString("en")} messages in total</p>
        </div>
        {perDay.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No Tutor messages yet.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink3)]">
                <th className="pb-2">Day</th>
                <th className="pb-2 text-right">Messages</th>
                <th className="pb-2 text-right">Learners</th>
                <th className="w-1/2 pb-2 pl-4" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {perDay.map((r) => (
                <tr key={new Date(r.day).toISOString()} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2">{new Date(r.day).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{n(r.messages)}</td>
                  <td className="py-2 text-right tabular-nums">{n(r.learners)}</td>
                  <td className="py-2 pl-4" aria-hidden="true">
                    <div className="h-2 rounded-full bg-[var(--blue2)]" style={{ width: `${(n(r.messages) / peak) * 100}%` }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Top lessons asked about</h2>
        {topLessons.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No lesson questions yet.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink3)]">
                <th className="pb-2">Lesson</th>
                <th className="pb-2">Track</th>
                <th className="pb-2 text-right">Messages</th>
                <th className="pb-2 text-right">Learners</th>
              </tr>
            </thead>
            <tbody>
              {topLessons.map((r) => (
                <tr key={r.lessonId} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2">
                    <Link href={`/admin_pro/learn/lessons/${r.lessonId}`} className="text-[var(--blue2)] hover:underline">
                      {r.title ?? r.lessonId}
                    </Link>
                  </td>
                  <td className="py-2 text-[var(--ink3)]">{r.track ?? ""}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{n(r.messages)}</td>
                  <td className="py-2 text-right tabular-nums">{n(r.learners)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">By page</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {totals.map((r) => (
              <li key={r.kind} className="flex justify-between">
                <span className="capitalize">{r.kind}</span>
                <span className="font-semibold tabular-nums">{n(r.messages)}</span>
              </li>
            ))}
            {totals.length === 0 && <li className="text-[var(--ink3)]">None yet.</li>}
          </ul>
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">Quick actions</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {actions.map((r) => (
              <li key={r.action ?? "typed"} className="flex justify-between">
                <span>{r.action ? ACTION_LABEL[r.action] ?? r.action : "Typed question"}</span>
                <span className="font-semibold tabular-nums">{n(r.messages)}</span>
              </li>
            ))}
            {actions.length === 0 && <li className="text-[var(--ink3)]">None yet.</li>}
          </ul>
        </section>
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
