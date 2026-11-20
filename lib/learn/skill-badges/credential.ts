// Builds the Open Badges 3.0 credential (an OpenBadgeCredential, which is a
// W3C Verifiable Credential) for an awarded skill badge. Server only.
//
// Shape: VC Data Model 1.1 with the Open Badges 3.0 context, issuanceDate,
// an embedded issuer Profile (did:web), an AchievementSubject identified by a
// salted SHA-256 hash of the learner's email (plus the public display name,
// "First L."), the Achievement with criteria narrative and alignments, and
// evidence that names what was passed (never the learner's work). The proof
// is added by signing.ts.
import crypto from "node:crypto";
import { FAMILY_LABEL_EN, type SkillBadgeFamily } from "./catalog";
import { issuerDid, siteBase } from "./signing";

export const OB3_CONTEXT = [
  "https://www.w3.org/2018/credentials/v1",
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json",
  "https://w3id.org/security/data-integrity/v2",
];

export interface EvidenceItem {
  name: string;
  description: string;
}

export interface AlignmentItem {
  targetName: string;
  targetUrl: string;
  targetDescription?: string;
}

export interface CredentialFacts {
  awardId: string;
  badgeKey: string;
  family: SkillBadgeFamily;
  name: string;
  description: string;
  criteria: string;
  alignments: AlignmentItem[];
  evidence: EvidenceItem[];
  issuedAt: Date;
  email: string;
  salt: string;
  displayName: string;
}

/** "Jane Mary Doe" → "Jane D."; one word stays as it is. */
export function publicDisplayName(full: string): string {
  // An address typed as a name never goes into a public, signed credential.
  const parts = full.trim().split(/\s+/).filter((p) => p && !p.includes("@"));
  if (parts.length === 0) return "ARFA Learner";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

export const newSalt = () => crypto.randomBytes(16).toString("hex");
export const newAwardId = () => crypto.randomBytes(12).toString("base64url");

/** OB 3.0 IdentityObject hash: "sha256$" + hex(SHA-256(identity + salt)). */
export function identityHash(email: string, salt: string): string {
  return "sha256$" + crypto.createHash("sha256").update(email.trim().toLowerCase() + salt, "utf8").digest("hex");
}

const isoSeconds = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

export const badgeUrl = (awardId: string) => `${siteBase()}/badges/${awardId}`;
export const badgeImageUrl = (awardId: string) => `${siteBase()}/badges/${awardId}/image`;

export function issuerProfile() {
  const base = siteBase();
  return {
    id: issuerDid(),
    type: ["Profile"],
    // Credentials already signed keep the old name; only new ones carry this.
    name: "ARFA, the TIBLOGICS AI Academy",
    url: base + "/",
    description: "ARFA (AI Readiness For All) is the TIBLOGICS AI Academy platform: AI skills training with assessed labs, exams and capstone projects.",
    image: { id: `${base}/icon.svg`, type: "Image" },
  };
}

const ACHIEVEMENT_TYPE: Record<SkillBadgeFamily, string> = {
  module: "Competency",
  skill: "Competency",
  studio: "Badge",
  capstone: "Award",
};

export function buildCredential(f: CredentialFacts): Record<string, unknown> {
  const url = badgeUrl(f.awardId);
  return {
    "@context": OB3_CONTEXT,
    id: url,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: `${f.name} (${FAMILY_LABEL_EN[f.family]})`,
    issuer: issuerProfile(),
    issuanceDate: isoSeconds(f.issuedAt),
    credentialSubject: {
      type: ["AchievementSubject"],
      identifier: [
        { type: "IdentityObject", identityType: "emailAddress", hashed: true, identityHash: identityHash(f.email, f.salt), salt: f.salt },
        { type: "IdentityObject", identityType: "name", hashed: false, identityHash: f.displayName },
      ],
      achievement: {
        id: `urn:tiblogics:achievement:${f.badgeKey}`,
        type: ["Achievement"],
        achievementType: ACHIEVEMENT_TYPE[f.family],
        name: f.name,
        description: f.description,
        criteria: { narrative: f.criteria },
        image: { id: badgeImageUrl(f.awardId), type: "Image", caption: f.name },
        alignment: f.alignments.map((a) => ({
          type: ["Alignment"],
          targetName: a.targetName,
          targetUrl: a.targetUrl,
          ...(a.targetDescription ? { targetDescription: a.targetDescription } : {}),
          targetType: "ceasn:Competency",
        })),
        tag: [FAMILY_LABEL_EN[f.family], "AI skills"],
        creator: issuerProfile(),
      },
    },
    evidence: f.evidence.map((e) => ({ type: ["Evidence"], name: e.name, description: e.description })),
  };
}

// ── Reading a stored credential (for the verify page) ─────────────────────

export interface CredentialView {
  name: string;
  achievementName: string;
  description: string;
  criteria: string;
  issuanceDate: string | null;
  displayName: string | null;
  evidence: EvidenceItem[];
  alignments: AlignmentItem[];
  issuerId: string | null;
}

export function readCredential(doc: unknown): CredentialView {
  const c = (doc ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const subject = c.credentialSubject ?? {};
  const ach = subject.achievement ?? {};
  const ids: Array<Record<string, unknown>> = Array.isArray(subject.identifier) ? subject.identifier : [];
  const nameId = ids.find((i) => i.identityType === "name" && i.hashed === false);
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    name: str(c.name),
    achievementName: str(ach.name),
    description: str(ach.description),
    criteria: str(ach.criteria?.narrative),
    issuanceDate: str(c.issuanceDate) || null,
    displayName: nameId ? str(nameId.identityHash) : null,
    evidence: (Array.isArray(c.evidence) ? c.evidence : []).map((e: Record<string, unknown>) => ({ name: str(e.name), description: str(e.description) })),
    alignments: (Array.isArray(ach.alignment) ? ach.alignment : []).map((a: Record<string, unknown>) => ({
      targetName: str(a.targetName),
      targetUrl: str(a.targetUrl),
      targetDescription: str(a.targetDescription) || undefined,
    })),
    issuerId: typeof c.issuer === "string" ? c.issuer : str(c.issuer?.id) || null,
  };
}
