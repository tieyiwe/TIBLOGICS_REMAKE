// Student session + entitlement. Replaces the spec's RLS `is_entitled(uid)`
// with server-side authorization, since this app uses NextAuth + Prisma.
import { cache } from "react";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions, OWNER_EMAIL } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureTrackSubscriptionTables, separateMonthlyTrackIds, subscribedTrackIds } from "@/lib/learn/track-subscriptions";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { getT } from "@/lib/i18n/server";
import { purchasedTrackIds } from "@/lib/learn/purchases";
import { getMembership } from "@/lib/learn/team/access";
import { getAccountState, isLockedOut } from "@/lib/learn/account-status";

export interface StudentSession {
  id: string;
  email: string;
  name: string;
  accessibilityMode: boolean;
  locale: string;
  /** Signed in with a temporary password from an admin: must choose a new one. */
  mustChangePassword?: boolean;
}

/** Why getStudent() refused the current session (per request). */
const refusal = cache((): { reason: "locked" | "revoked" | null } => ({ reason: null }));

/** A page render or server action, as opposed to an API call. Never throws. */
async function isPageRequest(): Promise<boolean> {
  try {
    const h = await headers();
    return h.get("rsc") === "1" || !!h.get("next-action") || (h.get("accept") ?? "").includes("text/html");
  } catch {
    return false;
  }
}

/**
 * The signed-in student, or null. Admins are NOT students.
 *
 * getServerSession throws if NEXTAUTH_SECRET is missing or a cookie is
 * malformed. Unguarded, that surfaced as a 500 on every authenticated API
 * instead of a 401 — leaking a server error where a clean "not signed in"
 * belongs. Failing closed (null => unauthenticated) is both correct and safe:
 * it can only ever deny access, never grant it.
 */
export const getStudent = cache(readStudent);

async function readStudent(): Promise<StudentSession | null> {
  // The content editor added `editedAt` columns to the Learn tables. A database
  // that has not been seeded or edited since would lack them, and every query
  // that reads whole rows (the lesson page, quizzes, labs) would fail and show
  // a 404. Creating them here, once per process, covers every learner page and
  // API before they query. Failure is logged, not fatal.
  await ensureLearnEditColumns().catch((err) => console.error("[learn] editedAt columns", err));
  let studentId: string | undefined;
  let sv = 0;
  let ownerStaff = false;
  try {
    const session = await getServerSession(authOptions);
    studentId = session?.user?.studentId;
    sv = session?.user?.sv ?? 0;
    // The owner signed in to the admin (one sign-in per browser) is the
    // owner's learner account too, so checking a track never meets a sign-in
    // page or a paywall. Only the owner: other staff have no learner account.
    ownerStaff = !studentId && session?.user?.isOwner === true;
  } catch (err) {
    console.error("[learn/session] session resolution failed", err);
    return null;
  }
  if (ownerStaff) return ownerLearner();
  if (!studentId) return null;

  // Account status (admin suspend / block / delete) and "sign out
  // everywhere": one cached query per request, read alongside the student.
  // A locked account, or a session older than the account's session version,
  // counts as signed out. Pages go to /learn/account-status, which explains
  // and clears the session cookie (sending them to /learn/login would loop:
  // the proxy sends a cookie holder from the login page back to /learn).
  // APIs get null (401).
  const [student, state] = await Promise.all([
    prisma.student
      .findUnique({
        where: { id: studentId },
        select: { id: true, email: true, name: true, accessibilityMode: true, locale: true },
      })
      .catch(() => null),
    getAccountState(studentId),
  ]);
  if (!student) return null;

  const locked = isLockedOut(state);
  if (locked || sv < state.sessionVersion) {
    refusal().reason = locked ? "locked" : "revoked";
    if (await isPageRequest()) redirect(locked ? "/learn/account-status" : "/learn/account-status?signedout=1");
    return null;
  }
  return state.mustChangePassword ? { ...student, mustChangePassword: true } : student;
}

/** The owner's learner account, created on first use (as the learner sign-in does). */
async function ownerLearner(): Promise<StudentSession | null> {
  const email = OWNER_EMAIL.toLowerCase();
  const select = { id: true, email: true, name: true, accessibilityMode: true, locale: true } as const;
  try {
    const found = await prisma.student.findUnique({ where: { email }, select });
    if (found) return found;
    const { randomBytes } = await import("crypto");
    const bcrypt = (await import("bcryptjs")).default;
    return await prisma.student.create({
      data: { email, name: process.env.ADMIN_NAME ?? "Tieyiwe", passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12) },
      select,
    });
  } catch (err) {
    // A concurrent first request created it.
    console.error("[learn/session] owner learner", err);
    return prisma.student.findUnique({ where: { email }, select }).catch(() => null);
  }
}

