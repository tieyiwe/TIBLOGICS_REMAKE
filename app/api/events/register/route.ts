import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
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

    const {
      firstName, lastName, email, whatsapp, role, goal, referral,
      paymentMethod, event: eventName, eventSlug: bodySlug, price, currency, location,
      numSeats, additionalParticipants,
    } = body;

    if (!firstName || !lastName || !email || !paymentMethod || !eventName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const seats = typeof numSeats === "number" && numSeats >= 1 ? Math.min(numSeats, 10) : 1;

    const slugMap: Record<string, string> = {
      "AI Practical Training — June Cohort": "ai-practical-training-cohort-1",
    };
    const eventSlug = bodySlug ?? slugMap[eventName] ?? eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Generate unique confirmation number (retry once on collision)
    let confirmationNumber = generateConfirmationNumber();
    const existing = await prisma.eventRegistration.findUnique({ where: { confirmationNumber } });
    if (existing) confirmationNumber = generateConfirmationNumber();

    const priceInt = typeof price === "number" ? Math.round(price * 100) : 0;

    // Create primary registration
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

    // Create registrations for additional participants (non-blocking, fire-and-forget)
    const extras: Array<{ firstName: string; lastName: string; email: string }> =
      Array.isArray(additionalParticipants) ? additionalParticipants : [];
    if (extras.length > 0) {
      Promise.all(extras.map(async (p, i) => {
        try {
          let cn = generateConfirmationNumber();
          const dup = await prisma.eventRegistration.findUnique({ where: { confirmationNumber: cn } });
          if (dup) cn = generateConfirmationNumber();
          await prisma.eventRegistration.create({
            data: {
              eventSlug,
              eventName: eventName.slice(0, 200),
              firstName: String(p.firstName ?? "").slice(0, 100),
              lastName: String(p.lastName ?? "").slice(0, 100),
              email: String(p.email ?? "").toLowerCase().trim().slice(0, 200),
              paymentMethod: paymentMethod.slice(0, 50),
              price: priceInt,
              currency: currency ?? "USD",
              status: "pending",
              confirmationNumber: cn,
              notes: `Group booking with ${confirmationNumber} (seat ${i + 2} of ${seats})`,
            },
          });
        } catch (e) {
          console.error(`[event-reg/additional-${i}]`, e instanceof Error ? e.message : e);
        }
      })).catch(() => {});
    }

    // Non-blocking side effects (email + newsletter)
    const cleanEmail = email.toLowerCase().trim();
    sendEventRegistrationConfirmation({
      firstName, lastName, email: cleanEmail, eventName, eventSlug,
      confirmationNumber, paymentMethod, price: priceInt,
      currency: currency ?? "USD", location: location ?? null,
    }).then(() => {
      console.log(`[event-reg/confirm-email] ✓ Sent to ${cleanEmail} (conf: ${confirmationNumber})`);
    }).catch(e => {
      console.error(`[event-reg/confirm-email] ✗ FAILED for ${cleanEmail}:`, e instanceof Error ? e.message : e);
    });

    prisma.newsletterSubscriber.upsert({
      where: { email: cleanEmail },
      create: { email: cleanEmail, firstName, source: `event-register:${eventSlug}`, active: true },
      update: { source: `event-register:${eventSlug}` },
    }).catch(() => { /* non-critical */ });

    // Create Stripe checkout session
    // Seat 1 = full price. Seats 2+ = 25% off (75% of unit price).
    const priceId = process.env.STRIPE_EVENT_PRICE_ID;
    if (priceId) {
      try {
        const baseUrl = (
          process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com"
        ).replace(/\/$/, "");

        const additionalSeatAmount = Math.round(priceInt * 0.75);
        const lineItems = seats === 1
          ? [{ price: priceId, quantity: 1 }]
          : [
              { price: priceId, quantity: 1 }, // seat 1 — full price via fixed Price ID
              {
                price_data: {
                  currency: (currency ?? "usd").toLowerCase(),
                  product_data: { name: `${eventName} — Additional Seat (25% off)` },
                  unit_amount: additionalSeatAmount,
                },
                quantity: seats - 1,
              },
            ];

        const session = await stripe.checkout.sessions.create({
          line_items: lineItems,
          mode: "payment",
          allow_promotion_codes: true,
          customer_email: cleanEmail,
          success_url: `${baseUrl}/events/${eventSlug}/confirmed?conf=${confirmationNumber}`,
          cancel_url: `${baseUrl}/events/${eventSlug}?payment=cancelled&conf=${confirmationNumber}`,
          metadata: {
            registrationId: registration.id,
            confirmationNumber,
            eventSlug,
            seats: String(seats),
          },
        });
        return NextResponse.json({ ok: true, id: registration.id, confirmationNumber, checkoutUrl: session.url });
      } catch (stripeErr) {
        console.error("[event-reg/stripe]", stripeErr instanceof Error ? stripeErr.message : stripeErr);
        return NextResponse.json({ ok: true, id: registration.id, confirmationNumber });
      }
    }

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
