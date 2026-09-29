// Student session + entitlement. Replaces the spec's RLS `is_entitled(uid)`
// with server-side authorization, since this app uses NextAuth + Prisma.
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, OWNER_EMAIL } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";

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

/** Convenience for pages: student + entitlement in one call. */
export async function getLearnContext() {
  const student = await getStudent();
  const entitlement = await getEntitlement(student?.id);
  return { student, entitlement };
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

/** API guard requiring an entitled (paying) student. */
export async function requireEntitledStudent(): Promise<
  { error: NextResponse; student: null } | { error: null; student: StudentSession }
> {
  const { error, student } = await requireStudent();
  if (error) return { error, student: null };
  const ent = await getEntitlement(student.id);
  if (!ent.entitled) {
    const t = await getT();
    return { error: NextResponse.json({ error: t("learn.api.subscriptionRequired") }, { status: 402 }), student: null };
  }
  return { error: null, student };
}
