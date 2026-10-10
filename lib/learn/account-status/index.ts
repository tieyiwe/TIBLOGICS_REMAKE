// Learner account status: active | suspended | blocked (and "deleted" for an
// anonymised account). Enforced in three places:
//   - lib/auth.ts, at sign-in (password and Google): refused with an
//     AccountSuspended / AccountBlocked error code;
//   - lib/learn/session.ts getStudent(): an existing session of a suspended
//     or blocked learner, or one older than the last "sign out everywhere",
//     is treated as signed out (pages are sent to /learn/account-status);
//   - the sign-up route: a blocked address cannot open a new account.
// The status read is one primary-key query, cached for the request.
import { cache } from "react";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { ensureAccountTables } from "./db";

export type AccountStatus = "active" | "suspended" | "blocked" | "deleted";

export interface AccountState {
  status: AccountStatus;
  suspendedUntil: Date | null;
  statusReason: string | null;
  statusChangedAt: Date | null;
  mustChangePassword: boolean;
  sessionVersion: number;
  tags: string[];
  marketingOptOut: boolean;
}

export const ACTIVE: AccountState = {
  status: "active",
  suspendedUntil: null,
  statusReason: null,
  statusChangedAt: null,
  mustChangePassword: false,
  sessionVersion: 0,
  tags: [],
  marketingOptOut: false,
};

type Row = {
  status: string;
  suspendedUntil: Date | null;
  statusReason: string | null;
  statusChangedAt: Date | null;
  mustChangePassword: boolean;
  sessionVersion: number;
  tags: string[];
  marketingOptOut: boolean;
};

function normalise(r: Row | null | undefined): AccountState {
  if (!r) return ACTIVE;
  let status = (["active", "suspended", "blocked", "deleted"].includes(r.status) ? r.status : "active") as AccountStatus;
  // A suspension with an end date lifts itself once that date has passed.
  if (status === "suspended" && r.suspendedUntil && r.suspendedUntil.getTime() <= Date.now()) status = "active";
  return {
    status,
    suspendedUntil: status === "suspended" ? r.suspendedUntil : null,
    statusReason: r.statusReason,
    statusChangedAt: r.statusChangedAt,
    mustChangePassword: r.mustChangePassword,
    sessionVersion: r.sessionVersion,
    tags: r.tags ?? [],
    marketingOptOut: r.marketingOptOut,
  };
}

/** Uncached read. Never throws: an unreadable table means "active". */
export async function readAccountState(studentId: string): Promise<AccountState> {
  try {
    await ensureAccountTables();
    return normalise(await prisma.learnerAccount.findUnique({ where: { studentId } }));
  } catch (err) {
    console.error("[account-status] read", err);
    return ACTIVE;
  }
}

/** The same, cached for the current request (React cache). */
export const getAccountState = cache(readAccountState);

/** Many learners at once (lists, audiences). Missing rows are "active". */
export async function accountStates(ids: string[]): Promise<Map<string, AccountState>> {
  const out = new Map<string, AccountState>();
  if (ids.length === 0) return out;
  try {
    await ensureAccountTables();
    const rows = await prisma.learnerAccount.findMany({ where: { studentId: { in: ids } } });
    for (const r of rows) out.set(r.studentId, normalise(r));
  } catch (err) {
    console.error("[account-status] batch read", err);
  }
  return out;
}

/** Whether this state stops the learner from signing in or using a session. */
export function isLockedOut(s: AccountState): boolean {
  return s.status === "suspended" || s.status === "blocked" || s.status === "deleted";
}

// ── Blocked addresses ──────────────────────────────────────────────────────

export const emailHash = (email: string) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

/** True when this address belongs to a blocked learner. Never throws. */
export async function isEmailBlocked(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  try {
    await ensureAccountTables();
    return !!(await prisma.learnerBlockedEmail.findUnique({ where: { emailHash: emailHash(email) }, select: { emailHash: true } }));
  } catch (err) {
    console.error("[account-status] blocked email check", err);
    return false;
  }
}

// ── Sign-in gate ───────────────────────────────────────────────────────────

/**
 * Called by lib/auth.ts once the password (or Google) is accepted. Returns
 * the error code to refuse the sign-in with (null lets it through) and the
 * session version to stamp into the JWT.
 */
export async function loginGate(studentId: string, email: string): Promise<{ refuse: string | null; sv: number }> {
  const [state, blocked] = await Promise.all([readAccountState(studentId), isEmailBlocked(email)]);
  if (state.status === "blocked" || state.status === "deleted" || blocked) {
    return { refuse: `AccountBlocked:${statusToken(studentId)}`, sv: state.sessionVersion };
  }
  if (state.status === "suspended") return { refuse: `AccountSuspended:${statusToken(studentId)}`, sv: state.sessionVersion };
  return { refuse: null, sv: state.sessionVersion };
}

// ── Status token ───────────────────────────────────────────────────────────
//
// After a refused sign-in the learner has no session, yet the status page
// should still say why (the reason the admin wrote) and until when. The
// refused sign-in already proved the password (or the Google account), so it
// hands the page a short-lived signed token naming the account.

const TOKEN_TTL_MS = 30 * 60_000;

function key(): string {
  return `${process.env.NEXTAUTH_SECRET ?? "dev-secret"}:learner-status`;
}

export function statusToken(studentId: string): string {
  const payload = Buffer.from(JSON.stringify({ s: studentId, e: Date.now() + TOKEN_TTL_MS })).toString("base64url");
  const sig = createHmac("sha256", key()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readStatusToken(token: string | null | undefined): string | null {
  if (!token || token.length > 400) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const want = createHmac("sha256", key()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(want);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { s, e } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { s?: unknown; e?: unknown };
    if (typeof s !== "string" || typeof e !== "number" || e < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}
