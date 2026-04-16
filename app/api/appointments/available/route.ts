import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date query param is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const start = new Date(date + "T00:00:00.000Z");
    const end = new Date(date + "T23:59:59.999Z");

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
      select: { timeSlot: true },
    });

    const blocked = await prisma.blockedDate.findFirst({
      where: { date: { gte: start, lte: end } },
    });

    return NextResponse.json({
      bookedSlots: appointments.map((a) => a.timeSlot),
      isBlocked: !!blocked,
    });
  } catch (error) {
    console.error("[GET /api/appointments/available]", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
