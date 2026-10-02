import { mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureVideoTables } from "./db";
import { composeVideo, probe, sceneAudio, toWebm } from "./ffmpeg";
import { generateScenes, narrationChars, readSceneScript, translateScenes, type LessonForVideo, type SceneScript } from "./scenes";
import { contentHash } from "./select";
import { renderSlide } from "./slides";
import { deleteAsset, storeVideoFile } from "./storage";
import { buildVtt, sceneChapters, timingsFrom } from "./timing";
import { ttsProvider, type TtsLocale } from "./tts";
import type { Captions } from "./shared";
import { ASSET_PREFIX, isGeneratedUrl, readVariants, type Variant } from "./variants";

export { isGeneratedUrl } from "./variants";

// One narrated video, end to end: scene script (cached on the plan) ->
// French translation when needed -> a slide PNG and the AI voice per scene
// -> ffmpeg -> stored file -> the lesson's link, chapters and captions.
// Temporary files live under os.tmpdir() and are always removed.

export class NeedsTts extends Error {
  constructor() {
    super("No text-to-speech provider is configured (set GOOGLE_TTS_API_KEY or OPENAI_API_KEY).");
  }
}
export class SkipJob extends Error {}

async function loadLesson(lessonId: string): Promise<(LessonForVideo & { videoUrl: string | null }) | null> {
  const l = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true, title: true, objective: true, bodyMd: true, durationMinutes: true, videoUrl: true,
      module: { select: { title: true, track: { select: { title: true } } } },
    },
  });
  if (!l) return null;
  return { ...l, trackTitle: l.module.track.title, moduleTitle: l.module.title };
}

interface StoredScript {
  en: SceneScript;
  fr?: SceneScript | null;
}

/**
 * The scene script for the lesson's current content: reused from the plan
 * when the content has not changed, otherwise drafted again. French is added
 * on request (and cached the same way).
 */
export async function ensureScript(lesson: LessonForVideo, wantFr: boolean): Promise<{ en: SceneScript; fr: SceneScript | null }> {
  await ensureVideoTables();
  const hash = contentHash(lesson);
  const plan = await prisma.lessonVideoPlan.findUnique({ where: { lessonId: lesson.id } });
  const stored = plan?.scriptHash === hash ? (plan.script as unknown as StoredScript | null) : null;
  let en = stored?.en ? readSceneScript(stored.en) : null;
  let fr = stored?.fr ? readSceneScript(stored.fr) : null;
  let changed = false;
  if (!en) {
    en = await generateScenes(lesson);
    fr = null;
    changed = true;
  }
  if (wantFr && !fr) {
    fr = await translateScenes(lesson.id, en, { track: lesson.trackTitle, module: lesson.moduleTitle });
    if (fr) changed = true;
  }
  if (changed) {
    const script = { en, fr } as unknown as Prisma.InputJsonValue;
    await prisma.lessonVideoPlan.upsert({
      where: { lessonId: lesson.id },
      create: { lessonId: lesson.id, contentHash: hash, decision: true, reason: "Generated on request.", source: "default", script, scriptHash: hash, estChars: narrationChars(en) },
      update: { script, scriptHash: hash, estChars: narrationChars(en) },
    });
  }
  return { en, fr };
}

