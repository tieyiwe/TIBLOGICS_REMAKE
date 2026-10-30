import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import TrackEditor from "./TrackEditor";

export const dynamic = "force-dynamic";

const toQ = (q: { id: string; question: string; options: unknown; correctIndex: number; explanation: string; difficulty?: number; moduleId?: string | null }) => ({
  id: q.id, question: q.question, options: Array.isArray(q.options) ? (q.options as string[]) : [], correctIndex: q.correctIndex,
  explanation: q.explanation, difficulty: q.difficulty, moduleId: q.moduleId ?? null,
});

/** Everything in one track, for the editor. */
export default async function TrackEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  await ensureLearnEditColumns();
  const { id } = await params;

  const track = await prisma.learnTrack.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true, title: true, durationMinutes: true, videoUrl: true, isPreview: true, editedAt: true,
              _count: { select: { resources: true, progress: true } },
              microCheck: { select: { _count: { select: { questions: true } } } },
            },
          },
          quiz: { include: { questions: { orderBy: { id: "asc" } } } },
        },
      },
      labs: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, labType: true, moduleId: true, isPublished: true, estimatedMinutes: true } },
      finalExam: { include: { questions: { orderBy: { id: "asc" } } } },
      capstone: true,
      _count: { select: { certificates: true } },
    },
  });
  if (!track) notFound();

  return (
    <TrackEditor
      track={{
        id: track.id, slug: track.slug, title: track.title, tagline: track.tagline ?? "", description: track.description,
        level: track.level, levelEnd: track.levelEnd ?? "", status: track.status, sortOrder: track.sortOrder,
        accentColor: track.accentColor, heroImage: track.heroImage ?? "", certificateName: track.certificateName,
        audience: track.audience ?? "", outcomes: Array.isArray(track.outcomes) ? (track.outcomes as string[]) : [],
        estimatedHours: track.estimatedHours, certificates: track._count.certificates, priceCents: track.priceCents,
      }}
      modules={track.modules.map((m) => ({
        id: m.id, title: m.title, summary: m.summary ?? "", estimatedMinutes: m.estimatedMinutes,
        lessons: m.lessons.map((l) => ({
          id: l.id, title: l.title, durationMinutes: l.durationMinutes, hasVideo: !!l.videoUrl, isPreview: l.isPreview,
          resources: l._count.resources, completions: l._count.progress, checkQuestions: l.microCheck?._count.questions ?? 0,
          edited: !!l.editedAt,
        })),
        quiz: m.quiz ? { passScore: m.quiz.passScore, questionsServed: m.quiz.questionsServed, questions: m.quiz.questions.map(toQ) } : null,
      }))}
      labs={track.labs}
      exam={track.finalExam ? {
        title: track.finalExam.title, timeLimitMinutes: track.finalExam.timeLimitMinutes, questionsServed: track.finalExam.questionsServed,
        passScore: track.finalExam.passScore, distinctionScore: track.finalExam.distinctionScore, maxAttempts: track.finalExam.maxAttempts,
        cooldownHours: track.finalExam.cooldownHours, instructionsMd: track.finalExam.instructionsMd, questions: track.finalExam.questions.map(toQ),
      } : null}
      capstone={track.capstone ? {
        briefMd: track.capstone.briefMd, passThreshold: track.capstone.passThreshold,
        rubric: Array.isArray(track.capstone.rubric) ? (track.capstone.rubric as Array<{ criterion: string; weight: number; description?: string }>) : [],
      } : null}
    />
  );
}
