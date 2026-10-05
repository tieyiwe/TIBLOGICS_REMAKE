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
    return !!(u.isOwner || u.isAdmin || u.collaboratorId);
  } catch {
    return false;
  }
}
