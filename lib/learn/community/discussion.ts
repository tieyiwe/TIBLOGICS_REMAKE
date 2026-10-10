import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { awardPoints } from "@/lib/learn/points";
import { ensureCommunityTables } from "./db";
import { LIMITS, hasLink, publicName } from "./shared";
import { canPostInCommunity, getYouthProfile } from "@/lib/learn/youth-account";

// Discussion threads and replies on lessons, tracks and cohorts.
//
// Visibility, enforced in every query here (never in the client):
//   - the learner can open the thread's track (the caller passes the tracks);
//   - a cohort-only thread is seen by that cohort's members only;
//   - deleted posts are gone; a hidden post (moderator, or auto-hidden after
//     several reports) is seen by its author only, marked as hidden.
// Learners appear as "First L."; an email address is never selected for a
// learner-facing response.

export type TrackScope = "all" | string[];

export interface ThreadSummary {
  id: string;
  trackId: string;
  lessonId: string | null;
  lessonTitle: string | null;
  cohortId: string | null;
  cohortName: string | null;
  title: string;
  bodyMd: string;
  author: string;
  mine: boolean;
  score: number;
  voted: boolean;
  replyCount: number;
  answered: boolean;
  answerPostId: string | null;
  hidden: boolean;
  createdAt: string;
  editedAt: string | null;
  lastPostAt: string;
}

export interface PostItem {
  id: string;
  bodyMd: string;
  author: string;
  mine: boolean;
  isAsker: boolean;
  score: number;
  voted: boolean;
  hidden: boolean;
  createdAt: string;
  editedAt: string | null;
}

interface RawThread {
  id: string;
  trackId: string;
  lessonId: string | null;
  lessonTitle: string | null;
  cohortId: string | null;
  cohortName: string | null;
  authorId: string;
  authorName: string;
  title: string;
  bodyMd: string;
  answerPostId: string | null;
  score: number;
  replyCount: number;
  hidden: boolean;
  createdAt: Date;
  editedAt: Date | null;
  lastPostAt: Date;
  voted: boolean;
}

const trackFilter = (tracks: TrackScope) =>
  tracks === "all"
    ? Prisma.sql`TRUE`
    : tracks.length === 0
    ? Prisma.sql`FALSE`
    : Prisma.sql`t."trackId" IN (${Prisma.join(tracks)})`;

/** Threads the viewer may see. */
const visible = (viewerId: string, tracks: TrackScope) => Prisma.sql`
  t."deletedAt" IS NULL
  AND (t."hidden" = false OR t."authorId" = ${viewerId})
  AND (t."cohortId" IS NULL OR EXISTS (
    SELECT 1 FROM "CohortMember" cm WHERE cm."cohortId" = t."cohortId" AND cm."studentId" = ${viewerId}))
  AND ${trackFilter(tracks)}`;

const THREAD_COLUMNS = (viewerId: string) => Prisma.sql`
  t."id", t."trackId", t."lessonId", l."title" AS "lessonTitle", t."cohortId", c."name" AS "cohortName",
  t."authorId", s."name" AS "authorName", t."title", t."bodyMd", t."answerPostId", t."score", t."replyCount",
  t."hidden", t."createdAt", t."editedAt", t."lastPostAt",
  EXISTS (SELECT 1 FROM "CommunityVote" v WHERE v."targetId" = t."id" AND v."studentId" = ${viewerId}) AS "voted"`;

const THREAD_JOINS = Prisma.sql`
  JOIN "Student" s ON s."id" = t."authorId"
  LEFT JOIN "Lesson" l ON l."id" = t."lessonId"
  LEFT JOIN "Cohort" c ON c."id" = t."cohortId"`;

