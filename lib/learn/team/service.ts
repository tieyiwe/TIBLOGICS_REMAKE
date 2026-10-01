import { createHash, randomBytes } from "crypto";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { ensureTeamTables } from "./db";
import { getMembership, teamEntitled, type TeamMembership, type TeamRow } from "./access";
import { TEAM_GRACE_DAYS, TEAM_INVITE_DAYS, TEAM_MAX_SEATS, TEAM_PRODUCT, isManagerRole, type TeamRole } from "./config";

// Team plans: lifecycle, seats, invitations and assignments. Every function
// here trusts its caller to have authorised the request (the API routes do,
// with requireTeamManager / requireTeamOwner in ./guard.ts); every query is
// scoped to one team id so one team can never touch another's rows.

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(24).toString("base64url");
const inviteExpiry = () => new Date(Date.now() + TEAM_INVITE_DAYS * 86_400_000);

// ── Seats ─────────────────────────────────────────────────────────────────

/** Active members plus unexpired invitations. Removed rows and expired invites free their seat. */
export async function seatsUsed(teamId: string): Promise<number> {
  await ensureTeamTables();
  return prisma.teamMember.count({
    where: {
      teamId,
      OR: [{ status: "active" }, { status: "invited", inviteExpiresAt: { gt: new Date() } }],
    },
  });
}

// ── Checkout and Stripe sync ──────────────────────────────────────────────

/** A team the learner owns that is live or comped (one per owner). */
export async function ownedLiveTeam(studentId: string): Promise<TeamRow | null> {
  await ensureTeamTables();
  const teams = await prisma.team.findMany({ where: { ownerStudentId: studentId, status: { notIn: ["pending", "canceled"] } } });
  return teams.find((t) => teamEntitled(t)) ?? teams[0] ?? null;
}

/** Creates (or reuses) the owner's pending team before Stripe Checkout. */
export async function createPendingTeam(p: { ownerStudentId: string; name: string; seats: number }): Promise<TeamRow> {
  await ensureTeamTables();
  const pending = await prisma.team.findFirst({ where: { ownerStudentId: p.ownerStudentId, status: "pending" } });
  if (pending) return prisma.team.update({ where: { id: pending.id }, data: { name: p.name, seats: p.seats } });
  return prisma.team.create({ data: { ownerStudentId: p.ownerStudentId, name: p.name, seats: p.seats, status: "pending" } });
}

function mapStatus(raw: string): string {
  if (raw === "active" || raw === "trialing" || raw === "past_due") return raw;
  if (raw === "canceled" || raw === "incomplete_expired" || raw === "unpaid") return "canceled";
  return "past_due";
}

/** The owner's own seat. Idempotent. */
async function ensureOwnerSeat(teamId: string, ownerStudentId: string) {
  const owner = await prisma.student.findUnique({ where: { id: ownerStudentId }, select: { email: true } });
  if (!owner) return;
  const email = owner.email.toLowerCase();
  await prisma.teamMember.upsert({
    where: { teamId_email: { teamId, email } },
    create: { teamId, email, studentId: ownerStudentId, role: "owner", status: "active", joinedAt: new Date() },
    update: { studentId: ownerStudentId, role: "owner", status: "active", removedAt: null, inviteTokenHash: null },
  });
}

/**
 * Mirrors a Stripe subscription into its Team: status, seats (quantity),
 * period end, cancel-at-period-end and the past_due grace window. Idempotent:
 * replaying an event writes the same values. A first sync (checkout) also
 * gives the owner their seat. Returns the team id, or null when the
 * subscription is not a team's.
 */
