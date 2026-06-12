import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (slug) where.eventSlug = slug;
  if (status) where.status = status;

  const registrations = await prisma.eventRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      eventSlug: true,
      eventName: true,
      firstName: true,
      lastName: true,
      email: true,
      whatsapp: true,
      role: true,
      goal: true,
      referral: true,
      paymentMethod: true,
      price: true,
      currency: true,
      status: true,
      notes: true,
      confirmationNumber: true,
    },
  });

  // Summary counts per event
  const summary = await prisma.eventRegistration.groupBy({
    by: ["eventSlug", "status"],
    _count: { id: true },
  });

  return NextResponse.json({ registrations, summary });
}

export async function PATCH(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const { id, status, notes } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const reg = await prisma.eventRegistration.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
  });
  return NextResponse.json({ registration: reg });
}