function toSummary(r: RawThread, viewerId: string): ThreadSummary {
  return {
    id: r.id,
    trackId: r.trackId,
    lessonId: r.lessonId,
    lessonTitle: r.lessonTitle,
    cohortId: r.cohortId,
    cohortName: r.cohortName,
    title: r.title,
    bodyMd: r.bodyMd,
    author: publicName(r.authorName),
    mine: r.authorId === viewerId,
    score: Number(r.score),
    voted: !!r.voted,
    replyCount: Number(r.replyCount),
    answered: !!r.answerPostId,
    answerPostId: r.answerPostId,
    hidden: r.hidden,
    createdAt: r.createdAt.toISOString(),
    editedAt: r.editedAt?.toISOString() ?? null,
    lastPostAt: r.lastPostAt.toISOString(),
  };
}

export type ThreadFilter = "recent" | "unanswered" | "top";

export async function listThreads(
  viewerId: string,
  tracks: TrackScope,
  opts: { trackId?: string; lessonId?: string; cohortId?: string; filter?: ThreadFilter; limit?: number; offset?: number },
): Promise<ThreadSummary[]> {
  await ensureCommunityTables();
  const where: Prisma.Sql[] = [visible(viewerId, tracks)];
  if (opts.trackId) where.push(Prisma.sql`t."trackId" = ${opts.trackId}`);
  if (opts.lessonId) where.push(Prisma.sql`t."lessonId" = ${opts.lessonId}`);
  if (opts.cohortId) where.push(Prisma.sql`t."cohortId" = ${opts.cohortId}`);
  if (opts.filter === "unanswered") where.push(Prisma.sql`t."answerPostId" IS NULL`);
  const order =
    opts.filter === "top" ? Prisma.sql`t."score" DESC, t."lastPostAt" DESC` : opts.filter === "unanswered" ? Prisma.sql`t."createdAt" DESC` : Prisma.sql`t."lastPostAt" DESC`;
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const rows = await prisma.$queryRaw<RawThread[]>`
    SELECT ${THREAD_COLUMNS(viewerId)} FROM "CommunityThread" t ${THREAD_JOINS}
    WHERE ${Prisma.join(where, " AND ")}
    ORDER BY ${order} LIMIT ${limit} OFFSET ${Math.max(0, opts.offset ?? 0)}`;
  return rows.map((r) => toSummary(r, viewerId));
}

/** Count of visible threads per track (for cards). */
export async function threadCounts(viewerId: string, tracks: TrackScope, trackId: string): Promise<{ total: number; unanswered: number }> {
  await ensureCommunityTables();
  const [r] = await prisma.$queryRaw<Array<{ total: number; unanswered: number }>>`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE t."answerPostId" IS NULL)::int AS unanswered
    FROM "CommunityThread" t WHERE ${visible(viewerId, tracks)} AND t."trackId" = ${trackId}`;
  return { total: Number(r?.total ?? 0), unanswered: Number(r?.unanswered ?? 0) };
}

interface RawThreadRow {
  id: string;
  trackId: string;
  lessonId: string | null;
  cohortId: string | null;
  authorId: string;
  answerPostId: string | null;
  hidden: boolean;
  deletedAt: Date | null;
  title: string;
}

/** The thread if the viewer may see it, else null. */
export async function visibleThread(viewerId: string, tracks: TrackScope, id: string): Promise<RawThreadRow | null> {
  await ensureCommunityTables();
  const rows = await prisma.$queryRaw<RawThreadRow[]>`
    SELECT t."id", t."trackId", t."lessonId", t."cohortId", t."authorId", t."answerPostId", t."hidden", t."deletedAt", t."title"
    FROM "CommunityThread" t WHERE t."id" = ${id} AND ${visible(viewerId, tracks)}`;
  return rows[0] ?? null;
}

