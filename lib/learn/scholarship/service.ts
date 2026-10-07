import { createHash, randomBytes, randomUUID } from "crypto";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { isLocale } from "@/lib/i18n/config";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { ensureTrackPurchaseTable } from "@/lib/learn/purchases";
import { trackPriceCents } from "@/lib/learn/pricing";
import { normEmail } from "@/lib/growth/outreach/normalize";
import { ensureScholarshipTables } from "./db";
import { sendScholarshipAward } from "./emails";
import { createCoupon } from "@/lib/promotions/stripe-ops";
import { awardLetterPdf, letterFileName, type LetterData } from "./letter";
import { sendScholarshipWelcome } from "./emails";

// The Tilo Vision Scholarship: staff award it to one or more people, review
// the details, then approve it. Approval emails the recipient a single-use
// link; they create an ARFA account (or sign in) with that address, accept
// it, and choose their tracks. Each award covers a number of individual
// tracks at a percentage of the price (100% = free). It never applies to team
// plans or the monthly plan.
//
// Statuses: draft → approved (emailed) → claimed; any of them → revoked.

export const SCHOLARSHIP_NAME = "Tilo Vision Scholarship";
export const MAX_TRACKS = 20;
export const MAX_RECIPIENTS = 50;
export const OFFER_DAYS = { min: 3, max: 180, default: 30 };
/** Optional conditions: days after accepting to choose tracks, and to complete them. */
export const PICK_DAYS = { min: 7, max: 365 };
export const COMPLETE_DAYS = { min: 14, max: 730 };
/** How a partner organisation is mentioned on the award. */
export const PARTNER_ROLES = ["partnership", "nominated", "through"] as const;
export type PartnerRole = (typeof PARTNER_ROLES)[number];
export const partnerRoleOf = (v: unknown): PartnerRole => (PARTNER_ROLES.includes(v as PartnerRole) ? (v as PartnerRole) : "partnership");
/** Stripe will not charge less than this; a smaller remainder is rounded up. */
const STRIPE_MIN_CENTS = 50;

export type ScholarshipStatus = "draft" | "approved" | "claimed" | "revoked";
/** Scholarships that block another award to the same address. */
const OPEN: ScholarshipStatus[] = ["draft", "approved", "claimed"];

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const newToken = () => randomBytes(24).toString("base64url");
export const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;

function newCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `TVS-${new Date().getUTCFullYear()}-${s}`;
}

/** What the learner pays for one track under a scholarship, in cents. */
export function scholarshipPriceCents(listCents: number, coveragePct: number): number {
  if (coveragePct >= 100) return 0;
  const left = Math.round((listCents * (100 - coveragePct)) / 100);
  return left > 0 && left < STRIPE_MIN_CENTS ? STRIPE_MIN_CENTS : left;
}

/** Plain text typed by staff: no control characters, trimmed, capped. */
export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
  return s || null;
}

// ── Tracks ────────────────────────────────────────────────────────────────

export interface LiveTrack {
  id: string;
  slug: string;
  title: string;
  titleFr: string | null;
  priceCents: number;
}

export async function liveTracks(): Promise<LiveTrack[]> {
  await ensureLearnEditColumns().catch(() => {});
  const rows = await prisma.learnTrack.findMany({
    where: { status: "live" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, title: true, titleFr: true, level: true, priceCents: true },
  });
  return rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title, titleFr: r.titleFr, priceCents: trackPriceCents(r.level, r.priceCents) }));
}

/** The live tracks a scholarship can be used on (its list, or every live track). */
export function eligibleTracks(all: LiveTrack[], trackIds: string[]): LiveTrack[] {
  return trackIds.length ? all.filter((t) => trackIds.includes(t.id)) : all;
}

// ── Staff: create, edit, approve, resend, revoke ─────────────────────────

export interface AwardInput {
  recipients: Array<{ name: string; email: string; locale?: string | null }>;
  trackCount: number;
  coveragePct: number;
  trackIds: string[];
  message?: string | null;
  note?: string | null;
  offerDays?: number | null;
  sponsorName?: string | null;
  sponsorEmail?: string | null;
  pickDays?: number | null;
  completeDays?: number | null;
  partnerName?: string | null;
  partnerRole?: string | null;
  /** The public application this award answers. */
  applicationId?: string | null;
}

