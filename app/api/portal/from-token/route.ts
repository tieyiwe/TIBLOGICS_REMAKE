import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { parentFromToken } from "@/lib/learn/youth-account";
import { portalCookie } from "@/lib/learn/youth-portal";

// From a child's parent dashboard link (/parent/[token]) to the portal with
// all the parent's children: the link proves the parent's email.
const Body = z.object({ token: z.string().max(100) });

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`parent-ip:${ip}`, 30, 600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const child = parsed.success ? await parentFromToken(parsed.data.token) : null;
  if (!child?.parentEmail) return NextResponse.json({ error: t("learn.parent.err.link") }, { status: 404 });
  const res = NextResponse.json({ ok: true, next: "/portal" });
  const c = portalCookie(child.parentEmail);
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
