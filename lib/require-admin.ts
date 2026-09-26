import { getServerSession, type Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/** Returns true (allowed) or false (blocked). key = `${route}:${ip}` */
export function rateLimit(key: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

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
 * Returns null if the session user has the given permission (or is admin),
 * otherwise returns a 403 response.
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
  if (session.user.isAdmin || session.user.permissions.includes("*")) return null;
  if (!session.user.permissions.includes(permission)) {
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