export class ScholarshipError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

async function validateTerms(trackCount: number, coveragePct: number, trackIds: string[]): Promise<string[]> {
  if (!Number.isInteger(coveragePct) || coveragePct < 1 || coveragePct > 100) throw new ScholarshipError("Coverage must be a whole percentage from 1 to 100.");
  if (!Number.isInteger(trackCount) || trackCount < 1 || trackCount > MAX_TRACKS) throw new ScholarshipError(`Tracks must be a whole number from 1 to ${MAX_TRACKS}.`);
  const live = await liveTracks();
  const ids = [...new Set(trackIds)];
  const unknown = ids.filter((id) => !live.some((t) => t.id === id));
  if (unknown.length) throw new ScholarshipError("One of the chosen tracks is not live. Refresh the page and choose again.");
  const pool = ids.length ? ids.length : live.length;
  if (trackCount > pool) {
    throw new ScholarshipError(
      ids.length
        ? `You chose ${ids.length} track(s) to choose from but ${trackCount} tracks to cover. Add tracks or lower the number.`
        : `There are only ${live.length} live tracks.`,
    );
  }
  return ids;
}

/**
 * Creates one draft per recipient. Addresses that already hold an open
 * scholarship (draft, approved or claimed) are skipped and reported.
 */
export async function createDrafts(input: AwardInput, actorEmail: string): Promise<{ created: Array<{ id: string; email: string }>; skipped: Array<{ email: string; reason: string }> }> {
  await ensureScholarshipTables();
  if (!input.recipients.length) throw new ScholarshipError("Add at least one recipient.");
  if (input.recipients.length > MAX_RECIPIENTS) throw new ScholarshipError(`At most ${MAX_RECIPIENTS} recipients at a time.`);
  const trackIds = await validateTerms(input.trackCount, input.coveragePct, input.trackIds);
  const offerDays = clampOfferDays(input.offerDays);
  const extra = conditions(input);

  const created: Array<{ id: string; email: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];
  const seen = new Set<string>();
  for (const r of input.recipients) {
    const email = normEmail(r.email);
    const name = cleanText(r.name, 120);
    if (!email) {
      skipped.push({ email: String(r.email ?? "").slice(0, 254), reason: "Not a valid email address" });
      continue;
    }
    if (!name) {
      skipped.push({ email, reason: "Name missing" });
      continue;
    }
    if (seen.has(email)) {
      skipped.push({ email, reason: "Listed twice" });
      continue;
    }
    seen.add(email);
    const open = await prisma.scholarship.findFirst({ where: { email, status: { in: OPEN } }, select: { code: true, status: true } });
    if (open) {
      skipped.push({ email, reason: `Already has scholarship ${open.code} (${open.status})` });
      continue;
    }
    const known = await prisma.student.findUnique({ where: { email }, select: { locale: true } });
    const locale = isLocale(r.locale) ? r.locale : isLocale(known?.locale) ? known!.locale : "en";
    const id = randomUUID();
    await prisma.scholarship.create({
      data: {
        id,
        code: newCode(),
        name,
        email,
        locale,
        trackCount: input.trackCount,
        coveragePct: input.coveragePct,
        trackIds,
        message: cleanText(input.message, 1000),
        note: cleanText(input.note, 1000),
        offerDays,
        ...extra,
        applicationId: input.applicationId ?? null,
        createdBy: actorEmail,
      },
    });
    created.push({ id, email });
  }
  return { created, skipped };
}

