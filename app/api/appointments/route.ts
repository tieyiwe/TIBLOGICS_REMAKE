import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import resend from "@/lib/resend";
import { createMeeting } from "@/lib/meeting-providers";
import { isValidEmail, escapeHtml } from "@/lib/require-admin";
import stripe from "@/lib/stripe";

export async function GET(req: Request) {
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
    const body = await req.json();

    const {
      serviceType,
      serviceDuration,
      servicePrice,
      date,
      timeSlot,
      timezone,
      firstName,
      lastName,
      email,
      company,
      goalNotes,
      addOnRecording,
      addOnActionPlan,
      addOnSlackAccess,
      totalAmount,
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
    if (!serviceType || typeof serviceType !== "string" || serviceType.length > 100) {
      return NextResponse.json({ error: "Invalid serviceType" }, { status: 400 });
    }
    if (typeof totalAmount !== "number" || !Number.isInteger(totalAmount) || totalAmount < 0 || totalAmount > 500_000) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!date || isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    if (totalAmount === 0) {
      const tz = timezone ?? "America/New_York";

      // Auto-create meeting link before saving so it's included in the confirmation email
      const meetingLink = await createMeeting({
        serviceType,
        date: new Date(date),
        timeSlot,
        timezone: tz,
        serviceDuration,
        firstName,
        lastName,
      });

      const appointment = await prisma.appointment.create({
        data: {
          serviceType,
          serviceDuration,
          servicePrice,
          date: new Date(date),
          timeSlot,
          timezone: tz,
          firstName,
          lastName,
          email,
          company: company ?? null,
          goalNotes: goalNotes ?? null,
          addOnRecording: addOnRecording ?? false,
          addOnActionPlan: addOnActionPlan ?? false,
          addOnSlackAccess: addOnSlackAccess ?? false,
          totalAmount,
          status: "CONFIRMED",
          paymentStatus: "free",
          confirmedAt: new Date(),
          zoomLink: meetingLink,
        },
      });

      // Send confirmation email with meeting link
      await sendBookingConfirmation({ firstName, lastName, email, serviceType, date, timeSlot, meetingLink });
      // Notify the team
      await sendTeamBookingAlert({ firstName, lastName, email, serviceType, date, timeSlot });

      return NextResponse.json(
        { appointmentId: appointment.id, checkoutUrl: null },
        { status: 201 }
      );
    }

    // totalAmount > 0 — create PENDING appointment then Stripe session
    const appointment = await prisma.appointment.create({
      data: {
        serviceType,
        serviceDuration,
        servicePrice,
        date: new Date(date),
        timeSlot,
        timezone: timezone ?? "America/New_York",
        firstName,
        lastName,
        email,
        company: company ?? null,
        goalNotes: goalNotes ?? null,
        addOnRecording: addOnRecording ?? false,
        addOnActionPlan: addOnActionPlan ?? false,
        addOnSlackAccess: addOnSlackAccess ?? false,
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
            product_data: { name: body.serviceType },
            unit_amount: body.totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/success?appointmentId=${appointmentId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book`,
      metadata: {
        appointmentId,
        serviceType: body.serviceType,
        clientEmail: body.email,
      },
      customer_email: body.email,
    });

    // Store the session ID on the appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { stripeSessionId: session.id },
    });

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
  serviceType: string; date: string; timeSlot: string;
  meetingLink?: string | null;
}) {
  const serviceLabel = data.serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
  const dateLabel = new Date(data.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

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
          <tr><td style="padding:5px 0;color:#7A8FA6;font-size:14px;width:80px;">Service</td><td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${serviceLabel}</td></tr>
          <tr><td style="padding:5px 0;color:#7A8FA6;font-size:14px;">Date</td><td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${dateLabel}</td></tr>
          <tr><td style="padding:5px 0;color:#7A8FA6;font-size:14px;">Time</td><td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${data.timeSlot} EST</td></tr>
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

async function sendTeamBookingAlert(data: {
  firstName: string; lastName: string; email: string;
  serviceType: string; date: string; timeSlot: string;
}) {
  const serviceLabel = data.serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
  const dateLabel = new Date(data.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: process.env.DESIGN_EMAIL ?? "design@tiblogics.com",
    subject: `📅 New Booking — ${serviceLabel} · ${data.firstName} ${data.lastName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:#1B3A6B;">New Meeting Booked</h2>
      <div style="background:#F4F7FB;border-radius:12px;padding:20px;margin:16px 0;">
        <p><strong>Client:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>Service:</strong> ${serviceLabel}</p>
        <p><strong>Date:</strong> ${dateLabel} at ${data.timeSlot} EST</p>
      </div>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}/admin/appointments" style="color:#F47C20;">View in Admin →</a></p>
    </div>`,
  }).catch(() => {});
}
