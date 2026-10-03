import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { ensureVideoTables } from "@/lib/learn/video/db";
import { removeGeneratedVideo } from "@/lib/learn/video/pipeline";
import { cancelQueued, queuePlanned, queueVideos, runVideoQueue, videoSummary } from "@/lib/learn/video/queue";
import { planLessons, setOverride } from "@/lib/learn/video/select";

// Staff only: the narrated-video pipeline on /admin_pro/learn/videos.
//   GET                                   counts, provider, storage, cost estimate
//   POST { action: "plan", trackId? }     decide which lessons get a video (rules + Haiku)
//   POST { action: "generate", trackId? } queue every planned lesson without a current video
//   POST { action: "generate", lessonId } queue one lesson (both languages) and start it now
//   POST { action: "run" }               make the next queued video now (one, waits for it)
//   POST { action: "cancel", trackId? }   take waiting jobs out of the queue (running ones finish)
//   POST { action: "override", lessonId, override: "include"|"exclude"|null }
//   POST { action: "remove", lessonId }   take the generated video off the lesson

export const maxDuration = 300;

export async function GET() {
  const denied = await requirePermission("events");
  if (denied) return denied;
  try {
    return NextResponse.json(await videoSummary());
  } catch (err) {
    console.error("[GET admin/learn/video/auto]", err);
    return NextResponse.json({ error: "Could not load the video pipeline." }, { status: 500 });
  }
}

const Id = z.string().min(1).max(64);
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("plan"), trackId: Id.optional() }),
  z.object({ action: z.literal("generate"), trackId: Id.optional(), lessonId: Id.optional() }),
  z.object({ action: z.literal("run") }),
  z.object({ action: z.literal("cancel"), trackId: Id.optional() }),
  z.object({ action: z.literal("override"), lessonId: Id, override: z.enum(["include", "exclude"]).nullable() }),
  z.object({ action: z.literal("remove"), lessonId: Id }),
]);

export async function POST(req: NextRequest) {
  const denied = await requirePermission("events");
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const body = parsed.data;
  try {
    await ensureVideoTables();
    switch (body.action) {
      case "plan": {
        // Up to ~4 minutes of AI checks; anything left is finished by the cron job.
        const r = await planLessons({ trackId: body.trackId, aiBudget: 400, deadline: Date.now() + 240_000 });
        return NextResponse.json({ ok: true, ...r });
      }
      case "generate": {
        if (body.lessonId) {
          const lesson = await prisma.lesson.findUnique({ where: { id: body.lessonId }, select: { id: true } });
          if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
          const queued = await queueVideos([body.lessonId], { priority: 10 });
          // Start right away, after the response (the cron job would pick it up anyway).
          after(() => runVideoQueue({ max: 2 }).catch((err) => console.error("[video] run now", err)));
          return NextResponse.json({ ok: true, queued });
        }
        const queued = await queuePlanned({ trackId: body.trackId });
        return NextResponse.json({ ok: true, queued });
      }
      case "run": {
        // One video, inside this request, so staff see the result or the error.
        const r = await runVideoQueue({ max: 1, deadline: Date.now() + 200_000 });
        return NextResponse.json({ ok: true, processed: r.processed, done: r.done, needsTts: r.needsTts, error: r.results.find((x) => x.error)?.error ?? null });
      }
      case "cancel": {
        const cancelled = await cancelQueued({ trackId: body.trackId });
        return NextResponse.json({ ok: true, cancelled });
      }
      case "override": {
        await setOverride(body.lessonId, body.override);
        return NextResponse.json({ ok: true });
      }
      case "remove": {
        await removeGeneratedVideo(body.lessonId);
        await prisma.lessonVideoJob.updateMany({ where: { lessonId: body.lessonId }, data: { status: "skipped", error: "Removed by staff.", updatedAt: new Date() } });
        return NextResponse.json({ ok: true });
      }
    }
  } catch (err) {
    console.error("[POST admin/learn/video/auto]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message.slice(0, 300) : "Something went wrong." }, { status: 500 });
  }
}
