import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSessionReminder } from "@/lib/resend";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { sessionNumber } = await req.json();
  if (![1, 2, 3, 4].includes(sessionNumber)) {
    return NextResponse.json({ error: "sessionNumber must be 1–4" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventSlug: event.slug, status: "paid" },
  });

  if (registrations.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, message: "No paid registrations found." });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const reg of registrations) {
    try {
      await sendSessionReminder({
        firstName: reg.firstName,
        email: reg.email,
        sessionNumber,
        zoomLink: event.zoomLink ?? undefined,
        eventName: event.title,
      });
      sent++;
    } catch (err) {
      failed++;
      errors.push(`${reg.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`[reminder] Session ${sessionNumber} — sent:${sent} failed:${failed}`);
  return NextResponse.json({ ok: true, sent, failed, errors });
}