export async function syncTeamSubscription(
  sub: Stripe.Subscription,
  hint?: { teamId?: string | null; checkoutSessionId?: string | null },
): Promise<string | null> {
  await ensureTeamTables();
  const teamId = hint?.teamId || sub.metadata?.teamId || null;
  const team =
    (teamId ? await prisma.team.findUnique({ where: { id: teamId } }) : null) ??
    (await prisma.team.findUnique({ where: { stripeSubscriptionId: sub.id } }));
  if (!team) {
    console.error(`[learn/team] no team for subscription ${sub.id}`);
    return null;
  }
  if (team.comped) {
    // Staff comped this team: Stripe no longer drives it.
    return team.id;
  }
  // customer.subscription.created can arrive before the first payment
  // settles: an unpaid team stays pending (no access, no grace).
  if ((sub.status === "incomplete" || sub.status === "incomplete_expired") && team.status === "pending") return team.id;
  const status = mapStatus(sub.status);
  const item = sub.items?.data?.[0];
  const quantity = item?.quantity ?? team.seats;
  const periodEndUnix =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (item as unknown as { current_period_end?: number } | undefined)?.current_period_end;
  // Entering past_due starts the grace window once; a replay keeps the
  // original deadline; a healthy status clears it.
  const graceUntil =
    status === "past_due"
      ? team.status === "past_due" && team.graceUntil
        ? team.graceUntil
        : new Date(Date.now() + TEAM_GRACE_DAYS * 86_400_000)
      : null;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  await prisma.team.update({
    where: { id: team.id },
    data: {
      status,
      seats: Math.max(1, Math.min(TEAM_MAX_SEATS, quantity)),
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId ?? team.stripeCustomerId,
      ...(hint?.checkoutSessionId ? { stripeCheckoutSessionId: hint.checkoutSessionId } : {}),
      currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : team.currentPeriodEnd,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
      graceUntil,
    },
  });
  if (status !== "canceled") await ensureOwnerSeat(team.id, team.ownerStudentId);
  return team.id;
}

/** invoice.payment_failed: start the grace window (once). */
export async function markTeamPaymentFailed(subscriptionId: string): Promise<boolean> {
  await ensureTeamTables();
  const team = await prisma.team.findUnique({ where: { stripeSubscriptionId: subscriptionId } });
  if (!team || team.comped) return false;
  if (team.status === "past_due" && team.graceUntil) return true;
  await prisma.team.update({
    where: { id: team.id },
    data: { status: "past_due", graceUntil: new Date(Date.now() + TEAM_GRACE_DAYS * 86_400_000) },
  });
  return true;
}

export function isTeamSubscription(meta: Record<string, string> | null | undefined): boolean {
  return meta?.product === TEAM_PRODUCT;
}

// ── Invitations ───────────────────────────────────────────────────────────

export type InviteOutcome =
  | { email: string; ok: true; memberId: string; token: string }
  | { email: string; ok: false; reason: "member" | "invited" | "full" };

/**
 * Invites each address, in order, while seats remain. An address that was
 * removed earlier is invited again on the same row. Returns the token for
 * each new invitation so the caller can email it (only its hash is stored).
 */
