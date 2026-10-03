import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { ensureVideoTables } from "./db";
import { NeedsTts, SkipJob, generateLessonVideo, isGeneratedUrl } from "./pipeline";
import { contentHash, effectiveDecision, planLessons } from "./select";
import { storageMode } from "./storage";
import { loadVoiceSettings, ttsProvider, ttsStatus, type TtsLocale } from "./tts";
import { readVariants } from "./variants";

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
/** A failed attempt waits this long (times the attempt number) before the next, so a passing problem can clear. */
const RETRY_AFTER_MIN = 10;

/**
 * Errors that will not go away by trying again (a wrong voice name, a key
 * without the API, a refused request): the job fails at once with the
 * reason, instead of paying for the same failure three times.
 */
function permanent(msg: string): boolean {
  return (
    /\b(?:Google TTS|OpenAI TTS|Google TTS voices) (?:400|401|403|404)\b/.test(msg) ||
    /ffmpeg binary not found/.test(msg) ||
    // The script model twice gave something that is not a usable script (each try is paid).
    /scene script did not come back in the expected shape/.test(msg)
  );
}

/** Removes working folders left by a run that died (older than two hours). */
async function sweepTemp(): Promise<void> {
  const { readdir, stat, rm } = await import("fs/promises");
  const os = await import("os");
  const path = await import("path");
  const dir = os.tmpdir();
  const names = await readdir(dir).catch(() => [] as string[]);
  const cutoff = Date.now() - 2 * 3_600_000;
  for (const n of names) {
    if (!/^arfa-(video|voice)-/.test(n)) continue;
    const full = path.join(dir, n);
    const st = await stat(full).catch(() => null);
    if (st && st.mtimeMs < cutoff) await rm(full, { recursive: true, force: true }).catch(() => {});
  }
}

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
  /** Set by this claim: the job is still ours while status is running with this start time. */
  startedAt: Date;
}

/** Claims the next job. A French job waits until its lesson's English job is not pending. */
async function claimNext(): Promise<ClaimedJob | null> {
  const rows = await prisma.$queryRawUnsafe<ClaimedJob[]>(
    `UPDATE "LessonVideoJob" SET "status"='running', "attempts"="attempts"+1, "startedAt"=NOW(), "updatedAt"=NOW(),
       "leaseUntil"=NOW() + INTERVAL '${LEASE_MIN} minutes', "error"=NULL
     WHERE "id" = (
       SELECT j."id" FROM "LessonVideoJob" j
       WHERE (j."status"='queued' OR (j."status"='running' AND j."leaseUntil" < NOW()))
         AND j."queuedAt" <= NOW()
         AND j."attempts" < ${MAX_ATTEMPTS}
         AND NOT (j."locale"='fr' AND EXISTS (
           SELECT 1 FROM "LessonVideoJob" e WHERE e."lessonId"=j."lessonId" AND e."locale"='en'
             AND (e."status"='queued' OR (e."status"='running' AND e."leaseUntil" >= NOW()))))
       ORDER BY j."priority" DESC, j."queuedAt" ASC, j."locale" ASC
       LIMIT 1 FOR UPDATE SKIP LOCKED)
     RETURNING "id","lessonId","locale","attempts","startedAt"`,
  );
  return rows[0] ?? null;
}

/** Written only while the job is still ours (staff may have cancelled or removed it meanwhile). */
async function finish(job: ClaimedJob, data: { status: JobStatus; error?: string | null; chars?: number; durationSec?: number; provider?: string; assetId?: string; contentHash?: string }) {
  await prisma.lessonVideoJob.updateMany({
    where: { id: job.id, status: "running", startedAt: job.startedAt },
    data: { ...data, error: data.error ?? null, finishedAt: new Date(), leaseUntil: null, updatedAt: new Date() },
  });
}

const stillOurs = (job: ClaimedJob) => () =>
  prisma.lessonVideoJob.count({ where: { id: job.id, status: "running", startedAt: job.startedAt } }).then((n) => n > 0);

