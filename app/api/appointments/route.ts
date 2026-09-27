import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import resend from "@/lib/resend";
import { sendTiweNotification } from "@/lib/resend";
import { createMeeting, calcEndTime } from "@/lib/meeting-providers";
import { isValidEmail, escapeHtml, requireAdmin, rateLimit, anonymiseIp } from "@/lib/require-admin";
import { findTopicByName } from "@/lib/booking/services";
import {
  getAvailability,
  parseBookingDate,
  bookingDayOfWeek,
  BOOKING_TIMEZONE,
} from "@/lib/booking/availability";
import stripe from "@/lib/stripe";

// Staff only. This returns every customer's name, email, phone, company and
// private notes — it was reachable by anyone until now. POST below stays
// public, because that is the booking form itself.
/** How long the booking response will wait on confirmation emails. */
const EMAIL_TIMEOUT_MS = 5000;

/** Resolve when `p` settles or `ms` elapses, whichever comes first. */
function withTimeout(p: Promise<unknown>, ms: number): Promise<unknown> {
  return Promise.race([
    p,
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);
}

export async function GET(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("[GET /api/appointments]", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Unauthenticated, and every accepted booking sends two emails — one of
    // them to an address the caller chooses. Without a cap this is both a slot
    // exhaustion vector and a mail relay: nine bookings in a row went through
    // before this was added.
    //
    // Two limits, because they guard different things. The loose one stops a
    // flood of requests; the tight one, consumed further down only when a
    // booking is actually about to be written, stops slot hoarding without
    // punishing someone who picks a blocked date a few times.
    const ip = anonymiseIp(
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        "unknown",
    );
    // With no forwarded header there is no caller to attribute to, and keying
    // on the literal "unknown" would put every visitor in one bucket — five
    // bookings and the site stops taking any. Fall back to the email instead,
    // so a limit can never be shared between unrelated people.
    const knownIp = ip !== "unknown";
    if (!rateLimit(`appointments:req:${ip}`, knownIp ? 30 : 300, 10 * 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a few minutes." },
        { status: 429 },
      );
    }

    const body = await req.json();

    const {
      serviceType,
      date,
      timeSlot,
      firstName,
      lastName,
      email,
      phone,
      company,
      goalNotes,
      sessionId,
    } = body;

    // Input validation
    if (!firstName || typeof firstName !== "string" || firstName.length > 100) {
      return NextResponse.json({ error: "Invalid first name" }, { status: 400 });
    }
    if (!lastName || typeof lastName !== "string" || lastName.length > 100) {
      return NextResponse.json({ error: "Invalid last name" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    for (const [label, value] of [
      ["phone", phone],
      ["company", company],
      ["notes", goalNotes],
    ] as const) {
      if (value != null && (typeof value !== "string" || value.length > 2000)) {
        return NextResponse.json({ error: `Invalid ${label}` }, { status: 400 });
      }
    }

    // The topic, its length and its price all come from the server's own list.
    // They used to be read straight off the request body, so a crafted call
    // could book a topic the site does not offer, at any price it liked, and
    // put arbitrary text into the notification emails and the admin UI.
    const topic = findTopicByName(serviceType);
    if (!topic) {
      return NextResponse.json({ error: "Unknown consultation topic" }, { status: 400 });
    }
    const serviceDuration = topic.duration;
    const servicePrice = topic.price;
    const totalAmount = topic.price;

    const bookingDate = parseBookingDate(date);
    if (!bookingDate) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    // Yesterday's slots are not bookable. Compared against UTC midnight today,
    // matching how bookings are stored.
    const todayUtc = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
    if (bookingDate < todayUtc) {
      return NextResponse.json({ error: "That date has already passed" }, { status: 400 });
    }

    // The form only ever offers configured days and slots, but nothing stopped
    // a direct POST: a Saturday at "3:17 AM" was accepted, which is a slot no
    // one is there for.
    const availability = await getAvailability();
    if (typeof timeSlot !== "string" || !availability.slots.includes(timeSlot)) {
      return NextResponse.json({ error: "That time is not offered" }, { status: 400 });
    }
    if (!availability.days.includes(bookingDayOfWeek(bookingDate))) {
      return NextResponse.json({ error: "That day is not open for booking" }, { status: 400 });
    }

    const dayStart = bookingDate;
    const dayEnd = new Date(bookingDate.getTime() + 86_399_999);

    const blocked = await prisma.blockedDate.findFirst({
      where: { date: { gte: dayStart, lte: dayEnd } },
      select: { id: true },
    });
    if (blocked) {
      return NextResponse.json({ error: "That date is unavailable" }, { status: 400 });
    }

    // The form hides slots that /api/appointments/available reports as booked,
    // but nothing re-checked at write time — so a double-click, a retry after a
    // slow response, or two people on the page at once all produced overlapping
    // bookings for one slot. PENDING counts as taken, matching how `available`
    // computes bookedSlots.
    //
    // This closes the realistic cases. Two genuinely simultaneous requests can
    // still slip through; only a unique index would make that impossible.
    const taken = await prisma.appointment.findFirst({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        timeSlot,
        status: { not: "CANCELLED" },
      },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "That time has just been booked. Please pick another slot." },
        { status: 409 },
      );
    }

    // Everything checks out, so this attempt is a real booking. Only now is
    // the per-IP booking allowance spent — a visitor who first tried a blocked
    // date or a taken slot has not used any of it up.
    const bookingKey = knownIp ? ip : `email:${String(email).toLowerCase()}`;
    if (!rateLimit(`appointments:new:${bookingKey}`, 5, 60 * 60_000)) {
      return NextResponse.json(
        {
          error:
            "You've already booked several sessions. Reply to your confirmation email if you need another.",
        },
        { status: 429 },
      );
    }

    // Consultations carry no add-ons today; the columns stay so a paid tier can
    // reintroduce them without a migration.
    const addOnRecording = false;
    const addOnActionPlan = false;
    const addOnSlackAccess = false;

    if (totalAmount === 0) {
      const tz = BOOKING_TIMEZONE;

      // Auto-create meeting link before saving so it's included in the confirmation email
      const meetingLink = await createMeeting({
        serviceType: topic.name,
        date: bookingDate,
        timeSlot,
        timezone: tz,
        serviceDuration,
        firstName,
        lastName,
      });

      const appointment = await prisma.appointment.create({
        data: {
          serviceType: topic.name,
          serviceDuration,
          servicePrice,
          date: bookingDate,
          timeSlot,
          timezone: tz,
          firstName,
          lastName,
          email,
          company: company ?? null,
          phone: phone ?? null,
          goalNotes: goalNotes ?? null,
          addOnRecording,
          addOnActionPlan,
          addOnSlackAccess,
          totalAmount,
          status: "CONFIRMED",
          paymentStatus: "free",
          confirmedAt: new Date(),
          zoomLink: meetingLink,
        },
      });

      // Link chat session to this appointment for expert intelligence
      if (sessionId && typeof sessionId === "string") {
        prisma.adminSettings.upsert({
          where: { key: `appt:sid:${appointment.id}` },
          update: { value: sessionId },
          create: { key: `appt:sid:${appointment.id}`, value: sessionId },
        }).catch(() => {});
      }

      // The appointment is already saved, so the emails are best-effort. Don't
      // hold the response open on them: an unreachable or slow mail provider
      // would leave the customer staring at a spinner on a booking that
      // actually succeeded, and they would submit again and double-book.
      // Sending continues in the background after the timeout — this runs on a
      // long-lived server, not a function that gets frozen on response.
      await withTimeout(
        Promise.allSettled([
          sendBookingConfirmation({ firstName, lastName, email, serviceType: topic.name, serviceDuration, date: bookingDate, timeSlot, meetingLink }),
          sendTiweNotification({
            firstName, lastName, email, company: company ?? null,
            serviceType: topic.name, date: bookingDate, timeSlot,
            totalAmount: 0, paymentStatus: "free",
            addOnRecording: false, addOnActionPlan: false, addOnSlackAccess: false,
            goalNotes: goalNotes ?? null, meetingLink,
          }),
        ]),
        EMAIL_TIMEOUT_MS,
      );

      return NextResponse.json(
        { appointmentId: appointment.id, checkoutUrl: null },
        { status: 201 }
      );
    }

    // totalAmount > 0 — create PENDING appointment then Stripe session
    const appointment = await prisma.appointment.create({
      data: {
        serviceType: topic.name,
        serviceDuration,
        servicePrice,
        date: bookingDate,
        timeSlot,
        timezone: BOOKING_TIMEZONE,
        firstName,
        lastName,
        email,
        company: company ?? null,
        phone: phone ?? null,
        goalNotes: goalNotes ?? null,
        addOnRecording,
        addOnActionPlan,
        addOnSlackAccess,
        totalAmount,
        status: "PENDING",
        paymentStatus: "pending",
      },
    });

    const appointmentId = appointment.id;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: topic.name },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/success?appointmentId=${appointmentId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book`,
      metadata: {
        appointmentId,
        serviceType: topic.name,
        clientEmail: email,
      },
      customer_email: email,
    });

    // Store the Stripe session ID on the appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { stripeSessionId: session.id },
    });

    // Link chat session to appointment for expert intelligence
    if (sessionId && typeof sessionId === "string") {
      prisma.adminSettings.upsert({
        where: { key: `appt:sid:${appointmentId}` },
        update: { value: sessionId },
        create: { key: `appt:sid:${appointmentId}`, value: sessionId },
      }).catch(() => {});
    }

    return NextResponse.json(
      { appointmentId, checkoutUrl: session.url },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/appointments]", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}

async function sendBookingConfirmation(data: {
  firstName: string; lastName: string; email: string;
  serviceType: string; serviceDuration?: string; date: Date; timeSlot: string;
  meetingLink?: string | null;
}) {
  const serviceLabel = data.serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
  // Booked dates are stored at UTC midnight, so the label has to be read in
  // UTC — a local-zone read prints the previous day on any server west of it.
  const dateLabel = data.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const endTime = data.serviceDuration ? calcEndTime(data.timeSlot, data.serviceDuration) : "";

  const safeFirst = escapeHtml(data.firstName);
  const safeService = escapeHtml(serviceLabel);
  const providerName = "Jitsi Meet";
  const providerColor = "#1D76BA";

  const meetingSection = data.meetingLink
    ? `<div style="margin:24px 0;text-align:center;">
        <p style="margin:0 0 12px;font-size:11px;color:#7A8FA6;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Your Meeting Link</p>
        <a href="${data.meetingLink}"
           style="display:inline-block;background:${providerColor};color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">
          🎥 Join on ${providerName}
        </a>
        <p style="color:#7A8FA6;font-size:12px;margin:10px 0 0;word-break:break-all;">${data.meetingLink}</p>
      </div>`
    : `<div style="background:#FEF0E3;border-radius:12px;padding:16px 20px;margin:24px 0;border-left:4px solid #F47C20;">
        <p style="margin:0;color:#F47C20;font-size:14px;">📅 Your meeting link will be sent at least 24 hours before your session.</p>
      </div>`;

  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: data.email,
    subject: `✅ Your TIBLOGICS meeting is confirmed — ${dateLabel}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(27,58,107,0.10);">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:40px 32px;text-align:center;">
      <h1 style="color:white;margin:0 0 6px;font-size:28px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
      <p style="color:rgba(255,255,255,0.65);margin:0;font-size:13px;">Meeting Confirmed ✓</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="color:#0D1B2A;font-size:22px;margin:0 0 10px;font-weight:700;">You're confirmed, ${data.firstName}! 🎉</h2>
      <p style="color:#3A4A5C;font-size:15px;line-height:1.7;margin:0 0 24px;">
        We're looking forward to speaking with you. Here are your session details.
      </p>
      <div style="background:#F4F7FB;border-radius:14px;padding:22px 24px;">
        <p style="margin:0 0 12px;font-size:11px;color:#7A8FA6;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Session Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:5px 0;color:#7A8FA6;font-size:14px;width:90px;">Service</td><td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${serviceLabel}</td></tr>
          <tr><td style="padding:5px 0;color:#7A8FA6;font-size:14px;">Date</td><td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${dateLabel}</td></tr>
          <tr><td style="padding:5px 0;color:#7A8FA6;font-size:14px;">Time</td><td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${data.timeSlot}${endTime ? ` – ${endTime}` : ""} EST</td></tr>
          ${data.serviceDuration ? `<tr><td style="padding:5px 0;color:#7A8FA6;font-size:14px;">Duration</td><td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${data.serviceDuration}</td></tr>` : ""}
        </table>
      </div>
      ${meetingSection}
      <div style="background:#EBF5FF;border-radius:12px;padding:16px 20px;margin-top:8px;">
        <p style="margin:0;color:#2251A3;font-size:13px;line-height:1.65;">
          💡 <strong>Prepare:</strong> Jot down 2–3 specific challenges you want to tackle so we can make every minute count.
        </p>
      </div>
    </div>
    <div style="background:#F4F7FB;padding:20px 32px;text-align:center;border-top:1px solid #E8EFF8;">
      <p style="color:#7A8FA6;font-size:12px;margin:0;line-height:2;">
        Questions? Reply or email <a href="mailto:info@tiblogics.com" style="color:#2251A3;text-decoration:none;">info@tiblogics.com</a><br>
        TIBLOGICS · <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}" style="color:#2251A3;text-decoration:none;">tiblogics.com</a>
      </p>
    </div>
  </div>
</body></html>`,
  }).catch(() => {});
}
