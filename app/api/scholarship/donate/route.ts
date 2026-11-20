import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, getT } from "@/lib/i18n/server";
import { createDonationCheckout, DONATE_FROM, DONATION_MAX_CENTS, DONATION_MIN_CENTS } from "@/lib/learn/scholarship/donations";

// The donate box: starts a Stripe Checkout for a one-time or monthly gift to
// the Tilo Vision Scholarship fund. No sign-in. The amount is checked here
// (whole cents, within the limits); Stripe collects the payment details.
const Body = z.object({
  amountCents: z.number().int().min(DONATION_MIN_CENTS).max(DONATION_MAX_CENTS),
  frequency: z.enum(["once", "monthly"]),
  from: z.enum(Object.keys(DONATE_FROM) as [keyof typeof DONATE_FROM, ...Array<keyof typeof DONATE_FROM>]).default("scholarship"),
});

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`scholarship-donate:${ip}`, 10, 60_000))) {
    return NextResponse.json({ error: t("donate.error.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("donate.error.amount") }, { status: 400 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: t("donate.error.generic") }, { status: 503 });
  try {
    const url = await createDonationCheckout({ ...parsed.data, locale: await getLocale() }, req.headers);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[POST /api/scholarship/donate]", err);
    return NextResponse.json({ error: t("donate.error.generic") }, { status: 502 });
  }
}
