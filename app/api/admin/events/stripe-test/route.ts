import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import stripe from "@/lib/stripe";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const priceId = process.env.STRIPE_EVENT_PRICE_ID;
  const keyPrefix = process.env.STRIPE_SECRET_KEY?.slice(0, 12) + "...";

  if (!priceId) return NextResponse.json({ error: "STRIPE_EVENT_PRICE_ID not set" });

  try {
    const price = await (stripe as any).prices.retrieve(priceId);
    return NextResponse.json({
      ok: true,
      keyPrefix,
      priceId,
      priceAmount: price.unit_amount,
      priceCurrency: price.currency,
      priceLiveMode: price.livemode,
      priceActive: price.active,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, keyPrefix, priceId, error: message });
  }
}
