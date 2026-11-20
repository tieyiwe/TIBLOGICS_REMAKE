import prisma from "@/lib/prisma";
import { ensureTeamTables } from "./db";
import { teamEntitled } from "./access";
import { teamReport } from "./report";
import { monthlyOn, readPrefs } from "./prefs";
import { claimEmail, releaseClaim } from "./claims";
import { sendOwnerMonthly, type MonthlyData } from "./emails";

// The monthly report to each team OWNER: last calendar month's activity
// (active learners, lessons completed, quizzes passed, certificates earned),
// the top 3 learners by progress and who has been inactive for 14 days or
// more. Runs inside the teams cron (daily or hourly): from the 1st of a month
// on, each team is sent last month's report once, claimed before sending
// (TeamEmailClaim "monthly:<team>:<YYYY-MM>"); a failed send releases the
// claim so the next run retries. Opt-out: Reports tab (prefs.monthly; with no
// explicit choice it follows the owner's weekly digest setting).
//
// Same privacy limits as the dashboard: counts and progress percents only.

const DAY = 86_400_000;
export const MONTHLY_INACTIVE_DAYS = 14;
const MAX_NAMED_INACTIVE = 10;

/** Last calendar month (UTC): its key (YYYY-MM) and [start, end). */
export function previousMonth(now = new Date()): { key: string; start: Date; end: Date } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1));
  return { key: start.toISOString().slice(0, 7), start, end };
}

export async function buildMonthly(teamId: string, teamName: string, month: { start: Date; end: Date }, now = new Date()): Promise<MonthlyData> {
  const r = await teamReport(teamId);
  const active = r.members.filter((m) => m.status === "active" && m.studentId);
  const ids = active.map((m) => m.studentId!);
  const inMonth = { gte: month.start, lt: month.end };
  const [lessons, quizzes, certificates, ledger] = ids.length
    ? await Promise.all([
        prisma.lessonProgress.findMany({ where: { studentId: { in: ids }, completedAt: inMonth }, select: { studentId: true } }),
        prisma.quizAttempt.findMany({
          where: { studentId: { in: ids }, passed: true, createdAt: inMonth },
          select: { studentId: true, quizId: true },
          distinct: ["studentId", "quizId"],
        }),
        prisma.learnCertificate.count({ where: { studentId: { in: ids }, revoked: false, issuedAt: inMonth } }),
        prisma.pointsLedger.findMany({ where: { studentId: { in: ids }, createdAt: inMonth }, select: { studentId: true }, distinct: ["studentId"] }),
      ])
    : [[], [], 0, []];
  const activeIds = new Set([...lessons, ...quizzes, ...ledger].map((x) => x.studentId));
  const name = (m: (typeof active)[number]) => m.name?.trim() || m.email;
  const learners = active.filter((m) => m.role !== "owner");
  const top = [...learners]
    .filter((m) => m.overallPercent > 0)
    .sort((a, b) => b.overallPercent - a.overallPercent || b.tracksStarted - a.tracksStarted)
    .slice(0, 3)
    .map((m) => ({ who: name(m), percent: m.overallPercent }));
  const cutoff = now.getTime() - MONTHLY_INACTIVE_DAYS * DAY;
  const inactive = learners.filter((m) => !m.lastActiveAt || new Date(m.lastActiveAt).getTime() < cutoff).map(name);
  return {
    teamName,
    month: month.start,
    members: active.length,
    activeLearners: activeIds.size,
    lessons: lessons.length,
    quizzesPassed: quizzes.length,
    certificates,
    top,
    inactive: inactive.slice(0, MAX_NAMED_INACTIVE),
    inactiveMore: Math.max(0, inactive.length - MAX_NAMED_INACTIVE),
  };
}

export interface MonthlyRun {
  month: string;
  sent: number;
  /** Already sent this month (claimed). */
  skipped: number;
  optedOut: number;
  errors: string[];
  /** Dry run only: the teams that would get a report now. */
  wouldSend?: Array<{ teamId: string; team: string }>;
}

export async function runTeamMonthly(opts: { now?: Date; dry?: boolean; deadline?: number } = {}): Promise<MonthlyRun> {
  await ensureTeamTables();
  const now = opts.now ?? new Date();
  const stop = opts.deadline ?? Date.now() + 60_000;
  const month = previousMonth(now);
  const out: MonthlyRun = { month: month.key, sent: 0, skipped: 0, optedOut: 0, errors: [], ...(opts.dry ? { wouldSend: [] } : {}) };
  // Teams that existed during the month and are still entitled.
  const teams = (await prisma.team.findMany({ where: { status: { notIn: ["pending", "canceled"] }, createdAt: { lt: month.end } } })).filter((t) => teamEntitled(t));
  if (teams.length === 0) return out;
  const keys = teams.map((t) => `monthly:${t.id}:${month.key}`);
  const done = new Set(
    (await prisma.$queryRaw<Array<{ key: string }>>`SELECT "key" FROM "TeamEmailClaim" WHERE "key" = ANY(${keys})`).map((r) => r.key),
  );
  for (const team of teams) {
    if (Date.now() > stop) break;
    const key = `monthly:${team.id}:${month.key}`;
    if (done.has(key)) {
      out.skipped++;
      continue;
    }
    // The owner, still holding their seat; a team of one has nothing to report.
    const members = await prisma.teamMember.findMany({ where: { teamId: team.id, status: { in: ["active", "invited"] } }, select: { studentId: true, role: true, status: true } });
    if (members.length < 2) continue;
    if (!members.some((m) => m.studentId === team.ownerStudentId && m.role === "owner" && m.status === "active")) continue;
    if (!monthlyOn(readPrefs(team.settings), team.ownerStudentId)) {
      out.optedOut++;
      continue;
    }
    const owner = await prisma.student.findUnique({ where: { id: team.ownerStudentId }, select: { email: true, name: true, locale: true } });
    if (!owner?.email) continue;
    if (opts.dry) {
      out.wouldSend!.push({ teamId: team.id, team: team.name });
      continue;
    }
    if (!(await claimEmail(key, team.id))) {
      out.skipped++;
      continue;
    }
    try {
      const d = await buildMonthly(team.id, team.name, month, now);
      await sendOwnerMonthly({ email: owner.email, name: owner.name, locale: owner.locale, d });
      out.sent++;
    } catch (err) {
      await releaseClaim(key);
      out.errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  return out;
}
