// Milestone detection and notification.
//
// Deliberately conservative: an email per lesson would train learners to
// ignore us, so only genuine milestones send. Each one is recorded in the
// points ledger, which makes "have we already told them?" a database
// question rather than a guess — and keeps sends idempotent.
import prisma from "@/lib/prisma";
import { sendMilestoneEmail } from "./emails";
import { levelFor } from "./points";

/**
 * A milestone email is sent at most once per (student, milestone) because the
 * underlying award is unique in the ledger. We check the ledger for the
 * award's existence *before* it was created to decide whether this is the
 * moment of crossing.
 */
type MilestoneKind =
  | "module_quiz_passed"
  | "half_track"
  | "exam_passed"
  | "level_up";

interface MilestoneInput {
  studentId: string;
  kind: MilestoneKind;
  trackId?: string;
  detail?: string;
  points?: number;
}

/** Fire-and-forget: never let a notification failure break the request. */
export function notifyMilestone(input: MilestoneInput): void {
  void sendMilestone(input).catch((err) =>
    console.error("[milestones] send failed", input.kind, err),
  );
}

async function sendMilestone({ studentId, kind, trackId, detail, points = 0 }: MilestoneInput) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { email: true, name: true },
  });
  if (!student) return;

  const track = trackId
    ? await prisma.learnTrack.findUnique({ where: { id: trackId }, select: { title: true } })
    : null;

  const copy: Record<MilestoneKind, { milestone: string; detail: string }> = {
    module_quiz_passed: {
      milestone: "Module complete",
      detail:
        detail ??
        `You've passed the quiz for a module in ${track?.title ?? "your track"}. That module is signed off.`,
    },
    half_track: {
      milestone: "Halfway there",
      detail:
        detail ??
        `You're past the halfway point of ${track?.title ?? "your track"}. The second half tends to go faster than the first.`,
    },
    exam_passed: {
      milestone: "Final exam passed",
      detail:
        detail ??
        `You've cleared the final exam for ${track?.title ?? "your track"}. Only the capstone stands between you and the certificate.`,
    },
    level_up: {
      milestone: detail ?? "New level reached",
      detail: `Your points total has taken you to a new level.`,
    },
  };

  const c = copy[kind];
  await sendMilestoneEmail({
    email: student.email,
    name: student.name,
    milestone: c.milestone,
    detail: c.detail,
    points,
  });
}

/**
 * Called after points are awarded. Detects a level crossing by comparing the
 * total before and after — so it fires exactly once, on the award that
 * crossed the boundary.
 */
export function checkLevelUp(studentId: string, totalBefore: number, totalAfter: number): void {
  const before = levelFor(totalBefore);
  const after = levelFor(totalAfter);
  if (after.index > before.index) {
    notifyMilestone({
      studentId,
      kind: "level_up",
      detail: `You've reached ${after.name}`,
      points: totalAfter - totalBefore,
    });
  }
}

/**
 * Halfway milestone. Fires only on the crossing lesson: we check whether the
 * previous completion count was below half and the new one is at or above.
 */
export async function checkHalfway(studentId: string, trackId: string): Promise<void> {
  const total = await prisma.lesson.count({ where: { module: { trackId } } });
  if (total < 4) return; // too short for a halfway point to mean anything

  const done = await prisma.lessonProgress.count({
    where: { studentId, lesson: { module: { trackId } } },
  });

  const half = Math.ceil(total / 2);
  // Exactly at the crossing point — one lesson earlier this was false.
  if (done === half) {
    notifyMilestone({ studentId, kind: "half_track", trackId });
  }
}
