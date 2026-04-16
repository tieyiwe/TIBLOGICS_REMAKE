import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
