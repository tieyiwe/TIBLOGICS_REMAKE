import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const { registrationId, status, notes } = await req.json();

  if (!registrationId) return NextResponse.json({ error: "registrationId required" }, { status: 400 });

  // Verify registration belongs to this event
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reg = await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
    },
  });
  return NextResponse.json({ registration: reg });
}
