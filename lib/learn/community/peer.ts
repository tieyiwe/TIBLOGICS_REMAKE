import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { awardPoints } from "@/lib/learn/points";
import { ensureCommunityTables } from "./db";
import { LIMITS } from "./shared";

// Capstone peer review. Advisory only: the official grade still comes from
// the staff review, and nothing here touches CapstoneSubmission or the
// certificate rules.
//
// A learner who opts a submission in is assigned up to two other opted-in
// submissions in the same track and must review them before seeing the
// feedback their own submission received. Anonymous both ways: reviewers see
// only the work, recipients see "Peer 1", "Peer 2". When there are not yet
// enough other submissions, reviewing every one available is enough.

export interface FeedbackItem {
  criterion: string;
  rating: number | null;
  text: string;
}

export interface AssignedReview {
  id: string;
  status: "assigned" | "submitted";
  submissionUrl: string | null;
  submissionMd: string | null;
  feedback: FeedbackItem[];
}

export interface ReceivedReview {
  id: string;
  label: number;
  feedback: FeedbackItem[];
  helpful: boolean;
  submittedAt: string;
}

export interface PeerState {
  optedIn: boolean;
  /** The submission that can be opted in (the learner's latest), if any. */
  submissionId: string | null;
  assigned: AssignedReview[];
  completed: number;
  required: number;
  unlocked: boolean;
  /** Only filled when unlocked. */
  received: ReceivedReview[];
  /** Submitted reviews waiting behind the lock (count only). */
  waitingCount: number;
}

function parseFeedback(v: unknown): FeedbackItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => x && typeof x === "object")
    .map((x) => ({
      criterion: String((x as FeedbackItem).criterion ?? ""),
      rating: typeof (x as FeedbackItem).rating === "number" ? (x as FeedbackItem).rating : null,
      text: String((x as FeedbackItem).text ?? ""),
    }));
}

