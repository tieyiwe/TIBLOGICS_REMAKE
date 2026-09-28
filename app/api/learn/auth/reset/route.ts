import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/require-admin";
import { clearRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

// Completes a password reset. The token works once: it is cleared in the same
// update that sets the new password, and only while it has not expired.

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`learn-reset:${ip}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyAttemptsLater") }, { status: 429 });
  }
  const { token, password } = await req.json().catch(() => ({}));
  if (typeof token !== "string" || token.length < 20 || token.length > 200) {
    return NextResponse.json({ error: t("learn.api.resetInvalid") }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: t("learn.api.passwordShort") }, { status: 400 });
  }

  const hash = createHash("sha256").update(token).digest("hex");
  const student = await prisma.student
    .findFirst({ where: { resetToken: hash, resetTokenExpires: { gt: new Date() } }, select: { id: true, email: true } })
    .catch(() => null);
  const expired = NextResponse.json({ error: t("learn.api.resetExpired"), code: "expired" }, { status: 400 });
  if (!student) return expired;

  // Conditional on the token still being there, so two submissions of the
  // same link cannot both succeed.
  const updated = await prisma.student.updateMany({
    where: { id: student.id, resetToken: hash, resetTokenExpires: { gt: new Date() } },
    data: { passwordHash: await bcrypt.hash(password, 12), resetToken: null, resetTokenExpires: null },
  });
  if (updated.count === 0) return expired;

  // Lift any sign-in lockout the forgotten password caused.
  await clearRateLimit(`login:student:${student.email.toLowerCase().trim()}`).catch(() => {});

  return NextResponse.json({ ok: true });
}
