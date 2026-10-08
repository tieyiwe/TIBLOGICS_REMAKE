// Weekly challenge: entries, the weekly board and points.
//
// One entry per learner per week. The first submission is graded; one edit
// is allowed until the week ends (the owner's account may edit freely, to
// test). The board ranks by score, then by the earliest submission, and
// shows only learners who turned the leaderboard on (Account), as first name
// plus last initial: the same opt-in as the XP leaderboard.
//
// The table is created at runtime (./db.ts) and has no generated Prisma
// client, so it is read and written with parameterised raw SQL.
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { awardPoints } from "@/lib/learn/points";
import { ensureLeaderboardColumn, publicName } from "@/lib/learn/leaderboard";
import { ensureChallengeTables } from "./db";
import type { CriterionResult } from "./grade";

export const MAX_EDITS = 1;
export const BOARD_SIZE = 20;

export interface ChallengeEntry {
  id: string;
  week: string;
  challengeId: string;
  answer: string;
  score: number;
  feedback: string;
  breakdown: CriterionResult[];
  edits: number;
  submittedAt: Date;
}

export interface ChallengeBoardRow {
  rank: number;
  name: string;
  score: number;
  isMe: boolean;
}

export interface ChallengeBoard {
  top: ChallengeBoardRow[];
  /** The learner's own row when opted in and outside the top rows. */
  me: ChallengeBoardRow | null;
  myRank: number | null;
  players: number;
}

function toEntry(r: Record<string, unknown>): ChallengeEntry {
  const breakdown = Array.isArray(r.breakdown) ? (r.breakdown as CriterionResult[]) : [];
  return {
    id: String(r.id),
    week: String(r.week),
    challengeId: String(r.challengeId),
    answer: String(r.answer ?? ""),
    score: Number(r.score ?? 0),
    feedback: String(r.feedback ?? ""),
    breakdown,
    edits: Number(r.edits ?? 0),
    submittedAt: new Date(r.submittedAt as string | Date),
  };
}

