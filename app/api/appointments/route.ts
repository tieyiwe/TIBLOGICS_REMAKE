import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import resend from "@/lib/resend";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

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

    if (totalAmount === 0) {
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
          status: "CONFIRMED",
          paymentStatus: "free",
          confirmedAt: new Date(),
        },
      });

      // Send confirmation email to the client
      await sendBookingConfirmation({ firstName, lastName, email, serviceType, date, timeSlot });
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
}) {
  const serviceLabel = data.serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
  const dateLabel = new Date(data.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: data.email,
    subject: `Your meeting with TIBLOGICS is confirmed — ${dateLabel}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(27,58,107,0.08);">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:36px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:26px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;">Meeting Confirmed</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="color:#0D1B2A;font-size:20px;margin:0 0 8px;">You're all set, ${data.firstName}! 🎉</h2>
      <p style="color:#3A4A5C;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Your meeting has been confirmed. A team member will reach out before your call to make sure we're fully prepared for you.
      </p>
      <div style="background:#F4F7FB;border-radius:12px;padding:20px 24px;margin-bottom:28px;border-left:4px solid #F47C20;">
        <p style="margin:0 0 6px;font-size:13px;color:#7A8FA6;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Meeting Details</p>
        <p style="margin:0 0 6px;font-size:15px;color:#0D1B2A;"><strong>Service:</strong> ${serviceLabel}</p>
        <p style="margin:0 0 6px;font-size:15px;color:#0D1B2A;"><strong>Date:</strong> ${dateLabel}</p>
        <p style="margin:0;font-size:15px;color:#0D1B2A;"><strong>Time:</strong> ${data.timeSlot} EST</p>
      </div>
      <div style="text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}/tools"
           style="display:inline-block;background:#F47C20;color:white;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;">
          Explore Free Tools ↗
        </a>
      </div>
    </div>
    <div style="background:#F4F7FB;padding:18px 32px;text-align:center;">
      <p style="color:#7A8FA6;font-size:12px;margin:0;">
        Questions? Reply or email <a href="mailto:info@tiblogics.com" style="color:#2251A3;">info@tiblogics.com</a><br>
        TIBLOGICS · Wheaton, Maryland · <a href="https://tiblogics.com" style="color:#2251A3;">tiblogics.com</a>
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
