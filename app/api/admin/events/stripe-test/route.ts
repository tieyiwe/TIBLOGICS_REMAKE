import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  // Staff only. A bare session check passed here for TIBLOGICS Learn students
  // too, since learners share this NextAuth instance — requireAdmin rejects them.
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const priceId = process.env.STRIPE_EVENT_PRICE_ID;
  // The old `keyPrefix` echoed the first 12 characters of STRIPE_SECRET_KEY.
  // "live vs test" is the only thing this diagnostic actually needed, and
  // that's what `priceLiveMode` already reports — so report the mode, never
  // any part of the key itself.
  const keyMode = process.env.STRIPE_SECRET_KEY
    ? process.env.STRIPE_SECRET_KEY.startsWith("sk_live") ? "live" : "test"
    : "not set";

  if (!priceId) return NextResponse.json({ error: "STRIPE_EVENT_PRICE_ID not set" });

  try {
    const price = await (stripe as any).prices.retrieve(priceId);
    return NextResponse.json({
      ok: true,
      keyMode,
      priceId,
      priceAmount: price.unit_amount,
      priceCurrency: price.currency,
      priceLiveMode: price.livemode,
      priceActive: price.active,
    });
  } catch (err) {
    // Stripe errors can quote request payloads back — log them, don't return them.
    console.error("[admin/events/stripe-test]", err);
    return NextResponse.json({ ok: false, keyMode, priceId, error: "Could not retrieve that price from Stripe." });
  }
}
