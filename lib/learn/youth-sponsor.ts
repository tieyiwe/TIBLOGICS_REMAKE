// AI-Empowered Youth: "Sponsor a young person". Anybody (a parent, a
// grandparent, a mentor...) pays for a child's place; the child gets a warm
// email naming who sponsored them, and the sponsor follows the child in the
// Parent & Sponsor Portal.
//
// Flow: /sponsor-youth (components/learn/youth/SponsorFlow.tsx) posts to
// /api/learn/youth/sponsor, which stores a "checkout" row and starts Stripe
// (metadata product "youth-sponsor", sponsorshipId). Payment is fulfilled by
// the success URL (/api/learn/youth/sponsor/confirm) and by the webhook, both
// idempotent (fulfillSponsorship claims the row first).
//
// Consent (lib/learn/youth-account.ts): a parent or guardian sponsor attests
// in the flow, which counts as the parent's confirmation. Anyone else
// sponsoring a child under 13 gives the parent's email: the parent gets the
// consent email first, and the child's account and welcome email wait until
// the parent confirms (releaseSponsorships). A child under 13 is never
// emailed before consent.
//
// Table "YouthSponsorship" (runtime DDL in ensureYouthColumns, also in
// prisma/schema.prisma).
import { createHash, randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { arfaMailer } from "@/lib/resend";
import { recordTrackPurchase } from "./purchases";
import { upsertTrackSubscription, youthTrackIds } from "./track-subscriptions";
import { learnEmailEsc as esc, learnEmailP as p, learnEmailShell as shell, LEARN_SITE } from "./emails";
import { translator } from "./i18n";
import { YOUTH_SIBLING_DISCOUNT_PCT, laneForAge } from "./youth";
import {
  CONSENT_AGE,
  YOUTH_MAX_AGE,
  YOUTH_MIN_AGE,
  ensureYouthColumns,
  newParentToken,
  readYouthProfile,
  youthGate,
} from "./youth-account";
import { sendParentEmail } from "./youth-emails";
import { normEmail } from "./youth-portal";
export { cleanFreeText, hasBadWords } from "./youth-text";

export const SPONSOR_PRODUCT = "youth-sponsor";
export const RELATIONSHIPS = ["parent", "guardian", "grandparent", "auntUncle", "sibling", "godparent", "friend", "mentor", "teacher", "other"] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];
export const isParentRole = (r: string) => r === "parent" || r === "guardian";
export const SPONSOR_LOCALES = ["en", "fr", "sw"] as const;

export interface SponsorshipRow {
  id: string;
  sponsorName: string;
  sponsorEmail: string;
  relationship: Relationship;
  relationshipOther: string | null;
  childFirstName: string;
  childEmail: string;
  childAge: number;
  childLocale: string;
  lane: string;
  note: string | null;
  plan: "lifetime" | "monthly";
  amountCents: number;
  siblingPct: number;
  parentEmail: string | null;
  parentAttested: boolean;
  status: "checkout" | "fulfilling" | "awaiting_consent" | "active" | "canceled";
  stripeSessionId: string | null;
  childStudentId: string | null;
  childEmailSentAt: Date | null;
  createdAt: Date;
  sponsorLocale: string;
}

// ── Storage ──────────────────────────────────────────────────────────────

const COLS = `"id","sponsorName","sponsorEmail","relationship","relationshipOther","childFirstName","childEmail","childAge","childLocale","lane","note",
  "plan","amountCents","siblingPct","parentEmail","parentAttested","status","stripeSessionId","childStudentId","childEmailSentAt","createdAt","sponsorLocale"`;

export async function getSponsorship(id: string): Promise<SponsorshipRow | null> {
  if (!/^[\w-]{1,64}$/.test(id)) return null;
  await ensureYouthColumns();
  const rows = await prisma.$queryRawUnsafe<SponsorshipRow[]>(`SELECT ${COLS} FROM "YouthSponsorship" WHERE "id" = $1`, id);
  return rows[0] ? { ...rows[0], childAge: Number(rows[0].childAge), amountCents: Number(rows[0].amountCents), siblingPct: Number(rows[0].siblingPct) } : null;
}

export async function listSponsorships(limit = 200): Promise<SponsorshipRow[]> {
  await ensureYouthColumns();
  return prisma.$queryRawUnsafe<SponsorshipRow[]>(`SELECT ${COLS} FROM "YouthSponsorship" WHERE "status" <> 'checkout' ORDER BY "createdAt" DESC LIMIT $1`, limit);
}

/**
 * The sponsor already pays for another child (a different email), or, as a
 * parent, already has a child in the program: the sibling discount applies.
 */
