// AI-Empowered Youth: what a parent sees about their child (the parent
// dashboard, /parent/[token], and the weekly email). Only learning records:
// never the child's email, messages to the Tutor or written work.
import prisma from "@/lib/prisma";
import { weekStart } from "./leaderboard";
import { YOUTH_SLUGS } from "./youth";
import { ageBand, laneForBirthYear, type YouthProfile } from "./youth-account";

export interface ParentSummary {
  firstName: string;
  band: ReturnType<typeof ageBand>;
  lane: { slug: string; title: string } | null;
  lessonsDone: number;
  lessonsThisWeek: number;
  quizzesPassed: number;
  labsPassed: number;
  /** Estimated from the lessons and labs finished this week. */
  minutesThisWeek: number;
  certificates: Array<{ name: string; issuedAt: string; verificationId: string }>;
  recent: Array<{ kind: "lesson" | "quiz" | "lab" | "certificate"; title: string; at: string; passed?: boolean }>;
}

export async function parentSummary(child: YouthProfile): Promise<ParentSummary> {
  const studentId = child.studentId;
  const since = weekStart();
  const laneSlug = child.birthYear ? laneForBirthYear(child.birthYear) : YOUTH_SLUGS[0];
  const [lane, lessonsDone, weekLessons, quizPassed, labPassed, weekLabs, certs, recentLessons, recentQuizzes, recentLabs] = await Promise.all([
    prisma.learnTrack.findUnique({ where: { slug: laneSlug }, select: { slug: true, title: true } }).catch(() => null),
    prisma.lessonProgress.count({ where: { studentId } }),
    prisma.lessonProgress.findMany({ where: { studentId, completedAt: { gte: since } }, select: { lesson: { select: { durationMinutes: true } } } }),
    prisma.quizAttempt.groupBy({ by: ["quizId"], where: { studentId, passed: true } }),
    prisma.labAttempt.groupBy({ by: ["labId"], where: { studentId, passed: true } }),
    prisma.labAttempt.findMany({ where: { studentId, status: "submitted", updatedAt: { gte: since } }, select: { labId: true, lab: { select: { estimatedMinutes: true } } } }),
    prisma.learnCertificate.findMany({ where: { studentId, revoked: false }, orderBy: { issuedAt: "desc" }, select: { certificateName: true, issuedAt: true, verificationId: true } }),
    prisma.lessonProgress.findMany({ where: { studentId }, orderBy: { completedAt: "desc" }, take: 8, select: { completedAt: true, lesson: { select: { title: true } } } }),
    prisma.quizAttempt.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 5, select: { createdAt: true, passed: true, quiz: { select: { module: { select: { title: true } } } } } }),
    prisma.labAttempt.findMany({ where: { studentId, status: "submitted" }, orderBy: { updatedAt: "desc" }, take: 5, select: { updatedAt: true, passed: true, lab: { select: { title: true } } } }),
  ]);
  const labMinutes = new Map(weekLabs.map((l) => [l.labId, l.lab.estimatedMinutes]));
  const minutesThisWeek =
    weekLessons.reduce((n, l) => n + (l.lesson.durationMinutes || 0), 0) + [...labMinutes.values()].reduce((n, m) => n + (m || 0), 0);

  const recent: ParentSummary["recent"] = [
    ...recentLessons.map((l) => ({ kind: "lesson" as const, title: l.lesson.title, at: l.completedAt.toISOString() })),
    ...recentQuizzes.map((q) => ({ kind: "quiz" as const, title: q.quiz.module.title, at: q.createdAt.toISOString(), passed: q.passed })),
    ...recentLabs.map((l) => ({ kind: "lab" as const, title: l.lab.title, at: l.updatedAt.toISOString(), passed: l.passed })),
    ...certs.slice(0, 3).map((c) => ({ kind: "certificate" as const, title: c.certificateName, at: c.issuedAt.toISOString() })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  return {
    firstName: child.name.trim().split(/\s+/)[0] || "",
    band: ageBand(child),
    lane,
    lessonsDone,
    lessonsThisWeek: weekLessons.length,
    quizzesPassed: quizPassed.length,
    labsPassed: labPassed.length,
    minutesThisWeek,
    certificates: certs.map((c) => ({ name: c.certificateName, issuedAt: c.issuedAt.toISOString(), verificationId: c.verificationId })),
    recent,
  };
}
