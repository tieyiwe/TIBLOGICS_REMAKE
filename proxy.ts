import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const proxy = withAuth(
  function middleware(req) {
    // Authenticated user hitting /admin/login → send to dashboard
    if (req.nextUrl.pathname === "/admin_pro/login" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/admin_pro", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        if (
          pathname === "/admin_pro/login" ||
          pathname.startsWith("/admin_pro/accept-invite")
        ) {
          return true;
        }
        return !!token;
      },
    },
    pages: { signIn: "/admin_pro/login" },
  }
);

export const config = {
  matcher: ["/admin_pro/:path*"],
};