async function latestSubmission(studentId: string, capstoneId: string) {
  return prisma.capstoneSubmission.findFirst({
    where: { studentId, capstoneId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
}

async function optedInTrack(studentId: string, trackId: string): Promise<boolean> {
  const r = await prisma.$queryRaw<Array<{ x: number }>>`
    SELECT 1 AS x FROM "PeerReviewOptIn" WHERE "studentId" = ${studentId} AND "trackId" = ${trackId} LIMIT 1`;
  return r.length > 0;
}

/** Other learners' opted-in submissions this reviewer has not been given yet. */
async function candidates(studentId: string, trackId: string, limit: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ submissionId: string }>>`
    SELECT o."submissionId"
    FROM "PeerReviewOptIn" o
    WHERE o."trackId" = ${trackId} AND o."studentId" <> ${studentId}
      AND NOT EXISTS (SELECT 1 FROM "PeerReview" r WHERE r."submissionId" = o."submissionId" AND r."reviewerId" = ${studentId})
      AND NOT EXISTS (SELECT 1 FROM "PeerReview" r JOIN "PeerReviewOptIn" o2 ON o2."submissionId" = r."submissionId"
        WHERE r."reviewerId" = ${studentId} AND o2."studentId" = o."studentId")
      -- Each author's latest opted-in submission only.
      AND o."createdAt" = (SELECT MAX(o3."createdAt") FROM "PeerReviewOptIn" o3 WHERE o3."studentId" = o."studentId" AND o3."trackId" = ${trackId})
    ORDER BY (SELECT COUNT(*) FROM "PeerReview" r WHERE r."submissionId" = o."submissionId") ASC, o."createdAt" ASC
    LIMIT ${limit}`;
  return rows.map((r) => r.submissionId);
}

/** Top up this reviewer's assignments to the required number, if possible. */
export async function assignReviews(studentId: string, trackId: string): Promise<void> {
  await ensureCommunityTables();
  if (!(await optedInTrack(studentId, trackId))) return;
  const [{ n }] = await prisma.$queryRaw<Array<{ n: number }>>`
    SELECT COUNT(*)::int AS n FROM "PeerReview" WHERE "reviewerId" = ${studentId} AND "trackId" = ${trackId}`;
  const missing = LIMITS.peerReviewsRequired - Number(n);
  if (missing <= 0) return;
  for (const submissionId of await candidates(studentId, trackId, missing)) {
    await prisma.$executeRaw`
      INSERT INTO "PeerReview" ("id", "submissionId", "reviewerId", "trackId")
      VALUES (${randomUUID()}, ${submissionId}, ${studentId}, ${trackId}) ON CONFLICT DO NOTHING`;
  }
}

/** Opt the learner's latest submission for this capstone into peer review. */
export async function optIn(studentId: string, capstone: { id: string; trackId: string }): Promise<boolean> {
  await ensureCommunityTables();
  const latest = await latestSubmission(studentId, capstone.id);
  if (!latest) return false;
  await prisma.$executeRaw`
    INSERT INTO "PeerReviewOptIn" ("submissionId", "studentId", "trackId")
    VALUES (${latest.id}, ${studentId}, ${capstone.trackId}) ON CONFLICT DO NOTHING`;
  await assignReviews(studentId, capstone.trackId);
  return true;
}

export async function peerState(studentId: string, capstone: { id: string; trackId: string }): Promise<PeerState> {
  await ensureCommunityTables();
  const latest = await latestSubmission(studentId, capstone.id);
  const optedIn = await optedInTrack(studentId, capstone.trackId);
  if (optedIn) await assignReviews(studentId, capstone.trackId);

  const assignedRows = await prisma.$queryRaw<
    Array<{ id: string; status: string; feedback: unknown; submissionUrl: string | null; submissionMd: string | null }>
  >`
    SELECT r."id", r."status", r."feedback", s."submissionUrl", s."submissionMd"
    FROM "PeerReview" r JOIN "CapstoneSubmission" s ON s."id" = r."submissionId"
    WHERE r."reviewerId" = ${studentId} AND r."trackId" = ${capstone.trackId}
    ORDER BY r."createdAt" ASC`;
  const assigned: AssignedReview[] = assignedRows.map((r) => ({
    id: r.id,
    status: r.status === "submitted" ? "submitted" : "assigned",
    submissionUrl: r.submissionUrl,
    submissionMd: r.submissionMd,
    feedback: parseFeedback(r.feedback),
  }));
  const completed = assigned.filter((a) => a.status === "submitted").length;
  const pendingAssigned = assigned.length - completed;
  const more = optedIn && pendingAssigned === 0 && completed < LIMITS.peerReviewsRequired
    ? (await candidates(studentId, capstone.trackId, 1)).length > 0
    : true;
  const unlocked =
    optedIn &&
    (completed >= LIMITS.peerReviewsRequired || (completed >= 1 && pendingAssigned === 0 && !more));

  const receivedRows = await prisma.$queryRaw<Array<{ id: string; feedback: unknown; helpful: boolean; submittedAt: Date }>>`
    SELECT r."id", r."feedback", r."helpful", r."submittedAt"
    FROM "PeerReview" r JOIN "CapstoneSubmission" s ON s."id" = r."submissionId"
    WHERE s."studentId" = ${studentId} AND s."capstoneId" = ${capstone.id}
      AND r."status" = 'submitted' AND r."hidden" = false
    ORDER BY r."submittedAt" ASC`;

  return {
    optedIn,
    submissionId: latest?.id ?? null,
    assigned,
    completed,
    required: LIMITS.peerReviewsRequired,
    unlocked,
    received: unlocked
      ? receivedRows.map((r, i) => ({
          id: r.id,
          label: i + 1,
          feedback: parseFeedback(r.feedback),
          helpful: r.helpful,
          submittedAt: r.submittedAt.toISOString(),
        }))
      : [],
    waitingCount: receivedRows.length,
  };
}

/** Save a review the learner was assigned. Criteria must match the rubric. */
export async function submitReview(
  studentId: string,
  reviewId: string,
  feedback: FeedbackItem[],
): Promise<"ok" | "missing" | "done"> {
  await ensureCommunityTables();
  const [row] = await prisma.$queryRaw<Array<{ status: string }>>`
    SELECT "status" FROM "PeerReview" WHERE "id" = ${reviewId} AND "reviewerId" = ${studentId}`;
  if (!row) return "missing";
  if (row.status === "submitted") return "done";
  await prisma.$executeRaw`
    UPDATE "PeerReview" SET "feedback" = ${JSON.stringify(feedback)}::jsonb, "status" = 'submitted', "submittedAt" = now()
    WHERE "id" = ${reviewId} AND "reviewerId" = ${studentId}`;
  return "ok";
}

/** The recipient found a review helpful: the reviewer earns XP once. */
export async function markHelpful(studentId: string, reviewId: string): Promise<boolean> {
  await ensureCommunityTables();
  const [row] = await prisma.$queryRaw<Array<{ reviewerId: string }>>`
    SELECT r."reviewerId" FROM "PeerReview" r JOIN "CapstoneSubmission" s ON s."id" = r."submissionId"
    WHERE r."id" = ${reviewId} AND s."studentId" = ${studentId} AND r."status" = 'submitted' AND r."hidden" = false`;
  if (!row) return false;
  await prisma.$executeRaw`UPDATE "PeerReview" SET "helpful" = true WHERE "id" = ${reviewId}`;
  await awardPoints(row.reviewerId, "peer_review", reviewId);
  return true;
}

// ── Staff ───────────────────────────────────────────────────────────────────

export async function setPeerHidden(reviewId: string, hidden: boolean): Promise<void> {
  await ensureCommunityTables();
  await prisma.$executeRaw`UPDATE "PeerReview" SET "hidden" = ${hidden} WHERE "id" = ${reviewId}`;
}
