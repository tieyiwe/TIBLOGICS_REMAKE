import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, requirePermission } from "@/lib/require-admin";
import { ensureVideoTables } from "@/lib/learn/video/db";
import { generateScript, lessonBrief, readScript } from "@/lib/learn/video/script";

// Staff only: lesson video scripts, kept as numbered versions.
//   GET  ?lessonId=&version=   one version (the latest when version is omitted)
//   POST { lessonId, action: "generate" }          AI draft, saved as a new version
//   POST { lessonId, action: "save", script }      the edited script, as a new version

async function staffKey(): Promise<string> {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email ?? s?.user?.name ?? "staff";
}

export async function GET(req: NextRequest) {
  const denied = await requirePermission("events");
  if (denied) return denied;
  const lessonId = req.nextUrl.searchParams.get("lessonId") ?? "";
  const v = Number(req.nextUrl.searchParams.get("version"));
  try {
    await ensureVideoTables();
    const row = await prisma.videoScript.findFirst({
      where: { lessonId, ...(Number.isInteger(v) && v > 0 ? { version: v } : {}) },
      orderBy: { version: "desc" },
    });
    if (!row) return NextResponse.json({ script: null });
    return NextResponse.json({
      script: readScript(row.content),
      version: row.version,
      source: row.source,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[GET admin/learn/video/script]", err);
    return NextResponse.json({ error: "Could not load the script." }, { status: 500 });
  }
}

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("generate"), lessonId: z.string().min(1).max(64) }),
  z.object({ action: z.literal("save"), lessonId: z.string().min(1).max(64), script: z.unknown() }),
]);

async function saveVersion(lessonId: string, content: unknown, source: "ai" | "edit", createdBy: string) {
  // Two staff saving at once could pick the same number; retry once on conflict.
  for (let attempt = 0; ; attempt++) {
    const last = await prisma.videoScript.findFirst({ where: { lessonId }, orderBy: { version: "desc" }, select: { version: true } });
    const version = (last?.version ?? 0) + 1;
    try {
      await prisma.videoScript.create({ data: { lessonId, version, content: content as Prisma.InputJsonValue, source, createdBy } });
      return version;
    } catch (err) {
      if (attempt < 1 && err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission("events");
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const body = parsed.data;
  const who = await staffKey();

  try {
    await ensureVideoTables();
    const lesson = await prisma.lesson.findUnique({
      where: { id: body.lessonId },
      select: {
        id: true, title: true, objective: true, bodyMd: true, durationMinutes: true,
        module: { select: { title: true, track: { select: { title: true } } } },
      },
    });
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    if (body.action === "save") {
      const script = readScript(body.script);
      if (!script) return NextResponse.json({ error: "The script is incomplete: every section needs a heading and narration." }, { status: 400 });
      const version = await saveVersion(lesson.id, script, "edit", who);
      return NextResponse.json({ ok: true, version, script });
    }

    // AI drafts cost money: a few per hour per staff member, and a ceiling for the site.
    if (!(await checkRateLimit(`videoscript:${who}`, 12, 3_600_000)) || !(await checkRateLimit("videoscript:all", 60, 3_600_000))) {
      return NextResponse.json({ error: "Too many drafts in the last hour. Try again later." }, { status: 429 });
    }
    const script = await generateScript(
      lessonBrief({
        title: lesson.title,
        objective: lesson.objective,
        bodyMd: lesson.bodyMd,
        durationMinutes: lesson.durationMinutes,
        trackTitle: lesson.module.track.title,
        moduleTitle: lesson.module.title,
      }),
    );
    const version = await saveVersion(lesson.id, script, "ai", who);
    return NextResponse.json({ ok: true, version, script });
  } catch (err) {
    console.error("[POST admin/learn/video/script]", err);
    if (body.action === "save") return NextResponse.json({ error: "Could not save the script. Please try again." }, { status: 500 });
    const msg = err instanceof Error && /expected shape/.test(err.message) ? err.message + " Try again." : "Could not draft the script. Please try again.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
