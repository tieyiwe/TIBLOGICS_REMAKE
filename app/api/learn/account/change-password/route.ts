import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { ensureAccountTables } from "@/lib/learn/account-status/db";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";

export const dynamic = "force-dynamic";

// The forced password change after an admin set a temporary password. Needs
// the temporary password (the session alone is not enough), a new one of 10+
// characters, and clears the "must change" flag. The session stays valid.
const Body = z.object({ current: z.string().min(1).max(200), password: z.string().max(200) });

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();
  if (!(await checkRateLimit(`learn-change-pw:${student.id}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyAttemptsLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("changePassword.error") }, { status: 400 });
  const { current, password } = parsed.data;
  if (password.length < 10) return NextResponse.json({ error: t("changePassword.tooShort") }, { status: 400 });
  if (password === current) return NextResponse.json({ error: t("changePassword.same") }, { status: 400 });

  const row = await prisma.student.findUnique({ where: { id: student.id }, select: { passwordHash: true } });
  if (!row || !(await bcrypt.compare(current, row.passwordHash))) {
    return NextResponse.json({ error: t("changePassword.wrong") }, { status: 400 });
  }
  await prisma.student.update({ where: { id: student.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  await ensureAccountTables();
  await prisma.learnerAccount.updateMany({ where: { studentId: student.id }, data: { mustChangePassword: false, updatedAt: new Date() } });
  return NextResponse.json({ ok: true, message: t("changePassword.done") });
}
