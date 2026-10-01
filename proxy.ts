import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Single edge proxy for both gated areas. Uses getToken directly (rather than
// withAuth) because the two areas need different sign-in destinations:
//   /admin_pro/* → /admin_pro/login   (admins & collaborators)
//   /learn/*     → /learn/login       (TIBLOGICS Learn students)
async function gate(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // ── Admin area ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin_pro")) {
    const isPublic =
      pathname === "/admin_pro/login" || pathname.startsWith("/admin_pro/accept-invite");

    const isStaffToken = !!(token && (token.isOwner || token.isAdmin || token.collaboratorId) && !token.studentId);

    // Signed-in STAFF hitting the login page → dashboard. A learner session
    // (Learning Box students share this NextAuth instance) must still reach the
    // login page, or someone signed in to /learn could never switch to admin.
    if (pathname === "/admin_pro/login" && isStaffToken) {
      return NextResponse.redirect(new URL("/admin_pro", req.url));
    }
    if (isPublic) return NextResponse.next();

    if (!token) {
      const url = new URL("/admin_pro/login", req.url);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }

    // Students authenticate through the same NextAuth instance as staff, so
    // "has a token" does not mean "is staff". Without this, a signed-in
    // learner could open the admin dashboard. Send them to their own area
    // rather than the admin login, which they could never satisfy anyway.
    if (!isStaffToken) {
      // Signed in, but as a learner: offer the admin login (signing in there
      // replaces the learner session) instead of bouncing to /learn.
      const url = new URL("/admin_pro/login", req.url);
      url.searchParams.set("callbackUrl", pathname + search);
      url.searchParams.set("switch", "learner");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── TIBLOGICS Learn member area ───────────────────────────────────────────
  if (pathname.startsWith("/learn")) {
    const isPublic =
      pathname === "/learn/login" ||
      pathname === "/learn/signup" ||
      pathname.startsWith("/learn/forgot") ||
      // The emailed reset link is opened by someone who cannot sign in.
      pathname.startsWith("/learn/reset");

    if (isPublic) {
      // Already signed in as a student → straight to the dashboard
      if (token?.studentId && !pathname.startsWith("/learn/forgot") && !pathname.startsWith("/learn/reset")) {
        // Honour ?next= (same-site paths only), so a signed-in account sent
        // here from the paid tools goes back to them rather than to Learn.
        const next = req.nextUrl.searchParams.get("next");
        const safe = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/learn";
        return NextResponse.redirect(new URL(safe, req.url));
      }
      return NextResponse.next();
    }

    // Entitlement (active subscription) is re-checked server-side in the
    // member layout — this only blocks signed-out visitors.
    if (!token?.studentId) {
      const url = new URL("/learn/login", req.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

/** The Learning Box is offered in English and French only (see lib/i18n/config). */
const LEARN_AREA = /^\/(learn|learning-box|api\/learn|p|certificates)(\/|$)/;

export async function proxy(req: NextRequest) {
  const res = await gate(req);
  if (!LEARN_AREA.test(req.nextUrl.pathname) || res.headers.get("location")) return res;
  // Mark Learning Box requests so getLocale() can serve English instead of
  // Swahili there. The rest of the site keeps all three languages.
  const headers = new Headers(req.headers);
  headers.set("x-tib-area", "learn");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin_pro/:path*", "/learn/:path*", "/learning-box/:path*", "/api/learn/:path*", "/p/:path*", "/certificates/:path*"],
};
