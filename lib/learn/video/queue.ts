import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { ensureVideoTables } from "./db";
import { NeedsTts, SkipJob, generateLessonVideo, isGeneratedUrl } from "./pipeline";
import { contentHash, effectiveDecision, planLessons } from "./select";
import { storageMode } from "./storage";
import { ttsProvider, ttsStatus, type TtsLocale } from "./tts";

// The narrated-video job queue: one LessonVideoJob per lesson and language.
// The cron job ("videos", every 15 minutes) claims jobs one at a time with a
// lease (claim-before-run: an UPDATE ... RETURNING on a row picked with
// FOR UPDATE SKIP LOCKED), so overlapping runs never make the same video
// twice, and a run that dies leaves a lease that simply expires.

export const LOCALES: TtsLocale[] = ["en", "fr"];
export const JOB_STATUSES = ["queued", "running", "done", "failed", "needs_tts", "skipped"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

const MAX_ATTEMPTS = 3;
const LEASE_MIN = 25;

/** Queues (or re-queues) videos. Running jobs are left alone. */
export async function queueVideos(lessonIds: string[], opts: { locales?: TtsLocale[]; priority?: number } = {}): Promise<number> {
  if (!lessonIds.length) return 0;
  await ensureVideoTables();
  const lessons = await prisma.lesson.findMany({ where: { id: { in: lessonIds } }, select: { id: true, title: true, objective: true, bodyMd: true } });
  let n = 0;
  for (const l of lessons) {
    const hash = contentHash(l);
    for (const locale of opts.locales ?? LOCALES) {
      const id = randomBytes(10).toString("hex");
      const rows = await prisma.$executeRawUnsafe(
        `INSERT INTO "LessonVideoJob" ("id","lessonId","locale","status","contentHash","priority","attempts","queuedAt","updatedAt")
         VALUES ($1,$2,$3,'queued',$4,$5,0,NOW(),NOW())
         ON CONFLICT ("lessonId","locale") DO UPDATE SET "status"='queued', "contentHash"=$4, "priority"=$5, "attempts"=0, "error"=NULL,
           "queuedAt"=NOW(), "updatedAt"=NOW(), "leaseUntil"=NULL
         WHERE "LessonVideoJob"."status" <> 'running' OR "LessonVideoJob"."leaseUntil" < NOW()`,
        id, l.id, locale, hash, opts.priority ?? 0,
      );
      n += rows;
    }
  }
  return n;
}

/** Every lesson the plan includes that has no finished, current video yet. */
export async function queuePlanned(opts: { trackId?: string } = {}): Promise<number> {
  await ensureVideoTables();
  const lessons = await prisma.lesson.findMany({
    where: opts.trackId ? { module: { trackId: opts.trackId } } : {},
    select: { id: true, title: true, objective: true, bodyMd: true, videoUrl: true },
  });
  const ids = lessons.map((l) => l.id);
  const [plans, jobs] = await Promise.all([
    prisma.lessonVideoPlan.findMany({ where: { lessonId: { in: ids } } }),
    prisma.lessonVideoJob.findMany({ where: { lessonId: { in: ids } } }),
  ]);
  const plan = new Map(plans.map((p) => [p.lessonId, p]));
  let n = 0;
  for (const l of lessons) {
    if (l.videoUrl && !isGeneratedUrl(l.videoUrl)) continue;
    if (!effectiveDecision(plan.get(l.id))) continue;
    const hash = contentHash(l);
    const mine = jobs.filter((j) => j.lessonId === l.id);
    // Only the languages without a current video: a finished one is never paid for twice.
    const missing = LOCALES.filter((loc) => {
      const j = mine.find((x) => x.locale === loc);
      return !(j && j.contentHash === hash && (j.status === "done" || j.status === "queued" || j.status === "running"));
    });
    if (missing.length) n += await queueVideos([l.id], { locales: missing });
  }
  return n;
}

interface ClaimedJob {
  id: string;
  lessonId: string;
  locale: TtsLocale;
  attempts: number;
}

/** Claims the next job. A French job waits until its lesson's English job is not pending. */
async function claimNext(): Promise<ClaimedJob | null> {
  const rows = await prisma.$queryRawUnsafe<ClaimedJob[]>(
    `UPDATE "LessonVideoJob" SET "status"='running', "attempts"="attempts"+1, "startedAt"=NOW(), "updatedAt"=NOW(),
       "leaseUntil"=NOW() + INTERVAL '${LEASE_MIN} minutes', "error"=NULL
     WHERE "id" = (
       SELECT j."id" FROM "LessonVideoJob" j
       WHERE (j."status"='queued' OR (j."status"='running' AND j."leaseUntil" < NOW()))
         AND j."attempts" < ${MAX_ATTEMPTS}
         AND NOT (j."locale"='fr' AND EXISTS (
           SELECT 1 FROM "LessonVideoJob" e WHERE e."lessonId"=j."lessonId" AND e."locale"='en'
             AND (e."status"='queued' OR (e."status"='running' AND e."leaseUntil" >= NOW()))))
       ORDER BY j."priority" DESC, j."queuedAt" ASC, j."locale" ASC
       LIMIT 1 FOR UPDATE SKIP LOCKED)
     RETURNING "id","lessonId","locale","attempts"`,
  );
  return rows[0] ?? null;
}

async function finish(id: string, data: { status: JobStatus; error?: string | null; chars?: number; durationSec?: number; provider?: string; assetId?: string; contentHash?: string }) {
  await prisma.lessonVideoJob.update({
    where: { id },
    data: { ...data, error: data.error ?? null, finishedAt: new Date(), leaseUntil: null, updatedAt: new Date() },
  });
}

// One generation at a time in this process: ffmpeg is CPU-bound.
let localBusy = false;

export interface RunReport {
  processed: number;
  done: number;
  failed: number;
  needsTts: number;
  skipped: number;
  results: Array<{ lessonId: string; locale: string; status: string; seconds?: number; error?: string }>;
}

/** Processes up to `max` jobs before the deadline. */
export async function runVideoQueue(opts: { max?: number; deadline?: number } = {}): Promise<RunReport> {
  const report: RunReport = { processed: 0, done: 0, failed: 0, needsTts: 0, skipped: 0, results: [] };
  if (localBusy) return report;
  localBusy = true;
  try {
    await ensureVideoTables();
    const max = opts.max ?? (Number(process.env.VIDEO_MAX_PER_RUN) || 2);
    if (!ttsProvider()) {
      // Nothing can be made: say so on the queued jobs instead of failing them.
      const n = await prisma.lessonVideoJob.updateMany({
        where: { status: "queued" },
        data: { status: "needs_tts", error: new NeedsTts().message, updatedAt: new Date() },
      });
      report.needsTts = n.count;
      return report;
    }
    while (report.processed < max && (!opts.deadline || Date.now() < opts.deadline)) {
      const job = await claimNext();
      if (!job) break;
      report.processed++;
      const started = Date.now();
      try {
        const r = await generateLessonVideo(job.lessonId, job.locale);
        await finish(job.id, { status: "done", chars: r.chars, durationSec: r.durationSec, provider: r.provider, assetId: r.assetId, contentHash: r.hash });
        report.done++;
        report.results.push({ lessonId: job.lessonId, locale: job.locale, status: "done", seconds: Math.round((Date.now() - started) / 1000) });
      } catch (err) {
        const msg = err instanceof Error ? err.message.slice(0, 1000) : String(err);
        if (err instanceof NeedsTts) {
          await finish(job.id, { status: "needs_tts", error: msg });
          report.needsTts++;
        } else if (err instanceof SkipJob) {
          await finish(job.id, { status: "skipped", error: msg });
          report.skipped++;
        } else {
          console.error("[video/queue]", job.lessonId, job.locale, msg);
          // Back to the queue until the attempts run out.
          const final = job.attempts >= MAX_ATTEMPTS;
          await prisma.lessonVideoJob.update({
            where: { id: job.id },
            data: final
              ? { status: "failed", error: msg, finishedAt: new Date(), leaseUntil: null, updatedAt: new Date() }
              : { status: "queued", error: msg, leaseUntil: null, updatedAt: new Date() },
          });
          if (final) report.failed++;
        }
        report.results.push({ lessonId: job.lessonId, locale: job.locale, status: "error", error: msg.slice(0, 200) });
      }
    }
    return report;
  } finally {
    localBusy = false;
  }
}

/**
 * Keeps the queue in step with the content: lessons whose text changed since
 * their video was made are queued again; jobs waiting for a voice provider
 * go back to the queue once one is configured; new or changed lessons are
 * planned (rules, plus a few AI checks per run).
 */
export async function syncVideoJobs(opts: { aiBudget?: number; deadline?: number } = {}): Promise<{ requeued: number; planned: number; resumed: number }> {
  await ensureVideoTables();
  const planned = (await planLessons({ aiBudget: opts.aiBudget ?? 0, deadline: opts.deadline })).planned;
  let resumed = 0;
  if (ttsProvider()) {
    const r = await prisma.lessonVideoJob.updateMany({ where: { status: "needs_tts" }, data: { status: "queued", error: null, attempts: 0, updatedAt: new Date() } });
    resumed = r.count;
  }
  const requeued = await requeueChanged();
  return { requeued, planned, resumed };
}

/**
 * Takes waiting jobs out of the queue (queued, waiting for a voice key, or
 * stuck from a run that died), for one track or all. Running jobs finish. Nothing is spent on cancelled
 * jobs, and they stay out until someone presses Generate again.
 */
export async function cancelQueued(opts: { trackId?: string } = {}): Promise<number> {
  await ensureVideoTables();
  const r = await prisma.lessonVideoJob.updateMany({
    where: {
      // Waiting, or "running" from a run that died (its lease has expired).
      OR: [{ status: { in: ["queued", "needs_tts"] } }, { status: "running", OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }] }],
      ...(opts.trackId
        ? { lessonId: { in: (await prisma.lesson.findMany({ where: { module: { trackId: opts.trackId } }, select: { id: true } })).map((l) => l.id) } }
        : {}),
    },
    data: { status: "skipped", error: "Cancelled by staff.", leaseUntil: null, updatedAt: new Date() },
  });
  return r.count;
}

