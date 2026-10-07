import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { awardPoints } from "@/lib/learn/points";
import { canAccessTrack, type LearnAccess } from "@/lib/learn/session";
import { publicName } from "@/lib/learn/community/shared";
import { ensureLiveTables } from "./db";
import { joinOpen, rsvpOpen, type Resource } from "./shared";

// Monthly live expert sessions: the sessions, RSVPs with a waitlist,
// attendance and pre-session questions. Raw SQL against the runtime tables
// (lib/learn/live/db.ts), like lib/learn/community/cohorts.ts.
//
// Who may attend: any learner with at least one open track (an active,
// trialing or comped subscription, a team seat, or one track bought); that
// is LearnAccess.any from lib/learn/session.ts. A session's related tracks
// are a label ("for your tracks"), not a gate.

export interface SessionRow {
  id: string;
  title: string;
  expertName: string;
  expertBio: string | null;
  expertPhotoUrl: string | null;
  topic: string | null;
  trackIds: string[];
  startsAt: Date;
  durationMinutes: number;
  timezone: string;
  meetingUrl: string | null;
  capacity: number;
  status: string;
  recordingUrl: string | null;
  resources: Resource[];
  createdAt: Date;
  updatedAt: Date;
  going: number;
  waitlist: number;
}

type Raw = Omit<SessionRow, "trackIds" | "resources" | "going" | "waitlist"> & {
  trackIds: unknown;
  resources: unknown;
  going: number | bigint;
  waitlist: number | bigint;
};

function toRow(r: Raw): SessionRow {
  const tracks = Array.isArray(r.trackIds) ? r.trackIds.filter((x): x is string => typeof x === "string") : [];
  const res = Array.isArray(r.resources)
    ? (r.resources as Resource[]).filter((x) => x && typeof x.title === "string" && typeof x.url === "string")
    : [];
  return { ...r, trackIds: tracks, resources: res, going: Number(r.going ?? 0), waitlist: Number(r.waitlist ?? 0) };
}

const SELECT = Prisma.sql`
  SELECT s.*,
    (SELECT COUNT(*)::int FROM "ExpertSessionRsvp" r WHERE r."sessionId" = s."id" AND r."status" = 'going') AS "going",
    (SELECT COUNT(*)::int FROM "ExpertSessionRsvp" r WHERE r."sessionId" = s."id" AND r."status" = 'waitlist') AS "waitlist"
  FROM "ExpertSession" s`;

export async function listSessions(filter: { ids?: string[] } = {}): Promise<SessionRow[]> {
  await ensureLiveTables();
  if (filter.ids && filter.ids.length === 0) return [];
  const rows = await prisma.$queryRaw<Raw[]>`
    ${SELECT} ${filter.ids ? Prisma.sql`WHERE s."id" IN (${Prisma.join(filter.ids)})` : Prisma.empty}
    ORDER BY s."startsAt" ASC`;
  return rows.map(toRow);
}

export async function getSession(id: string): Promise<SessionRow | null> {
  return (await listSessions({ ids: [id] }))[0] ?? null;
}

/** May this learner see and attend live sessions at all? */
export function canAttend(access: LearnAccess): boolean {
  return access.any;
}

/** True when the session is for every track or one this learner can open. */
export function forMyTracks(access: LearnAccess, s: Pick<SessionRow, "trackIds">): boolean {
  return s.trackIds.length === 0 || s.trackIds.some((id) => canAccessTrack(access, id));
}

// ── RSVPs and the waitlist ─────────────────────────────────────────────────

export type RsvpStatus = "going" | "waitlist";

export interface MyRsvp {
  status: RsvpStatus;
  joinedAt: Date | null;
  /** 1-based place on the waitlist; 0 when going. */
  position: number;
}

