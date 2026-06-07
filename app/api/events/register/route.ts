import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    const { firstName, lastName, email, whatsapp, role, goal, referral, paymentMethod, event: eventName, price, currency } = body;

    if (!firstName || !lastName || !email || !paymentMethod || !eventName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const slugMap: Record<string, string> = {
      "AI Practical Training — Cohort 1": "ai-practical-training-cohort-1",
    };
    const eventSlug = slugMap[eventName] ?? eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

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
        price: typeof price === "number" ? Math.round(price * 100) : 0,
        currency: currency ?? "USD",
        status: "pending",
      },
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

    return NextResponse.json({ ok: true, id: registration.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/events/register]", msg);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Admin list endpoint — public summary only
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const where = slug ? { eventSlug: slug } : {};
    const rows = await prisma.eventRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, email: true, paymentMethod: true, status: true, createdAt: true, eventName: true },
    });
    return NextResponse.json({ registrations: rows });
  } catch {
    return NextResponse.json({ registrations: [] });
  }
}
