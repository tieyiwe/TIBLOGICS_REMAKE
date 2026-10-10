import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEventWelcomeEmail, sendEventRegistrationConfirmation } from "@/lib/resend";
import { requireAdmin, checkRateLimit } from "@/lib/require-admin";

export async function GET() {
  // Staff only. A bare session check passed here for TIBLOGICS Learn students
  // too, since learners share this NextAuth instance — requireAdmin rejects them.
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const session = await getServerSession(authOptions);
  // The recipient is always the caller's own mailbox. A `?to=` override turned
  // this diagnostic into an open relay: two templates rendered with attacker
  // text, sent from our verified domain to any address, once per request.
  const to = session?.user?.email ?? "";
  if (!to) return NextResponse.json({ error: "No recipient" }, { status: 400 });

  if (!(await checkRateLimit(`events-email-test:${to}`, 5, 600_000))) {
    return NextResponse.json({ error: "Too many test sends. Try again shortly." }, { status: 429 });
  }

  const results: Record<string, string> = {};

  // Test 1: registration confirmation email
  try {
    await sendEventRegistrationConfirmation({
      firstName: "Test",
      lastName: "User",
      email: to,
      eventName: "AI Practical Training — June Cohort",
      eventSlug: "ai-practical-training-cohort-1",
      confirmationNumber: "ARFA-TEST-000000",
      paymentMethod: "stripe",
      price: 84900,
      currency: "USD",
      location: "Zoom (Online)",
    });
    results.confirmationEmail = `✓ sent to ${to}`;
  } catch (e) {
    results.confirmationEmail = `✗ FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test 2: welcome email
  try {
    await sendEventWelcomeEmail({
      firstName: "Test",
      email: to,
      eventName: "AI Practical Training — June Cohort",
      confirmationNumber: "ARFA-TEST-000000",
    });
    results.welcomeEmail = `✓ sent to ${to}`;
  } catch (e) {
    results.welcomeEmail = `✗ FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(results);
}
