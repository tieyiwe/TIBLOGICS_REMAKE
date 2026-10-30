import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, getT } from "@/lib/i18n/server";
import { cheatSheetData, cheatSheetFileName, cheatSheetPdfCached } from "@/lib/learn/cheatsheet";

// GET /api/learn/cheatsheet/[moduleId]: the module's one-page cheat sheet
// (PDF) in the learner's language. A learner with access to the module's
// track only (free-preview lessons do not open the sheet). No model calls.

export const maxDuration = 30;

export async function GET(_req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();
  if (!(await checkRateLimit(`learn-cheatsheet:${student.id}`, 30, 600_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }
  const { moduleId } = await params;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(moduleId)) return NextResponse.json({ error: t("learn.cheat.notFound") }, { status: 404 });

  const mod = await prisma.learnModule.findUnique({ where: { id: moduleId }, select: { trackId: true } }).catch(() => null);
  if (!mod) return NextResponse.json({ error: t("learn.cheat.notFound") }, { status: 404 });
  const denied = await denyTrack(access, mod.trackId);
  if (denied) return denied;

  const sheet = await cheatSheetData(moduleId, await getLocale());
  if (!sheet) return NextResponse.json({ error: t("learn.cheat.notFound") }, { status: 404 });
  const { pdf, version } = await cheatSheetPdfCached(sheet);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${cheatSheetFileName(sheet)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Version": version,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
