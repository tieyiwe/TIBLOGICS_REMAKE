import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { setWeeklyOptOut, verifyUnsubscribe } from "@/lib/learn/youth-portal";

// The "unsubscribe" link in a sponsor's weekly email (signed, no sign-in).
const Body = z.object({ g: z.string().max(64), s: z.string().max(100) });

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`portal-unsub:${ip}`, 20, 600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || !verifyUnsubscribe(parsed.data.g, parsed.data.s)) {
    return NextResponse.json({ error: t("learn.portal.err.link") }, { status: 400 });
  }
  await setWeeklyOptOut(parsed.data.g, true);
  return NextResponse.json({ ok: true, message: t("learn.portal.weekly.off") });
}
