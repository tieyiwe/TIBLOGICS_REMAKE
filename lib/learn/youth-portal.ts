// AI-Empowered Youth: the Parent & Sponsor Portal (/portal).
//
// An adult signs in by email (a one-time link) and sees every youth learner
// linked to that email: as their parent (Student.parentEmail) or as a sponsor
// (YouthGuardian, added by the parent: a grandparent, mentor, teacher or a
// scholarship sponsor). Sponsors see progress only (first name, no settings,
// consent or deletion, which stay with the parent).
//
// Also here: encouragement messages to a child, and the pause alerts (a
// gentle nudge to the child at day 3 without learning, then one email to the
// parent and sponsors at day 5, once per pause).
//
// Tables are created by ensureYouthColumns (lib/learn/youth-account.ts).
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { arfaMailer } from "@/lib/resend";
import { createNotification } from "@/lib/learn/inbox/notifications";
import { learnEmailEsc as esc, learnEmailP as p, learnEmailShell as shell, LEARN_SITE } from "./emails";
import { translator } from "./i18n";
import { cleanFreeText } from "./youth-text";
import { ensureYouthColumns, minorBirthYearAbove, readYouthProfile, youthGate, type YouthProfile } from "./youth-account";

export type GuardianRole = "parent" | "sponsor";

/** A child is "paused" after this many days without learning: the child gets a nudge. */
export const YOUTH_PAUSE_NUDGE_DAYS = 3;
/** ...and after this many, the parent and sponsors get one email. */
export const YOUTH_PAUSE_ALERT_DAYS = 5;
/** Older pauses are not alerted (first run after a deploy, long holidays). */
const PAUSE_MAX_DAYS = 14;
export const MAX_SPONSORS = 10;
export const ENCOURAGE_MAX = 300;
export const ENCOURAGE_PER_DAY = 3;
export const ENCOURAGE_PRESETS = ["1", "2", "3", "4", "5", "6"] as const;

const DAY = 86_400_000;
const COOKIE = "arfa_portal";
const SESSION_DAYS = 30;
const LOGIN_TTL = 60 * 60 * 1000; // sign-in link from the portal: 1 hour
const ALERT_LINK_TTL = 7 * DAY; // one-tap links in emails: 7 days

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "";
const secret = () => process.env.NEXTAUTH_SECRET ?? "";
const sign = (v: string) => createHmac("sha256", secret()).update(`youth-portal:${v}`).digest("base64url");
const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const normEmail = (e: string) => e.trim().toLowerCase();

// ── Session ──────────────────────────────────────────────────────────────