export async function myRsvps(studentId: string, sessionIds?: string[]): Promise<Map<string, MyRsvp>> {
  await ensureLiveTables();
  if (sessionIds && sessionIds.length === 0) return new Map();
  const rows = await prisma.$queryRaw<Array<{ sessionId: string; status: RsvpStatus; joinedAt: Date | null; position: number }>>`
    SELECT r."sessionId", r."status", r."joinedAt",
      CASE WHEN r."status" = 'waitlist' THEN (
        SELECT COUNT(*)::int FROM "ExpertSessionRsvp" w
        WHERE w."sessionId" = r."sessionId" AND w."status" = 'waitlist'
          AND (w."createdAt", w."studentId") <= (r."createdAt", r."studentId")) ELSE 0 END AS "position"
    FROM "ExpertSessionRsvp" r
    WHERE r."studentId" = ${studentId}
      ${sessionIds ? Prisma.sql`AND r."sessionId" IN (${Prisma.join(sessionIds)})` : Prisma.empty}`;
  return new Map(rows.map((r) => [r.sessionId, { status: r.status, joinedAt: r.joinedAt, position: Number(r.position) }]));
}

type Tx = Prisma.TransactionClient;

/** Lock the session row: RSVPs, cancellations and capacity edits queue up. */
async function lockSession(tx: Tx, id: string) {
  const [row] = await tx.$queryRaw<Array<{ capacity: number; status: string; startsAt: Date; durationMinutes: number }>>`
    SELECT "capacity", "status", "startsAt", "durationMinutes" FROM "ExpertSession" WHERE "id" = ${id} FOR UPDATE`;
  return row ?? null;
}

/** Move the oldest waitlisted learners up while there are seats. */
async function promote(tx: Tx, sessionId: string, capacity: number): Promise<string[]> {
  const [{ n }] = await tx.$queryRaw<Array<{ n: number }>>`
    SELECT COUNT(*)::int AS n FROM "ExpertSessionRsvp" WHERE "sessionId" = ${sessionId} AND "status" = 'going'`;
  const free = capacity - Number(n);
  if (free <= 0) return [];
  const rows = await tx.$queryRaw<Array<{ studentId: string }>>`
    UPDATE "ExpertSessionRsvp" SET "status" = 'going', "promotedAt" = now()
    WHERE "sessionId" = ${sessionId} AND "studentId" IN (
      SELECT "studentId" FROM "ExpertSessionRsvp"
      WHERE "sessionId" = ${sessionId} AND "status" = 'waitlist'
      ORDER BY "createdAt" ASC, "studentId" ASC LIMIT ${free})
    RETURNING "studentId"`;
  return rows.map((r) => r.studentId);
}

export type RsvpResult = "going" | "waitlist" | "already" | "closed" | "missing";

/**
 * RSVP. A seat when one is free, otherwise the waitlist. The session row is
 * locked for the duration, so two learners can never take the last seat.
 */
export async function rsvp(sessionId: string, studentId: string): Promise<RsvpResult> {
  await ensureLiveTables();
  return prisma.$transaction(async (tx) => {
    const s = await lockSession(tx, sessionId);
    if (!s) return "missing";
    if (!rsvpOpen(s)) return "closed";
    const [had] = await tx.$queryRaw<Array<{ status: string }>>`
      SELECT "status" FROM "ExpertSessionRsvp" WHERE "sessionId" = ${sessionId} AND "studentId" = ${studentId}`;
    if (had) return "already";
    const [{ n }] = await tx.$queryRaw<Array<{ n: number }>>`
      SELECT COUNT(*)::int AS n FROM "ExpertSessionRsvp" WHERE "sessionId" = ${sessionId} AND "status" = 'going'`;
    const status: RsvpStatus = Number(n) < s.capacity ? "going" : "waitlist";
    // A late RSVP inside a reminder window gets the confirmation instead of
    // an immediate reminder on top of it.
    const now = Date.now();
    const start = s.startsAt.getTime();
    const r24 = status === "going" && start - now <= 24 * 3_600_000 ? s.startsAt : null;
    const r1 = status === "going" && start - now <= 3_600_000 ? s.startsAt : null;
    await tx.$executeRaw`
      INSERT INTO "ExpertSessionRsvp" ("sessionId", "studentId", "status", "reminded24For", "reminded1For")
      VALUES (${sessionId}, ${studentId}, ${status}, ${r24}, ${r1})`;
    return status;
  });
}

