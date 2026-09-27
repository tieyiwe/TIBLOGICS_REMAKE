import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { requireAdmin } from "@/lib/require-admin";
import { checkRateLimit } from "@/lib/rate-limit";


function generateConfirmationNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `ARFA-${ymd}-${rand}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`event-register:${ip}`, 5, 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();

    const {
      firstName, lastName, email, whatsapp, role, goal, referral,
      // price, currency and location deliberately NOT taken from the body —
      // they come from the Event row below.
      paymentMethod, event: eventName, eventSlug: bodySlug,
      numSeats, additionalParticipants,
    } = body;

    if (!firstName || !lastName || !email || !paymentMethod || !eventName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const seats = Math.max(1, Math.min(Math.floor(typeof numSeats === "number" ? numSeats : 1), 10));

    const slugMap: Record<string, string> = {
      "AI Practical Training — June Cohort": "ai-practical-training-cohort-1",
    };
    const eventSlug = bodySlug ?? slugMap[eventName] ?? eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // The event has to exist, and its name, price and currency come from the
    // row — not from the request. They were read straight off the body, and
    // `price` feeds the Stripe line items for seats 2 and up, so a group
    // booking could be checked out at any amount the caller chose, zero
    // included. It also meant a registration could be recorded against an
    // event name that does not exist.
    const eventRow = await prisma.event.findUnique({
      where: { slug: eventSlug },
      select: {
        title: true, price: true, currency: true, published: true,
        registrationOpen: true, date: true, endDate: true, spots: true,
      },
    });
    if (!eventRow || !eventRow.published) {
      return NextResponse.json({ error: "That event could not be found." }, { status: 404 });
    }

    // A cohort that has already run must not keep taking registrations. The
    // June cohort was still open three months after it finished, because
    // registrationOpen is set by hand and nobody clears it.
    const lastSession = eventRow.endDate ?? eventRow.date;
    const hasFinished =
      !!lastSession && lastSession.getTime() + 24 * 60 * 60 * 1000 < Date.now();
    if (!eventRow.registrationOpen || hasFinished) {
      return NextResponse.json(
        {
          error: hasFinished
            ? "That cohort has finished. Join the waitlist and we will tell you when the next one opens."
            : "Registration for that event is not open yet.",
        },
        { status: 409 },
      );
    }

    if (typeof eventRow.spots === "number" && eventRow.spots < seats) {
      return NextResponse.json(
        {
          error:
            eventRow.spots <= 0
              ? "That cohort is full."
              : `Only ${eventRow.spots} seat${eventRow.spots === 1 ? "" : "s"} left.`,
        },
        { status: 409 },
      );
    }

    const resolvedEventName = eventRow.title;
    const resolvedCurrency = eventRow.currency;
    // Stored in cents on the row already, so no conversion here.
    const priceInt = eventRow.price;

    // Generate unique confirmation number (retry once on collision)
    let confirmationNumber = generateConfirmationNumber();
    const existing = await prisma.eventRegistration.findUnique({ where: { confirmationNumber } });
    if (existing) confirmationNumber = generateConfirmationNumber();

    // Create primary registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventSlug,
        eventName: resolvedEventName.slice(0, 200),
        firstName: firstName.slice(0, 100),
        lastName: lastName.slice(0, 100),
        email: email.toLowerCase().trim().slice(0, 200),
        whatsapp: whatsapp ? String(whatsapp).slice(0, 50) : null,
        role: role ? String(role).slice(0, 200) : null,
        goal: goal ? String(goal).slice(0, 500) : null,
        referral: referral ? String(referral).slice(0, 200) : null,
        paymentMethod: paymentMethod.slice(0, 50),
        price: priceInt,
        currency: resolvedCurrency,
        status: "pending",
        confirmationNumber,
      },
    });

    // Create registrations for additional participants (non-blocking, fire-and-forget)
    const rawExtras = Array.isArray(additionalParticipants) ? additionalParticipants : [];
    const extras: Array<{ firstName: string; lastName: string; email: string }> =
      rawExtras.slice(0, seats - 1); // never more than seats - 1 extra participants
    if (extras.length > 0) {
      Promise.all(extras.map(async (p, i) => {
        try {
          let cn = generateConfirmationNumber();
          const dup = await prisma.eventRegistration.findUnique({ where: { confirmationNumber: cn } });
          if (dup) cn = generateConfirmationNumber();
          await prisma.eventRegistration.create({
            data: {
              eventSlug,
              eventName: resolvedEventName.slice(0, 200),
              firstName: String(p.firstName ?? "").slice(0, 100),
              lastName: String(p.lastName ?? "").slice(0, 100),
              email: String(p.email ?? "").toLowerCase().trim().slice(0, 200),
              paymentMethod: paymentMethod.slice(0, 50),
              price: priceInt,
              currency: resolvedCurrency,
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

    // Non-blocking side effects — newsletter only. Confirmation email fires
    // from the Stripe webhook after payment is confirmed, not here.
    const cleanEmail = email.toLowerCase().trim();
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

        // Tiered seat pricing: seat 1 full, seat 2 −17%, seat 3 −23%, seat 4 −25%, seat 5+ full
        const curr = resolvedCurrency.toLowerCase();
        const lineItems: object[] = [{ price: priceId, quantity: 1 }]; // seat 1 full price
        const discounts: Array<{ label: string; rate: number }> = [
          { label: "17% group discount", rate: 0.83 },
          { label: "23% group discount", rate: 0.77 },
          { label: "25% group discount", rate: 0.75 },
        ];
        for (let i = 1; i < Math.min(seats, 4); i++) {
          lineItems.push({
            price_data: {
              currency: curr,
              product_data: { name: `${resolvedEventName} — Seat ${i + 1} (${discounts[i - 1].label})` },
              unit_amount: Math.round(priceInt * discounts[i - 1].rate),
            },
            quantity: 1,
          });
        }
        // Seats 5+ at full price
        if (seats > 4) {
          lineItems.push({
            price_data: {
              currency: curr,
              product_data: { name: `${resolvedEventName} — Additional Seats (standard rate)` },
              unit_amount: priceInt,
            },
            quantity: seats - 4,
          });
        }

        const session = await stripe.checkout.sessions.create({
          line_items: lineItems,
          mode: "payment",
          allow_promotion_codes: true,
          customer_email: cleanEmail,
          // Google Pay is auto-shown in Stripe Checkout when card is enabled and browser supports it
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
  const authErr = await requireAdmin();
  if (authErr) return authErr;

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
