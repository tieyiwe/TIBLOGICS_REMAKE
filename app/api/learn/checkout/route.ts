import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import payments from "@/lib/payments";
import prisma from "@/lib/prisma";
import { getAccess, requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { getT } from "@/lib/i18n/server";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { TRACK_CURRENCY, trackPriceCents } from "@/lib/learn/pricing";
import { PLANS } from "@/lib/payments/provider";
import { recordAttribution } from "@/lib/growth/attribution";
import { referralCouponFor } from "@/lib/learn/referrals/service";

// Slugs become part of a redirect URL; an unvalidated value here would be an
// open-redirect vector, so they are constrained to a slug shape.
const Slug = z.string().trim().regex(/^[a-z0-9-]{1,64}$/, "Invalid track");

// Two products:
//   { plan: "monthly", track? }  all tracks, monthly subscription
//                                (track = where checkout returns them)
//   { trackSlug }                one track, one payment, lifetime access
// The annual plan is no longer sold.
const Body = z.union([
  z.object({ trackSlug: Slug }),
  z.object({ plan: z.literal("monthly"), track: Slug.optional() }),
]);

const SITE = (
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com"
).replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`learn-checkout:${ip}`, 10, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }

  const { error, student } = await requireStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidPlan") }, { status: 400 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: t("learn.api.paymentsOff") }, { status: 503 });
  }

  try {
    // ── One track, one payment ──────────────────────────────────────────
    if ("trackSlug" in parsed.data) {
      const slug = parsed.data.trackSlug;
      await ensureLearnEditColumns().catch(() => {});
      const track = await prisma.learnTrack.findUnique({
        where: { slug },
        select: { id: true, slug: true, title: true, level: true, status: true, priceCents: true },
      });
      if (!track || track.status !== "live") {
        return NextResponse.json({ error: t("learn.api.trackNotForSale") }, { status: 404 });
      }
      const access = await getAccess(student.id);
      if (access.purchased.includes(track.id)) {
        return NextResponse.json({ error: t("learn.api.alreadyOwned") }, { status: 409 });
      }
      // Price from the server only.
      const amount = trackPriceCents(track.level, track.priceCents);
      const { url } = await payments.createTrackCheckout({
        studentId: student.id,
        email: student.email,
        // Referred learners get the welcome coupon when STRIPE_REFERRAL_COUPON_ID is set.
        couponId: await referralCouponFor(student.id),
        trackId: track.id,
        trackTitle: track.title,
        amount,
        currency: TRACK_CURRENCY,
        successUrl: `${SITE}/learn/track/${track.slug}?welcome=1`,
        cancelUrl: `${SITE}/learn/subscribe?track=${track.slug}&checkout=cancelled`,
      });
      // Growth attribution; paid status is resolved from TrackPurchase at report time.
      await recordAttribution({ kind: "track_checkout", refId: `${student.id}:${track.id}`, cookieHeader: req.headers.get("cookie"), amountCents: amount });
      return NextResponse.json({ url });
    }

    // ── All tracks, monthly ─────────────────────────────────────────────
    const { url } = await payments.createCheckout({
      plan: "monthly",
      studentId: student.id,
      email: student.email,
      couponId: await referralCouponFor(student.id),
      successUrl: parsed.data.track
        ? `${SITE}/learn/track/${parsed.data.track}?welcome=1`
        : `${SITE}/learn?welcome=1`,
      cancelUrl: `${SITE}/learning-box?checkout=cancelled`,
    });
    await recordAttribution({ kind: "learn_subscription_checkout", refId: student.id, cookieHeader: req.headers.get("cookie"), amountCents: PLANS.monthly.amount });
    return NextResponse.json({ url });
  } catch (err) {
    // Any signed-up learner can reach this, and a Stripe error names our price
    // ids and key mode. Log the detail, hand back a fixed message.
    console.error("[POST /api/learn/checkout]", err);
    return NextResponse.json(
      { error: t("learn.api.checkoutFailed") },
      { status: 500 },
    );
  }
}