/** Cancel an RSVP. Returns the learners promoted from the waitlist. */
export async function cancelRsvp(sessionId: string, studentId: string): Promise<{ removed: boolean; promoted: string[] }> {
  await ensureLiveTables();
  return prisma.$transaction(async (tx) => {
    const s = await lockSession(tx, sessionId);
    if (!s) return { removed: false, promoted: [] };
    const n = await tx.$executeRaw`
      DELETE FROM "ExpertSessionRsvp" WHERE "sessionId" = ${sessionId} AND "studentId" = ${studentId}`;
    // Seats freed after the session is over help nobody.
    const promoted = n > 0 && rsvpOpen(s) ? await promote(tx, sessionId, s.capacity) : [];
    return { removed: n > 0, promoted };
  });
}

/** After staff raise the capacity. */
export async function fillFromWaitlist(sessionId: string): Promise<string[]> {
  await ensureLiveTables();
  return prisma.$transaction(async (tx) => {
    const s = await lockSession(tx, sessionId);
    return s && rsvpOpen(s) ? promote(tx, sessionId, s.capacity) : [];
  });
}

export type JoinResult = { ok: true; url: string; points: number } | { ok: false; reason: "missing" | "notGoing" | "closed" | "noLink" };

/**
 * The learner clicked "Join" inside the window: record attendance (first
 * click), award the XP once per session, and hand back the meeting link.
 */
export async function joinSession(sessionId: string, studentId: string, now = Date.now()): Promise<JoinResult> {
  const s = await getSession(sessionId);
  if (!s) return { ok: false, reason: "missing" };
  if (!joinOpen(s, now)) return { ok: false, reason: "closed" };
  const n = await prisma.$executeRaw`
    UPDATE "ExpertSessionRsvp" SET "joinedAt" = COALESCE("joinedAt", now())
    WHERE "sessionId" = ${sessionId} AND "studentId" = ${studentId} AND "status" = 'going'`;
  if (n === 0) return { ok: false, reason: "notGoing" };
  if (!s.meetingUrl) return { ok: false, reason: "noLink" };
  const points = await awardPoints(studentId, "live_session", sessionId);
  return { ok: true, url: s.meetingUrl, points };
}

// ── People (staff and mail) ─────────────────────────────────────────────────

export interface AttendeeRow {
  studentId: string;
  name: string;
  email: string;
  locale: string;
  status: RsvpStatus;
  createdAt: Date;
  promotedAt: Date | null;
  joinedAt: Date | null;
}

/** RSVPs with account fields: going first, then the waitlist in order. Staff and mail only. */
export async function attendees(sessionId: string): Promise<AttendeeRow[]> {
  await ensureLiveTables();
  return prisma.$queryRaw<AttendeeRow[]>`
    SELECT r."studentId", s."name", s."email", s."locale", r."status", r."createdAt", r."promotedAt", r."joinedAt"
    FROM "ExpertSessionRsvp" r JOIN "Student" s ON s."id" = r."studentId"
    WHERE r."sessionId" = ${sessionId}
    ORDER BY CASE WHEN r."status" = 'going' THEN 0 ELSE 1 END, r."createdAt" ASC, r."studentId" ASC`;
}

export async function contact(studentId: string) {
  return prisma.student.findUnique({ where: { id: studentId }, select: { email: true, name: true, locale: true } });
}

// ── Questions ───────────────────────────────────────────────────────────────

export interface QuestionItem {
  id: string;
  body: string;
  author: string;
  mine: boolean;
  score: number;
  voted: boolean;
  answered: boolean;
  hidden: boolean;
  createdAt: string;
}

/**
 * Questions for a session, most upvoted first. Learners see "First L." and
 * never an email; a hidden question is seen by its author only.
 */