/** Sponsor and deadlines, checked. Undefined fields are left out (for edits). */
function conditions(v: { sponsorName?: string | null; sponsorEmail?: string | null; pickDays?: number | null; completeDays?: number | null; partnerName?: string | null; partnerRole?: string | null }) {
  const out: { sponsorName?: string | null; sponsorEmail?: string | null; pickDays?: number | null; completeDays?: number | null; partnerName?: string | null; partnerRole?: string | null } = {};
  if (v.sponsorName !== undefined) out.sponsorName = cleanText(v.sponsorName, 120);
  if (v.partnerName !== undefined) {
    out.partnerName = cleanText(v.partnerName, 120);
    out.partnerRole = out.partnerName ? partnerRoleOf(v.partnerRole) : null;
  } else if (v.partnerRole !== undefined) out.partnerRole = partnerRoleOf(v.partnerRole);
  if (v.sponsorEmail !== undefined) {
    const e = v.sponsorEmail ? normEmail(v.sponsorEmail) : null;
    if (v.sponsorEmail && !e) throw new ScholarshipError("The sponsor email is not a valid address.");
    out.sponsorEmail = e;
  }
  const days = (n: number | null | undefined, r: { min: number; max: number }, what: string) => {
    if (n == null) return null;
    if (!Number.isInteger(n) || n < r.min || n > r.max) throw new ScholarshipError(`${what} must be from ${r.min} to ${r.max} days.`);
    return n;
  };
  if (v.pickDays !== undefined) out.pickDays = days(v.pickDays, PICK_DAYS, "Time to choose tracks");
  if (v.completeDays !== undefined) out.completeDays = days(v.completeDays, COMPLETE_DAYS, "Time to complete");
  if (out.pickDays && out.completeDays && out.completeDays < out.pickDays) throw new ScholarshipError("Time to complete must be at least the time to choose tracks.");
  return out;
}

function clampOfferDays(v: number | null | undefined): number {
  const n = Number.isInteger(v) ? (v as number) : OFFER_DAYS.default;
  return Math.min(OFFER_DAYS.max, Math.max(OFFER_DAYS.min, n));
}

export interface EditInput {
  name?: string;
  email?: string;
  locale?: string;
  trackCount?: number;
  coveragePct?: number;
  trackIds?: string[];
  message?: string | null;
  note?: string | null;
  offerDays?: number;
  sponsorName?: string | null;
  sponsorEmail?: string | null;
  pickDays?: number | null;
  completeDays?: number | null;
  partnerName?: string | null;
  partnerRole?: string | null;
}

/**
 * Edits an award. A draft can change anything. Once approved, the recipient
 * has been told the terms: only the number of tracks (never below what is
 * used), the track list, the deadlines (to give more time), the sponsor, the
 * partner mention and the internal note can change.
 */
export async function editScholarship(id: string, patch: EditInput): Promise<void> {
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findUnique({ where: { id } });
  if (!s) throw new ScholarshipError("Scholarship not found.", 404);
  if (s.status === "revoked") throw new ScholarshipError("This scholarship was revoked.", 409);
  const draft = s.status === "draft";
  const lockedField = (["name", "email", "locale", "coveragePct", "message", "offerDays"] as const).find((k) => patch[k] !== undefined);
  if (!draft && lockedField) throw new ScholarshipError("After approval only the number of tracks, the track list, the deadlines, the sponsor and the note can change.", 409);

  const trackCount = patch.trackCount ?? s.trackCount;
  const coveragePct = patch.coveragePct ?? s.coveragePct;
  const trackIds = await validateTerms(trackCount, coveragePct, patch.trackIds ?? s.trackIds);
  const used = await prisma.scholarshipTrack.count({ where: { scholarshipId: id } });
  if (trackCount < used) throw new ScholarshipError(`${used} track(s) are already unlocked with it.`, 409);

  const cond = conditions(patch);
  const pickDays = cond.pickDays !== undefined ? cond.pickDays : s.pickDays;
  const completeDays = cond.completeDays !== undefined ? cond.completeDays : s.completeDays;
  if (pickDays && completeDays && completeDays < pickDays) throw new ScholarshipError("Time to complete must be at least the time to choose tracks.");
  const data: Record<string, unknown> = { trackCount, trackIds, ...cond, updatedAt: new Date() };
  if (patch.note !== undefined) data.note = cleanText(patch.note, 1000);
  if (draft) {
    if (patch.name !== undefined) {
      const name = cleanText(patch.name, 120);
      if (!name) throw new ScholarshipError("Name missing.");
      data.name = name;
    }
    if (patch.email !== undefined) {
      const email = normEmail(patch.email);
      if (!email) throw new ScholarshipError("Not a valid email address.");
      const other = await prisma.scholarship.findFirst({ where: { email, status: { in: OPEN }, id: { not: id } }, select: { code: true } });
      if (other) throw new ScholarshipError(`That address already has scholarship ${other.code}.`, 409);
      data.email = email;
    }
    if (patch.locale !== undefined && isLocale(patch.locale)) data.locale = patch.locale;
    if (patch.coveragePct !== undefined) data.coveragePct = coveragePct;
    if (patch.message !== undefined) data.message = cleanText(patch.message, 1000);
    if (patch.offerDays !== undefined) data.offerDays = clampOfferDays(patch.offerDays);
  }
  const n = await prisma.scholarship.updateMany({ where: { id, status: s.status }, data });
  if (n.count !== 1) throw new ScholarshipError("It changed meanwhile. Refresh and try again.", 409);
}

