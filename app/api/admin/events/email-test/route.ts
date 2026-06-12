import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEventWelcomeEmail, sendEventRegistrationConfirmation } from "@/lib/resend";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const to = req.nextUrl.searchParams.get("to") ?? session.user?.email ?? "";
  if (!to) return NextResponse.json({ error: "No recipient" }, { status: 400 });

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