export async function listQuestions(sessionId: string, viewerId: string): Promise<QuestionItem[]> {
  await ensureLiveTables();
  const rows = await prisma.$queryRaw<
    Array<{ id: string; body: string; authorId: string; authorName: string; score: number; voted: boolean; answeredAt: Date | null; hidden: boolean; createdAt: Date }>
  >`
    SELECT q."id", q."body", q."authorId", s."name" AS "authorName", q."score", q."answeredAt", q."hidden", q."createdAt",
      EXISTS (SELECT 1 FROM "ExpertSessionVote" v WHERE v."questionId" = q."id" AND v."studentId" = ${viewerId}) AS "voted"
    FROM "ExpertSessionQuestion" q JOIN "Student" s ON s."id" = q."authorId"
    WHERE q."sessionId" = ${sessionId} AND q."deletedAt" IS NULL AND (q."hidden" = false OR q."authorId" = ${viewerId})
    ORDER BY q."score" DESC, q."createdAt" ASC
    LIMIT 200`;
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    author: publicName(r.authorName),
    mine: r.authorId === viewerId,
    score: Number(r.score),
    voted: !!r.voted,
    answered: !!r.answeredAt,
    hidden: r.hidden,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function myQuestionCount(sessionId: string, studentId: string): Promise<number> {
  await ensureLiveTables();
  const [{ n }] = await prisma.$queryRaw<Array<{ n: number }>>`
    SELECT COUNT(*)::int AS n FROM "ExpertSessionQuestion"
    WHERE "sessionId" = ${sessionId} AND "authorId" = ${studentId} AND "deletedAt" IS NULL`;
  return Number(n);
}

export async function addQuestion(sessionId: string, authorId: string, body: string): Promise<string> {
  await ensureLiveTables();
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "ExpertSessionQuestion" ("id", "sessionId", "authorId", "body") VALUES (${id}, ${sessionId}, ${authorId}, ${body})`;
  return id;
}

export async function getQuestion(id: string) {
  await ensureLiveTables();
  const [q] = await prisma.$queryRaw<Array<{ id: string; sessionId: string; authorId: string; hidden: boolean; deletedAt: Date | null }>>`
    SELECT "id", "sessionId", "authorId", "hidden", "deletedAt" FROM "ExpertSessionQuestion" WHERE "id" = ${id}`;
  return q ?? null;
}

/** Toggle an upvote. Null when not allowed (own question, gone, hidden). */
export async function toggleQuestionVote(studentId: string, questionId: string): Promise<{ voted: boolean; score: number } | null> {
  const q = await getQuestion(questionId);
  if (!q || q.deletedAt || q.hidden || q.authorId === studentId) return null;
  const removed = await prisma.$executeRaw`
    DELETE FROM "ExpertSessionVote" WHERE "questionId" = ${questionId} AND "studentId" = ${studentId}`;
  if (removed > 0) {
    const [r] = await prisma.$queryRaw<Array<{ score: number }>>`
      UPDATE "ExpertSessionQuestion" SET "score" = GREATEST(0, "score" - 1) WHERE "id" = ${questionId} RETURNING "score"`;
    return { voted: false, score: Number(r?.score ?? 0) };
  }
  const added = await prisma.$executeRaw`
    INSERT INTO "ExpertSessionVote" ("questionId", "studentId") VALUES (${questionId}, ${studentId}) ON CONFLICT DO NOTHING`;
  const [r] = added
    ? await prisma.$queryRaw<Array<{ score: number }>>`
        UPDATE "ExpertSessionQuestion" SET "score" = "score" + 1 WHERE "id" = ${questionId} RETURNING "score"`
    : [];
  return { voted: true, score: Number(r?.score ?? 0) };
}

/** Delete a question: its author (authorId set) or staff (null). */
export async function deleteQuestion(id: string, authorId: string | null): Promise<boolean> {
  await ensureLiveTables();
  const n = await prisma.$executeRaw`
    UPDATE "ExpertSessionQuestion" SET "deletedAt" = now()
    WHERE "id" = ${id} AND "deletedAt" IS NULL ${authorId ? Prisma.sql`AND "authorId" = ${authorId}` : Prisma.empty}`;
  return n > 0;
}

export interface StaffQuestion {
  id: string;
  body: string;
  authorName: string;
  authorEmail: string;
  score: number;
  hidden: boolean;
  answeredAt: Date | null;
  createdAt: Date;
}

export async function staffQuestions(sessionId: string): Promise<StaffQuestion[]> {
  await ensureLiveTables();
  return prisma.$queryRaw<StaffQuestion[]>`
    SELECT q."id", q."body", s."name" AS "authorName", s."email" AS "authorEmail", q."score", q."hidden", q."answeredAt", q."createdAt"
    FROM "ExpertSessionQuestion" q JOIN "Student" s ON s."id" = q."authorId"
    WHERE q."sessionId" = ${sessionId} AND q."deletedAt" IS NULL
    ORDER BY q."score" DESC, q."createdAt" ASC`;
}

export async function setQuestionAnswered(id: string, answered: boolean): Promise<void> {
  await ensureLiveTables();
  await prisma.$executeRaw`
    UPDATE "ExpertSessionQuestion" SET "answeredAt" = ${answered ? new Date() : null} WHERE "id" = ${id}`;
}

export async function setQuestionHidden(id: string, hidden: boolean): Promise<void> {
  await ensureLiveTables();
  await prisma.$executeRaw`UPDATE "ExpertSessionQuestion" SET "hidden" = ${hidden} WHERE "id" = ${id}`;
}

// ── Staff: sessions ─────────────────────────────────────────────────────────

export interface SessionInput {
  title: string;
  expertName: string;
  expertBio: string | null;
  expertPhotoUrl: string | null;
  topic: string | null;
  trackIds: string[];
  startsAt: Date;
  durationMinutes: number;
  timezone: string;
  meetingUrl: string | null;
  capacity: number;
  status: string;
  recordingUrl: string | null;
  resources: Resource[];
}

export async function createSession(v: SessionInput): Promise<string> {
  await ensureLiveTables();
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "ExpertSession" ("id", "title", "expertName", "expertBio", "expertPhotoUrl", "topic", "trackIds", "startsAt",
      "durationMinutes", "timezone", "meetingUrl", "capacity", "status", "recordingUrl", "resources")
    VALUES (${id}, ${v.title}, ${v.expertName}, ${v.expertBio}, ${v.expertPhotoUrl}, ${v.topic}, ${JSON.stringify(v.trackIds)}::jsonb,
      ${v.startsAt}, ${v.durationMinutes}, ${v.timezone}, ${v.meetingUrl}, ${v.capacity}, ${v.status}, ${v.recordingUrl},
      ${JSON.stringify(v.resources)}::jsonb)`;
  return id;
}

/**
 * Save the session. Reminders are keyed on the start time they were sent
 * for, so moving the session re-arms them; a raised capacity fills seats
 * from the waitlist (the promoted learners are returned for their email).
 */
export async function updateSession(id: string, v: SessionInput): Promise<string[]> {
  await ensureLiveTables();
  await prisma.$executeRaw`
    UPDATE "ExpertSession" SET "title" = ${v.title}, "expertName" = ${v.expertName}, "expertBio" = ${v.expertBio},
      "expertPhotoUrl" = ${v.expertPhotoUrl}, "topic" = ${v.topic}, "trackIds" = ${JSON.stringify(v.trackIds)}::jsonb,
      "startsAt" = ${v.startsAt}, "durationMinutes" = ${v.durationMinutes}, "timezone" = ${v.timezone},
      "meetingUrl" = ${v.meetingUrl}, "capacity" = ${v.capacity}, "status" = ${v.status}, "recordingUrl" = ${v.recordingUrl},
      "resources" = ${JSON.stringify(v.resources)}::jsonb, "updatedAt" = now()
    WHERE "id" = ${id}`;
  return fillFromWaitlist(id);
}

export async function deleteSession(id: string): Promise<void> {
  await ensureLiveTables();
  await prisma.$executeRaw`DELETE FROM "ExpertSession" WHERE "id" = ${id}`;
}

export async function removeAttendee(sessionId: string, studentId: string): Promise<string[]> {
  return (await cancelRsvp(sessionId, studentId)).promoted;
}

/** CSV of the RSVP and attendance list (staff). */
export function attendanceCsv(rows: AttendeeRow[]): string {
  const cell = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    // Spreadsheet formula injection: a cell starting with = + - @ is text.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const iso = (d: Date | null) => (d ? d.toISOString() : "");
  const head = ["name", "email", "status", "rsvp_at", "promoted_at", "attended", "joined_at", "language"];
  const lines = rows.map((r) => [r.name, r.email, r.status, iso(r.createdAt), iso(r.promotedAt), r.joinedAt ? "yes" : "no", iso(r.joinedAt), r.locale]);
  return [head, ...lines].map((l) => l.map(cell).join(",")).join("\r\n") + "\r\n";
}
