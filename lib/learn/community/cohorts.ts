import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureCommunityTables } from "./db";
import { publicName, type CohortTiming, type PlanModule } from "./shared";

// Cohorts: a group taking one track together, with dates, a weekly live
// session, recordings and announcements. Raw SQL against the runtime tables
// (lib/learn/community/db.ts), so nothing here depends on the generated
// Prisma client knowing these models.

export interface Recording {
  title: string;
  url: string;
  addedAt: string;
}

export interface CohortRow extends CohortTiming {
  id: string;
  trackId: string;
  name: string;
  meetingUrl: string | null;
  capacity: number;
  enrolmentOpen: boolean;
  priceNote: string | null;
  recordings: Recording[];
  remindedFor: Date | null;
  createdAt: Date;
  memberCount: number;
}

type RawCohort = Omit<CohortRow, "recordings" | "memberCount"> & { recordings: unknown; memberCount: number | bigint };

function toRow(r: RawCohort): CohortRow {
  const recs = Array.isArray(r.recordings) ? (r.recordings as Recording[]) : [];
  return {
    ...r,
    memberCount: Number(r.memberCount ?? 0),
    recordings: recs.filter((x) => x && typeof x.url === "string" && typeof x.title === "string"),
  };
}

const SELECT = Prisma.sql`
  SELECT c.*, (SELECT COUNT(*)::int FROM "CohortMember" m WHERE m."cohortId" = c."id") AS "memberCount"
  FROM "Cohort" c`;

export async function listCohorts(filter: { trackId?: string; trackIds?: string[]; ids?: string[] } = {}): Promise<CohortRow[]> {
  await ensureCommunityTables();
  const where: Prisma.Sql[] = [];
  if (filter.trackId) where.push(Prisma.sql`c."trackId" = ${filter.trackId}`);
  if (filter.trackIds) {
    if (filter.trackIds.length === 0) return [];
    where.push(Prisma.sql`c."trackId" IN (${Prisma.join(filter.trackIds)})`);
  }
  if (filter.ids) {
    if (filter.ids.length === 0) return [];
    where.push(Prisma.sql`c."id" IN (${Prisma.join(filter.ids)})`);
  }
  const rows = await prisma.$queryRaw<RawCohort[]>`
    ${SELECT} ${where.length ? Prisma.sql`WHERE ${Prisma.join(where, " AND ")}` : Prisma.empty}
    ORDER BY c."startDate" ASC, c."createdAt" ASC`;
  return rows.map(toRow);
}

export async function getCohort(id: string): Promise<CohortRow | null> {
  return (await listCohorts({ ids: [id] }))[0] ?? null;
}

/** Cohorts the learner belongs to (optionally within one track). */
export async function myCohorts(studentId: string, trackId?: string): Promise<CohortRow[]> {
  await ensureCommunityTables();
  const ids = await prisma.$queryRaw<Array<{ cohortId: string }>>`
    SELECT m."cohortId" FROM "CohortMember" m JOIN "Cohort" c ON c."id" = m."cohortId"
    WHERE m."studentId" = ${studentId} ${trackId ? Prisma.sql`AND c."trackId" = ${trackId}` : Prisma.empty}`;
  return listCohorts({ ids: ids.map((r) => r.cohortId) });
}

export async function isMember(cohortId: string, studentId: string): Promise<boolean> {
  await ensureCommunityTables();
  const r = await prisma.$queryRaw<Array<{ x: number }>>`
    SELECT 1 AS x FROM "CohortMember" WHERE "cohortId" = ${cohortId} AND "studentId" = ${studentId}`;
  return r.length > 0;
}

/** The last calendar day has passed. */
export function cohortEnded(c: Pick<CohortRow, "endDate">, now = new Date()): boolean {
  return c.endDate.getTime() + 86_400_000 <= now.getTime();
}

export type JoinResult = "joined" | "already" | "full" | "closed" | "ended" | "missing";

/**
 * Join, in one statement so two learners taking the last seat cannot both
 * get it. The caller has already checked track access.
 */
export async function joinCohort(cohortId: string, studentId: string): Promise<JoinResult> {
  const c = await getCohort(cohortId);
  if (!c) return "missing";
  if (await isMember(cohortId, studentId)) return "already";
  if (cohortEnded(c)) return "ended";
  if (!c.enrolmentOpen) return "closed";
  const n = await prisma.$executeRaw`
    INSERT INTO "CohortMember" ("cohortId", "studentId")
    SELECT ${cohortId}, ${studentId}
    WHERE (SELECT COUNT(*) FROM "CohortMember" WHERE "cohortId" = ${cohortId}) < ${c.capacity}
    ON CONFLICT DO NOTHING`;
  return n > 0 ? "joined" : "full";
}

export async function leaveCohort(cohortId: string, studentId: string): Promise<void> {
  await ensureCommunityTables();
  await prisma.$executeRaw`DELETE FROM "CohortMember" WHERE "cohortId" = ${cohortId} AND "studentId" = ${studentId}`;
}

export interface MemberRow {
  studentId: string;
  name: string;
  email: string;
  locale: string;
  joinedAt: Date;
  lastNudgeAt: Date | null;
}

/** Members with their account fields. Emails are for staff and mail only. */
export async function cohortMemberRows(cohortId: string): Promise<MemberRow[]> {
  await ensureCommunityTables();
  return prisma.$queryRaw<MemberRow[]>`
    SELECT m."studentId", s."name", s."email", s."locale", m."joinedAt", m."lastNudgeAt"
    FROM "CohortMember" m JOIN "Student" s ON s."id" = m."studentId"
    WHERE m."cohortId" = ${cohortId}
    ORDER BY m."joinedAt" ASC`;
}

