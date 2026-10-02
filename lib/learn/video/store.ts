import prisma from "@/lib/prisma";
import { ensureVideoTables } from "./db";
import { isGeneratedUrl, readVariants, type Variants } from "./variants";
import {
  CAPTION_LANGS,
  COVERAGE_BUCKETS,
  WATCHED_SHARE,
  coverageShare,
  emptyCoverage,
  mergeCoverage,
  normaliseChapters,
  type Captions,
  type Chapter,
  type LessonVideoData,
} from "./shared";

// Server reads and writes for lesson videos. Every function degrades quietly
// when the tables cannot be created: a lesson still shows its video, just
// without chapters, captions or a saved position.

export function readCaptions(v: unknown): Captions {
  const out: Captions = {};
  if (v && typeof v === "object") {
    for (const l of CAPTION_LANGS) {
      const s = (v as Record<string, unknown>)[l];
      if (typeof s === "string" && s.trim()) out[l] = s;
    }
  }
  return out;
}

export async function getVideoMeta(lessonId: string): Promise<{ chapters: Chapter[]; captions: Captions; variants: Variants }> {
  try {
    await ensureVideoTables();
    const row = await prisma.lessonVideoMeta.findUnique({ where: { lessonId } });
    return { chapters: normaliseChapters(row?.chapters), captions: readCaptions(row?.captions), variants: readVariants(row?.variants) };
  } catch (err) {
    console.error("[learn/video] meta", err);
    return { chapters: [], captions: {}, variants: {} };
  }
}

/**
 * Everything the lesson page needs for one learner. Null when the lesson has
 * no video. A generated narrated video plays in the learner's language when
 * that version exists (French learners get the French voice-over); the
 * owner's own video always wins over generated ones.
 */
export async function lessonVideoFor(
  studentId: string,
  lesson: { id: string; videoUrl: string | null },
  locale: string = "en",
): Promise<LessonVideoData | null> {
  if (!lesson.videoUrl) return null;
  const meta = await getVideoMeta(lesson.id);
  const progress = await prisma.videoProgress
    .findUnique({ where: { studentId_lessonId: { studentId, lessonId: lesson.id } } })
    .catch(() => null);
  const generated = isGeneratedUrl(lesson.videoUrl);
  const variant = generated ? (locale === "fr" ? meta.variants.fr : undefined) ?? meta.variants.en : undefined;
  const pick = variant ? { url: variant.url, chapters: variant.chapters, captions: readCaptions(variant.captions) } : { url: lesson.videoUrl, chapters: meta.chapters, captions: meta.captions };
  const voiceLang = variant ? (variant === meta.variants.fr ? "fr" : "en") : generated ? "en" : undefined;
  return {
    ...pick,
    resumeAt: progress?.positionSec ?? 0,
    coverage: progress?.coverage?.length === COVERAGE_BUCKETS ? progress.coverage : emptyCoverage(),
    watched: !!progress?.watchedAt,
    ...(generated
      ? {
          voiceLang,
          sources: [
            { src: pick.url, type: 'video/mp4; codecs="avc1.640029, mp4a.40.2"' },
            ...(variant?.webm ? [{ src: variant.webm, type: 'video/webm; codecs="vp9, opus"' }] : []),
          ],
        }
      : {}),
  };
}

/**
 * Record where the learner is and what they have seen. Coverage is merged
 * with what was already stored, so skipping around never loses earlier
 * viewing. Returns whether the video now counts as watched, and whether this
 * call is the one that crossed the line.
 */
export async function saveVideoProgress(
  studentId: string,
  lessonId: string,
  p: { position: number; duration: number; coverage: string },
): Promise<{ watched: boolean; justWatched: boolean; share: number }> {
  await ensureVideoTables();
  const key = { studentId_lessonId: { studentId, lessonId } };
  const prev = await prisma.videoProgress.findUnique({ where: key });
  const incoming = /^[01]+$/.test(p.coverage) && p.coverage.length === COVERAGE_BUCKETS ? p.coverage : emptyCoverage();
  const before = prev?.coverage?.length === COVERAGE_BUCKETS ? prev.coverage : emptyCoverage();
  const coverage = mergeCoverage(before, incoming);
  const share = coverageShare(coverage);
  const watched = !!prev?.watchedAt || share >= WATCHED_SHARE;
  const justWatched = watched && !prev?.watchedAt;
  // Near the very end counts as finished: start again from the top next time.
  const duration = p.duration > 0 ? p.duration : prev?.durationSec ?? 0;
  const position = duration > 0 && p.position >= duration - 3 ? 0 : p.position;
  const data = {
    positionSec: Math.max(0, position),
    durationSec: Math.max(0, duration),
    coverage,
    ...(justWatched ? { watchedAt: new Date() } : {}),
  };
  await prisma.videoProgress.upsert({ where: key, create: { studentId, lessonId, ...data }, update: data });
  return { watched, justWatched, share };
}
