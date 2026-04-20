import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/** Returns null if authenticated (admin or collaborator), or a 401 response */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Returns null if the session user has the given permission (or is admin),
 * otherwise returns a 403 response.
 */
export async function requirePermission(permission: string): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