export async function inviteMembers(team: TeamRow, inviterId: string, emails: string[]): Promise<InviteOutcome[]> {
  await ensureTeamTables();
  // One transaction holding the team's row lock: without it, parallel invite
  // requests each read the same "seats used" and together hand out more
  // seats than the team pays for. The seat count is re-read under the lock.
  return prisma.$transaction(
    async (tx) => {
      const seats = await lockTeamSeats(tx, team.id);
      const out: InviteOutcome[] = [];
      let used = await seatsUsedTx(tx, team.id);
      const existing = await tx.teamMember.findMany({ where: { teamId: team.id, email: { in: emails } } });
      for (const email of emails) {
        const row = existing.find((r) => r.email === email);
        if (row?.status === "active") { out.push({ email, ok: false, reason: "member" }); continue; }
        const live = row?.status === "invited" && row.inviteExpiresAt && row.inviteExpiresAt > new Date();
        if (live) { out.push({ email, ok: false, reason: "invited" }); continue; }
        if (seats == null || used >= seats) { out.push({ email, ok: false, reason: "full" }); continue; }
        const token = newToken();
        const data = {
          status: "invited",
          role: "member",
          studentId: null,
          inviteTokenHash: hashToken(token),
          inviteExpiresAt: inviteExpiry(),
          invitedById: inviterId,
          invitedAt: new Date(),
          joinedAt: null,
          removedAt: null,
        };
        const m = row
          ? await tx.teamMember.update({ where: { id: row.id }, data })
          : await tx.teamMember.create({ data: { teamId: team.id, email, ...data } });
        used++;
        out.push({ email, ok: true, memberId: m.id, token });
      }
      return out;
    },
    { timeout: 30_000 },
  );
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Locks the team row for the rest of the transaction; returns its seat count (null if gone). */
async function lockTeamSeats(tx: Tx, teamId: string): Promise<number | null> {
  const rows = await tx.$queryRaw<Array<{ seats: number }>>`SELECT "seats" FROM "Team" WHERE "id" = ${teamId} FOR UPDATE`;
  return rows[0] ? Number(rows[0].seats) : null;
}

function seatsUsedTx(tx: Tx, teamId: string): Promise<number> {
  return tx.teamMember.count({
    where: {
      teamId,
      OR: [{ status: "active" }, { status: "invited", inviteExpiresAt: { gt: new Date() } }],
    },
  });
}

/** New link and expiry for a pending invitation (the old link stops working). */
export async function resendInvite(teamId: string, memberId: string): Promise<{ email: string; token: string } | "notFound" | "full"> {
  await ensureTeamTables();
  // Same team row lock as inviteMembers, so a renewal cannot race an invite
  // for the last seat.
  return prisma.$transaction(async (tx) => {
    const seats = await lockTeamSeats(tx, teamId);
    const m = await tx.teamMember.findFirst({ where: { id: memberId, teamId, status: "invited" } });
    if (!m || seats == null) return "notFound" as const;
    const expired = !m.inviteExpiresAt || m.inviteExpiresAt <= new Date();
    // An expired invitation no longer holds a seat; renewing it takes one.
    if (expired && (await seatsUsedTx(tx, teamId)) >= seats) return "full" as const;
    const token = newToken();
    await tx.teamMember.update({
      where: { id: m.id },
      data: { inviteTokenHash: hashToken(token), inviteExpiresAt: inviteExpiry(), invitedAt: new Date() },
    });
    return { email: m.email, token };
  });
}

/** Revoke an invitation or remove a member. The seat is freed; the owner cannot be removed. */
export async function removeMember(teamId: string, memberId: string): Promise<"ok" | "notFound" | "owner"> {
  await ensureTeamTables();
  const m = await prisma.teamMember.findFirst({ where: { id: memberId, teamId, status: { not: "removed" } } });
  if (!m) return "notFound";
  if (m.role === "owner") return "owner";
  await prisma.teamMember.update({
    where: { id: m.id },
    data: { status: "removed", removedAt: new Date(), inviteTokenHash: null, inviteExpiresAt: null, role: "member" },
  });
  if (m.studentId) await prisma.teamAssignment.deleteMany({ where: { teamId, studentId: m.studentId } });
  return "ok";
}

export async function setMemberRole(teamId: string, memberId: string, role: "manager" | "member"): Promise<"ok" | "notFound" | "owner"> {
  await ensureTeamTables();
  const m = await prisma.teamMember.findFirst({ where: { id: memberId, teamId, status: "active" } });
  if (!m) return "notFound";
  if (m.role === "owner") return "owner";
  await prisma.teamMember.update({ where: { id: m.id }, data: { role } });
  return "ok";
}

export interface InvitePreview {
  memberId: string;
  teamId: string;
  teamName: string;
  email: string;
  inviterName: string | null;
  expired: boolean;
  teamActive: boolean;
}

/** What an invitation link points to, or null for an unknown or used link. */
export async function previewInvite(token: string): Promise<InvitePreview | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  await ensureTeamTables();
  const m = await prisma.teamMember.findUnique({ where: { inviteTokenHash: hashToken(token) } });
  if (!m || m.status !== "invited") return null;
  const [team, inviter] = await Promise.all([
    prisma.team.findUnique({ where: { id: m.teamId } }),
    m.invitedById ? prisma.student.findUnique({ where: { id: m.invitedById }, select: { name: true } }) : null,
  ]);
  if (!team) return null;
  return {
    memberId: m.id,
    teamId: team.id,
    teamName: team.name,
    email: m.email,
    inviterName: inviter?.name ?? null,
    expired: !m.inviteExpiresAt || m.inviteExpiresAt <= new Date(),
    teamActive: teamEntitled(team),
  };
}

export type AcceptResult = "ok" | "invalid" | "expired" | "wrongEmail" | "otherTeam" | "inactive";

/**
 * Accepts an invitation. The signed-in account's email must be the invited
 * one, the link is single use (its hash is cleared) and a learner holds one
 * active seat at a time.
 */
