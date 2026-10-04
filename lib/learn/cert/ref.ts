import { randomInt } from "crypto";
import prisma from "@/lib/prisma";

// Certificate reference numbers and the learner's name confirmation.
//
//   ARFA-AF-2026-7K4Q9XRM
//   track code (initials of the track's slug), year of issue, 8 random
//   characters without look-alikes (no 0/O, 1/I/L). Unique (database index),
//   printed on the certificate, used as the LinkedIn credential ID and in the
//   public verification link (/certificates/<reference>).
//
// A new certificate waits for the learner to type and confirm their full
// name (nameConfirmedAt); only then is it emailed and shown for download.
// Certificates issued before this existed count as confirmed.
// Columns mirror the LearnCertificate model in prisma/schema.prisma; the
// db-prepare job runs ensureCertificateColumns too.

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const STATEMENTS = [
  `ALTER TABLE "LearnCertificate" ADD COLUMN IF NOT EXISTS "reference" TEXT`,
  `ALTER TABLE "LearnCertificate" ADD COLUMN IF NOT EXISTS "nameConfirmedAt" TIMESTAMP(3)`,
  `ALTER TABLE "LearnCertificate" ADD COLUMN IF NOT EXISTS "emailedAt" TIMESTAMP(3)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LearnCertificate_reference_key" ON "LearnCertificate"("reference")`,
  // Issued before name confirmation existed: already emailed and shown.
  `UPDATE "LearnCertificate" SET "nameConfirmedAt" = "issuedAt", "emailedAt" = COALESCE("emailedAt", "issuedAt") WHERE "nameConfirmedAt" IS NULL AND "reference" IS NULL`,
];

let ready: Promise<void> | null = null;
export function ensureCertificateColumns(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
    // Every certificate gets a reference (older ones included).
    const missing = await prisma.$queryRawUnsafe<Array<{ id: string; slug: string; issuedAt: Date }>>(
      `SELECT c."id", t."slug", c."issuedAt" FROM "LearnCertificate" c JOIN "LearnTrack" t ON t."id" = c."trackId" WHERE c."reference" IS NULL`,
    );
    for (const m of missing) await assignReference(m.id, m.slug, m.issuedAt);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** "ai-ml-fundamentals" -> "AMF", "ai-governance" -> "AG". */
export function trackCode(slug: string): string {
  const parts = slug.split(/[^a-z0-9]+/i).filter(Boolean);
  const code = parts.map((p) => p[0]).join("").toUpperCase();
  return (code.length >= 2 ? code : slug.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase()).slice(0, 5);
}

export function makeReference(slug: string, at: Date = new Date()): string {
  let r = "";
  for (let i = 0; i < 8; i++) r += ALPHABET[randomInt(ALPHABET.length)];
  return `ARFA-${trackCode(slug)}-${at.getUTCFullYear()}-${r}`;
}

/** Gives a certificate its reference (retries on the rare collision). */
export async function assignReference(certId: string, slug: string, at: Date): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const ref = makeReference(slug, at);
    const n = await prisma
      .$executeRawUnsafe(`UPDATE "LearnCertificate" SET "reference" = $1 WHERE "id" = $2 AND "reference" IS NULL`, ref, certId)
      .catch(() => -1);
    if (n === 1) return ref;
    if (n === 0) break; // someone else assigned it meanwhile
  }
  const rows = await prisma.$queryRawUnsafe<Array<{ reference: string | null }>>(`SELECT "reference" FROM "LearnCertificate" WHERE "id" = $1`, certId);
  if (!rows[0]?.reference) throw new Error("Could not assign a certificate reference");
  return rows[0].reference;
}

export const REFERENCE_RE = /^ARFA-[A-Z0-9]{2,5}-\d{4}-[2-9A-HJKMNP-Z]{8}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CertView {
  id: string;
  studentId: string;
  trackId: string;
  reference: string;
  verificationId: string;
  recipientName: string;
  certificateName: string;
  distinction: boolean;
  examScore: number | null;
  issuedAt: Date;
  nameConfirmedAt: Date | null;
  emailedAt: Date | null;
  revoked: boolean;
  track: { slug: string; title: string; level: string; levelEnd: string | null; accentColor: string; tagline: string | null; estimatedHours: number };
}

/** A certificate by its reference or its older verification id. */
export async function findCertificate(key: string): Promise<CertView | null> {
  const k = key.trim();
  const byRef = REFERENCE_RE.test(k.toUpperCase());
  if (!byRef && !UUID_RE.test(k)) return null;
  await ensureCertificateColumns();
  const rows = await prisma.$queryRawUnsafe<Array<Omit<CertView, "track"> & { slug: string; title: string; level: string; levelEnd: string | null; accentColor: string; tagline: string | null; estimatedHours: number }>>(
    `SELECT c."id", c."studentId", c."trackId", c."reference", c."verificationId", c."recipientName", c."certificateName", c."distinction",
            c."examScore", c."issuedAt", c."nameConfirmedAt", c."emailedAt", c."revoked",
            t."slug", t."title", t."level", t."levelEnd", t."accentColor", t."tagline", t."estimatedHours"
     FROM "LearnCertificate" c JOIN "LearnTrack" t ON t."id" = c."trackId"
     WHERE ${byRef ? `c."reference" = $1` : `c."verificationId" = $1`} LIMIT 1`,
    byRef ? k.toUpperCase() : k,
  );
  const r = rows[0];
  if (!r) return null;
  const { slug, title, level, levelEnd, accentColor, tagline, estimatedHours, ...c } = r;
  return { ...c, track: { slug, title, level, levelEnd, accentColor, tagline, estimatedHours: Number(estimatedHours) || 0 } };
}

/**
 * The name exactly as it will be printed: letters (any alphabet), spaces,
 * hyphens, apostrophes and full stops; 2 to 70 characters; spacing tidied.
 * Returns null when it is not a name.
 */
export function cleanCertificateName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.normalize("NFC").replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
  if (s.length < 2 || s.length > 70) return null;
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*[\p{L}\p{M}.]$/u.test(s)) return null;
  if (!/\s/.test(s)) return null; // first and last name
  return s;
}

/** LinkedIn's "Add to profile" for a certificate, filled in. */
export function linkedInCertUrl(c: { certificateName: string; reference: string; issuedAt: Date }, verifyUrl: string): string {
  const q = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: c.certificateName,
    organizationName: "TIBLOGICS",
    issueYear: String(c.issuedAt.getUTCFullYear()),
    issueMonth: String(c.issuedAt.getUTCMonth() + 1),
    certUrl: verifyUrl,
    certId: c.reference,
  });
  return `https://www.linkedin.com/profile/add?${q.toString()}`;
}
