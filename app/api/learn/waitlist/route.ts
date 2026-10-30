import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/require-admin";
import { getT } from "@/lib/i18n/server";
import { Prisma } from "@prisma/client";

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  trackSlug: z.string().trim().regex(/^[a-z0-9-]{1,80}$/),
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
  // Only a real track that is shown on the site can be waited for.
  const track = await prisma.learnTrack.findUnique({ where: { slug: trackSlug }, select: { status: true } }).catch(() => null);
  if (!track || track.status === "draft") {
    return NextResponse.json({ error: t("learn.api.invalidInput") }, { status: 400 });
  }

  try {
    await prisma.learnWaitlist.create({ data: { email, trackSlug } });
    return NextResponse.json({ ok: true, message: t("learn.waitlist.joined") });
  } catch (err) {
    // Unique violation: already signed up. Anything else is a real failure.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: true, message: t("learn.waitlist.already") });
    }
    console.error("[learn/waitlist]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("learn.api.invalidInput") }, { status: 500 });
  }
}
