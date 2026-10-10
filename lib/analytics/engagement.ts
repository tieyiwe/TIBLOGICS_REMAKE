import prisma from "@/lib/prisma";
import { ensureAnalyticsTables } from "./db";
import { cached } from "./cache";
import { areaSql } from "./paths";
import type { Filters } from "./filters";

// Engagement (/admin_pro/analytics/engagement).
//
// Website, from PageView: sessions, pages per session, engaged time (the time
// the tab was visible, sent by the tracker), bounce rate (one page and under
// 10 s engaged), returning visitors (the first-party first-visit cookie was
// already there), and scroll depth on key pages (25/50/75/100%, only for
// visitors without Do Not Track or Global Privacy Control).
//
// ARFA: the learning numbers come from lib/admin/analytics.ts (DAU/WAU/MAU,
// cohorts, completion); this adds the lesson where stalled learners stop and
// learner counts per feature.

export const KEY_PAGES = ["/", "/services", "/learning-box", "/tools/scanner", "/book", "/sponsor-youth", "/store", "/contact"];
const BOUNCE_MS = 10_000;

export interface SiteEngagement {
  cur: SiteStats;
  prev: SiteStats;
  daily: Array<{ day: string; value: number }>;
  scroll: Array<{ page: string; views: number; d25: number; d50: number; d75: number; d100: number }>;
  timeOnPage: Array<{ page: string; views: number; avgMs: number }>;
}
export interface SiteStats { sessions: number; views: number; pagesPerSession: number; avgEngagedMs: number; bounceRate: number; returningRate: number }

function filt(f: Filters, start: number): { sql: string; args: unknown[] } {
  const args: unknown[] = [];
  let sql = "";
  if (f.device) { args.push(f.device); sql += ` AND "device" = $${start + args.length}`; }
  if (f.country) { args.push(f.country); sql += ` AND "country" = $${start + args.length}`; }
  if (f.source) { args.push(f.source); sql += ` AND "source" = $${start + args.length}`; }
  return { sql, args };
}

async function stats(f: Filters, from: Date, to: Date): Promise<SiteStats> {
  const x = filt(f, 2);
  const r = await prisma.$queryRawUnsafe<Array<{ s: number; v: number; ms: number | null; b: number; ret: number }>>(
    `WITH s AS (
       SELECT "sessionId", count(*) AS views, sum(COALESCE("engagedMs", 0)) AS ms, bool_or(COALESCE("returning", false)) AS ret
       FROM "PageView" WHERE "createdAt" >= $1 AND "createdAt" < $2 AND ${areaSql(f.area)}${x.sql} GROUP BY 1)
     SELECT count(*)::int AS s, COALESCE(sum(views), 0)::int AS v, avg(ms)::float8 AS ms,
            count(*) FILTER (WHERE views = 1 AND ms < ${BOUNCE_MS})::int AS b, count(*) FILTER (WHERE ret)::int AS ret FROM s`,
    from, to, ...x.args,
  );
  const o = r[0] ?? { s: 0, v: 0, ms: 0, b: 0, ret: 0 };
  return {
    sessions: o.s,
    views: o.v,
    pagesPerSession: o.s ? o.v / o.s : 0,
    avgEngagedMs: Math.round(Number(o.ms ?? 0)),
    bounceRate: o.s ? o.b / o.s : 0,
    returningRate: o.s ? o.ret / o.s : 0,
  };
}

export async function siteEngagement(f: Filters): Promise<SiteEngagement> {
  return cached(`eng:${f.from.toISOString().slice(0, 13)}:${f.to.toISOString().slice(0, 13)}:${f.area}:${f.device}:${f.country}:${f.source}`, async () => {
    await ensureAnalyticsTables();
    const x = filt(f, 2);
    const [cur, prev, daily, scroll, time] = await Promise.all([
      stats(f, f.from, f.to),
      stats(f, f.prevFrom, f.prevTo),
      prisma.$queryRawUnsafe<Array<{ d: Date; n: number }>>(
        `SELECT date_trunc('day', "createdAt") AS d, count(DISTINCT "sessionId")::int AS n FROM "PageView"
         WHERE "createdAt" >= $1 AND "createdAt" < $2 AND ${areaSql(f.area)}${x.sql} GROUP BY 1 ORDER BY 1`,
        f.from, f.to, ...x.args,
      ),
      prisma.$queryRawUnsafe<Array<{ page: string; views: number; d25: number; d50: number; d75: number; d100: number }>>(
        `SELECT "page", count(*)::int AS views,
                count(*) FILTER (WHERE "scrollPct" >= 25)::int AS d25, count(*) FILTER (WHERE "scrollPct" >= 50)::int AS d50,
                count(*) FILTER (WHERE "scrollPct" >= 75)::int AS d75, count(*) FILTER (WHERE "scrollPct" >= 100)::int AS d100
         FROM "PageView" WHERE "createdAt" >= $1 AND "createdAt" < $2 AND "scrollPct" IS NOT NULL AND "page" = ANY($${3 + x.args.length}::text[])${x.sql}
         GROUP BY 1 ORDER BY views DESC`,
        f.from, f.to, ...x.args, KEY_PAGES,
      ),
      prisma.$queryRawUnsafe<Array<{ page: string; views: number; ms: number }>>(
        `SELECT "page", count(*)::int AS views, avg("engagedMs")::float8 AS ms FROM "PageView"
         WHERE "createdAt" >= $1 AND "createdAt" < $2 AND "engagedMs" IS NOT NULL AND ${areaSql(f.area)}${x.sql}
         GROUP BY 1 HAVING count(*) >= 3 ORDER BY views DESC LIMIT 25`,
        f.from, f.to, ...x.args,
      ),
    ]);
    const by = new Map(daily.map((d) => [new Date(d.d).toISOString().slice(0, 10), d.n]));
    const days: Array<{ day: string; value: number }> = [];
    for (let t = Date.UTC(f.from.getUTCFullYear(), f.from.getUTCMonth(), f.from.getUTCDate()); t < f.to.getTime() && days.length < 400; t += 86_400_000) {
      const k = new Date(t).toISOString().slice(0, 10);
      days.push({ day: k, value: by.get(k) ?? 0 });
    }
    return { cur, prev, daily: days, scroll, timeOnPage: time.map((t) => ({ page: t.page, views: t.views, avgMs: Math.round(Number(t.ms ?? 0)) })) };
  });
}

