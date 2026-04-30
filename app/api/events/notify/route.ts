import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidEmail, requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { source: { startsWith: "event-notify" } },
      orderBy: { subscribedAt: "desc" },
      select: { id: true, email: true, firstName: true, source: true, subscribedAt: true },
    });
    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error("[GET /api/events/notify]", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, event } = await req.json();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim().length < 1 || name.length > 100) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const source = event ? `event-notify:${String(event).slice(0, 60)}` : "event-notify";

    await prisma.newsletterSubscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      update: { source, active: true },
      create: {
        email: email.toLowerCase().trim(),
        firstName: name.trim().slice(0, 100),
        source,
        active: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/events/notify]", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
