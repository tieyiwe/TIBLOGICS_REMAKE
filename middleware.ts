import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the login page and NextAuth API routes through
  if (
    pathname === "/admin_pro/login" ||
    pathname.startsWith("/admin_pro/login/") ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  // Protect every /admin_pro/* route at the edge
  if (pathname.startsWith("/admin_pro")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/admin_pro/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin_pro/:path*"],
};
