import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { consumeLogin, portalCookie } from "@/lib/learn/youth-portal";

// Uses a one-time portal sign-in link (from /portal/signin, after a click,
// so mail scanners that open links cannot use it up) and starts the session.
const Body = z.object({ token: z.string().max(100) });

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`portal-verify:${ip}`, 20, 600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const login = parsed.success ? await consumeLogin(parsed.data.token) : null;
  if (!login) return NextResponse.json({ error: t("learn.portal.err.link") }, { status: 400 });
  const res = NextResponse.json({ ok: true, next: login.next ?? "/portal" });
  const c = portalCookie(login.email);
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