export async function deleteDraft(id: string): Promise<boolean> {
  await ensureScholarshipTables();
  const n = await prisma.scholarship.deleteMany({ where: { id, status: "draft" } });
  return n.count === 1;
}

type Row = NonNullable<Awaited<ReturnType<typeof prisma.scholarship.findUnique>>>;

/** What the award letter shows, for one scholarship in one language. */
export async function letterData(s: Row, locale: string): Promise<LetterData> {
  const all = await liveTracks();
  return {
    name: s.name,
    code: s.code,
    coveragePct: s.coveragePct,
    trackCount: s.trackCount,
    tracks: s.trackIds.length ? eligibleTracks(all, s.trackIds).map((t) => (locale === "fr" && t.titleFr ? t.titleFr : t.title)) : [],
    issuedAt: s.approvedAt ?? new Date(),
    acceptBy: s.status === "approved" || s.status === "draft" ? s.offerExpiresAt ?? (s.status === "draft" ? new Date(Date.now() + s.offerDays * 86_400_000) : null) : null,
    pickDays: s.pickDays,
    completeDays: s.completeDays,
    sponsorName: s.sponsorName,
    partner: s.partnerName ? { name: s.partnerName, role: partnerRoleOf(s.partnerRole) } : null,
    locale,
    draft: s.status === "draft",
  };
}

/** The award letter PDF for a scholarship (DRAFT watermark before approval). */
export async function letterFor(s: Row, locale?: string): Promise<{ pdf: Buffer; filename: string }> {
  return { pdf: await awardLetterPdf(await letterData(s, locale && isLocale(locale) ? locale : s.locale)), filename: letterFileName(s.code) };
}

async function emailAward(id: string, token: string, opts: { reminder?: boolean } = {}): Promise<void> {
  const s = await prisma.scholarship.findUnique({ where: { id } });
  if (!s || !s.offerExpiresAt) return;
  const [known, all] = await Promise.all([
    prisma.student.findUnique({ where: { email: s.email }, select: { id: true, locale: true } }),
    liveTracks(),
  ]);
  const locale = known?.locale && isLocale(known.locale) ? known.locale : s.locale;
  // The award letter rides along as a PDF; the email still goes if it fails.
  const letter = opts.reminder ? null : await letterFor(s, locale).catch((err) => {
    console.error("[scholarship] letter", id, err instanceof Error ? err.message : err);
    return null;
  });
  await sendScholarshipAward({
    letter,
    reminder: opts.reminder,
    sponsorName: s.sponsorName,
    partner: s.partnerName ? { name: s.partnerName, role: partnerRoleOf(s.partnerRole) } : null,
    pickDays: s.pickDays,
    completeDays: s.completeDays,
    email: s.email,
    name: s.name,
    code: s.code,
    locale,
    token,
    coveragePct: s.coveragePct,
    trackCount: s.trackCount,
    tracks: s.trackIds.length ? eligibleTracks(all, s.trackIds).map((t) => (locale === "fr" && t.titleFr ? t.titleFr : t.title)) : [],
    message: s.message,
    expiresAt: s.offerExpiresAt,
    hasAccount: !!known,
  });
  await prisma.scholarship.update({ where: { id }, data: { emailedAt: new Date() } });
}

/**
 * Approves a reviewed draft and emails the congratulations with its link.
 * Returns emailed=false when the email failed (it stays approved: resend).
 */
