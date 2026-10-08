// AI-Empowered Youth: the weekly parent email, sent on Sundays (UTC) by the
// daily teams cron (app/api/cron/teams). Safe to run more than once a day:
// each child's email for the week is claimed first ("YouthParentDigest",
// primary key studentId + week); a failed send releases the claim so the next
// run retries.
import prisma from "@/lib/prisma";
import { weekStart } from "./leaderboard";
import { ensureYouthColumns, minorBirthYearAbove, readYouthProfile, needsParentConsent } from "./youth-account";
import { parentSummary } from "./youth-dashboard";
import { sendParentWeeklyEmail } from "./youth-emails";

export async function runParentDigests(opts: { now?: Date; force?: boolean; deadline?: number } = {}): Promise<{ sent: number; skipped: number; errors: string[] }> {
  const now = opts.now ?? new Date();
  if (!opts.force && now.getUTCDay() !== 0) return { sent: 0, skipped: 0, errors: [] };
  await ensureYouthColumns();
  const week = weekStart(now).toISOString().slice(0, 10);
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT s."id" FROM "Student" s
      WHERE s."parentEmail" IS NOT NULL AND s."parentToken" IS NOT NULL
        AND s."birthYear" > $1 AND s."parentConsent" <> 'revoked' AND s."parentDeleteRequestedAt" IS NULL
        AND NOT EXISTS (SELECT 1 FROM "YouthParentDigest" d WHERE d."studentId" = s."id" AND d."week" = $2)
      LIMIT 2000`,
    minorBirthYearAbove(), week,
  );
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const { id } of rows) {
    if (opts.deadline && Date.now() > opts.deadline) break;
    const child = await readYouthProfile(id);
    // Under 13 and not confirmed yet: no reports until the parent agrees.
    if (!child || (needsParentConsent(child) && child.parentConsent !== "granted")) {
      skipped++;
      continue;
    }
    const claimed = await prisma.$executeRawUnsafe(
      `INSERT INTO "YouthParentDigest" ("studentId","week") VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      id, week,
    );
    if (!claimed) {
      skipped++;
      continue;
    }
    try {
      await sendParentWeeklyEmail(child, await parentSummary(child));
      sent++;
    } catch (err) {
      await prisma.$executeRawUnsafe(`DELETE FROM "YouthParentDigest" WHERE "studentId" = $1 AND "week" = $2`, id, week).catch(() => {});
      errors.push(`${id}: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200));
    }
  }
  return { sent, skipped, errors: errors.slice(0, 20) };
}
