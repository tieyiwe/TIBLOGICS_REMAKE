import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

// Who may do what with learner accounts and communications.
//   read:   the owner, an admin, or a collaborator with the "learners"
//           permission (or the older Learn permission "events", which
//           already opened the Learners pages).
//   manage: the owner or an admin only. Suspend, block, delete, passwords,
//           email changes, access, messages, notes and tags all need it:
//           a collaborator never gets them, whatever their permissions.
export type LearnerLevel = "read" | "manage";

export const LEARNER_READ_PERMISSIONS = ["*", "learners", "events"];

function isStaff(s: Session | null): s is Session {
  const u = s?.user;
  return !!u && !u.studentId && !!(u.isOwner || u.isAdmin || u.collaboratorId);
}

export function canManageLearners(s: Session | null): boolean {
  return isStaff(s) && !!(s.user.isOwner || s.user.isAdmin);
}

export function canReadLearners(s: Session | null): boolean {
  return isStaff(s) && (canManageLearners(s) || (s.user.permissions ?? []).some((p) => LEARNER_READ_PERMISSIONS.includes(p)));
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
export async function learnerStaff(level: LearnerLevel): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const s = await currentSession();
  if (!s) return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const ok = level === "manage" ? canManageLearners(s) : canReadLearners(s);
  if (!ok) {
    return {
      session: null,
      error: NextResponse.json(
        { error: level === "manage" ? "Only the owner or an admin can do this." : "You do not have access to learners." },
        { status: 403 },
      ),
    };
  }
  return { session: s, error: null };
}

/** Page guard: redirects when the check fails. */
export async function requireLearnerPage(level: LearnerLevel): Promise<Session> {
  const s = await currentSession();
  if (!isStaff(s)) redirect("/admin_pro/login");
  if (!(level === "manage" ? canManageLearners(s) : canReadLearners(s))) redirect("/admin_pro");
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