export type Entitlement = {
  entitled: boolean;
  status: string | null;
  inGrace: boolean;
  graceUntil: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  /** Set when access comes from a team seat (lib/learn/team). */
  team?: { id: string; name: string; role: string };
  /**
   * Also opens the tracks sold on their own monthly plan
   * (lib/learn/track-monthly.ts): comps, the owner, team seats, and
   * subscribers from before those tracks were split off.
   */
  includesSeparate?: boolean;
};

const NONE: Entitlement = {
  entitled: false, status: null, inGrace: false,
  graceUntil: null, currentPeriodEnd: null, cancelAtPeriodEnd: false,
};

const COMPED: Entitlement = { ...NONE, entitled: true, status: "comped", includesSeparate: true };

/**
 * Entitled = active | trialing | comped, or past_due still inside the 7-day
 * grace window (read-only, banner shown).
 *
 * "comped" is free access granted from Admin → Test access. The site owner's
 * own learner account (OWNER_EMAIL) is always entitled, so every track can be
 * tested without paying; a paid subscription on it still takes precedence.
 */
export async function getEntitlement(studentId: string | null | undefined): Promise<Entitlement> {
  if (!studentId) return NONE;
  const own = await getIndividualEntitlement(studentId);
  if (own.entitled && !own.inGrace) return own;
  // Team plans: an active seat on an active team (or one in its grace
  // window) counts like a subscription. The learner's own subscription, when
  // healthy, still wins (it carries their billing details).
  const m = await getMembership(studentId);
  if (m?.entitled) {
    return {
      entitled: true,
      status: "active",
      // Billing is the team owner's business: no grace banner or renewal
      // date for members (the team page shows the owner a warning).
      inGrace: false,
      graceUntil: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      team: { id: m.team.id, name: m.team.name, role: m.role },
      includesSeparate: true,
    };
  }
  return own;
}

/** The learner's own subscription (or the owner's comp), ignoring teams. */
export async function getIndividualEntitlement(studentId: string | null | undefined): Promise<Entitlement> {
  if (!studentId) return NONE;
  // The subscription and the email (for the owner's comp) in parallel: one
  // round trip instead of two for learners without a subscription.
  const [sub, row] = await Promise.all([
    prisma.learnSubscription.findUnique({ where: { studentId } }).catch(() => null),
    prisma.student.findUnique({ where: { id: studentId }, select: { email: true } }).catch(() => null),
  ]);
  const isOwner = row?.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  if (!sub || sub.status === "canceled") {
    if (isOwner) return COMPED;
    if (!sub) return NONE;
  }

  const now = Date.now();
  const inGrace =
    sub.status === "past_due" && !!sub.graceUntil && sub.graceUntil.getTime() > now;
  // A free month earned through the referral program (lib/learn/referrals) is
  // comped access with an end date (plan "referral"); other comps never end.
  // An admin's "extend access by N days" is the same kind of timed comp
  // (plan "comp_timed", lib/learn/account-status/actions.ts).
  const referralCompOver =
    sub.status === "comped" && (sub.plan === "referral" || sub.plan === "comp_timed") && !!sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() <= now;
  const entitled =
    sub.status === "active" || sub.status === "trialing" || (sub.status === "comped" && !referralCompOver) || inGrace;
  // The owner is never stopped by the paywall, whatever state a test
  // subscription is in (unfinished checkout, failed payment, ended comp).
  if (!entitled && isOwner) return COMPED;

  return {
    entitled,
    status: sub.status,
    inGrace,
    graceUntil: sub.graceUntil,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    // Comps from the admin cover everything; a referral's free month is a
    // month of the all-tracks plan as sold today.
    includesSeparate: (sub.status === "comped" && sub.plan !== "referral") || sub.allTracksLegacy,
  };
}

// ── Per-track access ──────────────────────────────────────────────────────
//
// Three ways in:
//   - an all-access subscription (active | trialing | comped | past_due in
//     grace, or the owner's account): every track, except the tracks sold on
//     their own monthly plan (lib/learn/track-monthly.ts) unless the
//     entitlement includes them (comps, team seats, earlier subscribers);
//   - a track's own monthly plan (TrackSubscription): that track while paid;
//   - a one-time purchase (TrackPurchase): that track, forever, whatever the
//     subscription does later.
// A learner with neither is sent to /learn/subscribe by the member layout.

export interface LearnAccess {
  entitlement: Entitlement;
  /** Every track (subscription, comped or owner), minus `excluded`. */
  all: boolean;
  /** Tracks the all-tracks plan leaves out for this learner (sold on their own monthly plan). */
  excluded: string[];
  /** Tracks bought outright. */
  purchased: string[];
  /** Tracks open through their own monthly plan. */
  subscribed: string[];
  /** At least one track is open: may enter the member area. */
  any: boolean;
}