export async function getThread(
  viewerId: string,
  tracks: TrackScope,
  id: string,
): Promise<{ thread: ThreadSummary; posts: PostItem[] } | null> {
  await ensureCommunityTables();
  const rows = await prisma.$queryRaw<RawThread[]>`
    SELECT ${THREAD_COLUMNS(viewerId)} FROM "CommunityThread" t ${THREAD_JOINS}
    WHERE t."id" = ${id} AND ${visible(viewerId, tracks)}`;
  const raw = rows[0];
  if (!raw) return null;
  const posts = await prisma.$queryRaw<
    Array<{ id: string; bodyMd: string; authorId: string; authorName: string; score: number; hidden: boolean; createdAt: Date; editedAt: Date | null; voted: boolean }>
  >`
    SELECT p."id", p."bodyMd", p."authorId", s."name" AS "authorName", p."score", p."hidden", p."createdAt", p."editedAt",
      EXISTS (SELECT 1 FROM "CommunityVote" v WHERE v."targetId" = p."id" AND v."studentId" = ${viewerId}) AS "voted"
    FROM "CommunityPost" p JOIN "Student" s ON s."id" = p."authorId"
    WHERE p."threadId" = ${id} AND p."deletedAt" IS NULL AND (p."hidden" = false OR p."authorId" = ${viewerId})
    ORDER BY p."createdAt" ASC LIMIT 200`;
  return {
    thread: toSummary(raw, viewerId),
    posts: posts.map((p) => ({
      id: p.id,
      bodyMd: p.bodyMd,
      author: publicName(p.authorName),
      mine: p.authorId === viewerId,
      isAsker: p.authorId === raw.authorId,
      score: Number(p.score),
      voted: !!p.voted,
      hidden: p.hidden,
      createdAt: p.createdAt.toISOString(),
      editedAt: p.editedAt?.toISOString() ?? null,
    })),
  };
}

// ── Profiles, suspension, anti-spam ─────────────────────────────────────────

export interface CommunityProfile {
  replyDigest: boolean;
  suspendedUntil: Date | null;
  suspendReason: string | null;
}

export async function getProfile(studentId: string): Promise<CommunityProfile> {
  await ensureCommunityTables();
  const rows = await prisma.$queryRaw<CommunityProfile[]>`
    SELECT "replyDigest", "suspendedUntil", "suspendReason" FROM "CommunityProfile" WHERE "studentId" = ${studentId}`;
  return rows[0] ?? { replyDigest: true, suspendedUntil: null, suspendReason: null };
}

export async function setReplyDigest(studentId: string, on: boolean): Promise<void> {
  await ensureCommunityTables();
  await prisma.$executeRaw`
    INSERT INTO "CommunityProfile" ("studentId", "replyDigest") VALUES (${studentId}, ${on})
    ON CONFLICT ("studentId") DO UPDATE SET "replyDigest" = ${on}, "updatedAt" = now()`;
}

export function isSuspended(p: CommunityProfile, now = new Date()): boolean {
  return !!p.suspendedUntil && p.suspendedUntil.getTime() > now.getTime();
}

/**
 * Message key of the reason this learner may not post this text, or null.
 * Suspended learners cannot post; a brand new account cannot post links.
 */
export async function postingBlock(studentId: string, text: string): Promise<string | null> {
  // AI-Empowered Youth: under 16, the community is read-only.
  if (!canPostInCommunity(await getYouthProfile(studentId))) return "community.err.youthReadOnly";
  const profile = await getProfile(studentId);
  if (isSuspended(profile)) return "community.err.suspended";
  if (hasLink(text)) {
    const [s, [{ n }]] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId }, select: { createdAt: true } }),
      prisma.$queryRaw<Array<{ n: number }>>`
        SELECT ((SELECT COUNT(*) FROM "CommunityPost" WHERE "authorId" = ${studentId} AND "deletedAt" IS NULL AND "hidden" = false)
          + (SELECT COUNT(*) FROM "CommunityThread" WHERE "authorId" = ${studentId} AND "deletedAt" IS NULL AND "hidden" = false))::int AS n`,
    ]);
    const ageDays = s ? (Date.now() - s.createdAt.getTime()) / 86_400_000 : 0;
    if (ageDays < LIMITS.newAccountDays && Number(n) < LIMITS.newAccountPosts) return "community.err.noLinksYet";
  }
  return null;
}

// ── Writes ──────────────────────────────────────────────────────────────────

