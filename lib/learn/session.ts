// Student session + entitlement. Replaces the spec's RLS `is_entitled(uid)`
// with server-side authorization, since this app uses NextAuth + Prisma.
import { cache } from "react";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, OWNER_EMAIL } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { getT } from "@/lib/i18n/server";
import { purchasedTrackIds } from "@/lib/learn/purchases";

export interface StudentSession {
  id: string;
  email: string;
  name: string;
  accessibilityMode: boolean;
  locale: string;
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
export async function getStudent(): Promise<StudentSession | null> {
  // The content editor added `editedAt` columns to the Learn tables. A database
  // that has not been seeded or edited since would lack them, and every query
  // that reads whole rows (the lesson page, quizzes, labs) would fail and show
  // a 404. Creating them here, once per process, covers every learner page and
  // API before they query. Failure is logged, not fatal.
  await ensureLearnEditColumns().catch((err) => console.error("[learn] editedAt columns", err));
  let studentId: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    studentId = session?.user?.studentId;
  } catch (err) {
    console.error("[learn/session] session resolution failed", err);
    return null;
  }
  if (!studentId) return null;

  const student = await prisma.student
    .findUnique({
      where: { id: studentId },
      select: { id: true, email: true, name: true, accessibilityMode: true, locale: true },
    })
    .catch(() => null);
  return student;
}

export type Entitlement = {
  entitled: boolean;
  status: string | null;
  inGrace: boolean;
  graceUntil: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

const NONE: Entitlement = {
  entitled: false, status: null, inGrace: false,
  graceUntil: null, currentPeriodEnd: null, cancelAtPeriodEnd: false,
};

const COMPED: Entitlement = { ...NONE, entitled: true, status: "comped" };

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
  const sub = await prisma.learnSubscription.findUnique({ where: { studentId } }).catch(() => null);
  if (!sub || sub.status === "canceled") {
    const s = await prisma.student.findUnique({ where: { id: studentId }, select: { email: true } }).catch(() => null);
    if (s?.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return COMPED;
    if (!sub) return NONE;
  }

  const now = Date.now();
  const inGrace =
    sub.status === "past_due" && !!sub.graceUntil && sub.graceUntil.getTime() > now;
  const entitled = sub.status === "active" || sub.status === "trialing" || sub.status === "comped" || inGrace;

  return {
    entitled,
    status: sub.status,
    inGrace,
    graceUntil: sub.graceUntil,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  };
}

// ── Per-track access ──────────────────────────────────────────────────────
//
// Two ways in:
//   - an all-access subscription (active | trialing | comped | past_due in
//     grace, or the owner's account): every track;
//   - a one-time purchase (TrackPurchase): that track, forever, whatever the
//     subscription does later.
// A learner with neither is sent to /learn/subscribe by the member layout.

export interface LearnAccess {
  entitlement: Entitlement;
  /** Every track (subscription, comped or owner). */
  all: boolean;
  /** Tracks bought outright. */
  purchased: string[];
  /** At least one track is open: may enter the member area. */
  any: boolean;
}

const NO_ACCESS: LearnAccess = { entitlement: NONE, all: false, purchased: [], any: false };

/** Subscription + purchases in two queries. Cached per request in pages. */
export const getAccess = cache(async (studentId: string | null | undefined): Promise<LearnAccess> => {
  if (!studentId) return NO_ACCESS;
  const [entitlement, purchased] = await Promise.all([getEntitlement(studentId), purchasedTrackIds(studentId)]);
  return { entitlement, all: entitlement.entitled, purchased, any: entitlement.entitled || purchased.length > 0 };
});

/** Pure check against an access already loaded. */
export function canAccessTrack(access: LearnAccess, trackId: string | null | undefined): boolean {
  if (!trackId) return false;
  return access.all || access.purchased.includes(trackId);
}

export async function hasTrackAccess(studentId: string | null | undefined, trackId: string): Promise<boolean> {
  return canAccessTrack(await getAccess(studentId), trackId);
}

/** "all", or the ids of the tracks this learner may open (batched: two queries). */
export async function accessibleTrackIds(studentId: string | null | undefined): Promise<"all" | string[]> {
  const a = await getAccess(studentId);
  return a.all ? "all" : a.purchased;
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
