import { timingSafeEqual } from "crypto";
import { getServerSession, type Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { can } from "@/lib/admin/permissions";

// Rate limiting moved to lib/rate-limit.ts, where the counter is shared rather
// than living in a per-instance Map that reset on every deploy. Re-exported
// here so the many routes that import their guards from this module keep one
// import. The name changed from `rateLimit` deliberately: the new function is
// async, and `if (!promise)` is always false, so a forgotten await would have
// silently disabled a limit instead of failing to compile.
export { checkRateLimit } from "@/lib/rate-limit";

/**
 * Returns null if authenticated (admin or collaborator), or a 401 response.
 *
 * Session resolution is wrapped because getServerSession throws on a missing
 * NEXTAUTH_SECRET or a malformed cookie. Failing closed turns that into a
 * clean 401 rather than a 500, and can only ever deny access.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[require-admin] session resolution failed", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return requireStaffSession(session);
}

/**
 * A session belongs to STAFF (owner, admin, or collaborator) — not a learner.
 *
 * This check exists because TIBLOGICS Learn students authenticate through the
 * same NextAuth instance as staff. "Has a session" therefore no longer implies
 * "is staff", and treating the two as equivalent let a signed-in student call
 * admin endpoints — including issuing themselves a certificate.
 *
 * Students are rejected explicitly rather than inferred, so adding another
 * non-staff account type in future fails closed here.
 */
function requireStaffSession(session: Session): NextResponse | null {
  const user = session.user;
  if (user?.studentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const isStaff = !!(user?.isOwner || user?.isAdmin || user?.collaboratorId);
  if (!isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Returns null if the session user holds `permission`, otherwise a 403.
 *
 * Accepts (lib/admin/permissions.ts, `can`):
 *   "blog" / "blog:view"   at least view access to the area
 *   "blog:manage"          manage access
 *   "learners.delete"      a sensitive capability
 *   "finance.manage"       alias of "finance:manage" (also team, settings)
 *   "*"                    owner or admin only
 * The owner (Super Admin) always passes; admins pass everything except the
 * owner-only keys. Every pre-existing call (a plain area key) behaves as
 * before: the plain key is in the list of anyone who had it.
 */
export async function requirePermission(permission: string): Promise<NextResponse | null> {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[require-permission] session resolution failed", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Learners are never permitted here, whatever permissions array they carry.
  const staffErr = requireStaffSession(session);
  if (staffErr) return staffErr;
  if (!can(session.user, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Log an action taken by a collaborator */
export async function logActivity(opts: {
  collaboratorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  req?: NextRequest;
}) {
  try {
    const ip = opts.req
      ? anonymiseIp(
          opts.req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
          opts.req.headers.get("x-real-ip") ??
          "unknown"
        )
      : undefined;
    await prisma.collaboratorActivityLog.create({
      data: {
        collaboratorId: opts.collaboratorId,
        action: opts.action,
        resource: opts.resource,
        resourceId: opts.resourceId,
        details: opts.details,
        ip,
      },
    });
  } catch {
    // Non-blocking — never fail the request over a log write
  }
}

/**
 * Constant-time comparison of a presented value against a configured secret.
 *
 * `presented === process.env.SOMETHING` short-circuits on the first differing
 * byte, and these secrets (ADMIN_PASSWORD, RESET_TOKEN) gate password recovery
 * paths that are reachable without a session. Returns false when the secret is
 * unset, so a missing env var can never authorise anyone.
 */
export function secretEquals(presented: unknown, secret: string | undefined): boolean {
  if (!secret || typeof presented !== "string") return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  // timingSafeEqual requires equal lengths; length alone is not the secret.
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Escape user-supplied strings before embedding in HTML email templates */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Basic email format check */
export function isValidEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

/** Anonymise IP to /24 block for GDPR-friendly storage */
export function anonymiseIp(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";
  const v4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (v4) return v4[1] + ".0";
  const v6 = ip.split(":");
  if (v6.length >= 4) return v6.slice(0, 4).join(":") + "::";
  return "unknown";
}
