import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/require-admin";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { ensureVideoTables } from "@/lib/learn/video/db";
import { getVideoMeta } from "@/lib/learn/video/store";
import { CAPTION_LANGS, LIMITS, normaliseChapters, parseVtt, videoUrlProblem } from "@/lib/learn/video/shared";

// Staff only: a lesson's video link, chapters and captions.
// GET ?lessonId= returns them with the script versions; POST saves them.
// Saving marks the lesson as edited (editedAt), so re-seeding never removes
// the video; chapters and captions live in LessonVideoMeta, which the seed
// never touches.

export async function GET(req: NextRequest) {
  const denied = await requirePermission("events");
  if (denied) return denied;
  const lessonId = req.nextUrl.searchParams.get("lessonId") ?? "";
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, videoUrl: true } }).catch(() => null);
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  try {
    await ensureVideoTables();
    const [meta, scripts] = await Promise.all([
      getVideoMeta(lessonId),
      prisma.videoScript.findMany({
        where: { lessonId },
        orderBy: { version: "desc" },
        select: { version: true, source: true, createdBy: true, createdAt: true },
        take: 50,
      }),
    ]);
    return NextResponse.json({ videoUrl: lesson.videoUrl ?? "", ...meta, scripts });
  } catch (err) {
    console.error("[GET admin/learn/video]", err);
    return NextResponse.json({ error: "Could not load the video settings." }, { status: 500 });
  }
}

const Body = z.object({
  lessonId: z.string().min(1).max(64),
  videoUrl: z.string().trim().max(LIMITS.url),
  chapters: z.array(z.object({ time: z.number().min(0).max(86_400), title: z.string().trim().min(1).max(LIMITS.chapterTitle) })).max(LIMITS.chapters),
  captions: z.object({ en: z.string().max(LIMITS.vtt).optional(), fr: z.string().max(LIMITS.vtt).optional(), sw: z.string().max(LIMITS.vtt).optional() }),
});

export async function POST(req: NextRequest) {
  const denied = await requirePermission("events");
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: `${issue?.path.join(".") || "request"}: ${issue?.message ?? "invalid"}` }, { status: 400 });
  }
  const { lessonId, videoUrl } = parsed.data;
  const urlProblem = videoUrlProblem(videoUrl);
  if (urlProblem) return NextResponse.json({ error: urlProblem }, { status: 400 });

  const captions: Record<string, string> = {};
  for (const l of CAPTION_LANGS) {
    const v = parsed.data.captions[l]?.trim();
    if (!v) continue;
    const r = parseVtt(v);
    if (!r.ok) {
      return NextResponse.json({ error: `${l.toUpperCase()} captions, line ${r.line ?? "?"}: ${r.error}` }, { status: 400 });
    }
    captions[l] = `${v}\n`;
  }
  const chapters = normaliseChapters(parsed.data.chapters);

  try {
    await Promise.all([ensureLearnEditColumns(), ensureVideoTables()]);
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    await prisma.$transaction([
      prisma.lesson.update({ where: { id: lessonId }, data: { videoUrl: videoUrl || null, editedAt: new Date() } }),
      prisma.lessonVideoMeta.upsert({
        where: { lessonId },
        create: { lessonId, chapters: chapters as unknown as Prisma.InputJsonValue, captions },
        update: { chapters: chapters as unknown as Prisma.InputJsonValue, captions },
      }),
    ]);
    return NextResponse.json({ ok: true, videoUrl, chapters, languages: Object.keys(captions) });
  } catch (err) {
    console.error("[POST admin/learn/video]", err);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  }
}
