import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/**
 * The page-level twin of `requireAdmin()` in lib/require-admin.ts.
 *
 * Admin pages used to be client components that fetched everything from
 * /api/admin/*, so authorisation lived entirely in those route handlers. Now
 * that pages query Prisma directly, each one has to run the same check itself —
 * proxy.ts and the client-side guard in layout.tsx only decide what the browser
 * is shown, not what the server hands out.
 *
 * The rule is deliberately identical to `requireStaffSession`:
 *   - TIBLOGICS Learn students share this NextAuth instance, so "has a session"
 *     does not mean "is staff". A studentId is rejected explicitly, so any
 *     future non-staff account type fails closed here too.
 *   - Staff means owner, admin, or collaborator.
 *
 * A page cannot return a 401 body usefully, so a failed check redirects to the
 * admin login instead. Session resolution is wrapped because getServerSession
 * throws on a missing NEXTAUTH_SECRET or a malformed cookie; failing closed
 * turns that into a redirect rather than a 500, and can only ever deny access.
 *
 * `redirect()` throws, so anything after the call is unreachable when the check
 * fails — callers can rely on the returned session being staff.
 */
export async function requireAdminPage(): Promise<Session> {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[admin-page-auth] session resolution failed", err);
    redirect("/admin_pro/login");
  }

  if (!session) redirect("/admin_pro/login");

  const user = session.user;
  // Learners are never staff, whatever else the token carries.
  if (user?.studentId) redirect("/admin_pro/login");
  const isStaff = !!(user?.isOwner || user?.isAdmin || user?.collaboratorId);
  if (!isStaff) redirect("/admin_pro/login");

  return session;
}