export async function getEntry(studentId: string, week: string): Promise<ChallengeEntry | null> {
  await ensureChallengeTables();
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT "id", "week", "challengeId", "answer", "score", "feedback", "breakdown", "edits", "submittedAt"
       FROM "WeeklyChallengeEntry" WHERE "studentId" = $1 AND "week" = $2 LIMIT 1`,
    studentId,
    week,
  );
  return rows[0] ? toEntry(rows[0]) : null;
}

/**
 * Save a graded first submission. Returns null when an entry already exists
 * (two submissions raced): the caller then treats it as an edit.
 */
export async function createEntry(input: {
  studentId: string;
  week: string;
  challengeId: string;
  answer: string;
  score: number;
  feedback: string;
  breakdown: CriterionResult[];
  locale: string;
}): Promise<ChallengeEntry | null> {
  await ensureChallengeTables();
  const id = `wce_${randomBytes(12).toString("base64url")}`;
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `INSERT INTO "WeeklyChallengeEntry"
       ("id", "studentId", "week", "challengeId", "answer", "score", "feedback", "breakdown", "locale", "edits", "submittedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, 0, now(), now(), now())
     ON CONFLICT ("studentId", "week") DO NOTHING
     RETURNING "id", "week", "challengeId", "answer", "score", "feedback", "breakdown", "edits", "submittedAt"`,
    id,
    input.studentId,
    input.week,
    input.challengeId,
    input.answer,
    input.score,
    input.feedback,
    JSON.stringify(input.breakdown),
    input.locale,
  );
  return rows[0] ? toEntry(rows[0]) : null;
}

/**
 * Replace the answer with an edit. Only applies when the entry still has
 * `expectedEdits` edits (so two edits sent at once cannot both land) and,
 * unless `unlimited`, the edit allowance is not used up. Null = refused.
 */
export async function editEntry(input: {
  studentId: string;
  week: string;
  expectedEdits: number;
  unlimited: boolean;
  answer: string;
  score: number;
  feedback: string;
  breakdown: CriterionResult[];
  locale: string;
}): Promise<ChallengeEntry | null> {
  await ensureChallengeTables();
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `UPDATE "WeeklyChallengeEntry"
        SET "answer" = $3, "score" = $4, "feedback" = $5, "breakdown" = $6::jsonb, "locale" = $7,
            "edits" = "edits" + 1, "submittedAt" = now(), "updatedAt" = now()
      WHERE "studentId" = $1 AND "week" = $2 AND "edits" = $8 AND ($9::boolean OR "edits" < $10)
      RETURNING "id", "week", "challengeId", "answer", "score", "feedback", "breakdown", "edits", "submittedAt"`,
    input.studentId,
    input.week,
    input.answer,
    input.score,
    input.feedback,
    JSON.stringify(input.breakdown),
    input.locale,
    input.expectedEdits,
    input.unlimited,
    MAX_EDITS,
  );
  return rows[0] ? toEntry(rows[0]) : null;
}

/**
 * Points for the week: the best score reached, at most once per week. The
 * first graded score is awarded under refId `<week>`; an edit that scores
 * higher adds the difference once, under `<week>:improved`. Returns the
 * points added now.
 */
export async function awardChallengePoints(studentId: string, week: string, score: number): Promise<number> {
  const improved = `${week}:improved`;
  const rows = await prisma.pointsLedger.findMany({
    where: { studentId, source: "weekly_challenge", refId: { in: [week, improved] } },
    select: { refId: true, points: true },
  });
  const already = rows.reduce((s, r) => s + r.points, 0);
  if (score <= already) return 0;
  const hasFirst = rows.some((r) => r.refId === week);
  const hasImproved = rows.some((r) => r.refId === improved);
  if (hasFirst && hasImproved) return 0;
  return awardPoints(studentId, "weekly_challenge", hasFirst ? improved : week, score - already);
}

/** The week's board: top rows (opted-in learners only) and the learner's rank. */
export async function weekBoard(week: string, studentId: string | null, limit = BOARD_SIZE): Promise<ChallengeBoard> {
  await Promise.all([ensureChallengeTables(), ensureLeaderboardColumn().catch(() => {})]);
  const top = await prisma.$queryRawUnsafe<Array<{ studentId: string; name: string; score: number }>>(
    `SELECT e."studentId", s."name", e."score"
       FROM "WeeklyChallengeEntry" e JOIN "Student" s ON s."id" = e."studentId"
      WHERE e."week" = $1 AND s."leaderboardOptIn" = true
      ORDER BY e."score" DESC, e."submittedAt" ASC, e."id" ASC
      LIMIT $2`,
    week,
    limit,
  );
  const [{ n: players }] = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
    `SELECT COUNT(*)::int AS n FROM "WeeklyChallengeEntry" e JOIN "Student" s ON s."id" = e."studentId"
      WHERE e."week" = $1 AND s."leaderboardOptIn" = true`,
    week,
  );
  const rows: ChallengeBoardRow[] = top.map((r, i) => ({
    rank: i + 1,
    name: publicName(r.name),
    score: Number(r.score),
    isMe: r.studentId === studentId,
  }));

  let me: ChallengeBoardRow | null = null;
  let myRank: number | null = rows.find((r) => r.isMe)?.rank ?? null;
  if (studentId && myRank == null) {
    // Ahead of me: a higher score, or the same score submitted earlier.
    const mine = await prisma.$queryRawUnsafe<Array<{ name: string; score: number; ahead: number }>>(
      `SELECT s."name", e."score",
              (SELECT COUNT(*)::int FROM "WeeklyChallengeEntry" o JOIN "Student" os ON os."id" = o."studentId"
                WHERE o."week" = e."week" AND os."leaderboardOptIn" = true
                  AND (o."score" > e."score" OR (o."score" = e."score" AND (o."submittedAt" < e."submittedAt"
                       OR (o."submittedAt" = e."submittedAt" AND o."id" < e."id"))))) AS ahead
         FROM "WeeklyChallengeEntry" e JOIN "Student" s ON s."id" = e."studentId"
        WHERE e."week" = $1 AND e."studentId" = $2 AND s."leaderboardOptIn" = true`,
      week,
      studentId,
    );
    if (mine[0]) {
      myRank = Number(mine[0].ahead) + 1;
      me = { rank: myRank, name: publicName(mine[0].name), score: Number(mine[0].score), isMe: true };
    }
  }
  return { top: rows, me, myRank, players: Number(players ?? 0) };
}

/** Whether the learner shows on boards (Account → leaderboard). */
export async function isOnBoards(studentId: string): Promise<boolean> {
  await ensureLeaderboardColumn().catch(() => {});
  const row = await prisma.student.findUnique({ where: { id: studentId }, select: { leaderboardOptIn: true } }).catch(() => null);
  return row?.leaderboardOptIn ?? false;
}
