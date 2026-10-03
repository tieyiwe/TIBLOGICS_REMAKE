import { mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureVideoTables } from "./db";
import { composeVideo, probe, sceneAudio, toWebm, type Shot } from "./ffmpeg";
import { generateScenes, narrationChars, readSceneScript, translateScenes, type LessonForVideo, type Scene, type SceneScript, SCRIPT_VERSION } from "./scenes";
import { contentHash } from "./select";
import { renderSlide, revealCount } from "./slides";
import { deleteAsset, storeVideoFile } from "./storage";
import { LEAD_SEC, buildVtt, sceneChapters, timingsFrom } from "./timing";
import { loadVoiceSettings, ttsProvider, type TtsLocale } from "./tts";
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
  // Written before the illustrated layouts: rewritten once.
  if (en && (en.v ?? 1) < SCRIPT_VERSION) {
    en = null;
    fr = null;
  }
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
      create: { lessonId: lesson.id, contentHash: hash, decision: true, reason: "Generated on request.", source: "request", script, scriptHash: hash, estChars: narrationChars(en) },
      update: { script, scriptHash: hash, estChars: narrationChars(en) },
    });
  }
  return { en, fr };
}

// ── Points that appear with the narration ───────────────────────────────────

const STOP = new Set("the and for with that this your you from into about what when then them they their there have will more than also each just like make sure step steps les des une pour avec dans vous votre que qui est sont aux sur par plus".split(" "));

/** The text of each point a scene reveals, in order (see revealCount). */
function revealItems(scene: Scene, n: number): string[] {
  switch (scene.layout) {
    case "steps":
      return scene.steps.slice(0, n);
    case "cycle":
    case "hub":
    case "timeline":
      return scene.nodes.slice(0, n);
    case "compare":
      return scene.compare ? [[scene.compare.leftTitle, ...scene.compare.left].join(" "), [scene.compare.rightTitle, ...scene.compare.right].join(" ")] : [];
    case "illustration":
      return scene.icons.slice(0, n);
    default:
      return scene.bullets.slice(0, n);
  }
}

const words = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));

/**
 * When each point appears, in seconds from the start of the scene: the first
 * at once, each next one when the narration first mentions it (by its words),
 * spread evenly where the words are not found. At least 1.2 s apart, and
 * never in the last second of speech.
 */
export function revealTimes(scene: Scene, n: number, speechSec: number): number[] {
  if (n <= 1) return [0];
  const text = scene.narration.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const items = revealItems(scene, n);
  const found: Array<number | null> = [0];
  let from = 0;
  for (let i = 1; i < n; i++) {
    let best: number | null = null;
    for (const w of words(items[i] ?? "")) {
      const at = text.indexOf(w.slice(0, Math.max(4, w.length - 2)), from);
      if (at >= 0 && (best === null || at < best)) best = at;
    }
    found.push(best === null ? null : best / Math.max(1, text.length));
    if (best !== null) from = best + 1;
  }
  // Fill gaps evenly between known neighbours.
  const pos = found.map((v, i) => v ?? NaN);
  for (let i = 1; i < n; i++) {
    if (!Number.isNaN(pos[i])) continue;
    let j = i;
    while (j < n && Number.isNaN(pos[j])) j++;
    const a = pos[i - 1], b = j < n ? pos[j] : 0.92;
    for (let k = i; k < j; k++) pos[k] = a + ((b - a) * (k - i + 1)) / (j - i + 1);
  }
  const out: number[] = [0];
  const last = Math.max(0, speechSec - 1);
  for (let i = 1; i < n; i++) {
    // Very short scenes: still in order, at least 0.4 s apart.
    const t = Math.max(out[i - 1] + 0.4, Math.min(last, Math.max(out[i - 1] + 1.2, LEAD_SEC + pos[i] * speechSec)));
    out.push(t);
  }
  // Many points in a short scene: squeeze them so the last still lands inside the speech.
  const limit = Math.max(0.5, speechSec);
  if (out[n - 1] > limit) return out.map((t) => (t * limit) / out[n - 1]);
  return out;
}