export async function approveScholarship(id: string, actorEmail: string): Promise<{ emailed: boolean }> {
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findUnique({ where: { id } });
  if (!s) throw new ScholarshipError("Scholarship not found.", 404);
  if (s.status !== "draft") throw new ScholarshipError("Only a draft can be approved.", 409);
  await validateTerms(s.trackCount, s.coveragePct, s.trackIds);
  const token = newToken();
  const now = new Date();
  const n = await prisma.scholarship.updateMany({
    where: { id, status: "draft" },
    data: {
      status: "approved",
      tokenHash: hashToken(token),
      approvedAt: now,
      approvedBy: actorEmail,
      offerExpiresAt: new Date(now.getTime() + s.offerDays * 86_400_000),
      updatedAt: now,
    },
  });
  if (n.count !== 1) throw new ScholarshipError("It changed meanwhile. Refresh and try again.", 409);
  try {
    await emailAward(id, token);
    return { emailed: true };
  } catch (err) {
    console.error("[scholarship] award email", id, err instanceof Error ? err.message : err);
    return { emailed: false };
  }
}

/** A new link (the old one stops working) and a fresh offer period, emailed again. */
export async function resendScholarship(id: string): Promise<{ emailed: boolean }> {
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findUnique({ where: { id } });
  if (!s) throw new ScholarshipError("Scholarship not found.", 404);
  if (s.status !== "approved") throw new ScholarshipError("Only an approved scholarship that is not accepted yet can be resent.", 409);
  const token = newToken();
  const n = await prisma.scholarship.updateMany({
    where: { id, status: "approved" },
    data: { tokenHash: hashToken(token), offerExpiresAt: new Date(Date.now() + s.offerDays * 86_400_000), updatedAt: new Date() },
  });
  if (n.count !== 1) throw new ScholarshipError("It changed meanwhile. Refresh and try again.", 409);
  try {
    await emailAward(id, token);
    return { emailed: true };
  } catch (err) {
    console.error("[scholarship] award email", id, err instanceof Error ? err.message : err);
    return { emailed: false };
  }
}

/**
 * Reminder before the offer ends: a new link (the emailed one is only stored
 * hashed, so it cannot be repeated), same end date. Daily job.
 */
export async function sendOfferReminder(id: string): Promise<void> {
  const token = newToken();
  const n = await prisma.scholarship.updateMany({ where: { id, status: "approved" }, data: { tokenHash: hashToken(token), updatedAt: new Date() } });
  if (n.count !== 1) return;
  await emailAward(id, token, { reminder: true });
}

/**
 * Revokes an award: the link stops working and no more tracks can be chosen.
 * Tracks already unlocked stay, unless removeFree: then the free ones (paid
 * nothing) are taken away. Tracks the learner paid for always stay.
 */
export async function revokeScholarship(id: string, actorEmail: string, removeFree: boolean): Promise<{ removed: number }> {
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findUnique({ where: { id } });
  if (!s) throw new ScholarshipError("Scholarship not found.", 404);
  if (s.status === "revoked") return { removed: 0 };
  if (s.status === "draft") throw new ScholarshipError("A draft is deleted, not revoked.", 409);
  await prisma.scholarship.updateMany({
    where: { id, status: s.status },
    data: { status: "revoked", tokenHash: null, revokedAt: new Date(), revokedBy: actorEmail, updatedAt: new Date() },
  });
  let removed = 0;
  if (removeFree) {
    await ensureTrackPurchaseTable();
    const free = await prisma.scholarshipTrack.findMany({ where: { scholarshipId: id, paidCents: 0 }, select: { studentId: true, trackId: true } });
    for (const f of free) {
      const r = await prisma.trackPurchase.deleteMany({ where: { studentId: f.studentId, trackId: f.trackId, stripeSessionId: freeKey(id, f.trackId) } });
      removed += r.count;
    }
  }
  return { removed };
}

// ── Recipient: the link, accepting, choosing tracks ──────────────────────

