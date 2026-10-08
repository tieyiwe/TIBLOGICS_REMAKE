import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { readYouthProfile } from "@/lib/learn/youth-account";
import { PortalError, addSponsor, linkFor, portalAuth, removeSponsor } from "@/lib/learn/youth-portal";

// The parent adds or removes a child's sponsors (parent only; a sponsor
// cannot manage sponsors). Each added sponsor gets an invitation email.
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), studentId: z.string().regex(/^[\w-]{1,64}$/), email: z.string().trim().toLowerCase().email().max(254), name: z.string().trim().max(40).optional() }),
  z.object({ action: z.literal("remove"), studentId: z.string().regex(/^[\w-]{1,64}$/), guardianId: z.string().regex(/^[\w-]{1,64}$/) }),
]);

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const email = await portalAuth();
  if (!email) return NextResponse.json({ error: t("learn.portal.err.signIn") }, { status: 401 });
  if (!(await checkRateLimit(`portal-sponsors:${email}`, 20, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.portal.err.sponsorEmail") }, { status: 400 });
  const a = parsed.data;
  const link = await linkFor(email, a.studentId);
  if (!link || link.role !== "parent") return NextResponse.json({ error: t("learn.portal.err.parentOnly") }, { status: 403 });
  try {
    if (a.action === "add") {
      const child = await readYouthProfile(a.studentId);
      if (!child) return NextResponse.json({ error: t("learn.portal.err.parentOnly") }, { status: 404 });
      const s = await addSponsor(child, { email: a.email, name: a.name ?? null }, email);
      return NextResponse.json({ ok: true, sponsor: { id: s.id, email: s.email, name: s.name }, message: t("learn.portal.sponsor.added") });
    }
    const ok = await removeSponsor(a.studentId, a.guardianId);
    return NextResponse.json({ ok, message: t("learn.portal.sponsor.removed") }, { status: ok ? 200 : 404 });
  } catch (err) {
    if (err instanceof PortalError) return NextResponse.json({ error: t(err.key, { n: 10 }) }, { status: err.status });
    console.error("[POST /api/portal/sponsors]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("learn.parent.err.failed") }, { status: 500 });
  }
}
