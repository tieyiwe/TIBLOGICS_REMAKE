import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidEmail, requireAdmin, rateLimit } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    const where = slug
      ? { source: { startsWith: `event-notify:${slug}` } }
      : { source: { startsWith: "event-notify" } };

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: "desc" },
      select: { id: true, email: true, firstName: true, whatsapp: true, source: true, subscribedAt: true },
    });
    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error("[GET /api/events/notify]", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`events-notify:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const { name, email, whatsapp, event, slug } = await req.json();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim().length < 1 || name.length > 100) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    // Use slug as primary identifier so admin can filter reliably
    const source = slug
      ? `event-notify:${String(slug).slice(0, 80)}`
      : event
      ? `event-notify:${String(event).slice(0, 80)}`
      : "event-notify";

    await prisma.newsletterSubscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      update: { source, active: true, whatsapp: whatsapp ?? undefined },
      create: {
        email: email.toLowerCase().trim(),
        firstName: name.trim().slice(0, 100),
        whatsapp: whatsapp ? String(whatsapp).slice(0, 50) : null,
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
