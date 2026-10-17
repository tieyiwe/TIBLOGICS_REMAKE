import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { csrfGuard, hasCapability, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Who may award scholarships: staff who manage learners AND hold the
// "Grant free access" capability (learners.access), since an award opens
// tracks for free or below price. The owner and admins always pass. Viewing
// needs learners read access.

export const canAward = (s: Session | null) => hasCapability(s, "learners.access");

/** Guard for every scholarship write. Returns the session or a ready error. */
export async function scholarshipWriter(req: Request): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const bad = csrfGuard(req);
  if (bad) return { session: null, error: bad };
  const { session, error } = await learnerStaff("manage");
  if (error) return { session: null, error };
  if (!canAward(session)) {
    return { session: null, error: NextResponse.json({ error: "Awarding scholarships needs the “Grant free access” permission." }, { status: 403 }) };
  }
  if (!(await checkRateLimit(`admin-scholarship:${session.user.email}`, 60, 60_000))) {
    return { session: null, error: NextResponse.json({ error: "Too many changes at once. Wait a minute." }, { status: 429 }) };
  }
  return { session, error: null };
}
