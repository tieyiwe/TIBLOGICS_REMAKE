import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEventRegistrationConfirmation } from "@/lib/resend";

function generateConfirmationNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `ARFA-${ymd}-${rand}`;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();

    const { firstName, lastName, email, whatsapp, role, goal, referral, paymentMethod, event: eventName, eventSlug: bodySlug, price, currency, location } = body;

    if (!firstName || !lastName || !email || !paymentMethod || !eventName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const slugMap: Record<string, string> = {
      "AI Practical Training — June Cohort": "ai-practical-training-cohort-1",
    };
    const eventSlug = bodySlug ?? slugMap[eventName] ?? eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Generate unique confirmation number (retry once on collision)
    let confirmationNumber = generateConfirmationNumber();
    const existing = await prisma.eventRegistration.findUnique({ where: { confirmationNumber } });
    if (existing) confirmationNumber = generateConfirmationNumber();

    const priceInt = typeof price === "number" ? Math.round(price * 100) : 0;

    const registration = await prisma.eventRegistration.create({
      data: {
        eventSlug,
        eventName: eventName.slice(0, 200),
        firstName: firstName.slice(0, 100),
        lastName: lastName.slice(0, 100),
        email: email.toLowerCase().trim().slice(0, 200),
        whatsapp: whatsapp ? String(whatsapp).slice(0, 50) : null,
        role: role ? String(role).slice(0, 200) : null,
        goal: goal ? String(goal).slice(0, 500) : null,
        referral: referral ? String(referral).slice(0, 200) : null,
        paymentMethod: paymentMethod.slice(0, 50),
        price: priceInt,
        currency: currency ?? "USD",
        status: "pending",
        confirmationNumber,
      },
    });

    // Send confirmation email (non-blocking — don't fail registration if email fails)
    sendEventRegistrationConfirmation({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      eventName,
      eventSlug,
      confirmationNumber,
      paymentMethod,
      price: priceInt,
      currency: currency ?? "USD",
      location: location ?? null,
    }).then(() => {
      console.log(`[event-reg/confirm-email] ✓ Sent to ${email} (conf: ${confirmationNumber})`);
    }).catch(e => {
      console.error(`[event-reg/confirm-email] ✗ FAILED for ${email}:`, e instanceof Error ? e.message : e);
    });

    // Also store in newsletter for email follow-up
    try {
      await prisma.newsletterSubscriber.upsert({
        where: { email: email.toLowerCase().trim() },
        create: {
          email: email.toLowerCase().trim(),
          firstName,
          source: `event-register:${eventSlug}`,
          active: true,
        },
        update: { source: `event-register:${eventSlug}` },
      });
    } catch { /* non-critical */ }

    return NextResponse.json({ ok: true, id: registration.id, confirmationNumber });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/events/register]", msg);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const where = slug ? { eventSlug: slug } : {};
    const rows = await prisma.eventRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, email: true, paymentMethod: true, status: true, createdAt: true, eventName: true, confirmationNumber: true },
    });
    return NextResponse.json({ registrations: rows });
  } catch {
    return NextResponse.json({ registrations: [] });
  }
}
