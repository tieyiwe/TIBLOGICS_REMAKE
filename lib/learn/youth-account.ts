// AI-Empowered Youth: the learner's age and their parent or guardian.
//
// Columns on "Student" (runtime DDL, also in prisma/schema.prisma and dbprep):
//   birthYear                INT       the only age data we ask for
//   parentEmail              TEXT      stored lower case; required under 18
//   parentConsent            TEXT      'none' | 'pending' | 'granted' | 'revoked'
//   parentConsentAt          TIMESTAMP when the parent confirmed (or revoked)
//   parentToken              TEXT      random, unguessable: the parent dashboard link
//   parentBoardsOptIn        BOOLEAN   parent allows the leaderboard and challenge board
//   parentEmailSentAt        TIMESTAMP last consent or information email
//   parentDeleteRequestedAt  TIMESTAMP parent asked us to delete the account
// and the table "YouthParentDigest" (one weekly parent email per child and week).
//
// The generated Prisma client may not know these columns yet (no
// `prisma generate` in some environments), so they are read and written with
// parameterised raw SQL only.
//
// Age from a birth year is approximate: `ageOf` is the age the learner
// reaches this year, so the real age is ageOf or ageOf - 1. Protective checks
// (minor, parental consent) use the younger of the two; the lane uses ageOf.
import { randomBytes } from "crypto";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { OWNER_EMAIL } from "@/lib/auth";
import { laneForAge } from "./youth";

export type ParentConsent = "none" | "pending" | "granted" | "revoked";
export type YouthGate = "setup" | "pending" | "revoked" | null;

export const YOUTH_MIN_AGE = 10;
export const YOUTH_MAX_AGE = 17;
/** Parental consent by email link below this age (COPPA). */
export const CONSENT_AGE = 13;
/** Community posting opens at this age. */
export const COMMUNITY_POST_AGE = 16;

export interface YouthProfile {
  studentId: string;
  name: string;
  email: string;
  locale: string;
  birthYear: number | null;
  parentEmail: string | null;
  parentConsent: ParentConsent;
  parentConsentAt: Date | null;
  parentToken: string | null;
  parentBoardsOptIn: boolean;
  parentEmailSentAt: Date | null;
  parentDeleteRequestedAt: Date | null;
}

