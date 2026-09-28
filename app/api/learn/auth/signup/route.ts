import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/require-admin";
import { sendStudentWelcomeEmail } from "@/lib/learn/emails";
import { getLocale, getT } from "@/lib/i18n/server";
import { isLocale } from "@/lib/i18n/config";

const SignupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  locale: z.string().optional(),
});

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
    const existing = await prisma.student.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: t("learn.api.emailExists") }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const student = await prisma.student.create({
      data: { name, email, passwordHash, locale },
      select: { id: true, email: true, name: true },
    });

    sendStudentWelcomeEmail({ email: student.email, name: student.name, locale })
      .catch((err) => console.error("[learn/signup] welcome email", err));

    return NextResponse.json({ ok: true, student });
  } catch (err) {
    console.error("[POST /api/learn/auth/signup]", err);
    return NextResponse.json({ error: t("learn.api.createFailed") }, { status: 500 });
  }
}
