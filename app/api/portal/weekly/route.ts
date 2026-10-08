import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { linkFor, portalAuth, setWeeklyOptOut } from "@/lib/learn/youth-portal";

// A sponsor turns their weekly summary for one child on or off.
const Body = z.object({ studentId: z.string().regex(/^[\w-]{1,64}$/), optOut: z.boolean() });

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const email = await portalAuth();
  if (!email) return NextResponse.json({ error: t("learn.portal.err.signIn") }, { status: 401 });
  if (!(await checkRateLimit(`portal-weekly:${email}`, 30, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.parent.err.invalid") }, { status: 400 });
  const link = await linkFor(email, parsed.data.studentId);
  if (!link?.guardianId) return NextResponse.json({ error: t("learn.portal.err.notLinked") }, { status: 403 });
  await setWeeklyOptOut(link.guardianId, parsed.data.optOut);
  return NextResponse.json({ ok: true, message: t(parsed.data.optOut ? "learn.portal.weekly.off" : "learn.portal.weekly.on") });
}
