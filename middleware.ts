import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Gate the member area at the edge (Part B rule 4). Entitlement itself is
// re-checked server-side in the (member) layout — this only avoids rendering
// the area for signed-out visitors and keeps the redirect fast.
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isStudent = !!token?.studentId;

  if (!isStudent) {
    const url = req.nextUrl.clone();
    url.pathname = "/learn/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything under /learn except the auth pages themselves.
  matcher: ["/learn/((?!login|signup|forgot).*)"],
};
