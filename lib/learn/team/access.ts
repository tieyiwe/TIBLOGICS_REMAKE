import prisma from "@/lib/prisma";
import { ensureTeamTables } from "./db";
import type { TeamRole } from "./config";

// Team membership as an entitlement. Read by lib/learn/session.ts (so an
// active member is treated like a subscriber) and lib/learn/ai-budget.ts (the
// pooled daily AI allowance). No imports from session.ts: keep it that way.

export interface TeamRow {
  id: string;
  name: string;
  ownerStudentId: string;
  seats: number;
  status: string;
  seatPriceCents: number | null;
  comped: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  graceUntil: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
}

/** Active | trialing | comped, or past_due inside the grace window. */
export function teamEntitled(t: Pick<TeamRow, "status" | "comped" | "graceUntil">, now = Date.now()): boolean {
  if (t.comped) return t.status !== "canceled";
  if (t.status === "active" || t.status === "trialing" || t.status === "comped") return true;
  return t.status === "past_due" && !!t.graceUntil && t.graceUntil.getTime() > now;
}

export function teamInGrace(t: Pick<TeamRow, "status" | "comped" | "graceUntil">, now = Date.now()): boolean {
  return !t.comped && t.status === "past_due" && !!t.graceUntil && t.graceUntil.getTime() > now;
}

export interface TeamMembership {
  memberId: string;
  role: TeamRole;
  team: TeamRow;
  entitled: boolean;
  inGrace: boolean;
}

/**
 * The learner's active seat, if any (an entitling team first). Null on any
 * failure: it can only ever deny access, never grant it.
 */
export async function getMembership(studentId: string | null | undefined): Promise<TeamMembership | null> {
  if (!studentId) return null;
  try {
    await ensureTeamTables();
    const seats = await prisma.teamMember.findMany({
      where: { studentId, status: "active" },
      select: { id: true, role: true, teamId: true },
    });
    if (seats.length === 0) return null;
    const teams = await prisma.team.findMany({ where: { id: { in: seats.map((s) => s.teamId) } } });
    const rows: TeamMembership[] = [];
    for (const s of seats) {
      const team = teams.find((t) => t.id === s.teamId);
      if (team) rows.push({ memberId: s.id, role: s.role as TeamRole, team, entitled: teamEntitled(team), inGrace: teamInGrace(team) });
    }
    rows.sort((a, b) => Number(b.entitled) - Number(a.entitled));
    return rows[0] ?? null;
  } catch (err) {
    console.error("[learn/team] membership", err);
    return null;
  }
}
