import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Single edge proxy for both gated areas. Uses getToken directly (rather than
// withAuth) because the two areas need different sign-in destinations:
//   /admin_pro/* → /admin_pro/login   (admins & collaborators)
//   /learn/*     → /learn/login       (TIBLOGICS Learn students)
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // ── Admin area ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin_pro")) {
    const isPublic =
      pathname === "/admin_pro/login" || pathname.startsWith("/admin_pro/accept-invite");

    // Signed-in admin hitting the login page → dashboard
    if (pathname === "/admin_pro/login" && token) {
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
    const isStaff = !!(token.isOwner || token.isAdmin || token.collaboratorId);
    if (token.studentId || !isStaff) {
      return NextResponse.redirect(new URL("/learn", req.url));
    }
    return NextResponse.next();
  }

  // ── TIBLOGICS Learn member area ───────────────────────────────────────────
  if (pathname.startsWith("/learn")) {
    const isPublic =
      pathname === "/learn/login" ||
      pathname === "/learn/signup" ||
      pathname.startsWith("/learn/forgot");

    if (isPublic) {
      // Already signed in as a student → straight to the dashboard
      if (token?.studentId && pathname !== "/learn/forgot") {
        return NextResponse.redirect(new URL("/learn", req.url));
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

export const config = {
  matcher: ["/admin_pro/:path*", "/learn/:path*"],
};