export async function sponsorSiblingPct(sponsorEmail: string, childEmail: string): Promise<number> {
  await ensureYouthColumns();
  const e = normEmail(sponsorEmail);
  const youth = await youthTrackIds();
  const rows = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
    `SELECT 1 AS n FROM "YouthSponsorship" WHERE "sponsorEmail" = $1 AND "childEmail" <> $2 AND "status" IN ('awaiting_consent','active')
     UNION ALL
     SELECT 1 FROM "Student" s WHERE s."parentEmail" = $1 AND s."email" <> $2
       AND (EXISTS (SELECT 1 FROM "TrackPurchase" p WHERE p."studentId" = s."id" AND p."trackId" = ANY($3::text[]))
         OR EXISTS (SELECT 1 FROM "TrackSubscription" t WHERE t."studentId" = s."id" AND t."trackId" = ANY($3::text[]) AND t."status" IN ('active','trialing','past_due')))
     LIMIT 1`,
    e, normEmail(childEmail), youth,
  ).catch(() => []);
  return rows.length ? YOUTH_SIBLING_DISCOUNT_PCT : 0;
}

export interface SponsorInput {
  sponsorName: string;
  sponsorEmail: string;
  relationship: Relationship;
  relationshipOther: string | null;
  childFirstName: string;
  childAge: number;
  childEmail: string;
  childLocale: (typeof SPONSOR_LOCALES)[number];
  lane: string;
  note: string | null;
  plan: "lifetime" | "monthly";
  parentEmail: string | null;
  parentAttested: boolean;
  sponsorLocale: string;
}

export async function createSponsorship(input: SponsorInput, amountCents: number, siblingPct: number): Promise<string> {
  await ensureYouthColumns();
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "YouthSponsorship" ("id","sponsorName","sponsorEmail","relationship","relationshipOther","childFirstName","childEmail","childAge",
      "childLocale","lane","note","plan","amountCents","siblingPct","parentEmail","parentAttested","status","sponsorLocale")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'checkout',$17)`,
    id, input.sponsorName, normEmail(input.sponsorEmail), input.relationship, input.relationshipOther, input.childFirstName, normEmail(input.childEmail),
    input.childAge, input.childLocale, input.lane, input.note, input.plan, amountCents, siblingPct,
    input.parentEmail ? normEmail(input.parentEmail) : null, input.parentAttested, input.sponsorLocale,
  );
  return id;
}

export async function setSponsorshipSession(id: string, sessionId: string): Promise<void> {
  await prisma.$executeRawUnsafe(`UPDATE "YouthSponsorship" SET "stripeSessionId" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`, id, sessionId);
}

// ── Fulfilment ───────────────────────────────────────────────────────────

const firstName = (n: string) => n.trim().split(/\s+/)[0] || n;

/** "Your grandparent, Jane," in the child's language. */
function whoSponsored(t: (k: string, v?: Record<string, string | number>) => string, s: SponsorshipRow): string {
  const sponsor = esc(firstName(s.sponsorName));
  return s.relationship === "other"
    ? t("learn.email.youth.gift.who.other", { sponsor, other: esc(s.relationshipOther ?? "") })
    : t(`learn.email.youth.gift.who.${s.relationship}`, { sponsor });
}

/**
 * Opens the place a sponsor paid for. Idempotent: the first caller claims
 * the row ("checkout" -> "fulfilling"); later calls do nothing. A failure
 * puts the row back to "checkout" so the webhook or the next visit retries.
 */
export async function fulfillSponsorship(session: Stripe.Checkout.Session, getSubscription: (id: string) => Promise<Stripe.Subscription>): Promise<SponsorshipRow | null> {
  const id = session.metadata?.sponsorshipId ?? "";
  if (session.metadata?.product !== SPONSOR_PRODUCT || !/^[\w-]{1,64}$/.test(id)) return null;
  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (!paid) return null;
  await ensureYouthColumns();
  const claimed = await prisma.$executeRawUnsafe(
    `UPDATE "YouthSponsorship" SET "status" = 'fulfilling', "stripeSessionId" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1 AND "status" = 'checkout'`,
    id, session.id,
  );
  if (!claimed) return getSponsorship(id);
  const s = (await getSponsorship(id))!;
  try {
    const track = await prisma.learnTrack.findUnique({ where: { slug: s.lane }, select: { id: true } });
    if (!track) throw new Error("lane not found");
    const childId = await childAccount(s);
    // The place itself: a purchase, or the monthly plan in the child's name.
    if (s.plan === "lifetime") {
      await recordTrackPurchase({
        studentId: childId,
        trackId: track.id,
        amountCents: session.amount_total ?? s.amountCents,
        currency: session.currency ?? "usd",
        stripeSessionId: session.id,
        stripePaymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
      });
    } else {
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
      if (!subId) throw new Error("no subscription");
      await upsertTrackSubscription(await getSubscription(subId), { studentId: childId, trackId: track.id });
    }
    const child = await readYouthProfile(childId);
    const gate = youthGate(child);
    const waiting = gate === "pending" || gate === "revoked";
    await prisma.$executeRawUnsafe(
      `UPDATE "YouthSponsorship" SET "status" = $2, "childStudentId" = $3, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
      id, waiting ? "awaiting_consent" : "active", childId,
    );
    const fresh = (await getSponsorship(id))!;
    if (!waiting) await sendChildWelcome(fresh).catch((err) => console.error("[youth-sponsor] child email", err instanceof Error ? err.message : err));
    await sendSponsorReceipt(fresh, waiting).catch((err) => console.error("[youth-sponsor] receipt", err instanceof Error ? err.message : err));
    return fresh;
  } catch (err) {
    await prisma.$executeRawUnsafe(`UPDATE "YouthSponsorship" SET "status" = 'checkout' WHERE "id" = $1 AND "status" = 'fulfilling'`, id).catch(() => {});
    throw err;
  }
}