/** Lessons with a finished video whose content has changed since: queued again. Cheap (no AI). */
export async function requeueChanged(): Promise<number> {
  await ensureVideoTables();
  const done = await prisma.lessonVideoJob.findMany({ where: { status: { in: ["done", "failed"] } }, select: { lessonId: true, locale: true, contentHash: true, status: true } });
  if (!done.length) return 0;
  const ids = [...new Set(done.map((d) => d.lessonId))];
  const lessons = await prisma.lesson.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, objective: true, bodyMd: true, videoUrl: true } });
  const hash = new Map(lessons.map((l) => [l.id, contentHash(l)]));
  const own = new Set(lessons.filter((l) => l.videoUrl && !isGeneratedUrl(l.videoUrl)).map((l) => l.id));
  // Only the languages whose video was made from older text.
  const stale = new Map<string, TtsLocale[]>();
  for (const d of done) {
    if (d.status !== "done" || !hash.has(d.lessonId) || hash.get(d.lessonId) === d.contentHash || own.has(d.lessonId)) continue;
    if (d.locale === "en" || d.locale === "fr") stale.set(d.lessonId, [...(stale.get(d.lessonId) ?? []), d.locale]);
  }
  let n = 0;
  for (const [lessonId, locales] of stale) n += await queueVideos([lessonId], { locales });
  return n;
}

