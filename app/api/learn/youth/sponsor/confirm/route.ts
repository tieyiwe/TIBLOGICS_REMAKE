import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { alertCheckoutSale } from "@/lib/payments/sale-alert";
import { SPONSOR_PRODUCT, fulfillSponsorship } from "@/lib/learn/youth-sponsor";

// Stripe's success_url for a sponsored place: reads the session back from
// Stripe (trusting only its id, which is unguessable), opens the place and
// sends the emails (idempotent with the webhook), then shows the thank-you
// page. No sponsorship id or personal data in the URL.
const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("session_id") ?? "";
  const go = (q: string) => NextResponse.redirect(`${SITE}/sponsor-youth/thanks${q}`);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  // Only a confirmed payment shows the thank-you; anything else says so.
  if (!(await checkRateLimit(`youth-sponsor-confirm:${ip}`, 30, 60_000))) return go("?unknown=1");
  if (!/^cs_[A-Za-z0-9_]{6,200}$/.test(id)) return go("?unknown=1");
  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    if (session.metadata?.product !== SPONSOR_PRODUCT) return go("?unknown=1");
    const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    if (!paid) return go(session.status === "complete" ? "?pending=1" : "?unknown=1");
    const row = await fulfillSponsorship(session, (subId) => stripe.subscriptions.retrieve(subId));
    await alertCheckoutSale(session);
    if (!row) return go("?unknown=1");
    return go(row.status === "awaiting_consent" ? "?waiting=1" : "");
  } catch (err) {
    console.error("[GET /api/learn/youth/sponsor/confirm]", err instanceof Error ? err.message : "error");
    return go("?unknown=1");
  }
}