/**
 * Housekeeping before a run: jobs left "running" by a process that died
 * after their last attempt fail with a reason (otherwise nothing would ever
 * pick them up again), and French jobs whose English video failed wait as
 * failed too (the French one reuses the English script).
 */
async function tidyJobs(): Promise<void> {
  await prisma.lessonVideoJob.updateMany({
    where: { status: "running", leaseUntil: { lt: new Date() }, attempts: { gte: MAX_ATTEMPTS } },
    data: { status: "failed", error: "The run stopped part-way several times (the server restarted or ran out of memory).", leaseUntil: null, finishedAt: new Date(), updatedAt: new Date() },
  });
  const failedEn = await prisma.lessonVideoJob.findMany({ where: { locale: "en", status: "failed" }, select: { lessonId: true } });
  if (failedEn.length) {
    await prisma.lessonVideoJob.updateMany({
      where: { locale: "fr", status: "queued", lessonId: { in: failedEn.map((j) => j.lessonId) } },
      data: { status: "failed", error: "Waiting for the English video, which failed: fix that one and press Generate.", updatedAt: new Date() },
    });
  }
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
    await loadVoiceSettings();
    await sweepTemp().catch(() => {});
    await tidyJobs().catch((err) => console.error("[video/queue] tidy", err));
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
        const r = await generateLessonVideo(job.lessonId, job.locale, { stillWanted: stillOurs(job) });
        await finish(job, { status: "done", chars: r.chars, durationSec: r.durationSec, provider: r.provider, assetId: r.assetId, contentHash: r.hash });
        report.done++;
        report.results.push({ lessonId: job.lessonId, locale: job.locale, status: "done", seconds: Math.round((Date.now() - started) / 1000) });
      } catch (err) {
        const msg = err instanceof Error ? err.message.slice(0, 1000) : String(err);
        if (err instanceof NeedsTts) {
          await finish(job, { status: "needs_tts", error: msg });
          report.needsTts++;
        } else if (err instanceof SkipJob) {
          await finish(job, { status: "skipped", error: msg });
          report.skipped++;
        } else {
          console.error("[video/queue]", job.lessonId, job.locale, msg);
          // Back to the queue, after a pause, until the attempts run out;
          // an error that retrying cannot fix fails at once.
          const final = job.attempts >= MAX_ATTEMPTS || permanent(msg);
          await prisma.lessonVideoJob.updateMany({
            where: { id: job.id, status: "running", startedAt: job.startedAt },
            data: final
              ? { status: "failed", error: msg, finishedAt: new Date(), leaseUntil: null, updatedAt: new Date() }
              : { status: "queued", error: msg, leaseUntil: null, queuedAt: new Date(Date.now() + job.attempts * RETRY_AFTER_MIN * 60_000), updatedAt: new Date() },
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
  await sweepOrphanAssets().catch((err) => console.error("[video/queue] orphan sweep", err));
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

/**
 * Stored video files no lesson uses any more (a run that died between
 * storing and publishing, an old version not cleaned up): deleted once they
 * are a day old. At most once a day.
 */
let lastOrphanSweep = 0;
async function sweepOrphanAssets(): Promise<number> {
  if (Date.now() - lastOrphanSweep < 24 * 3_600_000) return 0;
  lastOrphanSweep = Date.now();
  const [metas, assets] = await Promise.all([
    prisma.lessonVideoMeta.findMany({ select: { variants: true } }),
    prisma.lessonVideoAsset.findMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3_600_000) } }, select: { id: true } }),
  ]);
  const used = new Set<string>();
  for (const m of metas) {
    const v = readVariants(m.variants);
    for (const loc of LOCALES) for (const id of v[loc]?.assetIds ?? []) used.add(id);
  }
  const { deleteAsset } = await import("./storage");
  let n = 0;
  for (const a of assets) {
    if (used.has(a.id)) continue;
    await deleteAsset(a.id).catch(() => {});
    n++;
  }
  if (n) console.info(`[video/queue] removed ${n} unused video files`);
  return n;
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
    // Finished or failed videos whose lesson text changed since: made again from the new text.
    if ((d.status !== "done" && d.status !== "failed") || !hash.has(d.lessonId) || hash.get(d.lessonId) === d.contentHash || own.has(d.lessonId)) continue;
    if (d.locale === "en" || d.locale === "fr") stale.set(d.lessonId, [...(stale.get(d.lessonId) ?? []), d.locale]);
  }
  let n = 0;
  for (const [lessonId, locales] of stale) n += await queueVideos([lessonId], { locales });
  return n;
}

