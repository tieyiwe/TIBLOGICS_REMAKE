import { NextRequest, NextResponse } from "next/server";
import payments from "@/lib/payments";
import { getT } from "@/lib/i18n/server";
import { requireTeamOwner, teamRateLimit } from "@/lib/learn/team/guard";

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

/** Stripe customer portal for the team's subscription (seats, card, invoices, cancel). Owner only. */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "portal", 10);
  if (limited) return limited;
  const t = await getT();
  const g = await requireTeamOwner();
  if (g.error) return g.error;
  if (!g.m.team.stripeCustomerId) return NextResponse.json({ error: t("team.api.noBilling") }, { status: 404 });
  try {
    const { url } = await payments.createBillingPortal(g.m.team.stripeCustomerId, `${SITE}/learn/team`);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[POST /api/learn/team/billing-portal]", err);
    return NextResponse.json({ error: t("team.api.portalFailed") }, { status: 500 });
  }
}
