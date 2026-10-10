import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secretEquals } from "@/lib/require-admin";
import { teamTablesReady } from "@/lib/learn/team/db";
import { teamEntitled } from "@/lib/learn/team/access";
import { trackPercents } from "@/lib/learn/team/report";
import { sendOverdueReminder } from "@/lib/learn/team/emails";
import { runTeamDigests } from "@/lib/learn/team/digest";
import { runTeamMonthly } from "@/lib/learn/team/monthly";
import { runParentDigests } from "@/lib/learn/youth-digest";
import { runYouthPauses } from "@/lib/learn/youth-portal";
import { canAccessTrack, getAccess } from "@/lib/learn/session";
import { youthTrackIds } from "@/lib/learn/track-subscriptions";

// Team plans: a weekly email to each member with overdue assignments (past
// the due date, track not finished). Safe to run hourly: a learner is
// reminded about an assignment at most once every 7 days. Also sends the
// weekly manager digest (lib/learn/team/digest.ts: once per manager per week,
// claimed before sending) and, from the 1st of each month, last month's
// report to each team owner (lib/learn/team/monthly.ts: once per team per
// month, claimed before sending). On Sundays (UTC) it also sends the
// AI-Empowered Youth weekly parent email (lib/learn/youth-digest.ts: once per
// child per week, claimed before sending), and every run the youth pause
// alerts (lib/learn/youth-portal.ts: a nudge to the child at day 3 without
// learning, one email to the parent and sponsors at day 5; once per pause).
//   npm run cron teams
//   ?dry=1   only lists the monthly reports that would go out now; sends nothing
export const maxDuration = 120;
const WEEK = 7 * 86_400_000;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await teamTablesReady())) return NextResponse.json({ error: "Team tables unavailable" }, { status: 500 });
  if (req.nextUrl.searchParams.get("dry") === "1") return NextResponse.json({ dry: true, monthly: await runTeamMonthly({ dry: true }) });

  // Staff log retention (Team & Roles): deletes footprint and audit entries
  // past the owner's retention setting, at most once a day.
  const retention = await import("@/lib/admin/team/footprint")
    .then((m) => m.runStaffLogRetention())
    .catch((err) => ({ error: err instanceof Error ? err.message : String(err) }));
  const digest = await runTeamDigests().catch((err) => ({ digests: 0, skipped: 0, errors: [err instanceof Error ? err.message : String(err)] }));
  const monthly = await runTeamMonthly({ deadline: Date.now() + 50_000 }).catch((err) => ({ sent: 0, errors: [err instanceof Error ? err.message : String(err)] }));
  // ?parents=now sends this week's parent emails on any day (still once per child and week).
  const youthIds = await youthTrackIds().catch(() => [] as string[]);
  const pauses = await runYouthPauses({
    deadline: Date.now() + 30_000,
    holdsLane: async (id) => {
      const access = await getAccess(id);
      return youthIds.some((y) => canAccessTrack(access, y));
    },
  }).catch((err) => ({ nudges: 0, alerts: 0, errors: [err instanceof Error ? err.message : String(err)] }));
  const parents = await runParentDigests({ deadline: Date.now() + 40_000, force: req.nextUrl.searchParams.get("parents") === "now" }).catch((err) => ({ sent: 0, skipped: 0, errors: [err instanceof Error ? err.message : String(err)] }));
  const now = new Date();
  const due = await prisma.teamAssignment.findMany({
    where: { dueAt: { lt: now }, OR: [{ lastRemindedAt: null }, { lastRemindedAt: { lt: new Date(now.getTime() - WEEK + 3_600_000) } }] },
    take: 2000,
  });
  if (due.length === 0) return NextResponse.json({ reminded: 0, emails: 0, digest, monthly, retention, parents, pauses });

  const teams = await prisma.team.findMany({ where: { id: { in: [...new Set(due.map((d) => d.teamId))] } } });
  const live = new Map(teams.filter((t) => teamEntitled(t)).map((t) => [t.id, t]));
  // Only members still holding an active seat on that team.
  const seats = await prisma.teamMember.findMany({
    where: { teamId: { in: [...live.keys()] }, status: "active", studentId: { in: [...new Set(due.map((d) => d.studentId))] } },
    select: { teamId: true, studentId: true },
  });
  const seated = new Set(seats.map((s) => `${s.teamId}:${s.studentId}`));
  const open = due.filter((d) => live.has(d.teamId) && seated.has(`${d.teamId}:${d.studentId}`));
  const studentIds = [...new Set(open.map((d) => d.studentId))];
  const [pct, students, tracks] = await Promise.all([
    trackPercents(studentIds),
    prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, email: true, name: true, locale: true } }),
    prisma.learnTrack.findMany({ where: { id: { in: [...new Set(open.map((d) => d.trackId))] } }, select: { id: true, slug: true, title: true } }),
  ]);

  let emails = 0;
  let reminded = 0;
  const errors: string[] = [];
  for (const s of students) {
    const mine = open.filter((d) => d.studentId === s.id && (pct.get(s.id)?.get(d.trackId) ?? 0) < 100);
    if (mine.length === 0) continue;
    const team = live.get(mine[0].teamId)!;
    try {
      await sendOverdueReminder({
        email: s.email,
        name: s.name,
        teamName: team.name,
        locale: s.locale,
        items: mine.map((d) => {
          const t = tracks.find((x) => x.id === d.trackId);
          return { title: t?.title ?? "", slug: t?.slug ?? "", dueAt: d.dueAt!, percent: pct.get(s.id)?.get(d.trackId) ?? 0 };
        }),
      });
      await prisma.teamAssignment.updateMany({ where: { id: { in: mine.map((d) => d.id) } }, data: { lastRemindedAt: now } });
      emails++;
      reminded += mine.length;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  return NextResponse.json({ reminded, emails, errors, digest, monthly, retention, parents, pauses });
}