/** Published AI videos made with another voice than the one now chosen, per language. */
export async function oldVoiceVideos(): Promise<Array<{ lessonId: string; locale: TtsLocale; chars: number }>> {
  await ensureVideoTables();
  await loadVoiceSettings();
  const p = ttsProvider();
  if (!p) return [];
  const [metas, jobs] = await Promise.all([
    prisma.lessonVideoMeta.findMany({ select: { lessonId: true, variants: true } }),
    prisma.lessonVideoJob.findMany({ select: { lessonId: true, locale: true, status: true, chars: true } }),
  ]);
  const jobBy = new Map(jobs.map((j) => [`${j.lessonId}:${j.locale}`, j]));
  const out: Array<{ lessonId: string; locale: TtsLocale; chars: number }> = [];
  for (const m of metas) {
    const v = readVariants(m.variants);
    for (const loc of LOCALES) {
      const variant = v[loc];
      if (!variant || variant.voice === p.voice(loc)) continue;
      const j = jobBy.get(`${m.lessonId}:${loc}`);
      if (j && (j.status === "queued" || j.status === "running")) continue;
      out.push({ lessonId: m.lessonId, locale: loc, chars: j?.chars || 3000 });
    }
  }
  return out;
}

/** Queues those videos again with the chosen voice (the scripts are reused, so only the voice is paid for). */
export async function queueRevoice(): Promise<number> {
  let n = 0;
  for (const r of await oldVoiceVideos()) n += await queueVideos([r.lessonId], { locales: [r.locale] });
  return n;
}

// ── Automatic batches ("Make the next 10") ──────────────────────────────────
// Staff start a batch; the server makes queued videos one after another,
// in the background, until the batch size is reached (then it pauses for a
// review), the queue is empty, several fail in a row, or staff stop it. The
// state is stored (AdminSettings "video_batch"), so a restart resumes it the
// next time the admin page or the videos cron job runs.

const BATCH_KEY = "video_batch";
const BATCH_MAX_FAILS_IN_ROW = 3;

export interface BatchState {
  size: number;
  made: number;
  failed: number;
  state: "running" | "paused" | "finished" | "stopped";
  startedAt: string;
  endedAt?: string;
  reason?: string;
}

async function readBatch(): Promise<BatchState | null> {
  const row = await prisma.adminSettings.findUnique({ where: { key: BATCH_KEY } }).catch(() => null);
  if (!row) return null;
  try {
    return JSON.parse(row.value) as BatchState;
  } catch {
    return null;
  }
}

async function writeBatch(b: BatchState): Promise<void> {
  const value = JSON.stringify(b);
  await prisma.adminSettings.upsert({ where: { key: BATCH_KEY }, create: { key: BATCH_KEY, value }, update: { value } });
  invalidateVideoSummary();
}

let batchLoop: Promise<void> | null = null;

function kickBatch() {
  if (batchLoop) return;
  batchLoop = batchRun()
    .catch((err) => console.error("[video/batch]", err))
    .finally(() => {
      batchLoop = null;
    });
}

