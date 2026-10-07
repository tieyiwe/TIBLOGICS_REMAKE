import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import payments from "@/lib/payments";
import prisma from "@/lib/prisma";
import { canAccessTrack, getAccess, requireStudent } from "@/lib/learn/session";
import { trackMonthlyCents } from "@/lib/learn/track-monthly";
import { checkRateLimit } from "@/lib/require-admin";
import { getT } from "@/lib/i18n/server";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { TRACK_CURRENCY, trackPriceCents } from "@/lib/learn/pricing";
import { PLANS } from "@/lib/payments/provider";
import { recordAttribution } from "@/lib/growth/attribution";
import { referralCouponFor } from "@/lib/learn/referrals/service";
import { resolveCheckoutDiscount } from "@/lib/promotions/service";
import { promoCheckoutError } from "@/lib/promotions/http";
import { joinPath } from "@/lib/learn/join/choice";

// Slugs become part of a redirect URL; an unvalidated value here would be an
// open-redirect vector, so they are constrained to a slug shape.
const Slug = z.string().trim().regex(/^[a-z0-9-]{1,64}$/, "Invalid track");

// Two products:
//   { plan: "monthly", track? }  all tracks, monthly subscription
//                                (track = where checkout returns them)
//   { trackSlug }                one track, one payment, lifetime access
// The annual plan is no longer sold.
// promoCode: a code typed in our field (lib/promotions). Checked again here;
// an invalid one is refused with a 400 rather than silently dropped.
const PromoCode = z.string().trim().max(40).optional();
// from: "join" = the one-page join flow (/learning-box/join): a cancelled
// payment goes back there with the choice preselected. An enum, never a URL.
const From = z.enum(["join"]).optional();
const Body = z.union([
  z.object({ trackSlug: Slug, promoCode: PromoCode, from: From }),
  z.object({ plan: z.literal("monthly"), track: Slug.optional(), promoCode: PromoCode, from: From }),
]);

// Stripe's success_url: the confirm route reads the session back, opens the
// access at once (the webhook does the same; both idempotent) and lands the
// learner in their track or dashboard with the "You're in" welcome.
const CONFIRM = "/api/learn/checkout/confirm?session_id={CHECKOUT_SESSION_ID}";

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
      // One discount: a typed code, else an automatic sale, else the
      // referral welcome coupon (claimed only when it is the one used).
      const discount = await resolveCheckoutDiscount({
        lines: [{ key: "tracks", id: track.id, amountCents: amount }],
        recurring: false,
        code: parsed.data.promoCode,
        buyer: { studentId: student.id, email: student.email },
        referral: () => referralCouponFor(student.id),
      });
      const { url } = await payments.createTrackCheckout({
        studentId: student.id,
        email: student.email,
        couponId: discount.couponId,
        allowPromotionCodes: discount.allowPromotionCodes,
        promoMetadata: discount.metadata,
        trackId: track.id,
        trackTitle: track.title,
        amount,
        currency: TRACK_CURRENCY,
        successUrl: `${SITE}${CONFIRM}`,
        cancelUrl:
          parsed.data.from === "join"
            ? `${SITE}${joinPath({ kind: "track", slug: track.slug })}&checkout=cancelled`
            : `${SITE}/learn/subscribe?track=${track.slug}&checkout=cancelled`,
      });
      // Growth attribution; paid status is resolved from TrackPurchase at report time.
      await recordAttribution({ kind: "track_checkout", refId: `${student.id}:${track.id}`, cookieHeader: req.headers.get("cookie"), amountCents: amount - discount.discountCents });
      return NextResponse.json({ url });
    }

    // ── One track on its own monthly plan (lib/learn/track-monthly.ts) ──
    // A monthly choice made from such a track buys that track's plan.
    const ownMonthly = trackMonthlyCents(parsed.data.track);
    if (ownMonthly != null && parsed.data.track) {
      const slug = parsed.data.track;
      const track = await prisma.learnTrack.findUnique({ where: { slug }, select: { id: true, slug: true, title: true, status: true } });
      if (!track || track.status !== "live") {
        return NextResponse.json({ error: t("learn.api.trackNotForSale") }, { status: 404 });
      }
      const access = await getAccess(student.id);
      if (canAccessTrack(access, track.id)) {
        return NextResponse.json({ error: t("learn.api.alreadyOwned") }, { status: 409 });
      }
      const discount = await resolveCheckoutDiscount({
        lines: [{ key: "tracks", id: track.id, amountCents: ownMonthly }],
        recurring: true,
        code: parsed.data.promoCode,
        buyer: { studentId: student.id, email: student.email },
        referral: () => referralCouponFor(student.id),
      });
      const { url } = await payments.createTrackMonthlyCheckout({
        studentId: student.id,
        email: student.email,
        couponId: discount.couponId,
        allowPromotionCodes: discount.allowPromotionCodes,
        promoMetadata: discount.metadata,
        trackId: track.id,
        trackSlug: track.slug,
        trackTitle: track.title,
        amount: ownMonthly,
        currency: TRACK_CURRENCY,
        successUrl: `${SITE}${CONFIRM}`,
        cancelUrl:
          parsed.data.from === "join"
            ? `${SITE}${joinPath({ kind: "monthly", track: track.slug })}&checkout=cancelled`
            : `${SITE}/learn/subscribe?track=${track.slug}&checkout=cancelled`,
      });
      await recordAttribution({ kind: "learn_subscription_checkout", refId: student.id, cookieHeader: req.headers.get("cookie"), amountCents: ownMonthly - discount.discountCents });
      return NextResponse.json({ url });
    }

    // ── All tracks, monthly ─────────────────────────────────────────────
    const discount = await resolveCheckoutDiscount({
      lines: [{ key: "arfa_monthly", id: "monthly", amountCents: PLANS.monthly.amount }],
      recurring: true,
      code: parsed.data.promoCode,
      buyer: { studentId: student.id, email: student.email },
      referral: () => referralCouponFor(student.id),
    });
    const { url } = await payments.createCheckout({
      plan: "monthly",
      studentId: student.id,
      email: student.email,
      couponId: discount.couponId,
      allowPromotionCodes: discount.allowPromotionCodes,
      promoMetadata: discount.metadata,
      returnTrack: parsed.data.track ?? null,
      successUrl: `${SITE}${CONFIRM}`,
      cancelUrl:
        parsed.data.from === "join"
          ? `${SITE}${joinPath({ kind: "monthly", track: parsed.data.track ?? null })}&checkout=cancelled`
          : `${SITE}/learning-box?checkout=cancelled`,
    });
    await recordAttribution({ kind: "learn_subscription_checkout", refId: student.id, cookieHeader: req.headers.get("cookie"), amountCents: PLANS.monthly.amount - discount.discountCents });
    return NextResponse.json({ url });
  } catch (err) {
    const promoErr = promoCheckoutError(t, err);
    if (promoErr) return promoErr;
    // Any signed-up learner can reach this, and a Stripe error names our price
    // ids and key mode. Log the detail, hand back a fixed message.
    console.error("[POST /api/learn/checkout]", err);
    return NextResponse.json(
      { error: t("learn.api.checkoutFailed") },
      { status: 500 },
    );
  }
}
