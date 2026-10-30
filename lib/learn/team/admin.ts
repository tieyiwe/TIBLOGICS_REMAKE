import prisma from "@/lib/prisma";
import payments from "@/lib/payments";
import { ensureTeamTables } from "./db";
import { getTeamPricing, seatPrice } from "./settings";
import { seatsUsed } from "./service";
import { TEAM_CURRENCY, TEAM_MAX_SEATS } from "./config";

// Staff-side team tools (Admin > Learn > Teams) and team revenue.

/**
 * Monthly recurring revenue from paying teams: seats x per-seat price, for
 * active teams that are not comped. An estimate in the same sense as the
 * individual Learn MRR (Stripe discounts are not mirrored here).
 */
export async function teamMrr(): Promise<{ cents: number; teams: number; seats: number }> {
  try {
    await ensureTeamTables();
    const [teams, pricing] = await Promise.all([
      prisma.team.findMany({ where: { status: "active", comped: false }, select: { seats: true, seatPriceCents: true } }),
      getTeamPricing(),
    ]);
    return {
      cents: teams.reduce((n, t) => n + t.seats * seatPrice(t, pricing), 0),
      teams: teams.length,
      seats: teams.reduce((n, t) => n + t.seats, 0),
    };
  } catch (err) {
    console.error("[learn/team] mrr", err);
    return { cents: 0, teams: 0, seats: 0 };
  }
}

export async function listTeamsForAdmin() {
  await ensureTeamTables();
  const [teams, pricing] = await Promise.all([prisma.team.findMany({ orderBy: { createdAt: "desc" }, take: 500 }), getTeamPricing()]);
  const owners = await prisma.student.findMany({ where: { id: { in: teams.map((t) => t.ownerStudentId) } }, select: { id: true, email: true, name: true } });
  const counts = await prisma.teamMember.groupBy({
    by: ["teamId", "status"],
    where: { teamId: { in: teams.map((t) => t.id) } },
    _count: { _all: true },
  });
  return teams.map((t) => {
    const price = seatPrice(t, pricing);
    const active = counts.find((c) => c.teamId === t.id && c.status === "active")?._count._all ?? 0;
    const invited = counts.find((c) => c.teamId === t.id && c.status === "invited")?._count._all ?? 0;
    return {
      ...t,
      owner: owners.find((o) => o.id === t.ownerStudentId) ?? null,
      seatPrice: price,
      mrrCents: t.status === "active" && !t.comped ? t.seats * price : 0,
      activeMembers: active,
      invited,
    };
  });
}

export async function adminTeamDetail(id: string) {
  await ensureTeamTables();
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return null;
  const [members, pricing, used] = await Promise.all([
    prisma.teamMember.findMany({ where: { teamId: id }, orderBy: [{ status: "asc" }, { invitedAt: "asc" }] }),
    getTeamPricing(),
    seatsUsed(id),
  ]);
  const students = await prisma.student.findMany({
    where: { id: { in: [team.ownerStudentId, ...members.map((m) => m.studentId).filter((x): x is string => !!x)] } },
    select: { id: true, name: true, email: true },
  });
  return { team, members, students, pricing, used, seatPrice: seatPrice(team, pricing) };
}

/** Free seats for a partner or pilot: a new comped team owned by an existing learner account. */
export async function createCompedTeam(p: { name: string; ownerEmail: string; seats: number }): Promise<{ id: string } | { error: string }> {
  await ensureTeamTables();
  const owner = await prisma.student.findUnique({ where: { email: p.ownerEmail.toLowerCase() }, select: { id: true, email: true } });
  if (!owner) return { error: "No learner account with that email. Ask them to sign up at /learn/signup first." };
  const team = await prisma.team.create({
    data: { name: p.name, ownerStudentId: owner.id, seats: Math.min(TEAM_MAX_SEATS, p.seats), status: "comped", comped: true },
  });
  await prisma.teamMember.upsert({
    where: { teamId_email: { teamId: team.id, email: owner.email.toLowerCase() } },
    create: { teamId: team.id, email: owner.email.toLowerCase(), studentId: owner.id, role: "owner", status: "active", joinedAt: new Date() },
    update: {},
  });
  return { id: team.id };
}

/**
 * Staff edits: comp on/off, seats (comped teams), per-seat price. A new price
 * on a Stripe-billed team is pushed to its subscription from the next renewal.
 */
export async function updateTeamAdmin(
  id: string,
  p: { comped?: boolean; seats?: number; seatPriceCents?: number | null; name?: string },
): Promise<{ ok: true; stripe?: string } | { error: string }> {
  await ensureTeamTables();
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return { error: "Not found" };
  const data: Record<string, unknown> = {};
  if (p.name) data.name = p.name;
  if (p.comped === true) {
    data.comped = true;
    data.status = "comped";
    data.graceUntil = null;
  } else if (p.comped === false && team.comped) {
    data.comped = false;
    // Back to Stripe's word, or inactive if there is no subscription.
    data.status = team.stripeSubscriptionId ? "active" : "canceled";
  }
  if (p.seats != null) {
    if (!(team.comped || p.comped) && team.stripeSubscriptionId) return { error: "Seats on a paying team follow its Stripe subscription. Ask the owner, or comp the team first." };
    const used = await seatsUsed(id);
    if (p.seats < used) return { error: `${used} seats are in use (members and open invitations).` };
    data.seats = p.seats;
  }
  let stripe: string | undefined;
  if (p.seatPriceCents !== undefined) {
    data.seatPriceCents = p.seatPriceCents;
    if (team.stripeSubscriptionId && !team.comped && p.seatPriceCents != null) {
      if (process.env.STRIPE_LEARN_TEAM_PRICE_ID) {
        stripe = "STRIPE_LEARN_TEAM_PRICE_ID is set, so Stripe keeps billing that Price. Change it in Stripe for this subscription.";
      } else {
        try {
          await payments.updateTeamSeatPrice(team.stripeSubscriptionId, p.seatPriceCents, TEAM_CURRENCY);
          stripe = "Stripe subscription updated; the new price applies from the next renewal.";
        } catch (err) {
          console.error("[learn/team] seat price", err);
          return { error: "Stripe refused the price change. Nothing was saved." };
        }
      }
    }
  }
  await prisma.team.update({ where: { id }, data });
  return { ok: true, stripe };
}

export { getTeamPricing };
