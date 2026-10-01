import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secretEquals } from "@/lib/require-admin";
import { teamTablesReady } from "@/lib/learn/team/db";
import { teamEntitled } from "@/lib/learn/team/access";
import { trackPercents } from "@/lib/learn/team/report";
import { sendOverdueReminder } from "@/lib/learn/team/emails";

// Team plans: a weekly email to each member with overdue assignments (past
// the due date, track not finished). Safe to run hourly: a learner is
// reminded about an assignment at most once every 7 days.
//   npm run cron teams
export const maxDuration = 120;
const WEEK = 7 * 86_400_000;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await teamTablesReady())) return NextResponse.json({ error: "Team tables unavailable" }, { status: 500 });

  const now = new Date();
  const due = await prisma.teamAssignment.findMany({
    where: { dueAt: { lt: now }, OR: [{ lastRemindedAt: null }, { lastRemindedAt: { lt: new Date(now.getTime() - WEEK + 3_600_000) } }] },
    take: 2000,
  });
  if (due.length === 0) return NextResponse.json({ reminded: 0, emails: 0 });

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
  return NextResponse.json({ reminded, emails, errors });
}