export async function createThread(p: {
  trackId: string;
  lessonId: string | null;
  cohortId: string | null;
  authorId: string;
  title: string;
  bodyMd: string;
}): Promise<string> {
  await ensureCommunityTables();
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "CommunityThread" ("id", "trackId", "lessonId", "cohortId", "authorId", "title", "bodyMd")
    VALUES (${id}, ${p.trackId}, ${p.lessonId}, ${p.cohortId}, ${p.authorId}, ${p.title}, ${p.bodyMd})`;
  return id;
}

export async function createPost(threadId: string, authorId: string, bodyMd: string): Promise<string> {
  await ensureCommunityTables();
  const id = randomUUID();
  await prisma.$transaction([
    prisma.$executeRaw`INSERT INTO "CommunityPost" ("id", "threadId", "authorId", "bodyMd") VALUES (${id}, ${threadId}, ${authorId}, ${bodyMd})`,
    prisma.$executeRaw`UPDATE "CommunityThread" SET "replyCount" = "replyCount" + 1, "lastPostAt" = now() WHERE "id" = ${threadId}`,
  ]);
  return id;
}

export async function editThread(id: string, authorId: string, title: string, bodyMd: string): Promise<boolean> {
  await ensureCommunityTables();
  const n = await prisma.$executeRaw`
    UPDATE "CommunityThread" SET "title" = ${title}, "bodyMd" = ${bodyMd}, "editedAt" = now()
    WHERE "id" = ${id} AND "authorId" = ${authorId} AND "deletedAt" IS NULL`;
  return n > 0;
}

export async function deleteThread(id: string, authorId: string | null): Promise<boolean> {
  await ensureCommunityTables();
  const n = await prisma.$executeRaw`
    UPDATE "CommunityThread" SET "deletedAt" = now()
    WHERE "id" = ${id} AND "deletedAt" IS NULL ${authorId ? Prisma.sql`AND "authorId" = ${authorId}` : Prisma.empty}`;
  return n > 0;
}

export async function getPost(id: string): Promise<{ id: string; threadId: string; authorId: string; hidden: boolean; deletedAt: Date | null } | null> {
  await ensureCommunityTables();
  const rows = await prisma.$queryRaw<Array<{ id: string; threadId: string; authorId: string; hidden: boolean; deletedAt: Date | null }>>`
    SELECT "id", "threadId", "authorId", "hidden", "deletedAt" FROM "CommunityPost" WHERE "id" = ${id}`;
  return rows[0] ?? null;
}

export async function editPost(id: string, authorId: string, bodyMd: string): Promise<boolean> {
  await ensureCommunityTables();
  const n = await prisma.$executeRaw`
    UPDATE "CommunityPost" SET "bodyMd" = ${bodyMd}, "editedAt" = now()
    WHERE "id" = ${id} AND "authorId" = ${authorId} AND "deletedAt" IS NULL`;
  return n > 0;
}

/** Soft delete; clears the thread's answer if this was it. */
export async function deletePost(id: string, authorId: string | null): Promise<boolean> {
  await ensureCommunityTables();
  const post = await getPost(id);
  if (!post || post.deletedAt || (authorId && post.authorId !== authorId)) return false;
  await prisma.$transaction([
    prisma.$executeRaw`UPDATE "CommunityPost" SET "deletedAt" = now() WHERE "id" = ${id}`,
    prisma.$executeRaw`UPDATE "CommunityThread" SET "replyCount" = GREATEST(0, "replyCount" - 1),
      "answerPostId" = CASE WHEN "answerPostId" = ${id} THEN NULL ELSE "answerPostId" END,
      "answeredAt" = CASE WHEN "answerPostId" = ${id} THEN NULL ELSE "answeredAt" END
      WHERE "id" = ${post.threadId}`,
  ]);
  return true;
}

/**
 * Mark (or with null, unmark) the accepted answer. The caller checks that
 * the viewer is the asker or staff. The answer's author earns XP once per
 * thread, and never for answering their own question.
 */
export async function setAnswer(threadId: string, postId: string | null): Promise<boolean> {
  await ensureCommunityTables();
  if (postId) {
    const post = await getPost(postId);
    if (!post || post.threadId !== threadId || post.deletedAt || post.hidden) return false;
    const [thread] = await prisma.$queryRaw<Array<{ authorId: string }>>`SELECT "authorId" FROM "CommunityThread" WHERE "id" = ${threadId}`;
    await prisma.$executeRaw`UPDATE "CommunityThread" SET "answerPostId" = ${postId}, "answeredAt" = now() WHERE "id" = ${threadId}`;
    if (thread && thread.authorId !== post.authorId) await awardPoints(post.authorId, "community_answer", threadId);
    return true;
  }
  await prisma.$executeRaw`UPDATE "CommunityThread" SET "answerPostId" = NULL, "answeredAt" = NULL WHERE "id" = ${threadId}`;
  return true;
}

/** Toggle an upvote. Returns the new state, or null when not allowed. */
export async function toggleVote(studentId: string, targetType: "thread" | "post", targetId: string): Promise<{ voted: boolean; score: number } | null> {
  await ensureCommunityTables();
  const table = targetType === "thread" ? Prisma.sql`"CommunityThread"` : Prisma.sql`"CommunityPost"`;
  const [target] = await prisma.$queryRaw<Array<{ authorId: string; score: number }>>`
    SELECT "authorId", "score" FROM ${table} WHERE "id" = ${targetId} AND "deletedAt" IS NULL`;
  if (!target || target.authorId === studentId) return null;
  const removed = await prisma.$executeRaw`DELETE FROM "CommunityVote" WHERE "studentId" = ${studentId} AND "targetId" = ${targetId}`;
  if (removed > 0) {
    const [r] = await prisma.$queryRaw<Array<{ score: number }>>`
      UPDATE ${table} SET "score" = GREATEST(0, "score" - 1) WHERE "id" = ${targetId} RETURNING "score"`;
    return { voted: false, score: Number(r?.score ?? 0) };
  }
  const added = await prisma.$executeRaw`
    INSERT INTO "CommunityVote" ("studentId", "targetId", "targetType") VALUES (${studentId}, ${targetId}, ${targetType})
    ON CONFLICT DO NOTHING`;
  const [r] = added
    ? await prisma.$queryRaw<Array<{ score: number }>>`UPDATE ${table} SET "score" = "score" + 1 WHERE "id" = ${targetId} RETURNING "score"`
    : [{ score: Number(target.score) }];
  return { voted: true, score: Number(r?.score ?? 0) };
}

/**
 * File a report (once per learner per post). After enough distinct open
 * reports the post is hidden until a moderator decides.
 */
export async function report(reporterId: string, targetType: "thread" | "post", targetId: string, reason: string): Promise<"ok" | "already"> {
  await ensureCommunityTables();
  const n = await prisma.$executeRaw`
    INSERT INTO "CommunityReport" ("id", "reporterId", "targetType", "targetId", "reason")
    VALUES (${randomUUID()}, ${reporterId}, ${targetType}, ${targetId}, ${reason})
    ON CONFLICT DO NOTHING`;
  if (n === 0) return "already";
  const [{ c }] = await prisma.$queryRaw<Array<{ c: number }>>`
    SELECT COUNT(*)::int AS c FROM "CommunityReport" WHERE "targetId" = ${targetId} AND "status" = 'open'`;
  if (Number(c) >= LIMITS.autoHideReports) await setHidden(targetType, targetId, true);
  return "ok";
}

export async function setHidden(targetType: "thread" | "post", targetId: string, hidden: boolean): Promise<void> {
  await ensureCommunityTables();
  if (targetType === "thread") await prisma.$executeRaw`UPDATE "CommunityThread" SET "hidden" = ${hidden} WHERE "id" = ${targetId}`;
  else await prisma.$executeRaw`UPDATE "CommunityPost" SET "hidden" = ${hidden} WHERE "id" = ${targetId}`;
}
