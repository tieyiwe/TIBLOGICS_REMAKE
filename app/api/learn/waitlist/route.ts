import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/require-admin";

const Body = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  trackSlug: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`learn-waitlist:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { email, trackSlug } = parsed.data;

  try {
    await prisma.learnWaitlist.create({ data: { email, trackSlug } });
    return NextResponse.json({ ok: true, message: "You're on the list — we'll email you when it opens." });
  } catch {
    // Unique violation → already signed up. Same response either way.
    return NextResponse.json({ ok: true, message: "You're already on the list for this track." });
  }
}
