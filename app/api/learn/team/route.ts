import { NextRequest, NextResponse } from "next/server";
import { isManagerRole } from "@/lib/learn/team/config";
import { requireTeamMember, teamRateLimit } from "@/lib/learn/team/guard";
import { teamReport } from "@/lib/learn/team/report";
import { myAssignments, seatsUsed } from "@/lib/learn/team/service";
import { teamAiPool } from "@/lib/learn/ai-budget";
import { teamInGrace } from "@/lib/learn/team/access";
import prisma from "@/lib/prisma";

/**
 * The caller's team. Managers get the privacy-limited report for their own
 * team; members get who manages them, what is shared and their assignments.
 */
export async function GET(req: NextRequest) {
  const limited = await teamRateLimit(req, "read", 120);
  if (limited) return limited;
  const g = await requireTeamMember();
  if (g.error) return g.error;
  const { team } = g.m;
  const base = {
    team: { id: team.id, name: team.name, status: team.status, seats: team.seats, comped: team.comped, inGrace: teamInGrace(team), graceUntil: team.graceUntil, entitled: g.m.entitled },
    role: g.m.role,
  };
  if (!isManagerRole(g.m.role)) {
    const managers = await prisma.teamMember.findMany({
      where: { teamId: team.id, status: "active", role: { in: ["owner", "manager"] } },
      select: { studentId: true, role: true },
    });
    const names = await prisma.student.findMany({ where: { id: { in: managers.map((m) => m.studentId!).filter(Boolean) } }, select: { name: true } });
    return NextResponse.json({ ...base, managers: names.map((n) => n.name), assignments: (await myAssignments(g.student.id))?.items ?? [] });
  }
  const [report, used, aiPool] = await Promise.all([teamReport(team.id), seatsUsed(team.id), teamAiPool(team.id)]);
  return NextResponse.json({ ...base, used, aiPool, ...report });
}