async function pool<T, R>(items: T[], n: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

export interface GenerateResult {
  assetId: string;
  url: string;
  durationSec: number;
  chars: number;
  provider: string;
  scenes: number;
  hash: string;
}

/** Makes the narrated video for one lesson in one language and publishes it on the lesson. */
export async function generateLessonVideo(lessonId: string, locale: TtsLocale): Promise<GenerateResult> {
  await ensureVideoTables();
  const lesson = await loadLesson(lessonId);
  if (!lesson) throw new SkipJob("The lesson no longer exists.");
  if (lesson.videoUrl && !isGeneratedUrl(lesson.videoUrl)) throw new SkipJob("The lesson has its own video; a generated one is not added.");
  const tts = ttsProvider();
  if (!tts) throw new NeedsTts();

  const hash = contentHash(lesson);
  const t0 = Date.now();
  const lap: Record<string, number> = {};
  const mark = (k: string) => (lap[k] = Math.round((Date.now() - t0) / 100) / 10);
  const { en, fr } = await ensureScript(lesson, true);
  mark("script");
  const script = locale === "fr" ? fr : en;
  if (!script) throw new Error("The French translation of the script is not available yet; will retry.");
  // The other language's text, timed to this video's scenes, for its second caption track.
  const other = locale === "fr" ? en : fr;

  const tmp = await mkdtemp(path.join(os.tmpdir(), "arfa-video-"));
  try {
    const total = script.scenes.length;
    const parts = await pool(script.scenes, 3, async (scene, i) => {
      const [png, mp3s] = await Promise.all([
        renderSlide(scene, {
          index: i,
          total,
          trackTitle: locale === "fr" ? script.track || lesson.trackTitle : lesson.trackTitle,
          moduleTitle: locale === "fr" ? script.module || lesson.moduleTitle : lesson.moduleTitle,
          lessonTitle: locale === "fr" ? script.title || lesson.title : lesson.title,
          locale,
        }),
        tts.synthesize(scene.narration, locale),
      ]);
      const slide = path.join(tmp, `s${i}.png`);
      await writeFile(slide, png);
      const chunks: string[] = [];
      for (const [j, b] of mp3s.entries()) {
        const f = path.join(tmp, `s${i}-${j}.mp3`);
        await writeFile(f, b);
        chunks.push(f);
      }
      const wav = path.join(tmp, `s${i}.wav`);
      const len = await sceneAudio(chunks, wav);
      return { slide, wav, ...len };
    });

    mark("voice+slides");
    const timings = timingsFrom(parts);
    const out = path.join(tmp, "video.mp4");
    await composeVideo({ slides: parts.map((p) => p.slide), audio: parts.map((p) => p.wav), sceneSeconds: parts.map((p) => p.total), out, tmp });
    mark("compose");
    const info = await probe(out);
    if (!info.streams.some((s) => s.startsWith("Video: h264")) || !info.streams.some((s) => s.startsWith("Audio: aac"))) {
      throw new Error(`The finished file is missing a stream (${info.streams.join("; ").slice(0, 200)})`);
    }
    const duration = info.duration || timings[timings.length - 1].end;

    const mp4 = await storeVideoFile(out, { lessonId, locale, contentType: "video/mp4", durationSec: duration });
    const assetIds = [mp4.id];
    let webmUrl: string | undefined;
    if (process.env.VIDEO_WEBM === "1") {
      const wf = path.join(tmp, "video.webm");
      await toWebm(out, wf, duration);
      const w = await storeVideoFile(wf, { lessonId, locale, contentType: "video/webm", durationSec: duration });
      assetIds.push(w.id);
      webmUrl = `${ASSET_PREFIX}${w.id}.webm`;
    }

    mark("store");
    console.info(`[video] ${lessonId} ${locale}: ${total} scenes, ${Math.round(duration)}s video, timings (cumulative s) ${JSON.stringify(lap)}`);
    const url = `${ASSET_PREFIX}${mp4.id}.mp4`;
    const chapters = sceneChapters(script.scenes.map((s) => s.title), timings);
    const captions: Captions = { [locale]: buildVtt(script.scenes.map((s) => s.narration), timings) };
    if (other && other.scenes.length === script.scenes.length) {
      captions[locale === "fr" ? "en" : "fr"] = buildVtt(other.scenes.map((s) => s.narration), timings);
    }
    const variant: Variant = {
      url,
      webm: webmUrl,
      assetIds,
      chapters,
      captions,
      durationSec: duration,
      voice: tts.voice(locale),
      provider: tts.id,
      generatedAt: new Date().toISOString(),
    };
    await publishVariant(lessonId, locale, variant);
    return { assetId: mp4.id, url, durationSec: duration, chars: narrationChars(script), provider: tts.id, scenes: total, hash };
  } finally {
    await rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Puts a finished variant on the lesson. The English one becomes the lesson
 * video (Lesson.videoUrl, chapters, captions) unless staff have set their own
 * video meanwhile. Replaced files are deleted afterwards. Never sets
 * editedAt, so the seed keeps updating the lesson text.
 */
async function publishVariant(lessonId: string, locale: TtsLocale, v: Variant): Promise<void> {
  const replaced: string[] = [];
  await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: lessonId }, select: { videoUrl: true } });
    if (!lesson) throw new SkipJob("The lesson no longer exists.");
    const meta = await tx.lessonVideoMeta.findUnique({ where: { lessonId } });
    const variants = readVariants(meta?.variants);
    replaced.push(...(variants[locale]?.assetIds ?? []));
    variants[locale] = v;
    const ownVideo = !!lesson.videoUrl && !isGeneratedUrl(lesson.videoUrl);
    const useEn = locale === "en" && !ownVideo;
    const json = variants as unknown as Prisma.InputJsonValue;
    await tx.lessonVideoMeta.upsert({
      where: { lessonId },
      create: {
        lessonId,
        variants: json,
        chapters: (useEn ? v.chapters : []) as unknown as Prisma.InputJsonValue,
        captions: (useEn ? v.captions : {}) as Prisma.InputJsonValue,
      },
      update: {
        variants: json,
        ...(useEn ? { chapters: v.chapters as unknown as Prisma.InputJsonValue, captions: v.captions as Prisma.InputJsonValue } : {}),
      },
    });
    if (useEn) await tx.lesson.update({ where: { id: lessonId }, data: { videoUrl: v.url } });
  });
  for (const id of replaced) if (!v.assetIds.includes(id)) await deleteAsset(id);
}

/** Removes the generated videos from a lesson (the owner's own video, if any, is left alone). */
export async function removeGeneratedVideo(lessonId: string): Promise<void> {
  await ensureVideoTables();
  const assets = await prisma.lessonVideoAsset.findMany({ where: { lessonId }, select: { id: true } });
  await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: lessonId }, select: { videoUrl: true } });
    const meta = await tx.lessonVideoMeta.findUnique({ where: { lessonId } });
    if (meta) {
      const generatedMain = isGeneratedUrl(lesson?.videoUrl);
      await tx.lessonVideoMeta.update({
        where: { lessonId },
        data: { variants: {}, ...(generatedMain ? { chapters: [], captions: {} } : {}) },
      });
    }
    if (isGeneratedUrl(lesson?.videoUrl)) await tx.lesson.update({ where: { id: lessonId }, data: { videoUrl: null } });
  });
  for (const a of assets) await deleteAsset(a.id);
}
