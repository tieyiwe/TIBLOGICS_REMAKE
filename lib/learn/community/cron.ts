import prisma from "@/lib/prisma";
import { ensureCommunityTables } from "./db";
import { cohortEnded, cohortMemberRows, listCohorts, memberProgress, planModules } from "./cohorts";
import { currentWeek, expectedPercent, nextSession, weekPlan } from "./shared";
import { sendBehindNudge, sendReplyDigest, sendSessionReminder } from "./emails";

// The "cohorts" scheduled job (npm run cron cohorts, hourly):
//   1. 24h reminders: each cohort's next live session, once per session.
//   2. Weekly nudge: a member more than NUDGE_SLACK points behind the week
//      plan, at most once every 7 days, not in their first 3 days.
//   3. Reply digest: one email per thread author with new replies from
//      others since their last digest, at most once a day, unless they
//      turned it off in account settings.
// Each step is idempotent, so a missed or repeated run is harmless.

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NUDGE_SLACK = 10;

export interface CronReport {
  reminders: number;
  nudges: number;
  digests: number;
  errors: string[];
}

export async function runCommunityJobs(now = new Date()): Promise<CronReport> {
  await ensureCommunityTables();
  const report: CronReport = { reminders: 0, nudges: 0, digests: 0, errors: [] };
  const cohorts = (await listCohorts()).filter((c) => !cohortEnded(c, new Date(now.getTime() - 7 * DAY)));

  for (const c of cohorts) {
    // 1. Reminder for a session starting within the next 24 hours.
    try {
      const s = nextSession(c, now);
      if (s && s.start.getTime() > now.getTime() && s.start.getTime() - now.getTime() <= DAY) {
        // Claim the session first so two overlapping runs cannot both send.
        const claimed = await prisma.$executeRaw`
          UPDATE "Cohort" SET "remindedFor" = ${s.start}
          WHERE "id" = ${c.id} AND ("remindedFor" IS NULL OR "remindedFor" <> ${s.start})`;
        if (claimed > 0) {
          for (const m of await cohortMemberRows(c.id)) {
            try {
              await sendSessionReminder({ email: m.email, name: m.name, locale: m.locale }, c, s.start);
              report.reminders++;
            } catch (err) {
              report.errors.push(`reminder ${c.id}: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        }
      }
    } catch (err) {
      report.errors.push(`reminder ${c.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 2. Nudges, while the cohort is running.
    try {
      const week = currentWeek(c, now);
      if (week >= 2 && !cohortEnded(c, now)) {
        const [mods, progress, members] = await Promise.all([planModules(c.trackId), memberProgress(c.id, c.trackId), cohortMemberRows(c.id)]);
        const plan = weekPlan(c, mods);
        const expected = expectedPercent(plan, week, progress.total);
        for (const m of members) {
          const mine = progress.total ? Math.round(((progress.done.get(m.studentId) ?? 0) / progress.total) * 100) : 0;
          if (mine + NUDGE_SLACK >= expected) continue;
          if (now.getTime() - m.joinedAt.getTime() < 3 * DAY) continue;
          if (m.lastNudgeAt && now.getTime() - m.lastNudgeAt.getTime() < 7 * DAY - HOUR) continue;
          const claimed = await prisma.$executeRaw`
            UPDATE "CohortMember" SET "lastNudgeAt" = ${now}
            WHERE "cohortId" = ${c.id} AND "studentId" = ${m.studentId}
              AND ("lastNudgeAt" IS NULL OR "lastNudgeAt" < ${new Date(now.getTime() - 7 * DAY + HOUR)})`;
          if (claimed === 0) continue;
          const next = await prisma.lesson.findFirst({
            where: { module: { trackId: c.trackId }, progress: { none: { studentId: m.studentId } } },
            orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }],
            select: { id: true },
          });
          try {
            await sendBehindNudge({ email: m.email, name: m.name, locale: m.locale }, c, { mine, expected, nextLessonId: next?.id ?? null });
            report.nudges++;
          } catch (err) {
            report.errors.push(`nudge ${c.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    } catch (err) {
      report.errors.push(`nudge ${c.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. Reply digests.
  try {
    report.digests = await sendDigests(now, report.errors);
  } catch (err) {
    report.errors.push(`digest: ${err instanceof Error ? err.message : String(err)}`);
  }
  return report;
}

async function sendDigests(now: Date, errors: string[]): Promise<number> {
  // New visible replies by someone else on a visible thread, since the
  // author's last digest (or the last 7 days for a first one).
  const rows = await prisma.$queryRaw<
    Array<{ authorId: string; email: string; name: string; locale: string; threadId: string; title: string; lessonId: string | null; n: number }>
  >`
    SELECT t."authorId", s."email", s."name", s."locale", t."id" AS "threadId", t."title", t."lessonId", COUNT(p."id")::int AS n
    FROM "CommunityThread" t
    JOIN "Student" s ON s."id" = t."authorId"
    JOIN "CommunityPost" p ON p."threadId" = t."id"
    LEFT JOIN "CommunityProfile" pr ON pr."studentId" = t."authorId"
    WHERE t."deletedAt" IS NULL AND t."hidden" = false
      AND p."deletedAt" IS NULL AND p."hidden" = false AND p."authorId" <> t."authorId"
      AND COALESCE(pr."replyDigest", true) = true
      AND (pr."lastDigestAt" IS NULL OR pr."lastDigestAt" < ${new Date(now.getTime() - 20 * HOUR)})
      AND p."createdAt" > COALESCE(pr."lastDigestAt", ${new Date(now.getTime() - 7 * DAY)})
      AND p."createdAt" <= ${now}
    GROUP BY t."authorId", s."email", s."name", s."locale", t."id", t."title", t."lessonId"
    ORDER BY t."authorId", MAX(p."createdAt") DESC`;

  const byAuthor = new Map<string, typeof rows>();
  for (const r of rows) byAuthor.set(r.authorId, [...(byAuthor.get(r.authorId) ?? []), r]);

  let sent = 0;
  for (const [authorId, threads] of byAuthor) {
    // Claim first: a concurrent run then finds lastDigestAt fresh and skips.
    const claimed = await prisma.$executeRaw`
      INSERT INTO "CommunityProfile" ("studentId", "lastDigestAt") VALUES (${authorId}, ${now})
      ON CONFLICT ("studentId") DO UPDATE SET "lastDigestAt" = ${now}, "updatedAt" = now()
      WHERE "CommunityProfile"."lastDigestAt" IS NULL OR "CommunityProfile"."lastDigestAt" < ${new Date(now.getTime() - 20 * HOUR)}`;
    if (claimed === 0) continue;
    const a = threads[0];
    try {
      await sendReplyDigest(
        { email: a.email, name: a.name, locale: a.locale },
        threads.slice(0, 10).map((th) => ({ title: th.title, replies: Number(th.n), href: `/learn/community/thread/${th.threadId}` })),
      );
      sent++;
    } catch (err) {
      errors.push(`digest ${authorId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return sent;
}