/** Per track, the lesson where most stalled learners stop (next lesson not done, no activity for 14 days). */
export async function dropOffLessons(): Promise<Array<{ track: string; lesson: string; stalled: number; total: number }>> {
  return cached("eng:dropoff", async () => {
    const cut = new Date(Date.now() - 14 * 86_400_000);
    try {
      return await prisma.$queryRawUnsafe<Array<{ track: string; lesson: string; stalled: number; total: number }>>(
        `WITH lessons AS (
           SELECT l."id" AS lesson_id, l."title", m."trackId" AS track_id, m."sortOrder" AS ms, l."sortOrder" AS ls
           FROM "Lesson" l JOIN "LearnModule" m ON m."id" = l."moduleId"),
         done AS (SELECT lp."studentId" AS sid, x.track_id, lp."lessonId" AS lesson_id, lp."completedAt" AS at FROM "LessonProgress" lp JOIN lessons x ON x.lesson_id = lp."lessonId"),
         per AS (SELECT sid, track_id, max(at) AS last_at, count(DISTINCT lesson_id) AS n FROM done GROUP BY 1, 2),
         tot AS (SELECT track_id, count(*) AS n FROM lessons GROUP BY 1),
         stalled AS (SELECT p.sid, p.track_id FROM per p JOIN tot t ON t.track_id = p.track_id WHERE p.n < t.n AND p.last_at < $1),
         nxt AS (
           SELECT s.track_id, (SELECT x.lesson_id FROM lessons x WHERE x.track_id = s.track_id
             AND NOT EXISTS (SELECT 1 FROM done d WHERE d.sid = s.sid AND d.lesson_id = x.lesson_id) ORDER BY x.ms, x.ls LIMIT 1) AS lesson_id
           FROM stalled s),
         agg AS (SELECT track_id, lesson_id, count(*)::int AS n, sum(count(*)) OVER (PARTITION BY track_id)::int AS total FROM nxt WHERE lesson_id IS NOT NULL GROUP BY 1, 2)
         SELECT DISTINCT ON (a.track_id) t."title" AS track, x."title" AS lesson, a.n AS stalled, a.total
         FROM agg a JOIN lessons x ON x.lesson_id = a.lesson_id JOIN "LearnTrack" t ON t."id" = a.track_id
         ORDER BY a.track_id, a.n DESC`,
        cut,
      );
    } catch (err) {
      console.error("[analytics/engagement] dropoff", err instanceof Error ? err.message : err);
      return [];
    }
  });
}

/** Learners who used each ARFA feature in the period (from records), where a record exists. */
export async function featureLearners(f: Filters): Promise<Array<{ key: string; label: string; learners: number | null }>> {
  return cached(`eng:features:${f.from.toISOString().slice(0, 13)}:${f.to.toISOString().slice(0, 13)}`, async () => {
    const one = async (sql: string) => {
      try {
        const r = await prisma.$queryRawUnsafe<Array<{ n: number }>>(sql, f.from, f.to);
        return Number(r[0]?.n ?? 0);
      } catch {
        return null; // feature table not created yet
      }
    };
    const rows: Array<[string, string, string]> = [
      ["tutor", "AI tutor", `SELECT count(DISTINCT tt."studentId")::int AS n FROM "TutorMessage" tm JOIN "TutorThread" tt ON tt."id" = tm."threadId" WHERE tm."role" = 'user' AND tm."createdAt" >= $1 AND tm."createdAt" < $2`],
      ["review", "Review (daily)", `SELECT count(DISTINCT "studentId")::int AS n FROM "PointsLedger" WHERE "source" = 'daily_review' AND "createdAt" >= $1 AND "createdAt" < $2`],
      ["studio", "Studio", `SELECT count(DISTINCT "studentId")::int AS n FROM "PointsLedger" WHERE "source" = 'studio_challenge' AND "createdAt" >= $1 AND "createdAt" < $2`],
      ["challenge", "Weekly challenge", `SELECT count(DISTINCT "studentId")::int AS n FROM "WeeklyChallengeEntry" WHERE "createdAt" >= $1 AND "createdAt" < $2`],
      ["community", "Community (posted)", `SELECT count(DISTINCT a)::int AS n FROM (SELECT "authorId" AS a FROM "CommunityThread" WHERE "createdAt" >= $1 AND "createdAt" < $2 UNION ALL SELECT "authorId" FROM "CommunityPost" WHERE "createdAt" >= $1 AND "createdAt" < $2) x`],
      ["glossary", "Glossary (terms reviewed)", `SELECT count(DISTINCT "studentId")::int AS n FROM "GlossarySeen" WHERE COALESCE("lastReviewedAt", "firstSeenAt") >= $1 AND COALESCE("lastReviewedAt", "firstSeenAt") < $2`],
      ["peer_helpful", "Peer reviews marked helpful", `SELECT count(*)::int AS n FROM "PeerReview" WHERE "helpful" AND "submittedAt" >= $1 AND "submittedAt" < $2`],
    ];
    return Promise.all(rows.map(async ([key, label, sql]) => ({ key, label, learners: await one(sql) })));
  });
}
