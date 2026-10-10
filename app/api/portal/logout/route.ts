import { NextRequest, NextResponse } from "next/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { PORTAL_COOKIE } from "@/lib/learn/youth-portal";

// Signs out of the Parent & Sponsor Portal (clears the session cookie).
export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  await checkRateLimit(`portal-logout:${ip}`, 30, 600_000);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
