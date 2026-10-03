import prisma from "@/lib/prisma";
import { ensureTeamTables } from "./db";

// What an invitation carries until it is accepted (TeamInvitePlan, raw SQL:
// see ./db.ts): the invitee's name as the manager typed it, their role, the
// tracks to assign with a due date, and the language of the email. Applied
// once, when the invitation is accepted (or a team link is used), then
// cleared. Every query is scoped to a team id.

export interface InvitePlan {
  memberId: string;
  teamId: string;
  name: string | null;
  role: "member" | "manager";
  trackIds: string[];
  dueAt: Date | null;
  locale: string | null;
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type Db = Tx | typeof prisma;

interface Row {
  memberId: string;
  teamId: string;
  name: string | null;
  role: string;
  trackIds: unknown;
  dueAt: Date | null;
  locale: string | null;
}

const toPlan = (r: Row): InvitePlan => ({
  memberId: r.memberId,
  teamId: r.teamId,
  name: r.name,
  role: r.role === "manager" ? "manager" : "member",
  trackIds: Array.isArray(r.trackIds) ? (r.trackIds as unknown[]).filter((x): x is string => typeof x === "string") : [],
  dueAt: r.dueAt,
  locale: r.locale,
});

export async function savePlan(db: Db, p: InvitePlan): Promise<void> {
  await db.$executeRaw`
    INSERT INTO "TeamInvitePlan" ("memberId", "teamId", "name", "role", "trackIds", "dueAt", "locale")
    VALUES (${p.memberId}, ${p.teamId}, ${p.name}, ${p.role}, ${JSON.stringify(p.trackIds)}::jsonb, ${p.dueAt}, ${p.locale})
    ON CONFLICT ("memberId") DO UPDATE SET
      "teamId" = EXCLUDED."teamId", "name" = EXCLUDED."name", "role" = EXCLUDED."role",
      "trackIds" = EXCLUDED."trackIds", "dueAt" = EXCLUDED."dueAt", "locale" = EXCLUDED."locale",
      "createdAt" = CURRENT_TIMESTAMP`;
}

export async function getPlan(teamId: string, memberId: string): Promise<InvitePlan | null> {
  await ensureTeamTables();
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT "memberId", "teamId", "name", "role", "trackIds", "dueAt", "locale"
    FROM "TeamInvitePlan" WHERE "memberId" = ${memberId} AND "teamId" = ${teamId}`;
  return rows[0] ? toPlan(rows[0]) : null;
}

export async function plansForTeam(teamId: string): Promise<Map<string, InvitePlan>> {
  await ensureTeamTables();
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT "memberId", "teamId", "name", "role", "trackIds", "dueAt", "locale"
    FROM "TeamInvitePlan" WHERE "teamId" = ${teamId}`;
  return new Map(rows.map((r) => [r.memberId, toPlan(r)]));
}

export async function deletePlan(teamId: string, memberId: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "TeamInvitePlan" WHERE "memberId" = ${memberId} AND "teamId" = ${teamId}`;
}

/**
 * Applies a plan to a member who just took their seat: role (manager only if
 * the plan says so) and the assignments, then removes the plan. Only live
 * tracks are assigned. Returns the number of tracks assigned.
 */
export async function applyPlan(teamId: string, memberId: string, studentId: string): Promise<number> {
  const plan = await getPlan(teamId, memberId);
  if (!plan) return 0;
  if (plan.role === "manager") {
    await prisma.teamMember.updateMany({ where: { id: memberId, teamId, status: "active", role: "member" }, data: { role: "manager" } });
  }
  let n = 0;
  if (plan.trackIds.length) {
    const live = await prisma.learnTrack.findMany({ where: { id: { in: plan.trackIds }, status: "live" }, select: { id: true } });
    const inviter = await prisma.teamMember.findUnique({ where: { id: memberId }, select: { invitedById: true } });
    for (const t of live) {
      await prisma.teamAssignment.upsert({
        where: { teamId_studentId_trackId: { teamId, studentId, trackId: t.id } },
        create: { teamId, studentId, trackId: t.id, dueAt: plan.dueAt, assignedById: inviter?.invitedById ?? null },
        update: {},
      });
      n++;
    }
  }
  await deletePlan(teamId, memberId);
  return n;
}