/**
 * The child's account: a new one (birth year from the age, the parent, the
 * consent), or an existing account found by email, which is left as it is
 * (a sponsor cannot change someone's age, parent or consent by typing their
 * email). The sponsor is linked in the portal only to an account they
 * created, or as the parent.
 */
async function childAccount(s: SponsorshipRow): Promise<string> {
  const existing = await prisma.student.findUnique({ where: { email: s.childEmail }, select: { id: true } });
  if (existing) return existing.id;
  const parentEmail = isParentRole(s.relationship) ? s.sponsorEmail : s.parentEmail;
  // The sponsor gives the exact age: this birth year makes the protective
  // "youngest possible age" (lib/learn/youth-account.ts) equal to it.
  const birthYear = new Date().getUTCFullYear() - s.childAge - 1;
  const created = await prisma.student.create({
    data: { email: s.childEmail, name: s.childFirstName, locale: s.childLocale, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12) },
    select: { id: true },
  });
  // Consent: a parent or guardian sponsor attested in the flow. Otherwise
  // under 13 the parent confirms by email first.
  const consent = isParentRole(s.relationship) && s.parentAttested ? "granted" : s.childAge < CONSENT_AGE ? "pending" : "none";
  await prisma.$executeRawUnsafe(
    `UPDATE "Student" SET "birthYear" = $2, "parentEmail" = $3, "parentConsent" = $4, "parentToken" = $5,
       "parentConsentAt" = CASE WHEN $4 = 'granted' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE "id" = $1`,
    created.id, birthYear, parentEmail, consent, parentEmail ? newParentToken() : null,
  );
  if (!isParentRole(s.relationship)) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "YouthGuardian" ("id","studentId","email","role","name","invitedBy") VALUES ($1,$2,$3,'sponsor',$4,$3)
       ON CONFLICT ("studentId","email") DO UPDATE SET "revokedAt" = NULL`,
      randomUUID(), created.id, s.sponsorEmail, firstName(s.sponsorName).slice(0, 40),
    );
  }
  // The parent hears first (consent request under 13, information 13 to 17).
  const profile = await readYouthProfile(created.id);
  if (profile?.parentEmail && consent !== "granted") {
    const t = translator(profile.locale);
    await sendParentEmail(profile, p(t("learn.email.youth.gift.parentNote", { sponsor: esc(firstName(s.sponsorName)), rel: whoRel(t, s) }))).catch((err) =>
      console.error("[youth-sponsor] parent email", err instanceof Error ? err.message : err),
    );
  }
  return created.id;
}

const whoRel = (t: (k: string, v?: Record<string, string | number>) => string, s: SponsorshipRow) =>
  s.relationship === "other" ? esc(s.relationshipOther ?? "") : t(`learn.youth.sponsor.rel.${s.relationship}`).toLowerCase();

/** The child's welcome: who sponsored them, the note, what they will do, and the account link. Never a price. */
export async function sendChildWelcome(s: SponsorshipRow): Promise<void> {
  if (!s.childStudentId) throw new Error("no child account");
  const student = await prisma.student.findUnique({ where: { id: s.childStudentId }, select: { id: true, email: true, name: true, passwordHash: true, lastLoginAt: true } });
  if (!student) throw new Error("no child account");
  const t = translator(s.childLocale);
  // A new account sets its password (7 days, the reset flow); an account in
  // use signs in.
  let href = `${LEARN_SITE}/learn/login`;
  let cta = t("learn.email.youth.gift.ctaSignIn");
  if (!student.lastLoginAt) {
    const token = randomBytes(32).toString("base64url");
    await prisma.student.update({
      where: { id: student.id },
      data: { resetToken: createHash("sha256").update(token).digest("hex"), resetTokenExpires: new Date(Date.now() + 7 * 86_400_000) },
    });
    href = `${LEARN_SITE}/learn/reset?token=${encodeURIComponent(token)}`;
    cta = t("learn.email.youth.gift.cta");
  }
  const name = esc(firstName(s.childFirstName));
  const body =
    p(t("learn.email.youth.gift.p1", { name, who: whoSponsored(t, s) })) +
    (s.note ? p(`<em>“${esc(s.note)}”</em><br/><span style="color:#8A9BA0;">${esc(firstName(s.sponsorName))}</span>`) : "") +
    p(`<strong style="color:#131A1B;">${t("learn.email.youth.gift.whatTitle")}</strong>`) +
    `<ul style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;padding-left:20px;">${[1, 2, 3].map((n) => `<li>${t(`learn.email.youth.gift.what.${n}`)}</li>`).join("")}</ul>` +
    p(t("learn.email.youth.gift.p2"));
  await arfaMailer.emails.send({
    to: student.email,
    subject: t("learn.email.youth.gift.subject", { name: firstName(s.childFirstName) }),
    html: shell(t, t("learn.email.youth.gift.title", { name }), body, { href, label: `${cta} →` }),
  });
  await prisma.$executeRawUnsafe(`UPDATE "YouthSponsorship" SET "childEmailSentAt" = CURRENT_TIMESTAMP, "status" = 'active' WHERE "id" = $1`, s.id);
}

