import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";
import { can } from "@/lib/admin/permissions";
import { growthTablesReady } from "./db";

// Growth content, scheduling and attribution: Team & Roles "growth_content"
// (view to read; writes need growth_content:manage, enforced per method in
// proxy.ts; publishing posts also needs "growth.publish"). Posts go out under
// the company's name, so the owner decides who gets it. Admins and the owner
// always. Learners never.

export async function requireGrowthAdmin(): Promise<NextResponse | null> {
  const denied = await requirePermission("growth_content");
  if (denied) return denied;
  if (!(await growthTablesReady())) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  return null;
}

/** Approving, scheduling or publishing content: the "growth.publish" capability. */
export async function requireGrowthPublish(): Promise<NextResponse | null> {
  return requirePermission("growth.publish");
}

export function isGrowthAdmin(user: Session["user"] | undefined | null): boolean {
  if (!user || user.studentId) return false;
  return can(user, "growth_content");
}

/** Page twin: redirects anyone else (staff without "*" go to the dashboard). */
export async function requireGrowthAdminPage(): Promise<Session> {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    redirect("/admin_pro/login");
  }
  if (!session) redirect("/admin_pro/login");
  const u = session.user;
  if (u?.studentId || !(u?.isOwner || u?.isAdmin || u?.collaboratorId)) redirect("/admin_pro/login");
  if (!isGrowthAdmin(u)) redirect("/admin_pro/no-access");
  return session;
}

/** Parses a JSON body, or null. */
export async function jsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
