import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { getStudent } from "@/lib/learn/session";
import { syncTeamSubscription } from "@/lib/learn/team/service";
import { TEAM_PRODUCT } from "@/lib/learn/team/config";
import { teamRateLimit } from "@/lib/learn/team/guard";

// Stripe Checkout's success_url for team plans. Reads the session back from
// Stripe (never trusting the query string beyond its id), checks it belongs
// to the signed-in owner and is paid, and activates the team. The webhook
// does the same; both are idempotent.
const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function GET(req: NextRequest) {
  const done = NextResponse.redirect(`${SITE}/learn/team?welcome=1`);
  const limited = await teamRateLimit(req, "confirm", 20);
  if (limited) return limited;
  const id = req.nextUrl.searchParams.get("session_id") ?? "";
  const student = await getStudent();
  if (!student || !/^cs_[A-Za-z0-9_]{6,200}$/.test(id)) return done;
  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    const ownerId = session.metadata?.ownerStudentId || session.client_reference_id;
    if (session.metadata?.product !== TEAM_PRODUCT || ownerId !== student.id) return done;
    const paid = session.status === "complete" && (session.payment_status === "paid" || session.payment_status === "no_payment_required");
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (paid && subId) {
      await syncTeamSubscription(await stripe.subscriptions.retrieve(subId), { teamId: session.metadata?.teamId, checkoutSessionId: session.id });
    }
  } catch (err) {
    console.error("[GET /api/learn/team/confirm]", err);
  }
  return done;
}
