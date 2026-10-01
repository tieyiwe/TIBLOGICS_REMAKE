import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";
import { growthTablesReady } from "./db";

// Growth content, scheduling and attribution are admin-only: posts go out
// under the company's name and the link reports show revenue. Admins (and the
// owner) or a collaborator holding "*". Learners never.

export async function requireGrowthAdmin(): Promise<NextResponse | null> {
  const denied = await requirePermission("*");
  if (denied) return denied;
  if (!(await growthTablesReady())) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  return null;
}

export function isGrowthAdmin(user: Session["user"] | undefined | null): boolean {
  if (!user || user.studentId) return false;
  return !!(user.isOwner || user.isAdmin || user.permissions?.includes("*"));
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
  if (!isGrowthAdmin(u)) redirect("/admin_pro");
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
