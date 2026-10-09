import prisma from "@/lib/prisma";
import { sendCertificateCongratsEmail } from "@/lib/learn/emails";
import { findCertificate, linkedInCertUrl } from "./ref";
import { certData, certFileName, verifyUrlFor } from "./data";
import { certificatePdf, certificatePng } from "./render";
import { claimArfaReviewLink } from "@/lib/reviews/invites";
import { isMinor } from "@/lib/learn/youth-account";

/** Adults only: young learners (AI-Empowered Youth) are never asked for a public review. */
async function isAdultLearner(email: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ birthYear: number | null; parentEmail: string | null }>>(
      `SELECT "birthYear", "parentEmail" FROM "Student" WHERE "email" = $1`,
      email,
    );
    const r = rows[0];
    return !!r && !r.parentEmail && !isMinor({ birthYear: r.birthYear == null ? null : Number(r.birthYear) });
  } catch {
    // Youth columns missing: no youth accounts exist yet.
    return true;
  }
}

/** The congratulations email with the certificate (image in the email, PDF attached). Once per certificate. */
export async function sendCertificateIssuedEmail(certId: string, locale: string): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<Array<{ reference: string; email: string; name: string; locale: string | null }>>(
    `SELECT c."reference", s."email", s."name", s."locale" FROM "LearnCertificate" c JOIN "Student" s ON s."id" = c."studentId" WHERE c."id" = $1 AND c."emailedAt" IS NULL`,
    certId,
  );
  const r = rows[0];
  if (!r) return;
  const c = await findCertificate(r.reference);
  if (!c || !c.nameConfirmedAt) return;
  const lang = r.locale ?? locale;
  const data = certData(c, lang);
  const [png, pdf] = await Promise.all([certificatePng(data), certificatePdf(data)]);
  const verifyUrl = verifyUrlFor(c.reference);
  // "Tell us how it went": one review invitation per learner, ever.
  const review = (await isAdultLearner(r.email)) ? await claimArfaReviewLink({ email: r.email, name: c.recipientName, locale: lang, refId: c.reference }) : null;
  try {
    await sendCertificateCongratsEmail({
      email: r.email,
      name: c.recipientName,
      certificateName: c.certificateName,
      reference: c.reference,
      distinction: c.distinction,
      verifyUrl,
      linkedInUrl: linkedInCertUrl(c, verifyUrl),
      png,
      pdf,
      pdfName: certFileName(c, "pdf"),
      locale: lang,
      reviewUrl: review?.url ?? null,
    });
  } catch (err) {
    await review?.release();
    throw err;
  }
  await prisma.$executeRawUnsafe(`UPDATE "LearnCertificate" SET "emailedAt" = NOW() WHERE "id" = $1`, certId);
}