async function batchRun(): Promise<void> {
  let failsInRow = 0;
  for (;;) {
    const b = await readBatch();
    if (!b || b.state !== "running") return;
    const end = async (state: BatchState["state"], reason: string) => writeBatch({ ...b, state, reason, endedAt: new Date().toISOString() });
    if (b.made >= b.size) return end("paused", `${b.made} videos made. Review them, then start the next batch.`);
    const r = await runVideoQueue({ max: 1 });
    if (r.needsTts) return end("paused", "No voice key is set: add GOOGLE_TTS_API_KEY, then start again.");
    if (r.processed === 0) {
      // Nothing ready: another run is busy, or failed videos are waiting to retry.
      const [waiting, running] = await Promise.all([
        prisma.lessonVideoJob.count({ where: { status: "queued" } }),
        prisma.lessonVideoJob.count({ where: { status: "running" } }),
      ]);
      if (!waiting && !running) return end("finished", b.made ? `${b.made} videos made. Nothing else is queued.` : "Nothing is queued: press Generate on a track first.");
      await new Promise((res) => setTimeout(res, 30_000));
      continue;
    }
    failsInRow = r.done ? 0 : failsInRow + 1;
    const next = { ...b, made: b.made + r.done, failed: b.failed + r.failed };
    await writeBatch(next);
    if (failsInRow >= BATCH_MAX_FAILS_IN_ROW) {
      await writeBatch({ ...next, state: "paused", reason: "Several videos in a row did not work: see Last error, fix it, then start again.", endedAt: new Date().toISOString() });
      return;
    }
  }
}

export async function startBatch(size: number): Promise<BatchState> {
  const cur = await readBatch();
  if (cur?.state === "running") {
    kickBatch();
    return cur;
  }
  const b: BatchState = { size: Math.max(1, Math.min(50, Math.round(size))), made: 0, failed: 0, state: "running", startedAt: new Date().toISOString() };
  await writeBatch(b);
  kickBatch();
  return b;
}

export async function stopBatch(): Promise<void> {
  const cur = await readBatch();
  if (cur?.state === "running") await writeBatch({ ...cur, state: "stopped", reason: "Stopped by staff. The video being made finishes.", endedAt: new Date().toISOString() });
}

/** After a restart: a batch that was running carries on. */
export async function resumeBatchIfNeeded(): Promise<void> {
  if (batchLoop) return;
  const b = await readBatch();
  if (b?.state === "running") kickBatch();
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
  /** The automatic batch, if one was started. */
  batch: BatchState | null;
  /** Videos made with another voice than the one now chosen, and what re-making them would cost (voice only). */
  oldVoice: { videos: number; usd: number };
  /** Whether the queue is moving: when a video was last started or finished, jobs stuck from a dead run, the latest error. */
  activity: {
    lastStartedAt: string | null;
    lastFinishedAt: string | null;
    stuck: number;
    lastError: { lessonTitle: string; locale: string; error: string; at: string } | null;
  };
  perTrack: Array<{ trackId: string; title: string; lessons: number; include: number; done: number; queued: number; failed: number; needsTts: number; estVideos: number; estUsd: number }>;
}

// The admin panel polls the summary every 15 s while videos are being made;
// it reads every lesson, so it is kept for 10 s (and dropped after any action).
let summaryCache: { at: number; p: Promise<VideoSummary> } | null = null;
export function invalidateVideoSummary() {
  summaryCache = null;
}
export function videoSummary(): Promise<VideoSummary> {
  if (summaryCache && Date.now() - summaryCache.at < 10_000) return summaryCache.p;
  const p = buildVideoSummary();
  summaryCache = { at: Date.now(), p };
  p.catch(() => (summaryCache = null));
  return p;
}

async function buildVideoSummary(): Promise<VideoSummary> {
  await ensureVideoTables();
  await loadVoiceSettings();
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
  const old = await oldVoiceVideos().catch(() => []);
  const oldVoice = { videos: old.length, usd: round2((old.reduce((t, r) => t + r.chars, 0) / 1e6) * status.pricePerMChar) };
  return {
    provider: status,
    storage: await storageMode(),
    activity,
    oldVoice,
    batch: await readBatch(),
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
