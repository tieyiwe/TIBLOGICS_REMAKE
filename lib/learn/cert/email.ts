import prisma from "@/lib/prisma";
import { sendCertificateCongratsEmail } from "@/lib/learn/emails";
import { findCertificate, linkedInCertUrl } from "./ref";
import { certData, certFileName, verifyUrlFor } from "./data";
import { certificatePdf, certificatePng } from "./render";

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
  });
  await prisma.$executeRawUnsafe(`UPDATE "LearnCertificate" SET "emailedAt" = NOW() WHERE "id" = $1`, certId);
}
