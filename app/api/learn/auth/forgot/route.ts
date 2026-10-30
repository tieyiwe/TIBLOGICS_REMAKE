import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { checkRateLimit, isValidEmail } from "@/lib/require-admin";
import { sendPasswordResetEmail } from "@/lib/learn/emails";
import { getT } from "@/lib/i18n/server";

// "Forgot password" for TIBLOGICS accounts (Learn and the paid tools).
//
// Accounts had no way to recover a lost password at all. The answer here is
// identical whether or not the address has an account, so it cannot be used
// to discover who is a customer. Only a hash of the token is stored.

const TTL_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`learn-forgot:${ip}`, 5, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const { email } = await req.json().catch(() => ({}));
  if (!isValidEmail(email)) return NextResponse.json({ error: t("learn.api.invalidEmail") }, { status: 400 });
  const clean = email.trim().toLowerCase();

  const ok = NextResponse.json({ ok: true, message: t("learn.api.resetSent") });

  // Per address as well, so one inbox cannot be flooded from many IPs.
  if (!(await checkRateLimit(`learn-forgot:email:${clean}`, 3, 3_600_000))) return ok;

  const student = await prisma.student.findUnique({ where: { email: clean }, select: { id: true, name: true, email: true, locale: true } }).catch(() => null);
  if (student) {
    const token = randomBytes(32).toString("base64url");
    await prisma.student.update({
      where: { id: student.id },
      data: {
        resetToken: createHash("sha256").update(token).digest("hex"),
        resetTokenExpires: new Date(Date.now() + TTL_MS),
      },
    });
    await sendPasswordResetEmail({ email: student.email, name: student.name, token, locale: student.locale }).catch((err) =>
      console.error("[learn/forgot] email failed", err instanceof Error ? err.message : err),
    );
  }
  return ok;
}