/** The signed-in portal adult's email, or null. */
export async function portalAuth(): Promise<string | null> {
  if (!secret()) return null;
  try {
    const raw = (await cookies()).get(COOKIE)?.value ?? "";
    const [b64, exp, sig] = raw.split(".");
    if (!b64 || !exp || !sig) return null;
    if (!safeEq(sig, sign(`${b64}.${exp}`)) || Number(exp) < Date.now()) return null;
    return Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function portalCookie(email: string): { name: string; value: string; options: { httpOnly: true; secure: boolean; sameSite: "lax"; path: string; maxAge: number } } {
  const b64 = Buffer.from(normEmail(email)).toString("base64url");
  const exp = String(Date.now() + SESSION_DAYS * DAY);
  return {
    name: COOKIE,
    value: `${b64}.${exp}.${sign(`${b64}.${exp}`)}`,
    options: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86_400 },
  };
}
export const PORTAL_COOKIE = COOKIE;

// ── Sign-in links ────────────────────────────────────────────────────────

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/** A one-time sign-in link (opened from /portal/signin, which asks for a click first). */
export async function createLoginLink(email: string, next: string | null, ttlMs = LOGIN_TTL): Promise<string> {
  await ensureYouthColumns();
  const token = randomBytes(32).toString("base64url");
  await prisma.$executeRawUnsafe(
    `INSERT INTO "YouthPortalLogin" ("tokenHash","email","next","expiresAt") VALUES ($1,$2,$3,$4)`,
    hashToken(token), normEmail(email), next && /^\/portal(\?|$)/.test(next) ? next : null, new Date(Date.now() + ttlMs),
  );
  return `${LEARN_SITE}/portal/signin?token=${encodeURIComponent(token)}`;
}

/** Uses a sign-in link once. Returns the email and where to go, or null. */
export async function consumeLogin(token: string): Promise<{ email: string; next: string | null } | null> {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  await ensureYouthColumns();
  const rows = await prisma.$queryRawUnsafe<Array<{ email: string; next: string | null }>>(
    `UPDATE "YouthPortalLogin" SET "usedAt" = CURRENT_TIMESTAMP
      WHERE "tokenHash" = $1 AND "usedAt" IS NULL AND "expiresAt" > CURRENT_TIMESTAMP
      RETURNING "email","next"`,
    hashToken(token),
  );
  return rows[0] ?? null;
}

// ── Who sees whom ────────────────────────────────────────────────────────

export interface PortalLink {
  studentId: string;
  role: GuardianRole;
  guardianId: string | null;
  sponsorName: string | null;
  weeklyOptOut: boolean;
}

/** Every youth learner linked to this email (parent first, then sponsored). */
export async function childrenFor(email: string): Promise<PortalLink[]> {
  await ensureYouthColumns();
  const e = normEmail(email);
  const rows = await prisma.$queryRawUnsafe<Array<{ studentId: string; role: string; guardianId: string | null; name: string | null; weeklyOptOut: boolean }>>(
    `SELECT s."id" AS "studentId", 'parent' AS "role", NULL AS "guardianId", NULL AS "name", false AS "weeklyOptOut", s."createdAt"
       FROM "Student" s WHERE s."parentEmail" = $1 AND s."parentDeleteRequestedAt" IS NULL AND s."email" NOT LIKE '%@deleted.arfa.invalid'
     UNION ALL
     SELECT g."studentId", g."role", g."id", g."name", g."weeklyOptOut", s."createdAt"
       FROM "YouthGuardian" g JOIN "Student" s ON s."id" = g."studentId"
      WHERE g."email" = $1 AND g."revokedAt" IS NULL AND s."parentDeleteRequestedAt" IS NULL
        AND s."email" NOT LIKE '%@deleted.arfa.invalid' AND (s."parentEmail" IS NULL OR s."parentEmail" <> $1)
     ORDER BY "role", "createdAt"`,
    e,
  );
  return rows.map((r) => ({
    studentId: r.studentId,
    role: r.role === "parent" ? "parent" : "sponsor",
    guardianId: r.guardianId,
    sponsorName: r.name,
    weeklyOptOut: !!r.weeklyOptOut,
  }));
}

/** This adult's link to this child, or null (the check behind every portal action). */
export async function linkFor(email: string, studentId: string): Promise<PortalLink | null> {
  return (await childrenFor(email)).find((c) => c.studentId === studentId) ?? null;
}

export interface SponsorRow {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export async function sponsorsOf(studentId: string): Promise<SponsorRow[]> {
  await ensureYouthColumns();
  return prisma.$queryRawUnsafe<SponsorRow[]>(
    `SELECT "id","email","name","createdAt" FROM "YouthGuardian" WHERE "studentId" = $1 AND "role" = 'sponsor' AND "revokedAt" IS NULL ORDER BY "createdAt"`,
    studentId,
  );
}

export class PortalError extends Error {
  constructor(public key: string, public status = 400) {
    super(key);
  }
}

/** The parent adds a sponsor (or re-adds one removed earlier) and the sponsor is invited by email. */
export async function addSponsor(child: YouthProfile, input: { email: string; name: string | null }, invitedBy: string): Promise<SponsorRow> {
  const email = normEmail(input.email);
  if (email === normEmail(child.email) || email === child.parentEmail) throw new PortalError("learn.portal.err.sponsorSelf");
  if (youthGate(child)) throw new PortalError("learn.portal.err.notConfirmed", 409);
  const current = await sponsorsOf(child.studentId);
  if (current.some((s) => s.email === email)) throw new PortalError("learn.portal.err.sponsorExists", 409);
  if (current.length >= MAX_SPONSORS) throw new PortalError("learn.portal.err.sponsorMax", 409);
  const name = input.name?.replace(/[<>"]/g, "").trim().slice(0, 40) || null;
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "YouthGuardian" ("id","studentId","email","role","name","invitedBy")
     VALUES ($1,$2,$3,'sponsor',$4,$5)
     ON CONFLICT ("studentId","email") DO UPDATE SET "role" = 'sponsor', "name" = $4, "invitedBy" = $5, "revokedAt" = NULL, "weeklyOptOut" = false, "createdAt" = CURRENT_TIMESTAMP`,
    id, child.studentId, email, name, normEmail(invitedBy),
  );
  const t = translator(child.locale);
  const link = await createLoginLink(email, "/portal", ALERT_LINK_TTL);
  const who = esc(firstName(child.name));
  await arfaMailer.emails.send({
    to: email,
    subject: t("learn.email.youth.sponsor.subject", { name: firstName(child.name) }),
    html: shell(
      t,
      t("learn.email.youth.sponsor.title", { name: who }),
      p(t("learn.email.youth.sponsor.p1", { name: who })) + p(t("learn.email.youth.sponsor.p2", { name: who })),
      { href: link, label: `${t("learn.email.youth.sponsor.cta")} →` },
      p(t("learn.email.youth.sponsor.notYou")),
    ),
  });
  return (await sponsorsOf(child.studentId)).find((s) => s.email === email)!;
}

export async function removeSponsor(studentId: string, guardianId: string): Promise<boolean> {
  await ensureYouthColumns();
  const n = await prisma.$executeRawUnsafe(
    `UPDATE "YouthGuardian" SET "revokedAt" = CURRENT_TIMESTAMP WHERE "id" = $1 AND "studentId" = $2 AND "revokedAt" IS NULL`,
    guardianId, studentId,
  );
  return n > 0;
}

export async function setWeeklyOptOut(guardianId: string, optOut: boolean): Promise<void> {
  await ensureYouthColumns();
  await prisma.$executeRawUnsafe(`UPDATE "YouthGuardian" SET "weeklyOptOut" = $2 WHERE "id" = $1`, guardianId, optOut);
}

/** Signed unsubscribe link for a sponsor's weekly email (no sign-in). */
export const unsubscribeUrl = (guardianId: string) =>
  `${LEARN_SITE}/portal/unsubscribe?g=${encodeURIComponent(guardianId)}&s=${sign(`unsub:${guardianId}`)}`;
export const verifyUnsubscribe = (guardianId: string, s: string) => !!secret() && /^[\w-]{1,64}$/.test(guardianId) && safeEq(s, sign(`unsub:${guardianId}`));

/** Adults who follow a child: the parent, then active sponsors. */
export async function adultsOf(child: YouthProfile): Promise<Array<{ email: string; role: GuardianRole; guardianId: string | null; name: string | null; weeklyOptOut: boolean }>> {
  const sponsors = await prisma.$queryRawUnsafe<Array<{ id: string; email: string; name: string | null; weeklyOptOut: boolean }>>(
    `SELECT "id","email","name","weeklyOptOut" FROM "YouthGuardian" WHERE "studentId" = $1 AND "revokedAt" IS NULL AND "role" = 'sponsor'`,
    child.studentId,
  );
  return [
    ...(child.parentEmail ? [{ email: child.parentEmail, role: "parent" as const, guardianId: null, name: null, weeklyOptOut: false }] : []),
    ...sponsors.filter((s) => s.email !== child.parentEmail).map((s) => ({ email: s.email, role: "sponsor" as const, guardianId: s.id, name: s.name, weeklyOptOut: !!s.weeklyOptOut })),
  ];
}

// ── Encouragement ────────────────────────────────────────────────────────

/**
 * A short message from an adult, cleaned: plain text, at most 300
 * characters, no links and no contact details (email, phone, handles).
 * Null when it cannot be sent as written.
 */
export function cleanEncouragement(raw: string): string | null {
  return cleanFreeText(raw, ENCOURAGE_MAX, 2);
}

/** Sends one encouragement: an in-app notice for the child and an email to them. */
export async function sendEncouragement(input: {
  child: YouthProfile;
  link: PortalLink;
  fromEmail: string;
  preset: string | null;
  text: string | null;
}): Promise<void> {
  const { child, link } = input;
  if (!(await checkRateLimit(`youth-enc:${normEmail(input.fromEmail)}:${child.studentId}`, ENCOURAGE_PER_DAY, DAY))) {
    throw new PortalError("learn.portal.err.encourageLimit", 429);
  }
  const t = translator(child.locale);
  const message = input.preset ? t(`learn.youth.enc.preset.${input.preset}`, { name: firstName(child.name) }) : input.text!;
  const from =
    link.role === "parent" ? t("learn.youth.enc.fromParent") : link.sponsorName ? t("learn.youth.enc.fromNamed", { name: link.sponsorName }) : t("learn.youth.enc.fromSponsor");
  await ensureYouthColumns();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "YouthEncouragement" ("id","studentId","fromEmail","fromRole","preset","text") VALUES ($1,$2,$3,$4,$5,$6)`,
    randomUUID(), child.studentId, normEmail(input.fromEmail), link.role, input.preset, input.preset ? null : input.text,
  );
  await createNotification({
    studentId: child.studentId,
    kind: "encouragement",
    title: t("learn.youth.enc.title", { from }),
    body: message,
    linkUrl: "/learn",
    linkLabel: t("learn.youth.enc.cta"),
  });
  await arfaMailer.emails
    .send({
      to: child.email,
      subject: t("learn.youth.enc.title", { from }),
      html: shell(t, esc(t("learn.youth.enc.title", { from })), p(`“${esc(message)}”`), { href: `${LEARN_SITE}/learn`, label: `${t("learn.youth.enc.cta")} →` }),
    })
    .catch((err) => console.error("[youth-portal] encouragement email", err instanceof Error ? err.message : err));
}

// ── Pauses ───────────────────────────────────────────────────────────────

/** Last learning activity of each youth learner (minors with a parent, not revoked). */
async function lastActivity(): Promise<Array<{ id: string; lastActive: Date }>> {
  return prisma.$queryRawUnsafe<Array<{ id: string; lastActive: Date }>>(
    `SELECT s."id", GREATEST(
        COALESCE((SELECT max("completedAt") FROM "LessonProgress" WHERE "studentId" = s."id"), 'epoch'::timestamp),
        COALESCE((SELECT max("createdAt") FROM "QuizAttempt" WHERE "studentId" = s."id"), 'epoch'::timestamp),
        COALESCE((SELECT max("updatedAt") FROM "LabAttempt" WHERE "studentId" = s."id"), 'epoch'::timestamp),
        COALESCE((SELECT max("createdAt") FROM "PointsLedger" WHERE "studentId" = s."id"), 'epoch'::timestamp),
        COALESCE(s."parentConsentAt", s."createdAt")) AS "lastActive"
       FROM "Student" s
      WHERE s."birthYear" > $1 AND s."parentEmail" IS NOT NULL AND s."parentConsent" <> 'revoked'
        AND s."parentDeleteRequestedAt" IS NULL
      LIMIT 5000`,
    minorBirthYearAbove(),
  );
}

async function claim(studentId: string, pauseStart: Date, stage: string): Promise<boolean> {
  const n = await prisma.$executeRawUnsafe(
    `INSERT INTO "YouthPauseAlert" ("studentId","pauseStart","stage") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    studentId, pauseStart, stage,
  );
  return n > 0;
}
const release = (studentId: string, pauseStart: Date, stage: string) =>
  prisma.$executeRawUnsafe(`DELETE FROM "YouthPauseAlert" WHERE "studentId" = $1 AND "pauseStart" = $2 AND "stage" = $3`, studentId, pauseStart, stage).catch(() => 0);

/**
 * Daily (teams cron): day 3 of a pause, a gentle nudge to the child (in-app
 * and email); day 5, one email to the parent and each sponsor with a
 * one-tap "Send encouragement" link. Once per pause and stage; learning again
 * starts a new pause. Only for learners who can open a youth lane.
 */
export async function runYouthPauses(opts: { now?: Date; deadline?: number; holdsLane: (studentId: string) => Promise<boolean> }): Promise<{ nudges: number; alerts: number; errors: string[] }> {
  await ensureYouthColumns();
  const now = (opts.now ?? new Date()).getTime();
  let nudges = 0;
  let alerts = 0;
  const errors: string[] = [];
  for (const row of await lastActivity()) {
    if (opts.deadline && Date.now() > opts.deadline) break;
    const start = new Date(row.lastActive);
    const days = Math.floor((now - start.getTime()) / DAY);
    if (days < YOUTH_PAUSE_NUDGE_DAYS || days > PAUSE_MAX_DAYS) continue;
    const stage = days >= YOUTH_PAUSE_ALERT_DAYS ? "adults" : "nudge";
    const child = await readYouthProfile(row.id);
    if (!child || youthGate(child) || !(await opts.holdsLane(row.id))) continue;
    if (!(await claim(row.id, start, stage))) continue;
    const t = translator(child.locale);
    const name = firstName(child.name);
    try {
      if (stage === "nudge") {
        await createNotification({ studentId: child.studentId, kind: "nudge", title: t("learn.youth.nudge.title", { name }), body: t("learn.youth.nudge.body"), linkUrl: "/learn", linkLabel: t("learn.youth.nudge.cta") });
        await arfaMailer.emails.send({
          to: child.email,
          subject: t("learn.youth.nudge.title", { name }),
          html: shell(t, esc(t("learn.youth.nudge.title", { name })), p(t("learn.youth.nudge.body")), { href: `${LEARN_SITE}/learn`, label: `${t("learn.youth.nudge.cta")} →` }),
        });
        nudges++;
      } else {
        for (const adult of await adultsOf(child)) {
          const link = await createLoginLink(adult.email, `/portal?encourage=${child.studentId}`, ALERT_LINK_TTL);
          await arfaMailer.emails.send({
            to: adult.email,
            subject: t("learn.email.youth.pause.subject", { name, days }),
            html: shell(
              t,
              t("learn.email.youth.pause.title", { name: esc(name), days }),
              p(t("learn.email.youth.pause.p1", { name: esc(name), days })) + p(t("learn.email.youth.pause.p2", { name: esc(name) })),
              { href: link, label: `${t("learn.email.youth.pause.cta")} →` },
            ),
          });
        }
        alerts++;
      }
    } catch (err) {
      await release(row.id, start, stage);
      errors.push(`${row.id}: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200));
    }
  }
  return { nudges, alerts, errors: errors.slice(0, 20) };
}

/** Kept for the weekly email of a sponsor: a sign-in link to the portal. */
export const portalLinkFor = (email: string) => createLoginLink(email, "/portal", ALERT_LINK_TTL);
