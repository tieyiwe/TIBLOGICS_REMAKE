// Milestone detection and notification.
//
// Deliberately conservative: an email per lesson would train learners to
// ignore us, so only genuine milestones send. Each one is recorded in the
// points ledger, which makes "have we already told them?" a database
// question rather than a guess — and keeps sends idempotent.
import prisma from "@/lib/prisma";
import { sendMilestoneEmail } from "./emails";
import { levelFor } from "./points";
import { rankName, translator } from "./i18n";

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
  /** For level_up: the new level's index (from levelFor). */
  levelIndex?: number;
  points?: number;
}

/** Fire-and-forget: never let a notification failure break the request. */
export function notifyMilestone(input: MilestoneInput): void {
  void sendMilestone(input).catch((err) =>
    console.error("[milestones] send failed", input.kind, err),
  );
}

async function sendMilestone({ studentId, kind, trackId, detail, levelIndex, points = 0 }: MilestoneInput) {
  // Different tables, neither reads the other.
  const [student, track] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { email: true, name: true, locale: true },
    }),
    trackId
      ? prisma.learnTrack.findUnique({ where: { id: trackId }, select: { title: true } })
      : Promise.resolve(null),
  ]);
  if (!student) return;

  // In the learner's saved language. Track titles stay as stored (English).
  const t = translator(student.locale);
  const title = track?.title ?? t("learn.email.milestone.yourTrack");
  const copy: Record<MilestoneKind, { milestone: string; detail: string }> = {
    module_quiz_passed: {
      milestone: t("learn.email.milestone.module.title"),
      detail: detail ?? t("learn.email.milestone.module.body", { title }),
    },
    half_track: {
      milestone: t("learn.email.milestone.half.title"),
      detail: detail ?? t("learn.email.milestone.half.body", { title }),
    },
    exam_passed: {
      milestone: t("learn.email.milestone.exam.title"),
      detail: detail ?? t("learn.email.milestone.exam.body", { title }),
    },
    level_up: {
      milestone:
        levelIndex != null
          ? t("learn.email.milestone.level.reached", { rank: rankName(t, levelIndex) })
          : detail ?? t("learn.email.milestone.level.title"),
      detail: t("learn.email.milestone.level.body"),
    },
  };

  const c = copy[kind];
  await sendMilestoneEmail({
    email: student.email,
    name: student.name,
    milestone: c.milestone,
    detail: c.detail,
    points,
    locale: student.locale,
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
      levelIndex: after.index,
      points: totalAfter - totalBefore,
    });
  }
}

/**
 * Halfway milestone. Fires only on the crossing lesson: we check whether the
 * previous completion count was below half and the new one is at or above.
 */
export async function checkHalfway(studentId: string, trackId: string): Promise<void> {
  // Two independent counts.
  const [total, done] = await Promise.all([
    prisma.lesson.count({ where: { module: { trackId } } }),
    prisma.lessonProgress.count({
      where: { studentId, lesson: { module: { trackId } } },
    }),
  ]);
  if (total < 4) return; // too short for a halfway point to mean anything

  const half = Math.ceil(total / 2);
  // Exactly at the crossing point — one lesson earlier this was false.
  if (done === half) {
    notifyMilestone({ studentId, kind: "half_track", trackId });
  }
}
