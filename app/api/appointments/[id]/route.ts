import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await params;
    const body = await req.json();
    const allowedFields = ["status", "zoomLink", "notes", "cancelReason", "reminderSent", "confirmedAt"];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) data[field] = body[field];
    }
    if (data.status === "CANCELLED" && !("cancelledAt" in data)) {
      data.cancelledAt = new Date();
    }
    const appointment = await prisma.appointment.update({ where: { id }, data });
    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await params;
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}
