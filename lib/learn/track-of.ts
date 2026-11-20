import prisma from "@/lib/prisma";

// Maps a piece of Learn content to the track it belongs to, so every API can
// check per-track access (lib/learn/session.ts denyTrack). One small query
// each; null when the record does not exist.

export interface LessonTrack {
  trackId: string;
  /** Free-preview lessons open for any member, whatever track they bought. */
  isPreview: boolean;
}

export async function trackOfLesson(lessonId: string): Promise<LessonTrack | null> {
  const l = await prisma.lesson
    .findUnique({ where: { id: lessonId }, select: { isPreview: true, module: { select: { trackId: true } } } })
    .catch(() => null);
  return l ? { trackId: l.module.trackId, isPreview: l.isPreview } : null;
}

/** A micro-check follows its lesson (open on a free-preview lesson). */
export async function trackOfMicroCheck(microCheckId: string): Promise<LessonTrack | null> {
  const m = await prisma.microCheck
    .findUnique({
      where: { id: microCheckId },
      select: { lesson: { select: { isPreview: true, module: { select: { trackId: true } } } } },
    })
    .catch(() => null);
  return m ? { trackId: m.lesson.module.trackId, isPreview: m.lesson.isPreview } : null;
}

export async function trackOfQuiz(quizId: string): Promise<string | null> {
  const q = await prisma.quiz
    .findUnique({ where: { id: quizId }, select: { module: { select: { trackId: true } } } })
    .catch(() => null);
  return q?.module.trackId ?? null;
}

export async function trackOfLab(labId: string): Promise<string | null> {
  const l = await prisma.lab.findUnique({ where: { id: labId }, select: { trackId: true } }).catch(() => null);
  return l?.trackId ?? null;
}

export async function trackOfExamSession(sessionId: string): Promise<string | null> {
  const s = await prisma.finalExamSession
    .findUnique({ where: { id: sessionId }, select: { finalExam: { select: { trackId: true } } } })
    .catch(() => null);
  return s?.finalExam.trackId ?? null;
}

export async function trackOfCapstone(capstoneId: string): Promise<string | null> {
  const c = await prisma.capstone.findUnique({ where: { id: capstoneId }, select: { trackId: true } }).catch(() => null);
  return c?.trackId ?? null;
}
