import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import payments from "@/lib/payments";
import prisma from "@/lib/prisma";
import { requireStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { teamRateLimit } from "@/lib/learn/team/guard";
import { getTeamPricing, quoteNewTeam } from "@/lib/learn/team/settings";
import { createPendingTeam, ownedLiveTeam } from "@/lib/learn/team/service";
import { TEAM_CURRENCY, TEAM_MAX_SEATS } from "@/lib/learn/team/config";

// Team plan checkout: { seats, name } -> Stripe Checkout (subscription,
// quantity = seats). The seat price comes from the server only, through
// quoteNewTeam() (base price or volume band), and is locked on the team.
const Body = z.object({
  seats: z.number().int().min(1).max(TEAM_MAX_SEATS),
  name: z.string().trim().min(2).max(80),
});

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "checkout", 10);
  if (limited) return limited;
  const t = await getT();
  const { error, student } = await requireStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json({ error: t(field === "name" ? "team.api.nameRequired" : "team.api.invalidSeats") }, { status: 400 });
  }
  const pricing = await getTeamPricing();
  if (parsed.data.seats < pricing.minSeats) {
    return NextResponse.json({ error: t("team.api.minSeats", { n: pricing.minSeats }) }, { status: 400 });
  }
  const quote = quoteNewTeam(pricing, parsed.data.seats);
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: t("team.api.paymentsOff") }, { status: 503 });

  try {
    if (await ownedLiveTeam(student.id)) {
      return NextResponse.json({ error: t("team.api.alreadyOwner") }, { status: 409 });
    }
    const team = await createPendingTeam({ ownerStudentId: student.id, name: parsed.data.name, seats: parsed.data.seats });
    const { url, sessionId } = await payments.createTeamCheckout({
      teamId: team.id,
      teamName: team.name,
      ownerStudentId: student.id,
      email: student.email,
      seats: parsed.data.seats,
      seatPriceCents: quote.seatPriceCents,
      currency: TEAM_CURRENCY,
      // The confirm route activates the team at once (the webhook does the
      // same, idempotently), so the owner never lands on a locked page.
      successUrl: `${SITE}/api/learn/team/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${SITE}/learn/subscribe?team=1&checkout=cancelled#teams`,
    });
    await prisma.team.update({ where: { id: team.id }, data: { stripeCheckoutSessionId: sessionId, seatPriceCents: quote.seatPriceCents } });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[POST /api/learn/team/checkout]", err);
    return NextResponse.json({ error: t("team.api.checkoutFailed") }, { status: 500 });
  }
}