const NO_ACCESS: LearnAccess = { entitlement: NONE, all: false, excluded: [], purchased: [], subscribed: [], any: false };

/** Subscription, purchases and track plans. Cached per request in pages. */
export const getAccess = cache(async (studentId: string | null | undefined): Promise<LearnAccess> => {
  if (!studentId) return NO_ACCESS;
  await ensureTrackSubscriptionTables().catch(() => {});
  const [entitlement, purchased, subscribed] = await Promise.all([
    getEntitlement(studentId),
    purchasedTrackIds(studentId),
    subscribedTrackIds(studentId),
  ]);
  const excluded = entitlement.entitled && !entitlement.includesSeparate ? await separateMonthlyTrackIds() : [];
  return {
    entitlement,
    all: entitlement.entitled,
    excluded,
    purchased,
    subscribed,
    any: entitlement.entitled || purchased.length > 0 || subscribed.length > 0,
  };
});

/** Pure check against an access already loaded. */
export function canAccessTrack(access: LearnAccess, trackId: string | null | undefined): boolean {
  if (!trackId) return false;
  if (access.purchased.includes(trackId) || access.subscribed.includes(trackId)) return true;
  return access.all && !access.excluded.includes(trackId);
}

/**
 * The tracks a list should show for this learner: "all" (every track), or
 * explicit ids. With exclusions, "all" becomes "every track but these".
 */
export function trackScope(access: LearnAccess): { all: true; except: string[] } | { all: false; ids: string[] } {
  const own = [...new Set([...access.purchased, ...access.subscribed])];
  if (access.all) return { all: true, except: access.excluded.filter((id) => !own.includes(id)) };
  return { all: false, ids: own };
}

export async function hasTrackAccess(studentId: string | null | undefined, trackId: string): Promise<boolean> {
  return canAccessTrack(await getAccess(studentId), trackId);
}

/** For queries scoped to the learner's tracks: null = every track, else the ids. */
export async function scopedTrackIds(access: LearnAccess): Promise<string[] | null> {
  const scope = trackScope(access);
  if (!scope.all) return scope.ids;
  if (!scope.except.length) return null;
  const rows = await prisma.learnTrack.findMany({ where: { id: { notIn: scope.except } }, select: { id: true } }).catch(() => []);
  return rows.map((r) => r.id);
}

/** "all", or the ids of the tracks this learner may open. */
export async function accessibleTrackIds(studentId: string | null | undefined): Promise<"all" | string[]> {
  return (await scopedTrackIds(await getAccess(studentId))) ?? "all";
}

/** Convenience for pages: student + entitlement + access in one call. */
export async function getLearnContext() {
  const student = await getStudent();
  const access = await getAccess(student?.id);
  return { student, entitlement: access.entitlement, access };
}

/** API guard — returns a NextResponse to short-circuit, or null to proceed. */
export async function requireStudent(): Promise<
  { error: NextResponse; student: null } | { error: null; student: StudentSession }
> {
  const student = await getStudent();
  if (!student) {
    const t = await getT();
    if (refusal().reason === "locked") {
      return { error: NextResponse.json({ error: t("authStatus.suspended"), code: "account_locked" }, { status: 403 }), student: null };
    }
    return { error: NextResponse.json({ error: t("learn.api.signInRequired") }, { status: 401 }), student: null };
  }
  return { error: null, student };
}

/**
 * API guard requiring a learner with at least one open track (a subscription
 * or a purchase). Content routes must ALSO call denyTrack() with the track the
 * request touches.
 */
export async function requireEntitledStudent(): Promise<
  | { error: NextResponse; student: null; access: null }
  | { error: null; student: StudentSession; access: LearnAccess }
> {
  const { error, student } = await requireStudent();
  if (error) return { error, student: null, access: null };
  const access = await getAccess(student.id);
  if (!access.any) {
    const t = await getT();
    return { error: NextResponse.json({ error: t("learn.api.subscriptionRequired") }, { status: 402 }), student: null, access: null };
  }
  return { error: null, student, access };
}

/**
 * 403 when the learner cannot open this track (null = go ahead). A missing
 * track id (unknown lesson, lab...) is treated as not found by the caller
 * before this; here it is simply refused.
 */
export async function denyTrack(access: LearnAccess, trackId: string | null | undefined): Promise<NextResponse | null> {
  if (canAccessTrack(access, trackId)) return null;
  const t = await getT();
  return NextResponse.json({ error: t("learn.api.trackLocked"), locked: "track", trackId: trackId ?? null }, { status: 403 });
}