export interface ScholarshipOffer {
  id: string;
  code: string;
  name: string;
  email: string;
  coveragePct: number;
  trackCount: number;
  trackIds: string[];
  status: ScholarshipStatus;
  studentId: string | null;
  expired: boolean;
  expiresAt: Date | null;
  partner: { name: string; role: PartnerRole } | null;
}

/** What an emailed link points to, or null for an unknown, replaced or revoked link. */
export async function previewOffer(token: string): Promise<ScholarshipOffer | null> {
  if (!TOKEN_RE.test(token)) return null;
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!s || (s.status !== "approved" && s.status !== "claimed")) return null;
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    email: s.email,
    coveragePct: s.coveragePct,
    trackCount: s.trackCount,
    trackIds: s.trackIds,
    status: s.status as ScholarshipStatus,
    studentId: s.studentId,
    expired: s.status === "approved" && (!s.offerExpiresAt || s.offerExpiresAt <= new Date()),
    expiresAt: s.offerExpiresAt,
    partner: s.partnerName ? { name: s.partnerName, role: partnerRoleOf(s.partnerRole) } : null,
  };
}

export type AcceptResult = "ok" | "invalid" | "expired" | "wrongEmail" | "taken";

/** Accepts an award with its link, for the signed-in learner with the awarded address. */
export async function acceptOffer(token: string, student: { id: string; email: string }): Promise<AcceptResult> {
  const offer = await previewOffer(token);
  if (!offer) return "invalid";
  if (offer.status === "claimed") return offer.studentId === student.id ? "ok" : "taken";
  if (offer.expired) return "expired";
  if (offer.email !== student.email.trim().toLowerCase()) return "wrongEmail";
  // Conditional update: two clicks accept it once. The link keeps working
  // for this learner (it leads to the scholarship page).
  const n = await prisma.scholarship.updateMany({
    where: { id: offer.id, status: "approved", tokenHash: hashToken(token) },
    data: { status: "claimed", studentId: student.id, claimedAt: new Date(), updatedAt: new Date() },
  });
  if (n.count === 1) {
    await welcome(offer.id).catch((err) => console.error("[scholarship] welcome", offer.id, err instanceof Error ? err.message : err));
    return "ok";
  }
  const now = await prisma.scholarship.findUnique({ where: { id: offer.id }, select: { studentId: true } });
  return now?.studentId === student.id ? "ok" : "invalid";
}

/** The welcome email, once, when a scholarship is accepted. */
async function welcome(id: string): Promise<void> {
  const n = await prisma.scholarship.updateMany({ where: { id, welcomedAt: null }, data: { welcomedAt: new Date() } });
  if (n.count !== 1) return;
  const s = await prisma.scholarship.findUnique({ where: { id } });
  if (!s || !s.studentId) return;
  const st = await prisma.student.findUnique({ where: { id: s.studentId }, select: { name: true, email: true, locale: true } });
  if (!st) return;
  const d = deadlines(s);
  await sendScholarshipWelcome({
    email: st.email,
    name: st.name,
    locale: st.locale,
    code: s.code,
    coveragePct: s.coveragePct,
    trackCount: s.trackCount,
    pickBy: d.pickBy,
    completeBy: d.completeBy,
    sponsorName: s.sponsorName,
    partner: s.partnerName ? { name: s.partnerName, role: partnerRoleOf(s.partnerRole) } : null,
  });
}

/** When the tracks must be chosen by, and the completion target, from acceptance. */
export function deadlines(s: { claimedAt: Date | null; pickDays: number | null; completeDays: number | null }): { pickBy: Date | null; completeBy: Date | null } {
  if (!s.claimedAt) return { pickBy: null, completeBy: null };
  const at = s.claimedAt.getTime();
  return {
    pickBy: s.pickDays ? new Date(at + s.pickDays * 86_400_000) : null,
    completeBy: s.completeDays ? new Date(at + s.completeDays * 86_400_000) : null,
  };
}

export interface MyScholarship {
  id: string;
  code: string;
  coveragePct: number;
  trackCount: number;
  trackIds: string[];
  claimedAt: Date | null;
  picks: Array<{ trackId: string; paidCents: number; coveredCents: number; createdAt: Date }>;
  /** Tracks still to choose (0 once the choice deadline has passed). */
  remaining: number;
  pickBy: Date | null;
  completeBy: Date | null;
  /** The time to choose tracks is over (unused tracks expired). */
  picksClosed: boolean;
  sponsorName: string | null;
  partner: { name: string; role: PartnerRole } | null;
}

