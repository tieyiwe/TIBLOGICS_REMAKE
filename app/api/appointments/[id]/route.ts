import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[GET /api/appointments/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const body = await req.json();

    const allowedFields = [
      "status",
      "zoomLink",
      "notes",
      "cancelReason",
      "reminderSent",
      "confirmedAt",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field];
      }
    }

    // Set cancelledAt automatically when status is changed to CANCELLED
    if (data.status === "CANCELLED" && !("cancelledAt" in data)) {
      data.cancelledAt = new Date();
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[PATCH /api/appointments/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/appointments/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
