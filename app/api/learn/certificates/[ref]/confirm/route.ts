import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, getT } from "@/lib/i18n/server";
import { cleanCertificateName, findCertificate } from "@/lib/learn/cert/ref";
import { sendCertificateIssuedEmail } from "@/lib/learn/cert/email";

// POST /api/learn/certificates/<ref>/confirm { name, nameAgain, agree }
// The learner confirms the name to print (typed twice, identical, and the
// box ticked). Done once: after that only staff can change it. Then the
// congratulations email goes out with the certificate attached.
export async function POST(req: NextRequest, ctx: { params: Promise<{ ref: string }> }) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const t = await getT();
  const { ref } = await ctx.params;
  const c = await findCertificate(ref).catch(() => null);
  if (!c || c.studentId !== student.id || c.revoked) return NextResponse.json({ error: t("learn.claim.notFound") }, { status: 404 });
  if (c.nameConfirmedAt) return NextResponse.json({ ok: true, already: true, reference: c.reference });
  if (!(await checkRateLimit(`cert-confirm:${student.id}`, 10, 10 * 60_000))) return NextResponse.json({ error: t("learn.claim.tooMany") }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { name?: unknown; nameAgain?: unknown; agree?: unknown } | null;
  const name = cleanCertificateName(body?.name);
  const again = cleanCertificateName(body?.nameAgain);
  if (!name) return NextResponse.json({ error: t("learn.claim.badName") }, { status: 400 });
  if (name !== again) return NextResponse.json({ error: t("learn.claim.mismatch") }, { status: 400 });
  if (body?.agree !== true) return NextResponse.json({ error: t("learn.claim.mustAgree") }, { status: 400 });

  // Once only, even with two tabs: the update applies to an unconfirmed row.
  const n = await prisma.$executeRawUnsafe(
    `UPDATE "LearnCertificate" SET "recipientName" = $1, "nameConfirmedAt" = NOW() WHERE "id" = $2 AND "nameConfirmedAt" IS NULL`,
    name,
    c.id,
  );
  if (n !== 1) return NextResponse.json({ ok: true, already: true, reference: c.reference });

  const locale = await getLocale();
  await sendCertificateIssuedEmail(c.id, locale).catch((err) => console.error("[cert/confirm] email", err));
  return NextResponse.json({ ok: true, reference: c.reference });
}