/** The learner's accepted scholarships (normally one), with what they unlocked. */
export async function scholarshipsFor(studentId: string): Promise<MyScholarship[]> {
  try {
    await ensureScholarshipTables();
    const rows = await prisma.scholarship.findMany({ where: { studentId, status: "claimed" }, orderBy: { claimedAt: "asc" } });
    if (!rows.length) return [];
    const picks = await prisma.scholarshipTrack.findMany({ where: { scholarshipId: { in: rows.map((r) => r.id) } }, orderBy: { createdAt: "asc" } });
    return rows.map((r) => {
      const mine = picks.filter((p) => p.scholarshipId === r.id);
      const d = deadlines(r);
      const picksClosed = !!d.pickBy && d.pickBy.getTime() <= Date.now();
      return {
        id: r.id,
        code: r.code,
        coveragePct: r.coveragePct,
        trackCount: r.trackCount,
        trackIds: r.trackIds,
        claimedAt: r.claimedAt,
        picks: mine.map((p) => ({ trackId: p.trackId, paidCents: p.paidCents, coveredCents: p.coveredCents, createdAt: p.createdAt })),
        remaining: picksClosed ? 0 : Math.max(0, r.trackCount - mine.length),
        pickBy: d.pickBy,
        completeBy: d.completeBy,
        picksClosed,
        sponsorName: r.sponsorName,
        partner: r.partnerName ? { name: r.partnerName, role: partnerRoleOf(r.partnerRole) } : null,
      };
    });
  } catch (err) {
    console.error("[scholarship] read", err);
    return [];
  }
}

/**
 * The award's Stripe coupon (percent off = coverage), so Stripe Checkout
 * shows the full price, a "Tilo Vision Scholarship" discount line with the
 * saving, and what is owed. Created once per award. A coupon without a
 * promotion code cannot be typed by anyone: only this server applies it.
 * Null when Stripe refuses; checkout then charges the reduced price directly.
 */
async function scholarshipCoupon(id: string, code: string, coveragePct: number): Promise<string | null> {
  const row = await prisma.scholarship.findUnique({ where: { id }, select: { stripeCouponId: true } });
  if (row?.stripeCouponId) return row.stripeCouponId;
  try {
    const couponId = await createCoupon({
      name: `Tilo Vision Scholarship ${coveragePct}%`,
      kind: "percent",
      percentOff: coveragePct,
      duration: "once",
      metadata: { scholarshipId: id, scholarshipCode: code },
    });
    await prisma.scholarship.updateMany({ where: { id, stripeCouponId: null }, data: { stripeCouponId: couponId } });
    const now = await prisma.scholarship.findUnique({ where: { id }, select: { stripeCouponId: true } });
    return now?.stripeCouponId ?? couponId;
  } catch (err) {
    console.error("[scholarship] coupon", id, err instanceof Error ? err.message : err);
    return null;
  }
}

/** The stand-in "session id" on a TrackPurchase unlocked free with a scholarship. */
const freeKey = (scholarshipId: string, trackId: string) => `scholarship:${scholarshipId}:${trackId}`;

export type PickResult =
  | { kind: "unlocked"; slug: string }
  | { kind: "checkout"; track: LiveTrack; amountCents: number; scholarshipId: string; code: string; coveragePct: number; couponId: string | null }
  | { kind: "error"; error: "notFound" | "full" | "notEligible" | "owned" | "closed"; status: number };

/**
 * Uses one of the learner's scholarship tracks. Free (100%): the track opens
 * now. Otherwise the caller sends them to checkout at the scholarship price;
 * the track opens when Stripe confirms payment (recordScholarshipPayment).
 */