/** The sponsor's confirmation ("we've let Amara know", or "waiting for the parent"). */
async function sendSponsorReceipt(s: SponsorshipRow, waiting: boolean): Promise<void> {
  const t = translator(s.sponsorLocale);
  const child = esc(firstName(s.childFirstName));
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(s.amountCents / 100);
  const body =
    p(t(waiting ? "learn.email.youth.receipt.waiting" : "learn.email.youth.receipt.p1", { name: child })) +
    p(t(s.plan === "monthly" ? "learn.email.youth.receipt.monthly" : "learn.email.youth.receipt.lifetime", { price })) +
    (s.siblingPct ? p(t("learn.youth.siblingDiscount", { pct: s.siblingPct })) : "") +
    p(t("learn.email.youth.receipt.portal", { name: child }));
  await arfaMailer.emails.send({
    to: s.sponsorEmail,
    subject: t("learn.email.youth.receipt.subject", { name: firstName(s.childFirstName) }),
    html: shell(t, t("learn.email.youth.receipt.title", { name: esc(firstName(s.sponsorName)) }), body, { href: `${LEARN_SITE}/portal`, label: `${t("learn.email.youth.receipt.cta")} →` }),
  });
}

/** After the parent confirms: the child's welcome emails that were waiting. */
export async function releaseSponsorships(studentId: string): Promise<number> {
  await ensureYouthColumns();
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "YouthSponsorship" WHERE "childStudentId" = $1 AND "status" = 'awaiting_consent' AND "childEmailSentAt" IS NULL`,
    studentId,
  );
  let n = 0;
  for (const r of rows) {
    const s = await getSponsorship(r.id);
    if (!s) continue;
    await sendChildWelcome(s).then(() => n++).catch((err) => console.error("[youth-sponsor] release", err instanceof Error ? err.message : err));
  }
  return n;
}

/** Admin "resend": the child's welcome (only when allowed) or the parent's consent email. */
export async function resendSponsorship(id: string): Promise<"child" | "parent"> {
  const s = await getSponsorship(id);
  if (!s?.childStudentId) throw new Error("Not paid yet");
  const child = await readYouthProfile(s.childStudentId);
  const gate = youthGate(child);
  if (gate === "pending" || gate === "revoked") {
    if (!child?.parentEmail) throw new Error("No parent email");
    await sendParentEmail(child);
    return "parent";
  }
  await sendChildWelcome(s);
  return "child";
}

/** Subscription events for a sponsored monthly plan (webhook): the child's plan. */
export async function syncSponsoredSubscription(sub: Stripe.Subscription): Promise<void> {
  const id = sub.metadata?.sponsorshipId ?? "";
  const s = await getSponsorship(id);
  if (!s?.childStudentId) return;
  const track = await prisma.learnTrack.findUnique({ where: { slug: s.lane }, select: { id: true } });
  if (track) await upsertTrackSubscription(sub, { studentId: s.childStudentId, trackId: track.id });
}

export const laneForChildAge = (age: number) => laneForAge(Math.min(YOUTH_MAX_AGE, Math.max(YOUTH_MIN_AGE, age)));
