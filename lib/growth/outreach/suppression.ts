import { createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { siteBase } from "./config";
import { stopByEmail } from "./leads";
import { normEmail } from "./normalize";

// Global suppression list and signed one-click unsubscribe links.
//
// The unsubscribe token is stateless — base64url(email).HMAC — so a link in an
// email sent months ago still works (CAN-SPAM: at least 30 days; CASL: must be
// honoured within 10 business days — we suppress on the click itself).

function secret(): string {
  const s = process.env.OUTREACH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("OUTREACH_SECRET or NEXTAUTH_SECRET is required for unsubscribe links");
  return s;
}

function sign(email: string): string {
  return createHmac("sha256", secret()).update(`outreach-unsub:${email}`).digest("base64url").slice(0, 32);
}

export function unsubscribeToken(email: string): string {
  return `${Buffer.from(email).toString("base64url")}.${sign(email)}`;
}

export function unsubscribeUrl(email: string): string {
  return `${siteBase()}/api/outreach/unsubscribe?t=${unsubscribeToken(email)}`;
}

/** The email a token was issued for, or null if it is forged or malformed. */
export function verifyUnsubscribeToken(token: unknown): string | null {
  if (typeof token !== "string" || token.length > 600) return null;
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  let email: string;
  try {
    email = Buffer.from(p, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const norm = normEmail(email);
  if (!norm || norm !== email) return null;
  const want = Buffer.from(sign(email));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got) ? email : null;
}

export type SuppressionReason = "unsubscribe" | "bounce" | "complaint" | "do_not_contact" | "manual";

/** Normalises "Foo@Bar.com" → "foo@bar.com", "bar.com"/"@bar.com" → "@bar.com". */
export function suppressionValue(input: string): string | null {
  const s = input.trim().toLowerCase();
  const e = normEmail(s);
  if (e) return e;
  const d = s.replace(/^@/, "");
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) ? `@${d}` : null;
}

export async function suppress(value: string, reason: SuppressionReason, source?: string, note?: string): Promise<boolean> {
  const v = suppressionValue(value);
  if (!v) return false;
  await prisma.outreachSuppression.upsert({
    where: { value: v },
    create: { value: v, reason, source: source ?? null, note: note ?? null },
    // An unsubscribe is the strongest signal; never downgrade it.
    update: reason === "unsubscribe" ? { reason } : {},
  });
  if (!v.startsWith("@")) await stopByEmail(v, reason === "unsubscribe" ? "unsubscribed" : reason);
  else {
    const leads = await prisma.growthLead.findMany({ where: { email: { endsWith: v } }, select: { email: true } });
    for (const l of leads) if (l.email) await stopByEmail(l.email, reason);
  }
  return true;
}

/** Is this address (or its whole domain) on the list? */
export async function isSuppressed(email: string): Promise<string | null> {
  const e = email.toLowerCase();
  const domain = `@${e.split("@")[1] ?? ""}`;
  const hit = await prisma.outreachSuppression.findFirst({ where: { value: { in: [e, domain] } } });
  return hit ? hit.reason : null;
}
