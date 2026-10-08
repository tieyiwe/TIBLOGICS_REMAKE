import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { readYouthProfile, youthGate } from "@/lib/learn/youth-account";
import { ENCOURAGE_PRESETS, PortalError, cleanEncouragement, linkFor, portalAuth, sendEncouragement } from "@/lib/learn/youth-portal";

// "Encourage": a ready-made message or a short one of the adult's own
// (max 300 characters, no links or contact details), to a child they follow.
// 3 per adult per child per day (lib/learn/youth-portal.ts).
const Body = z.object({
  studentId: z.string().regex(/^[\w-]{1,64}$/),
  preset: z.enum(ENCOURAGE_PRESETS).optional(),
  text: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const email = await portalAuth();
  if (!email) return NextResponse.json({ error: t("learn.portal.err.signIn") }, { status: 401 });
  if (!(await checkRateLimit(`portal-enc-ip:${email}`, 30, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || (!parsed.data.preset && !parsed.data.text)) {
    return NextResponse.json({ error: t("learn.portal.err.encourageEmpty") }, { status: 400 });
  }
  const link = await linkFor(email, parsed.data.studentId);
  if (!link) return NextResponse.json({ error: t("learn.portal.err.notLinked") }, { status: 403 });
  const child = await readYouthProfile(parsed.data.studentId);
  if (!child || youthGate(child)) return NextResponse.json({ error: t("learn.portal.err.notConfirmed") }, { status: 409 });
  const text = parsed.data.preset ? null : cleanEncouragement(parsed.data.text ?? "");
  if (!parsed.data.preset && !text) return NextResponse.json({ error: t("learn.portal.err.encourageText", { max: 300 }) }, { status: 400 });
  try {
    await sendEncouragement({ child, link, fromEmail: email, preset: parsed.data.preset ?? null, text });
    return NextResponse.json({ ok: true, message: t("learn.portal.encourage.sent", { name: child.name.trim().split(/\s+/)[0] }) });
  } catch (err) {
    if (err instanceof PortalError) return NextResponse.json({ error: t(err.key, { n: 3 }) }, { status: err.status });
    console.error("[POST /api/portal/encourage]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("learn.parent.err.failed") }, { status: 500 });
  }
}