const STATEMENTS = [
  `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "birthYear" INTEGER`,
  `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentEmail" TEXT`,
  `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentConsent" TEXT NOT NULL DEFAULT 'none'`,
  `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentConsentAt" TIMESTAMP(3)`,
  `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentToken" TEXT`,
  `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentBoardsOptIn" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentEmailSentAt" TIMESTAMP(3)`,
  `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentDeleteRequestedAt" TIMESTAMP(3)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Student_parentToken_key" ON "Student"("parentToken")`,
  `CREATE INDEX IF NOT EXISTS "Student_parentEmail_idx" ON "Student"("parentEmail")`,
  // One weekly summary per child, week and adult (parent or sponsor).
  `CREATE TABLE IF NOT EXISTS "YouthParentDigest" (
    "studentId" TEXT NOT NULL,
    "week" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YouthParentDigest_pkey" PRIMARY KEY ("studentId","week","email")
  )`,
  // Parent & Sponsor Portal (lib/learn/youth-portal.ts): sponsors of a child
  // (the parent is Student.parentEmail; role 'parent' rows are allowed too).
  `CREATE TABLE IF NOT EXISTS "YouthGuardian" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'sponsor',
    "name" TEXT,
    "invitedBy" TEXT,
    "weeklyOptOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "YouthGuardian_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "YouthGuardian_studentId_email_key" ON "YouthGuardian"("studentId","email")`,
  `CREATE INDEX IF NOT EXISTS "YouthGuardian_email_idx" ON "YouthGuardian"("email")`,
  // Portal sign-in links (hash of a one-time token).
  `CREATE TABLE IF NOT EXISTS "YouthPortalLogin" (
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "next" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YouthPortalLogin_pkey" PRIMARY KEY ("tokenHash")
  )`,
  `CREATE INDEX IF NOT EXISTS "YouthPortalLogin_email_idx" ON "YouthPortalLogin"("email")`,
  // Pause alerts, once per pause (pauseStart = the last learning activity) and stage.
  `CREATE TABLE IF NOT EXISTS "YouthPauseAlert" (
    "studentId" TEXT NOT NULL,
    "pauseStart" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YouthPauseAlert_pkey" PRIMARY KEY ("studentId","pauseStart","stage")
  )`,
  // Encouragements sent to a child by a parent or sponsor.
  `CREATE TABLE IF NOT EXISTS "YouthEncouragement" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromRole" TEXT NOT NULL,
    "preset" TEXT,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YouthEncouragement_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "YouthEncouragement_studentId_createdAt_idx" ON "YouthEncouragement"("studentId","createdAt")`,
  ...["YouthParentDigest", "YouthGuardian", "YouthPauseAlert", "YouthEncouragement"].map(
    (t) => `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${t}_studentId_fkey') THEN
      ALTER TABLE "${t}" ADD CONSTRAINT "${t}_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  ),
];

let ready: Promise<void> | null = null;
export function ensureYouthColumns(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

// ── Age ──────────────────────────────────────────────────────────────────

const thisYear = () => new Date().getUTCFullYear();

/** The age reached this year, or null without a birth year. */
export function ageOf(p: { birthYear: number | null } | null | undefined): number | null {
  return p?.birthYear ? thisYear() - p.birthYear : null;
}

/** The youngest the learner can be (protective checks). */
export function youngestAge(p: { birthYear: number | null } | null | undefined): number | null {
  const a = ageOf(p);
  return a == null ? null : a - 1;
}

export function isMinor(p: { birthYear: number | null } | null | undefined): boolean {
  const y = youngestAge(p);
  return y != null && y < 18;
}

export function needsParentConsent(p: { birthYear: number | null } | null | undefined): boolean {
  const y = youngestAge(p);
  return y != null && y < CONSENT_AGE;
}

/** Community posting is closed under 16 (reading stays open). */
export function canPostInCommunity(p: { birthYear: number | null } | null | undefined): boolean {
  const y = youngestAge(p);
  return y == null || y >= COMMUNITY_POST_AGE;
}

/** Accepted birth years for the program: ages 10 to 17 this year (an approximate age, see above). */
export function birthYearRange(): { min: number; max: number } {
  const y = thisYear();
  return { min: y - (YOUTH_MAX_AGE + 1), max: y - YOUTH_MIN_AGE };
}

export function inProgramRange(birthYear: number): boolean {
  const { min, max } = birthYearRange();
  return Number.isInteger(birthYear) && birthYear >= min && birthYear <= max;
}

/** The lane for a birth year (Explorer 10 to 13, Builder 14 to 17). */
export function laneForBirthYear(birthYear: number) {
  return laneForAge(Math.min(YOUTH_MAX_AGE, thisYear() - birthYear));
}

export type AgeBand = "explorer" | "builder" | "adult" | null;
export function ageBand(p: { birthYear: number | null } | null | undefined): AgeBand {
  const a = ageOf(p);
  if (a == null) return null;
  if (!isMinor(p)) return "adult";
  return laneForAge(Math.min(YOUTH_MAX_AGE, a)).endsWith("explorer") ? "explorer" : "builder";
}

/**
 * What stands between this learner and the youth lanes:
 *   "setup"    no birth year or parent email yet
 *   "revoked"  the parent turned access off
 *   "pending"  under 13 and the parent has not confirmed
 */
export function youthGate(p: YouthProfile | null): YouthGate {
  if (!p || p.birthYear == null || !p.parentEmail) return "setup";
  if (p.parentConsent === "revoked") return "revoked";
  if (needsParentConsent(p) && p.parentConsent !== "granted") return "pending";
  return null;
}

export const consentLabel = (p: YouthProfile | null): ParentConsent | "not_needed" =>
  !p ? "none" : p.parentConsent === "none" && p.birthYear != null && !needsParentConsent(p) ? "not_needed" : p.parentConsent;

// ── Read ─────────────────────────────────────────────────────────────────

const SELECT = `SELECT "id" AS "studentId", "name", "email", "locale", "birthYear", "parentEmail", "parentConsent", "parentConsentAt",
  "parentToken", "parentBoardsOptIn", "parentEmailSentAt", "parentDeleteRequestedAt" FROM "Student"`;

type Row = Omit<YouthProfile, "parentConsent"> & { parentConsent: string | null };
const toProfile = (r: Row): YouthProfile => ({
  ...r,
  birthYear: r.birthYear == null ? null : Number(r.birthYear),
  parentConsent: (["none", "pending", "granted", "revoked"].includes(r.parentConsent ?? "") ? r.parentConsent : "none") as ParentConsent,
  parentBoardsOptIn: !!r.parentBoardsOptIn,
});

async function readProfile(studentId: string): Promise<YouthProfile | null> {
  try {
    await ensureYouthColumns();
    const rows = await prisma.$queryRawUnsafe<Row[]>(`${SELECT} WHERE "id" = $1`, studentId);
    return rows[0] ? toProfile(rows[0]) : null;
  } catch (err) {
    console.error("[youth] read profile", err instanceof Error ? err.message : err);
    return null;
  }
}

/** The learner's youth profile, cached per request. Null on any failure. */
export const getYouthProfile = cache(readProfile);

/** Uncached read (after a write in the same request). */
export const readYouthProfile = readProfile;

const TOKEN_RE = /^[A-Za-z0-9_-]{40,64}$/;

/** The child behind a parent dashboard link, or null. */
export async function parentFromToken(token: string | null | undefined): Promise<YouthProfile | null> {
  if (!token || !TOKEN_RE.test(token)) return null;
  try {
    await ensureYouthColumns();
    const rows = await prisma.$queryRawUnsafe<Row[]>(`${SELECT} WHERE "parentToken" = $1`, token);
    const p = rows[0] ? toProfile(rows[0]) : null;
    // A deleted account keeps no parent link.
    if (!p || p.email.endsWith("@deleted.arfa.invalid")) return null;
    return p;
  } catch (err) {
    console.error("[youth] token lookup", err instanceof Error ? err.message : err);
    return null;
  }
}

export const newParentToken = () => randomBytes(32).toString("base64url");

// ── Write ────────────────────────────────────────────────────────────────

export class YouthProfileError extends Error {
  constructor(public code: "range" | "birth_locked" | "parent_same" | "parent_locked" | "not_found") {
    super(code);
  }
}

/**
 * Sets the birth year and parent email, chosen by the learner during
 * onboarding. The birth year cannot be changed once set (staff can), and the
 * parent email cannot be changed after the parent confirmed. A new parent
 * email gets a new dashboard link (the old one stops working) and, under 13,
 * a new consent request.
 *
 * Returns the saved profile and whether the parent should be emailed now.
 */
export async function setYouthProfile(
  studentId: string,
  input: { birthYear: number; parentEmail: string },
): Promise<{ profile: YouthProfile; notifyParent: boolean }> {
  const cur = await readProfile(studentId);
  if (!cur) throw new YouthProfileError("not_found");
  const parentEmail = input.parentEmail.trim().toLowerCase();
  if (cur.birthYear != null && cur.birthYear !== input.birthYear) throw new YouthProfileError("birth_locked");
  if (!inProgramRange(input.birthYear)) throw new YouthProfileError("range");
  if (parentEmail === cur.email.toLowerCase() || parentEmail === OWNER_EMAIL.toLowerCase()) throw new YouthProfileError("parent_same");
  const parentChanged = parentEmail !== (cur.parentEmail ?? "");
  if (parentChanged && cur.parentConsent === "granted") throw new YouthProfileError("parent_locked");

  const next = { birthYear: input.birthYear };
  const consent: ParentConsent = needsParentConsent(next)
    ? cur.parentConsent === "granted" && !parentChanged
      ? "granted"
      : cur.parentConsent === "revoked" && !parentChanged
        ? "revoked"
        : "pending"
    : cur.parentConsent === "pending"
      ? "none"
      : cur.parentConsent;
  const token = !cur.parentToken || parentChanged ? newParentToken() : cur.parentToken;
  await prisma.$executeRawUnsafe(
    `UPDATE "Student" SET "birthYear" = $2, "parentEmail" = $3, "parentConsent" = $4, "parentToken" = $5 WHERE "id" = $1`,
    studentId, input.birthYear, parentEmail, consent, token,
  );
  const profile = (await readProfile(studentId))!;
  return { profile, notifyParent: parentChanged || cur.birthYear == null };
}

export async function setParentConsent(studentId: string, consent: ParentConsent): Promise<void> {
  await ensureYouthColumns();
  await prisma.$executeRawUnsafe(
    `UPDATE "Student" SET "parentConsent" = $2, "parentConsentAt" = CURRENT_TIMESTAMP${consent === "revoked" ? `, "parentBoardsOptIn" = false` : ""} WHERE "id" = $1`,
    studentId, consent,
  );
}

export async function setParentBoards(studentId: string, allow: boolean): Promise<void> {
  await ensureYouthColumns();
  await prisma.$executeRawUnsafe(`UPDATE "Student" SET "parentBoardsOptIn" = $2 WHERE "id" = $1`, studentId, allow);
}

export async function markParentEmailSent(studentId: string): Promise<void> {
  await prisma.$executeRawUnsafe(`UPDATE "Student" SET "parentEmailSentAt" = CURRENT_TIMESTAMP WHERE "id" = $1`, studentId).catch(() => {});
}

export async function markDeleteRequested(studentId: string): Promise<void> {
  await ensureYouthColumns();
  await prisma.$executeRawUnsafe(
    `UPDATE "Student" SET "parentDeleteRequestedAt" = CURRENT_TIMESTAMP, "parentConsent" = 'revoked', "parentConsentAt" = CURRENT_TIMESTAMP, "parentBoardsOptIn" = false WHERE "id" = $1`,
    studentId,
  );
}

// ── Privacy helpers for boards and public pages ──────────────────────────

/** Birth years after this one belong to (possible) minors. */
export function minorBirthYearAbove(): number {
  return thisYear() - 19;
}

/**
 * SQL condition (for a "Student" alias) true when the learner may appear on
 * a public board: adults, and minors whose parent allowed it. The year is a
 * number computed here, never user input.
 */
export function boardVisibleSql(alias: string): string {
  return `(${alias}."birthYear" IS NULL OR ${alias}."birthYear" <= ${minorBirthYearAbove()} OR ${alias}."parentBoardsOptIn" = true)`;
}

/** Minors hidden from boards (no parent opt-in), among the given ids or all. */
export async function hiddenMinorIds(): Promise<string[]> {
  try {
    await ensureYouthColumns();
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "Student" WHERE "birthYear" > $1 AND "parentBoardsOptIn" = false`,
      minorBirthYearAbove(),
    );
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

/** Whether these learners are minors (missing = not known to be). */
export async function minorIds(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  try {
    await ensureYouthColumns();
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "Student" WHERE "id" = ANY($1::text[]) AND "birthYear" > $2`,
      ids, minorBirthYearAbove(),
    );
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}

export async function isMinorStudent(studentId: string | null | undefined): Promise<boolean> {
  if (!studentId) return false;
  return isMinor(await getYouthProfile(studentId));
}

// ── Admin ────────────────────────────────────────────────────────────────

export interface YouthAdminInfo {
  band: Exclude<AgeBand, null>;
  consent: ParentConsent | "not_needed";
  birthYear: number;
  parentEmail: string | null;
  parentEmailSentAt: Date | null;
  deleteRequestedAt: Date | null;
  boards: boolean;
}

/** Age band and consent for learners who gave a birth year (admin lists). */
export async function youthAdminInfo(ids: string[]): Promise<Map<string, YouthAdminInfo>> {
  const out = new Map<string, YouthAdminInfo>();
  if (!ids.length) return out;
  try {
    await ensureYouthColumns();
    const rows = await prisma.$queryRawUnsafe<Row[]>(`${SELECT} WHERE "id" = ANY($1::text[]) AND "birthYear" IS NOT NULL`, ids);
    for (const r of rows) {
      const p = toProfile(r);
      out.set(p.studentId, {
        band: ageBand(p) ?? "adult",
        consent: consentLabel(p),
        birthYear: p.birthYear!,
        parentEmail: p.parentEmail,
        parentEmailSentAt: p.parentEmailSentAt,
        deleteRequestedAt: p.parentDeleteRequestedAt,
        boards: p.parentBoardsOptIn,
      });
    }
  } catch (err) {
    console.error("[youth] admin info", err instanceof Error ? err.message : err);
  }
  return out;
}

// ── Sibling discount ─────────────────────────────────────────────────────

/**
 * True when another learner with the same parent email already owns or
 * subscribes to a youth lane. Server side only (lib/learn/youth.ts
 * YOUTH_SIBLING_DISCOUNT_PCT).
 */
export async function hasYouthSibling(studentId: string, youthTrackIds: string[]): Promise<boolean> {
  if (!youthTrackIds.length) return false;
  const p = await getYouthProfile(studentId);
  if (!p?.parentEmail) return false;
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT 1 AS n FROM "Student" s
        WHERE s."parentEmail" = $1 AND s."id" <> $2
          AND (EXISTS (SELECT 1 FROM "TrackPurchase" p WHERE p."studentId" = s."id" AND p."trackId" = ANY($3::text[]))
            OR EXISTS (SELECT 1 FROM "TrackSubscription" t WHERE t."studentId" = s."id" AND t."trackId" = ANY($3::text[]) AND t."status" IN ('active','trialing','past_due')))
        LIMIT 1`,
      p.parentEmail, studentId, youthTrackIds,
    );
    return rows.length > 0;
  } catch (err) {
    console.error("[youth] sibling check", err instanceof Error ? err.message : err);
    return false;
  }
}
