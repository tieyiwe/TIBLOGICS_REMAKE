import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/require-admin";
import { getT } from "@/lib/i18n/server";

const Body = z.object({
  email: z.string().trim().toLowerCase().email(),
  trackSlug: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`learn-waitlist:${ip}`, 8, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return NextResponse.json({ error: t(field === "email" ? "learn.api.invalidEmail" : "learn.api.invalidInput") }, { status: 400 });
  }
  const { email, trackSlug } = parsed.data;

  try {
    await prisma.learnWaitlist.create({ data: { email, trackSlug } });
    return NextResponse.json({ ok: true, message: t("learn.waitlist.joined") });
  } catch {
    // Unique violation → already signed up. Same response either way.
    return NextResponse.json({ ok: true, message: t("learn.waitlist.already") });
  }
}