export async function pickTrack(student: { id: string }, scholarshipId: string, trackId: string, ownedTrackIds: string[]): Promise<PickResult> {
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findUnique({ where: { id: scholarshipId } });
  if (!s || s.status !== "claimed" || s.studentId !== student.id) return { kind: "error", error: "notFound", status: 404 };
  const due = deadlines(s).pickBy;
  if (due && due.getTime() <= Date.now()) return { kind: "error", error: "closed", status: 410 };
  const track = eligibleTracks(await liveTracks(), s.trackIds).find((t) => t.id === trackId);
  if (!track) return { kind: "error", error: "notEligible", status: 400 };
  if (ownedTrackIds.includes(trackId)) return { kind: "error", error: "owned", status: 409 };
  const used = await prisma.scholarshipTrack.count({ where: { scholarshipId } });
  if (used >= s.trackCount) return { kind: "error", error: "full", status: 409 };

  const amountCents = scholarshipPriceCents(track.priceCents, s.coveragePct);
  if (amountCents > 0) {
    const couponId = await scholarshipCoupon(s.id, s.code, s.coveragePct);
    return { kind: "checkout", track, amountCents, scholarshipId, code: s.code, coveragePct: s.coveragePct, couponId };
  }

  // Free: the slot and the track in one transaction, the scholarship row
  // locked so two quick clicks cannot use more tracks than awarded.
  await ensureTrackPurchaseTable();
  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ trackCount: number; status: string }>>`
      SELECT "trackCount", "status" FROM "Scholarship" WHERE "id" = ${scholarshipId} FOR UPDATE`;
    if (!locked[0] || locked[0].status !== "claimed") return "notFound" as const;
    const n = await tx.scholarshipTrack.count({ where: { scholarshipId } });
    if (n >= locked[0].trackCount) return "full" as const;
    const added = await tx.$executeRaw`
      INSERT INTO "TrackPurchase" ("id", "studentId", "trackId", "amountCents", "currency", "stripeSessionId", "stripePaymentIntent")
      VALUES (${randomUUID()}, ${student.id}, ${trackId}, 0, 'usd', ${freeKey(scholarshipId, trackId)}, NULL)
      ON CONFLICT DO NOTHING`;
    if (added !== 1) return "owned" as const;
    await tx.scholarshipTrack.create({
      data: { id: randomUUID(), scholarshipId, studentId: student.id, trackId, listCents: track.priceCents, paidCents: 0, coveredCents: track.priceCents },
    });
    return "ok" as const;
  });
  if (result === "ok") return { kind: "unlocked", slug: track.slug };
  return { kind: "error", error: result, status: result === "notFound" ? 404 : 409 };
}

/**
 * A paid scholarship checkout completed (webhook or the buyer's return):
 * records the scholarship track. The TrackPurchase itself is recorded by the
 * usual track-purchase code. Idempotent on the Stripe session id. A payment
 * is honoured even if it went over the awarded number (two checkouts opened
 * at once): the learner paid, so the track is theirs; it is logged.
 */
export async function recordScholarshipPayment(session: Stripe.Checkout.Session): Promise<void> {
  const scholarshipId = session.metadata?.scholarshipId;
  const studentId = session.metadata?.studentId;
  const trackId = session.metadata?.trackId;
  if (!scholarshipId || !studentId || !trackId) return;
  const paid = session.payment_status === "paid" || (session.status === "complete" && session.payment_status === "no_payment_required");
  if (!paid) return;
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findUnique({ where: { id: scholarshipId }, select: { studentId: true, trackCount: true } });
  if (!s || s.studentId !== studentId) return;
  const listCents = Number(session.metadata?.listCents) || 0;
  const paidCents = session.amount_total ?? 0;
  const used = await prisma.scholarshipTrack.count({ where: { scholarshipId } });
  const n = await prisma.$executeRaw`
    INSERT INTO "ScholarshipTrack" ("id", "scholarshipId", "studentId", "trackId", "listCents", "paidCents", "coveredCents", "stripeSessionId")
    VALUES (${randomUUID()}, ${scholarshipId}, ${studentId}, ${trackId}, ${listCents}, ${paidCents}, ${Math.max(0, listCents - paidCents)}, ${session.id})
    ON CONFLICT DO NOTHING`;
  if (n > 0 && used >= s.trackCount) console.warn(`[scholarship] ${scholarshipId}: paid track ${trackId} beyond the ${s.trackCount} awarded`);
}
