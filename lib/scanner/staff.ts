import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwnerStudent } from "@/lib/learn/owner";

/**
 * Staff (owner, admin, team member) or the owner's own learner account: never
 * limited by the free-scan count, and see every report in full (without
 * unlocking it or writing it). Fails closed.
 */
export async function isScannerStaff(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const u = session?.user;
    if (!u) return false;
    if (u.studentId) return isOwnerStudent(u.studentId);
    if (u.isOwner || u.isAdmin) return true;
    // A team member only with access to scanner leads: the rest of the team
    // gets the same free limit and gated reports as a visitor.
    return !!u.collaboratorId && (u.permissions ?? []).some((p) => p === "*" || p === "scanner_leads" || p.startsWith("scanner_leads:"));
  } catch {
    return false;
  }
}
