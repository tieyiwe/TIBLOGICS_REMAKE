import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { recordTrackPurchase } from "@/lib/learn/purchases";
import { upsertLearnSubscription } from "@/lib/learn/subscription-sync";
import { TRACK_MONTHLY_PRODUCT } from "@/lib/learn/track-monthly";
import { upsertTrackSubscription } from "@/lib/learn/track-subscriptions";
import { completePendingEnrollment } from "@/lib/learn/join/pending";
import { isSlug } from "@/lib/learn/join/choice";
import { recordScholarshipPayment } from "@/lib/learn/scholarship/service";

// Stripe Checkout's success_url for one track and for the monthly plan
// (app/api/learn/checkout). Reads the session back from Stripe (trusting
// nothing in the query string beyond its id), checks it belongs to the
// signed-in learner and is paid, opens the access, then lands them in what
// they bought with the "You're in" welcome (?welcome=1). The webhook does the
// same; both are idempotent, in either order. Anything unexpected still
// lands somewhere sensible: access then arrives with the webhook.
const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("session_id") ?? "";
  const go = (path: string) => NextResponse.redirect(`${SITE}${path}`);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`learn-checkout-confirm:${ip}`, 30, 60_000))) return go("/learn?welcome=1");

  const student = await getStudent();
  const validId = /^cs_[A-Za-z0-9_]{6,200}$/.test(id);
  if (!student) {
    // Session expired on the way back: sign in, then come back here.
    const back = validId ? `/api/learn/checkout/confirm?session_id=${encodeURIComponent(id)}` : "/learn";
    return go(`/learn/login?next=${encodeURIComponent(back)}`);
  }
  if (!validId) return go("/learn?welcome=1");

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    const owner = session.metadata?.studentId || session.client_reference_id;
    if (owner !== student.id) return go("/learn");
    const product = session.metadata?.product;
    const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";

    // ── One track ───────────────────────────────────────────────────────
    if (product === "learn-track" && session.mode === "payment") {
      const trackId = session.metadata?.trackId ?? "";
      const track = trackId ? await prisma.learnTrack.findUnique({ where: { id: trackId }, select: { id: true, slug: true } }) : null;
      if (paid && track) {
        await recordTrackPurchase({
          studentId: student.id,
          trackId: track.id,
          amountCents: session.amount_total ?? 0,
          currency: session.currency ?? "usd",
          stripeSessionId: session.id,
          stripePaymentIntent:
            typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
        });
        await completePendingEnrollment(student.id, { kind: "track", trackId: track.id });
        await recordScholarshipPayment(session).catch((err) => console.error("[checkout/confirm] scholarship", err));
      }
      return go(track ? `/learn/track/${track.slug}?welcome=1` : "/learn?welcome=1");
    }

    // ── One track on its own monthly plan ───────────────────────────────
    if (product === TRACK_MONTHLY_PRODUCT && session.mode === "subscription") {
      const slug = isSlug(session.metadata?.trackSlug) ? session.metadata.trackSlug : null;
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
      if (paid && session.status === "complete" && subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await upsertTrackSubscription(sub, { studentId: student.id, trackId: session.metadata?.trackId });
        if (sub.status === "active" || sub.status === "trialing") {
          await completePendingEnrollment(student.id, { kind: "monthly", track: slug });
        }
      }
      return go(slug ? `/learn/track/${slug}?welcome=1` : "/learn?welcome=1");
    }

    // ── All tracks, monthly ─────────────────────────────────────────────
    if (product === "learn" && session.mode === "subscription") {
      const returnTrack = isSlug(session.metadata?.returnTrack) ? session.metadata.returnTrack : null;
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
      if (paid && session.status === "complete" && subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await upsertLearnSubscription(sub, student.id);
        if (sub.status === "active" || sub.status === "trialing") {
          await completePendingEnrollment(student.id, { kind: "monthly", track: returnTrack });
        }
      }
      return go(returnTrack ? `/learn/track/${returnTrack}?welcome=1` : "/learn?welcome=1");
    }
  } catch (err) {
    console.error("[GET /api/learn/checkout/confirm]", err);
  }
  return go("/learn?welcome=1");
}
