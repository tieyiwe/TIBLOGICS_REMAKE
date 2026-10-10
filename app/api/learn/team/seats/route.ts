import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import payments from "@/lib/payments";
import { getT } from "@/lib/i18n/server";
import { requireTeamOwner, teamRateLimit } from "@/lib/learn/team/guard";
import { seatsUsed } from "@/lib/learn/team/service";
import { getTeamPricing } from "@/lib/learn/team/settings";
import { TEAM_CURRENCY, TEAM_MAX_SEATS, seatPriceFor } from "@/lib/learn/team/config";

const Body = z.object({ seats: z.number().int().min(1).max(TEAM_MAX_SEATS) });

/**
 * Owner changes the seat count. Updates the Stripe subscription quantity
 * (Stripe's default proration); the webhook confirms it. Never below the
 * minimum or below the seats in use.
 */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "seats", 10);
  if (limited) return limited;
  const t = await getT();
  const g = await requireTeamOwner();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("team.api.invalidSeats") }, { status: 400 });
  const team = g.m.team;
  if (team.comped || !team.stripeSubscriptionId) return NextResponse.json({ error: t("team.api.seatsByStaff") }, { status: 400 });
  if (!g.m.entitled) return NextResponse.json({ error: t("team.api.inactive") }, { status: 402 });
  const [pricing, used] = await Promise.all([getTeamPricing(), seatsUsed(team.id)]);
  const seats = parsed.data.seats;
  if (seats < pricing.minSeats) return NextResponse.json({ error: t("team.api.minSeats", { n: pricing.minSeats }) }, { status: 400 });
  if (seats < used) return NextResponse.json({ error: t("team.api.belowUsed", { n: used }) }, { status: 409 });
  // A volume band's price is locked on the team at checkout. Buying 50 seats
  // at the 50-seat price and then dropping to 5 must not keep that price:
  // when the locked price is a band the new count no longer reaches, the
  // seat price moves to the price for the new size (never down).
  const locked = team.seatPriceCents;
  const band = locked != null ? pricing.tiers.find((x) => x.seatPriceCents === locked) : undefined;
  const sizePrice = seatPriceFor(pricing, seats);
  const reprice = band && locked != null && seats < band.minSeats && sizePrice > locked ? sizePrice : null;
  try {
    await payments.updateTeamSeats(team.stripeSubscriptionId, seats);
    if (reprice != null) await payments.updateTeamSeatPrice(team.stripeSubscriptionId, reprice, TEAM_CURRENCY);
    await prisma.team.update({ where: { id: team.id }, data: { seats, ...(reprice != null ? { seatPriceCents: reprice } : {}) } });
    return NextResponse.json({ ok: true, seats });
  } catch (err) {
    console.error("[POST /api/learn/team/seats]", err);
    return NextResponse.json({ error: t("team.api.seatsFailed") }, { status: 500 });
  }
}
