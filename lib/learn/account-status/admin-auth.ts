import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";

// Who may do what with learner accounts and communications (Team & Roles,
// lib/admin/permissions.ts). Each check names an area:
//   "learners" (default)
//     read:   view access to Learners (or the older Learn permission
//             "events", which already opened the Learners pages).
//     manage: "learners:manage": suspend, block, notes, tags, sign-out.
//             Deleting, passwords/email and free access additionally need
//             the learners.delete / learners.password / learners.access
//             capabilities (checked in the actions route).
//   "communications"
//     read:   view access to Communications.
//     manage: "communications:manage" (templates, close, notes); sending
//             also needs comms.send, broadcasting to all comms.send_all.
// The owner and admins always pass.
export type LearnerLevel = "read" | "manage";
export type LearnerArea = "learners" | "communications";

export const LEARNER_READ_PERMISSIONS = ["*", "learners", "events"];

function isStaff(s: Session | null): s is Session {
  const u = s?.user;
  return !!u && !u.studentId && !!(u.isOwner || u.isAdmin || u.collaboratorId);
}

export function canManageLearners(s: Session | null, area: LearnerArea = "learners"): boolean {
  return isStaff(s) && can(s.user, `${area}:manage`);
}

export function canReadLearners(s: Session | null, area: LearnerArea = "learners"): boolean {
  if (!isStaff(s)) return false;
  if (canManageLearners(s, area) || can(s.user, area)) return true;
  return area === "learners" && (s.user.permissions ?? []).some((p) => LEARNER_READ_PERMISSIONS.includes(p));
}

/** A capability such as "learners.delete" or "comms.send" (owner and admins always). */
export function hasCapability(s: Session | null, key: string): boolean {
  return isStaff(s) && can(s.user, key);
}

async function currentSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch (err) {
    console.error("[learner-admin] session", err);
    return null;
  }
}

/** API guard. Returns the session, or a ready 401/403 response. */
export async function learnerStaff(
  level: LearnerLevel,
  area: LearnerArea = "learners",
): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const s = await currentSession();
  if (!s) return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isStaff(s)) return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const ok = level === "manage" ? canManageLearners(s, area) : canReadLearners(s, area);
  if (!ok) {
    const what = area === "communications" ? "communications" : "learners";
    return {
      session: null,
      error: NextResponse.json(
        { error: level === "manage" ? `You do not have permission to manage ${what}.` : `You do not have access to ${what}.` },
        { status: 403 },
      ),
    };
  }
  return { session: s, error: null };
}

/** Page guard: redirects when the check fails. */
export async function requireLearnerPage(level: LearnerLevel, area: LearnerArea = "learners"): Promise<Session> {
  const s = await currentSession();
  if (!isStaff(s)) redirect("/admin_pro/login");
  if (!(level === "manage" ? canManageLearners(s, area) : canReadLearners(s, area))) redirect("/admin_pro/no-access");
  return s;
}

/**
 * Same-origin check for state-changing requests. The session cookie is
 * SameSite=Lax and the routes require a JSON body (which a cross-site form
 * cannot send without a CORS preflight), so this is defence in depth.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // older browsers on same-origin fetches, server-side callers
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** CSRF guard for JSON mutations: null to proceed. */
export function csrfGuard(req: Request): NextResponse | null {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON" }, { status: 415 });
  }
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  return null;
}
