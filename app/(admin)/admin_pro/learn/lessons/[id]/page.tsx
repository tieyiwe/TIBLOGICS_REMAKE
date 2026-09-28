import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import LessonEditor from "./LessonEditor";

export const dynamic = "force-dynamic";

export default async function LessonEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  await ensureLearnEditColumns();
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      module: { select: { id: true, title: true, sortOrder: true, track: { select: { id: true, title: true } } } },
      resources: { orderBy: { sortOrder: "asc" } },
      microCheck: { include: { questions: { orderBy: { id: "asc" } } } },
      _count: { select: { progress: true } },
    },
  });
  if (!lesson) notFound();

  return (
    <LessonEditor
      lesson={{
        id: lesson.id, title: lesson.title, objective: lesson.objective ?? "", contentType: lesson.contentType,
        videoUrl: lesson.videoUrl ?? "", bodyMd: lesson.bodyMd, durationMinutes: lesson.durationMinutes, isPreview: lesson.isPreview,
        completions: lesson._count.progress,
      }}
      crumbs={{ trackId: lesson.module.track.id, trackTitle: lesson.module.track.title, moduleTitle: lesson.module.title }}
      resources={lesson.resources.map((r) => ({
        id: r.id, title: r.title, url: r.url, resourceType: r.resourceType, isFree: r.isFree, isRequired: r.isRequired, notes: r.notes ?? "",
      }))}
      check={{
        passScore: lesson.microCheck?.passScore ?? 67,
        questionsServed: lesson.microCheck?.questionsServed ?? 3,
        questions: (lesson.microCheck?.questions ?? []).map((q) => ({
          id: q.id, question: q.question, options: Array.isArray(q.options) ? (q.options as string[]) : [], correctIndex: q.correctIndex, explanation: q.explanation,
        })),
      }}
    />
  );
}