export async function acceptInvite(token: string, student: { id: string; email: string }): Promise<AcceptResult> {
  const inv = await previewInvite(token);
  if (!inv) return "invalid";
  if (inv.expired) return "expired";
  if (!inv.teamActive) return "inactive";
  if (inv.email.toLowerCase() !== student.email.toLowerCase()) return "wrongEmail";
  const current = await getMembership(student.id);
  if (current && current.team.id !== inv.teamId && current.entitled) return "otherTeam";
  // Conditional update: two clicks on the same link accept it once.
  const n = await prisma.teamMember.updateMany({
    where: { id: inv.memberId, status: "invited", inviteTokenHash: hashToken(token) },
    data: { status: "active", studentId: student.id, joinedAt: new Date(), inviteTokenHash: null, inviteExpiresAt: null },
  });
  return n.count === 1 ? "ok" : "invalid";
}

/** A member leaves: the seat is freed. Purchases and their own subscription are untouched. */
export async function leaveTeam(m: TeamMembership): Promise<"ok" | "owner"> {
  if (m.role === "owner") return "owner";
  await prisma.teamMember.update({
    where: { id: m.memberId },
    data: { status: "removed", removedAt: new Date(), role: "member" },
  });
  await prisma.teamAssignment.deleteMany({ where: { teamId: m.team.id, studentId: (await memberStudentId(m.memberId)) ?? "" } });
  return "ok";
}

async function memberStudentId(memberId: string): Promise<string | null> {
  const r = await prisma.teamMember.findUnique({ where: { id: memberId }, select: { studentId: true } });
  return r?.studentId ?? null;
}

// ── Assignments ───────────────────────────────────────────────────────────

/** Assigns a track to active members of this team (others are ignored). Re-assigning updates the due date. */
export async function assignTrack(
  teamId: string,
  assignerId: string,
  studentIds: string[],
  trackId: string,
  dueAt: Date | null,
): Promise<number> {
  await ensureTeamTables();
  const members = await prisma.teamMember.findMany({
    where: { teamId, status: "active", studentId: { in: studentIds } },
    select: { studentId: true },
  });
  let n = 0;
  for (const m of members) {
    if (!m.studentId) continue;
    await prisma.teamAssignment.upsert({
      where: { teamId_studentId_trackId: { teamId, studentId: m.studentId, trackId } },
      create: { teamId, studentId: m.studentId, trackId, dueAt, assignedById: assignerId },
      update: { dueAt, assignedById: assignerId, lastRemindedAt: null },
    });
    n++;
  }
  return n;
}

export async function unassignTrack(teamId: string, assignmentId: string): Promise<boolean> {
  await ensureTeamTables();
  const r = await prisma.teamAssignment.deleteMany({ where: { id: assignmentId, teamId } });
  return r.count > 0;
}

export interface MyAssignment {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  dueAt: Date | null;
  percent: number;
  overdue: boolean;
}

/** The learner's assignments from their current team, with progress. */
export async function myAssignments(studentId: string): Promise<{ teamName: string; items: MyAssignment[] } | null> {
  const m = await getMembership(studentId);
  if (!m?.entitled) return null;
  const rows = await prisma.teamAssignment.findMany({
    where: { teamId: m.team.id, studentId },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
  if (rows.length === 0) return { teamName: m.team.name, items: [] };
  const { trackPercents } = await import("./report");
  const pct = await trackPercents([studentId]);
  const tracks = await prisma.learnTrack.findMany({
    where: { id: { in: rows.map((r) => r.trackId) } },
    select: { id: true, slug: true, title: true },
  });
  const now = new Date();
  return {
    teamName: m.team.name,
    items: rows
      .map((r) => {
        const t = tracks.find((x) => x.id === r.trackId);
        if (!t) return null;
        const percent = pct.get(studentId)?.get(r.trackId) ?? 0;
        return { id: r.id, trackId: r.trackId, slug: t.slug, title: t.title, dueAt: r.dueAt, percent, overdue: !!r.dueAt && r.dueAt < now && percent < 100 };
      })
      .filter((x): x is MyAssignment => x !== null),
  };
}

export { isManagerRole, type TeamRole };