// ── Summary and cost estimate (admin) ───────────────────────────────────────

/** Claude cost per lesson for the scene script (Sonnet) and its French translation, USD. */
const AI_COST_PER_LESSON = 0.06;

export interface VideoSummary {
  provider: ReturnType<typeof ttsStatus>;
  storage: "object" | "db";
  lessons: number;
  planned: number;
  include: number;
  exclude: number;
  ownVideo: number;
  jobs: Record<JobStatus, number>;
  /** What generating every included lesson still missing a current video would cost. */
  estimate: { lessons: number; videos: number; chars: number; minutes: number; ttsUsd: number; aiUsd: number; totalUsd: number };
  /** Whether the queue is moving: when a video was last started or finished, jobs stuck from a dead run, the latest error. */
  activity: {
    lastStartedAt: string | null;
    lastFinishedAt: string | null;
    stuck: number;
    lastError: { lessonTitle: string; locale: string; error: string; at: string } | null;
  };
  perTrack: Array<{ trackId: string; title: string; lessons: number; include: number; done: number; queued: number; failed: number; needsTts: number; estVideos: number; estUsd: number }>;
}

export async function videoSummary(): Promise<VideoSummary> {
  await ensureVideoTables();
  const [tracks, plans, jobs] = await Promise.all([
    prisma.learnTrack.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, modules: { select: { lessons: { select: { id: true, title: true, objective: true, bodyMd: true, videoUrl: true } } } } },
    }),
    prisma.lessonVideoPlan.findMany({ select: { lessonId: true, decision: true, override: true, estChars: true, scriptHash: true, script: true, contentHash: true } }),
    prisma.lessonVideoJob.findMany({
      select: { lessonId: true, locale: true, status: true, contentHash: true, error: true, startedAt: true, finishedAt: true, leaseUntil: true, updatedAt: true },
    }),
  ]);
  const plan = new Map(plans.map((p) => [p.lessonId, p]));
  const jobsBy = new Map<string, typeof jobs>();
  for (const j of jobs) jobsBy.set(j.lessonId, [...(jobsBy.get(j.lessonId) ?? []), j]);
  const counts = Object.fromEntries(JOB_STATUSES.map((s) => [s, 0])) as Record<JobStatus, number>;
  for (const j of jobs) if (j.status in counts) counts[j.status as JobStatus]++;
  const status = ttsStatus();

  let lessons = 0, planned = 0, include = 0, exclude = 0, ownVideo = 0;
  const est = { lessons: 0, videos: 0, chars: 0 };
  let aiLessons = 0;
  const perTrack: VideoSummary["perTrack"] = [];
  for (const t of tracks) {
    const row = { trackId: t.id, title: t.title, lessons: 0, include: 0, done: 0, queued: 0, failed: 0, needsTts: 0, estVideos: 0, estUsd: 0 };
    let trackChars = 0, trackAi = 0;
    for (const l of t.modules.flatMap((m) => m.lessons)) {
      lessons++;
      row.lessons++;
      const p = plan.get(l.id);
      if (p) planned++;
      if (l.videoUrl && !isGeneratedUrl(l.videoUrl)) {
        ownVideo++;
        continue;
      }
      const yes = effectiveDecision(p);
      if (!yes) {
        if (p) exclude++;
        continue;
      }
      include++;
      row.include++;
      const hash = contentHash(l);
      const js = jobsBy.get(l.id) ?? [];
      if (js.some((j) => j.status === "done" && j.locale === "en")) row.done++;
      if (js.some((j) => j.status === "queued" || j.status === "running")) row.queued++;
      if (js.some((j) => j.status === "failed")) row.failed++;
      if (js.some((j) => j.status === "needs_tts")) row.needsTts++;
      const missing = LOCALES.filter((loc) => !js.some((j) => j.locale === loc && j.status === "done" && j.contentHash === hash));
      if (!missing.length) continue;
      est.lessons++;
      const script = p?.scriptHash === hash ? (p.script as { en?: { scenes?: Array<{ narration?: string }> } } | null) : null;
      const chars = script?.en?.scenes?.reduce((a, s) => a + (s.narration?.length ?? 0), 0) || p?.estChars || 3000;
      if (!script) {
        aiLessons++;
        trackAi++;
      }
      for (const loc of missing) {
        const c = loc === "fr" ? Math.round(chars * 1.15) : chars;
        est.videos++;
        est.chars += c;
        row.estVideos++;
        trackChars += c;
      }
    }
    row.estUsd = round2((trackChars / 1e6) * status.pricePerMChar + trackAi * AI_COST_PER_LESSON);
    perTrack.push(row);
  }
  const ttsUsd = (est.chars / 1e6) * status.pricePerMChar;
  const aiUsd = aiLessons * AI_COST_PER_LESSON;
  const now = Date.now();
  const latest = (d: Array<Date | null>) => d.reduce<Date | null>((a, x) => (x && (!a || x > a) ? x : a), null)?.toISOString() ?? null;
  const errored = jobs
    .filter((j) => j.error && (j.status === "queued" || j.status === "failed"))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  const titles = new Map(tracks.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => [l.id, l.title] as const))));
  const activity: VideoSummary["activity"] = {
    lastStartedAt: latest(jobs.map((j) => j.startedAt)),
    lastFinishedAt: latest(jobs.map((j) => (j.status === "done" ? j.finishedAt : null))),
    stuck: jobs.filter((j) => j.status === "running" && (!j.leaseUntil || j.leaseUntil.getTime() < now)).length,
    lastError: errored
      ? { lessonTitle: titles.get(errored.lessonId) ?? errored.lessonId, locale: errored.locale, error: (errored.error ?? "").slice(0, 300), at: errored.updatedAt.toISOString() }
      : null,
  };
  return {
    provider: status,
    storage: await storageMode(),
    activity,
    lessons,
    planned,
    include,
    exclude,
    ownVideo,
    jobs: counts,
    estimate: { ...est, minutes: Math.round(est.chars / 900), ttsUsd: round2(ttsUsd), aiUsd: round2(aiUsd), totalUsd: round2(ttsUsd + aiUsd) },
    perTrack,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
