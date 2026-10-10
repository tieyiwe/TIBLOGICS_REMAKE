import prisma from "@/lib/prisma";
import { ensureCommunityTables } from "./db";

// Read models for the admin moderation page. Staff see full names and
// emails; learners never do.

export interface ReportGroup {
  targetType: "thread" | "post";
  targetId: string;
  threadId: string;
  title: string;
  bodyMd: string;
  hidden: boolean;
  deleted: boolean;
  authorId: string;
  authorName: string;
  authorEmail: string;
  reports: number;
  reasons: string[];
  firstAt: Date;
}

export async function openReports(): Promise<ReportGroup[]> {
  await ensureCommunityTables();
  const rows = await prisma.$queryRaw<
    Array<Omit<ReportGroup, "reports" | "deleted"> & { reports: number; deletedAt: Date | null }>
  >`
    SELECT r."targetType", r."targetId",
      COALESCE(t."id", p."threadId") AS "threadId",
      COALESCE(t."title", pt."title") AS "title",
      COALESCE(t."bodyMd", p."bodyMd") AS "bodyMd",
      COALESCE(t."hidden", p."hidden") AS "hidden",
      COALESCE(t."deletedAt", p."deletedAt") AS "deletedAt",
      s."id" AS "authorId", s."name" AS "authorName", s."email" AS "authorEmail",
      COUNT(*)::int AS "reports", ARRAY_AGG(r."reason") AS "reasons", MIN(r."createdAt") AS "firstAt"
    FROM "CommunityReport" r
    LEFT JOIN "CommunityThread" t ON r."targetType" = 'thread' AND t."id" = r."targetId"
    LEFT JOIN "CommunityPost" p ON r."targetType" = 'post' AND p."id" = r."targetId"
    LEFT JOIN "CommunityThread" pt ON pt."id" = p."threadId"
    JOIN "Student" s ON s."id" = COALESCE(t."authorId", p."authorId")
    WHERE r."status" = 'open'
    GROUP BY r."targetType", r."targetId", t."id", p."threadId", t."title", pt."title", t."bodyMd", p."bodyMd",
      t."hidden", p."hidden", t."deletedAt", p."deletedAt", s."id", s."name", s."email"
    ORDER BY MIN(r."createdAt") ASC
    LIMIT 100`;
  return rows.map((r) => ({ ...r, reports: Number(r.reports), deleted: !!r.deletedAt }));
}

export async function recentThreads(limit = 30) {
  await ensureCommunityTables();
  return prisma.$queryRaw<
    Array<{ id: string; title: string; trackTitle: string; lessonTitle: string | null; cohortName: string | null; authorName: string; authorEmail: string; replyCount: number; answerPostId: string | null; hidden: boolean; createdAt: Date }>
  >`
    SELECT t."id", t."title", tr."title" AS "trackTitle", l."title" AS "lessonTitle", c."name" AS "cohortName",
      s."name" AS "authorName", s."email" AS "authorEmail", t."replyCount", t."answerPostId", t."hidden", t."createdAt"
    FROM "CommunityThread" t
    JOIN "LearnTrack" tr ON tr."id" = t."trackId"
    JOIN "Student" s ON s."id" = t."authorId"
    LEFT JOIN "Lesson" l ON l."id" = t."lessonId"
    LEFT JOIN "Cohort" c ON c."id" = t."cohortId"
    WHERE t."deletedAt" IS NULL
    ORDER BY t."lastPostAt" DESC LIMIT ${limit}`;
}

export async function threadForStaff(id: string) {
  await ensureCommunityTables();
  const [thread] = await prisma.$queryRaw<
    Array<{ id: string; title: string; bodyMd: string; hidden: boolean; answerPostId: string | null; authorId: string; authorName: string; authorEmail: string; createdAt: Date }>
  >`
    SELECT t."id", t."title", t."bodyMd", t."hidden", t."answerPostId", s."id" AS "authorId", s."name" AS "authorName", s."email" AS "authorEmail", t."createdAt"
    FROM "CommunityThread" t JOIN "Student" s ON s."id" = t."authorId"
    WHERE t."id" = ${id} AND t."deletedAt" IS NULL`;
  if (!thread) return null;
  const posts = await prisma.$queryRaw<
    Array<{ id: string; bodyMd: string; hidden: boolean; authorId: string; authorName: string; authorEmail: string; createdAt: Date }>
  >`
    SELECT p."id", p."bodyMd", p."hidden", s."id" AS "authorId", s."name" AS "authorName", s."email" AS "authorEmail", p."createdAt"
    FROM "CommunityPost" p JOIN "Student" s ON s."id" = p."authorId"
    WHERE p."threadId" = ${id} AND p."deletedAt" IS NULL ORDER BY p."createdAt" ASC`;
  return { thread, posts };
}

export async function suspendedLearners() {
  await ensureCommunityTables();
  return prisma.$queryRaw<Array<{ studentId: string; name: string; email: string; suspendedUntil: Date; suspendReason: string | null }>>`
    SELECT pr."studentId", s."name", s."email", pr."suspendedUntil", pr."suspendReason"
    FROM "CommunityProfile" pr JOIN "Student" s ON s."id" = pr."studentId"
    WHERE pr."suspendedUntil" > now() ORDER BY pr."suspendedUntil" DESC`;
}

export async function recentPeerReviews(limit = 50) {
  await ensureCommunityTables();
  return prisma.$queryRaw<
    Array<{ id: string; status: string; hidden: boolean; helpful: boolean; feedback: unknown; submittedAt: Date | null; trackTitle: string; reviewerName: string; reviewerEmail: string; authorName: string; authorEmail: string; submissionId: string }>
  >`
    SELECT r."id", r."status", r."hidden", r."helpful", r."feedback", r."submittedAt", tr."title" AS "trackTitle",
      rv."name" AS "reviewerName", rv."email" AS "reviewerEmail", au."name" AS "authorName", au."email" AS "authorEmail", r."submissionId"
    FROM "PeerReview" r
    JOIN "CapstoneSubmission" s ON s."id" = r."submissionId"
    JOIN "Student" rv ON rv."id" = r."reviewerId"
    JOIN "Student" au ON au."id" = s."studentId"
    JOIN "LearnTrack" tr ON tr."id" = r."trackId"
    ORDER BY COALESCE(r."submittedAt", r."createdAt") DESC LIMIT ${limit}`;
}
