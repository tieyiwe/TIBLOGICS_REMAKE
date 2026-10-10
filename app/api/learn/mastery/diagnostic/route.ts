import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { startDiagnostic } from "@/lib/learn/mastery/diagnostic";
import { getLocale, translatorFor } from "@/lib/i18n/server";

// Starts (or resumes) a track's placement diagnostic and serves its current
// question: text and shuffled options only. The answer key never leaves the
// server; see lib/learn/mastery/diagnostic.ts.
const Body = z.object({ trackSlug: z.string().min(1).max(120) });

export async function POST(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`diag-start:${student.id}`, 40, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });

  const track = await prisma.learnTrack
    .findUnique({ where: { slug: parsed.data.trackSlug }, select: { id: true, status: true } })
    .catch(() => null);
  if (!track || track.status !== "live") return NextResponse.json({ error: t("mastery.api.notFound") }, { status: 404 });
  const denied = await denyTrack(access, track.id);
  if (denied) return denied;

  try {
    const res = await startDiagnostic(student.id, track.id, locale);
    if (!res.ok) {
      return NextResponse.json(
        { error: t(res.reason === "wait" ? "mastery.api.wait" : "mastery.api.empty"), reason: res.reason, retakeAt: res.retakeAt ?? null },
        { status: res.reason === "wait" ? 429 : 404 },
      );
    }
    return NextResponse.json(res.state, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[POST /api/learn/mastery/diagnostic]", err);
    return NextResponse.json({ error: t("mastery.api.failed") }, { status: 500 });
  }
}
