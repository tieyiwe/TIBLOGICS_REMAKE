import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/require-admin";
import { sendStudentWelcomeEmail } from "@/lib/learn/emails";
import { getLocale, getT } from "@/lib/i18n/server";
import { isLocale } from "@/lib/i18n/config";
import { sendSignupNotification } from "@/lib/learn/admin/signup-notify";
import { OWNER_EMAIL } from "@/lib/auth";

const SignupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  locale: z.string().optional(),
  // Where the learner came from, for the owner's sign-up email only.
  track: z.string().max(200).nullish(),
  next: z.string().max(500).nullish(),
});

/** Track slug and same-site ?next path, from the body or the signup page's URL. */
function signupSource(body: { track?: string | null; next?: string | null }, referer: string | null) {
  let track = body.track ?? null;
  let next = body.next ?? null;
  if (!track && !next && referer) {
    try {
      const u = new URL(referer);
      track = u.searchParams.get("track");
      next = u.searchParams.get("next");
    } catch { /* ignore */ }
  }
  return {
    track: track && /^[a-z0-9][a-z0-9-]{0,79}$/i.test(track) ? track : null,
    next: next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next.slice(0, 200) : null,
  };
}

const FIELD_ERROR: Record<string, string> = {
  name: "learn.api.nameRequired",
  email: "learn.api.invalidEmail",
  password: "learn.api.passwordShort",
};

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`learn-signup:${ip}`, 5, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyShort") }, { status: 429 });
  }

  const parsed = SignupSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json({ error: t(FIELD_ERROR[field] ?? "learn.api.invalidInput") }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  // The language the learner signed up in: saved on the account so emails
  // and other devices use it.
  const locale = isLocale(parsed.data.locale) ? parsed.data.locale : await getLocale();

  try {
    // The owner's learner account is always entitled (lib/learn/session.ts,
    // by email) and sign-up does not verify addresses, so a self-service
    // sign-up with the owner's email would hand a stranger free access to
    // every track. That account is created only by the owner's own sign-in
    // with the admin password (lib/auth.ts). Same answer as a taken address.
    if (email === OWNER_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: t("learn.api.emailExists") }, { status: 409 });
    }
    const existing = await prisma.student.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: t("learn.api.emailExists") }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const student = await prisma.student.create({
      data: { name, email, passwordHash, locale },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // Tell the owner (ADMIN_NOTIFY_EMAIL). Fire and forget: never blocks or
    // fails the sign-up.
    sendSignupNotification({
      studentId: student.id,
      name: student.name,
      email: student.email,
      locale,
      createdAt: student.createdAt,
      ...signupSource(parsed.data, req.headers.get("referer")),
    }).catch((err) => console.error("[learn/signup] owner notification", err));

    sendStudentWelcomeEmail({ email: student.email, name: student.name, locale })
      .catch((err) => console.error("[learn/signup] welcome email", err));

    return NextResponse.json({ ok: true, student: { id: student.id, email: student.email, name: student.name } });
  } catch (err) {
    console.error("[POST /api/learn/auth/signup]", err);
    return NextResponse.json({ error: t("learn.api.createFailed") }, { status: 500 });
  }
}