/** What learners see of each other: "First L." and nothing else. */
export async function publicMembers(cohortId: string): Promise<Array<{ id: string; name: string; isMe?: boolean }>> {
  const rows = await cohortMemberRows(cohortId);
  return rows.map((r) => ({ id: r.studentId, name: publicName(r.name) }));
}

/** Lessons completed in the track, per member. */
export async function memberProgress(cohortId: string, trackId: string): Promise<{ total: number; done: Map<string, number> }> {
  await ensureCommunityTables();
  const [total, rows] = await Promise.all([
    prisma.lesson.count({ where: { module: { trackId } } }),
    prisma.$queryRaw<Array<{ studentId: string; n: number }>>`
      SELECT p."studentId", COUNT(*)::int AS n
      FROM "LessonProgress" p
      JOIN "Lesson" l ON l."id" = p."lessonId"
      JOIN "LearnModule" mo ON mo."id" = l."moduleId"
      WHERE mo."trackId" = ${trackId}
        AND p."studentId" IN (SELECT "studentId" FROM "CohortMember" WHERE "cohortId" = ${cohortId})
      GROUP BY p."studentId"`,
  ]);
  return { total, done: new Map(rows.map((r) => [r.studentId, Number(r.n)])) };
}

/** The track's modules in order with their lesson counts, for the week plan. */
export async function planModules(trackId: string): Promise<PlanModule[]> {
  const mods = await prisma.learnModule.findMany({
    where: { trackId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, title: true, _count: { select: { lessons: true } } },
  });
  return mods.map((m) => ({ id: m.id, title: m.title, lessons: m._count.lessons }));
}

export interface Announcement {
  id: string;
  bodyMd: string;
  createdAt: Date;
}

export async function announcements(cohortId: string, limit = 20): Promise<Announcement[]> {
  await ensureCommunityTables();
  return prisma.$queryRaw<Announcement[]>`
    SELECT "id", "bodyMd", "createdAt" FROM "CohortAnnouncement"
    WHERE "cohortId" = ${cohortId} ORDER BY "createdAt" DESC LIMIT ${limit}`;
}

// ── Staff ───────────────────────────────────────────────────────────────────

export interface CohortInput {
  trackId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  sessionWeekday: number;
  sessionTime: string;
  timezone: string;
  sessionMinutes: number;
  meetingUrl: string | null;
  capacity: number;
  enrolmentOpen: boolean;
  priceNote: string | null;
}

export async function createCohort(input: CohortInput): Promise<string> {
  await ensureCommunityTables();
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "Cohort" ("id", "trackId", "name", "startDate", "endDate", "sessionWeekday", "sessionTime", "timezone",
      "sessionMinutes", "meetingUrl", "capacity", "enrolmentOpen", "priceNote")
    VALUES (${id}, ${input.trackId}, ${input.name}, ${input.startDate}, ${input.endDate}, ${input.sessionWeekday},
      ${input.sessionTime}, ${input.timezone}, ${input.sessionMinutes}, ${input.meetingUrl}, ${input.capacity},
      ${input.enrolmentOpen}, ${input.priceNote})`;
  return id;
}

export async function updateCohort(id: string, input: Omit<CohortInput, "trackId">): Promise<void> {
  await ensureCommunityTables();
  // A changed schedule may need a fresh reminder.
  await prisma.$executeRaw`
    UPDATE "Cohort" SET "name" = ${input.name}, "startDate" = ${input.startDate}, "endDate" = ${input.endDate},
      "sessionWeekday" = ${input.sessionWeekday}, "sessionTime" = ${input.sessionTime}, "timezone" = ${input.timezone},
      "sessionMinutes" = ${input.sessionMinutes}, "meetingUrl" = ${input.meetingUrl}, "capacity" = ${input.capacity},
      "enrolmentOpen" = ${input.enrolmentOpen}, "priceNote" = ${input.priceNote},
      "remindedFor" = CASE WHEN "sessionWeekday" = ${input.sessionWeekday} AND "sessionTime" = ${input.sessionTime}
        AND "timezone" = ${input.timezone} THEN "remindedFor" ELSE NULL END,
      "updatedAt" = now()
    WHERE "id" = ${id}`;
}

export async function deleteCohort(id: string): Promise<void> {
  await ensureCommunityTables();
  await prisma.$executeRaw`DELETE FROM "Cohort" WHERE "id" = ${id}`;
}

export async function setRecordings(id: string, recordings: Recording[]): Promise<void> {
  await ensureCommunityTables();
  await prisma.$executeRaw`UPDATE "Cohort" SET "recordings" = ${JSON.stringify(recordings)}::jsonb, "updatedAt" = now() WHERE "id" = ${id}`;
}

export async function addAnnouncement(cohortId: string, bodyMd: string): Promise<string> {
  await ensureCommunityTables();
  const id = randomUUID();
  await prisma.$executeRaw`INSERT INTO "CohortAnnouncement" ("id", "cohortId", "bodyMd") VALUES (${id}, ${cohortId}, ${bodyMd})`;
  return id;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await ensureCommunityTables();
  await prisma.$executeRaw`DELETE FROM "CohortAnnouncement" WHERE "id" = ${id}`;
}

export async function removeMember(cohortId: string, studentId: string): Promise<void> {
  await leaveCohort(cohortId, studentId);
}
