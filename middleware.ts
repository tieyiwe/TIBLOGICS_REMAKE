import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Authenticated user hitting /admin/login → send them to the dashboard
    if (pathname === "/admin/login" && token) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // These paths are always public (no auth required)
        if (
          pathname === "/admin/login" ||
          pathname.startsWith("/admin/accept-invite")
        ) {
          return true;
        }

        // Every other /admin path requires a valid session token
        return !!token;
      },
    },
    pages: {
      signIn: "/admin/login",
    },
  }
);

export const config = {
  // Apply middleware to all /admin routes
  matcher: ["/admin/:path*"],
};