// Slides are drawn one at a time across the whole process, with a pause
// between them: drawing is synchronous work, and the web server shares the
// process, so page requests get through in between.
let drawing: Promise<unknown> = Promise.resolve();
function drawSlide(scene: Scene, ctx: Parameters<typeof renderSlide>[1]): Promise<Buffer> {
  const run = drawing.then(async () => {
    const png = await renderSlide(scene, ctx);
    await new Promise((r) => setImmediate(r));
    return png;
  });
  drawing = run.catch(() => {});
  return run;
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
export async function generateLessonVideo(
  lessonId: string,
  locale: TtsLocale,
  opts: { stillWanted?: () => Promise<boolean> } = {},
): Promise<GenerateResult> {
  await ensureVideoTables();
  const lesson = await loadLesson(lessonId);
  if (!lesson) throw new SkipJob("The lesson no longer exists.");
  if (lesson.videoUrl && !isGeneratedUrl(lesson.videoUrl)) throw new SkipJob("The lesson has its own video; a generated one is not added.");
  await loadVoiceSettings();
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
      const ctx = {
        index: i,
        total,
        trackTitle: locale === "fr" ? script.track || lesson.trackTitle : lesson.trackTitle,
        moduleTitle: locale === "fr" ? script.module || lesson.moduleTitle : lesson.moduleTitle,
        lessonTitle: locale === "fr" ? script.title || lesson.title : lesson.title,
        locale,
      };
      // One frame per point that appears (or the whole slide), rendered while the voice is made.
      const k = revealCount(scene);
      const [pngs, mp3s] = await Promise.all([
        // One frame at a time: drawing several 1080p slides at once costs memory.
        (async () => {
          if (k <= 1) return [await drawSlide(scene, ctx)];
          const out: Buffer[] = [];
          for (let j = 0; j < k; j++) out.push(await drawSlide(scene, { ...ctx, reveal: j + 1 }));
          return out;
        })(),
        tts.synthesize(scene.narration, locale),
      ]);
      const frames: string[] = [];
      for (const [j, png] of pngs.entries()) {
        const f = path.join(tmp, `s${i}-f${j}.png`);
        await writeFile(f, png);
        frames.push(f);
      }
      const chunks: string[] = [];
      for (const [j, b] of mp3s.entries()) {
        const f = path.join(tmp, `s${i}-${j}.mp3`);
        await writeFile(f, b);
        chunks.push(f);
      }
      const wav = path.join(tmp, `s${i}.wav`);
      const len = await sceneAudio(chunks, wav);
      return { frames, wav, at: revealTimes(scene, frames.length, len.speech), ...len };
    });

    mark("voice+slides");
    const timings = timingsFrom(parts);
    const out = path.join(tmp, "video.mp4");
    // Each scene: its frames in turn (a 0.5 s crossfade into a new scene, 0.35 s as a point appears).
    const shots: Shot[] = parts.flatMap((p, i) =>
      p.frames.map((file, j) => ({
        file,
        seconds: Math.max(0.2, (j + 1 < p.frames.length ? p.at[j + 1] : p.total) - p.at[j]),
        fade: j === 0 ? (i === 0 ? 0 : 0.5) : 0.35,
      })),
    );
    await composeVideo({ shots, audio: parts.map((p) => p.wav), totalSeconds: parts.reduce((t, p) => t + p.total, 0), out, tmp });
    mark("compose");
    const info = await probe(out);
    if (!info.streams.some((s) => s.startsWith("Video: h264")) || !info.streams.some((s) => s.startsWith("Audio: aac"))) {
      throw new Error(`The finished file is missing a stream (${info.streams.join("; ").slice(0, 200)})`);
    }
    const duration = info.duration || timings[timings.length - 1].end;

    // Stored files are deleted again if anything after this fails, so a
    // failed or cancelled run never leaves an unused file behind.
    const stored: string[] = [];
    try {
      const mp4 = await storeVideoFile(out, { lessonId, locale, contentType: "video/mp4", durationSec: duration });
      stored.push(mp4.id);
      const assetIds = [mp4.id];
      let webmUrl: string | undefined;
      if (process.env.VIDEO_WEBM === "1") {
        const wf = path.join(tmp, "video.webm");
        await toWebm(out, wf, duration);
        const w = await storeVideoFile(wf, { lessonId, locale, contentType: "video/webm", durationSec: duration });
        stored.push(w.id);
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
      // Cancelled or removed by staff while it was being made: not published.
      if (opts.stillWanted && !(await opts.stillWanted())) throw new SkipJob("Stopped by staff while it was being made.");
      await publishVariant(lessonId, locale, variant);
      return { assetId: mp4.id, url, durationSec: duration, chars: narrationChars(script), provider: tts.id, scenes: total, hash };
    } catch (err) {
      for (const id of stored) await deleteAsset(id).catch(() => {});
      throw err;
    }
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
