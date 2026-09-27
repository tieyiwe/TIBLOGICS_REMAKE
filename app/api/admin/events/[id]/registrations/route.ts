import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// EventRegistration.status is a free-form String column, so the allowed set has
// to be enforced here — an arbitrary value silently drops a registration out of
// every status filter (paid counts, reminders, spots left).
const VALID_STATUSES = ["pending", "paid", "confirmed", "cancelled", "refunded"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Staff only. A bare session check passed here for TIBLOGICS Learn students
  // too, since learners share this NextAuth instance — requireAdmin rejects them.
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { slug: true } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventSlug: event.slug },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ registrations });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id: eventId } = await params;
  const { registrationId, status, notes } = await req.json();

  if (!registrationId || typeof registrationId !== "string") {
    return NextResponse.json({ error: "registrationId required" }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (notes !== undefined && notes !== null && (typeof notes !== "string" || notes.length > 5000)) {
    return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // The id in the path scoped nothing: registrationId alone selected the row, so
  // any event's URL could edit any other event's registration. Match on the pair
  // so the path segment is actually load-bearing.
  const reg = await prisma.eventRegistration.updateMany({
    where: { id: registrationId, eventSlug: event.slug },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
  });
  if (reg.count === 0) {
    return NextResponse.json({ error: "Registration not found for this event" }, { status: 404 });
  }

  const updated = await prisma.eventRegistration.findUnique({ where: { id: registrationId } });
  return NextResponse.json({ registration: updated });
}
