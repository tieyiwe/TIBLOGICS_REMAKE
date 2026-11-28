import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";
import { sameOrigin } from "@/lib/learn/account-status/admin-auth";

// The cyber scanner is for staff who manage scanner leads (owner, admins, and
// team members with "Scanner leads: manage"): it sends requests to other
// people's websites, so view-only access does not include it.

export function canCyber(session: Session | null): boolean {
  const u = session?.user;
  if (!u || u.studentId) return false;
  if (u.isOwner || u.isAdmin) return true;
  return !!u.collaboratorId && (u.permissions ?? []).some((p) => p === "*" || p === "scanner_leads:manage");
}

/** API guard: permission, and same-origin for anything that changes state. */
export async function cyberGuard(req: Request): Promise<{ denied: NextResponse } | { denied: null; email: string; name: string }> {
  const denied = await requirePermission("scanner_leads:manage");
  if (denied) return { denied };
  if (req.method !== "GET" && !sameOrigin(req)) return { denied: NextResponse.json({ error: "Cross-site request refused" }, { status: 403 }) };
  const u = (await getServerSession(authOptions))?.user;
  return { denied: null, email: u?.email ?? "staff", name: u?.name?.trim() || "The TIBLOGICS team" };
}
