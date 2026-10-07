import { absUrl } from "@/lib/seo/site";
import type { CertificateData } from "./render";
import type { CertView } from "./ref";

/** The public verification link printed on the certificate. */
export const verifyUrlFor = (reference: string) => absUrl(`/certificates/${reference}`);

/** What the renderer needs, from a stored certificate. */
export function certData(c: CertView, locale: string, override?: { name?: string; sample?: boolean }): CertificateData {
  return {
    name: override?.name ?? c.recipientName,
    certificateName: c.certificateName,
    tagline: c.track.tagline,
    level: c.track.level,
    levelEnd: c.track.levelEnd,
    accentColor: c.track.accentColor,
    hours: c.track.estimatedHours,
    distinction: c.distinction,
    scholar: !!c.scholar,
    issuedAt: c.issuedAt,
    reference: c.reference,
    verifyUrl: verifyUrlFor(c.reference),
    locale,
    sample: override?.sample,
  };
}

/** "ARFA-AF-2026-7K4Q9XRM-Jane-Doe-certificate.pdf" (the reference already starts with ARFA). */
export function certFileName(c: { reference: string; recipientName: string }, ext: "pdf" | "png"): string {
  const who = c.recipientName.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${c.reference}-${who || "learner"}-certificate.${ext}`;
}
