import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isMissingContent } from "@/lib/seo/exists";

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
  if (pathname === "/learn" || pathname.startsWith("/learn/")) {
    const isPublic =
      pathname === "/learn/login" ||
      pathname === "/learn/signup" ||
      pathname.startsWith("/learn/forgot") ||
      // The emailed reset link is opened by someone who cannot sign in.
      pathname.startsWith("/learn/reset") ||
      // Shown to suspended or blocked learners (who have no usable session)
      // and opened from emails without signing in.
      pathname.startsWith("/learn/account-status") ||
      pathname.startsWith("/learn/unsubscribe");

    if (isPublic) {
      // Already signed in as a student → straight to the dashboard
      const stay = ["/learn/forgot", "/learn/reset", "/learn/account-status", "/learn/unsubscribe"].some((p) => pathname.startsWith(p));
      if (token?.studentId && !stay) {
        // Honour ?next= (same-site paths only), so a signed-in account sent
        // here from the paid tools goes back to them rather than to Learn.
        // Resolved, then checked by origin: string prefix checks alone let
        // "/\t/evil.com" through (the URL parser drops tabs and newlines,
        // leaving "//evil.com", a different host).
        const next = req.nextUrl.searchParams.get("next");
        let dest = new URL("/learn", req.url);
        if (next && next.startsWith("/")) {
          try {
            const u = new URL(next, req.url);
            if (u.origin === req.nextUrl.origin) dest = u;
          } catch { /* keep /learn */ }
        }
        return NextResponse.redirect(dest);
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
const LEARN_AREA = /^\/(learn|learning-box|api\/learn|p|certificates|badges)(\/|$)/;

/** Content pages whose slug is checked before the page streams (lib/seo/exists.ts). */
const CONTENT = /^\/(learning-box|store|ai-times|free|lp)\/[^/]+(\/[^/]+)?$/;

export async function proxy(req: NextRequest) {
  // A missing track, product, article, magnet or landing page gets a real
  // 404 status. The public layout streams (loading.tsx), so the page itself
  // could only send a 200 with a noindex tag.
  if (CONTENT.test(req.nextUrl.pathname) && (await isMissingContent(req.nextUrl.pathname))) {
    return NextResponse.rewrite(new URL("/__missing__", req.url), { status: 404 });
  }
  const res = await gate(req);
  if (!LEARN_AREA.test(req.nextUrl.pathname) || res.headers.get("location")) return res;
  // Mark Learning Box requests so getLocale() can serve English instead of
  // Swahili there. The rest of the site keeps all three languages.
  const headers = new Headers(req.headers);
  headers.set("x-tib-area", "learn");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin_pro/:path*", "/learn/:path*", "/learning-box/:path*", "/api/learn/:path*", "/p/:path*", "/certificates/:path*", "/badges/:path*", "/store/:path*", "/ai-times/:path*", "/free/:path*", "/lp/:path*"],
};
