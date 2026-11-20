import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import LabEditor from "./LabEditor";

export const dynamic = "force-dynamic";

/** Edit a lab, or create one with /admin_pro/learn/labs/new?track=<trackId>. */
export default async function LabEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ track?: string }> }) {
  await requireAdminPage();
  await ensureLearnEditColumns();
  const { id } = await params;
  const sp = await searchParams;

  const lab = id === "new" ? null : await prisma.lab.findUnique({ where: { id }, include: { _count: { select: { attempts: true } } } });
  if (id !== "new" && !lab) notFound();
  const trackId = lab?.trackId ?? sp.track;
  if (!trackId) notFound();

  const track = await prisma.learnTrack.findUnique({
    where: { id: trackId },
    select: {
      id: true, title: true,
      modules: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true } } } },
    },
  });
  if (!track) notFound();

  return (
    <LabEditor
      trackId={track.id}
      trackTitle={track.title}
      modules={track.modules}
      lab={lab ? {
        id: lab.id, slug: lab.slug, title: lab.title, labType: lab.labType, moduleId: lab.moduleId ?? "", lessonId: lab.lessonId ?? "",
        briefMd: lab.briefMd, scenarioMd: lab.scenarioMd ?? "", objectives: Array.isArray(lab.objectives) ? (lab.objectives as never) : [],
        config: (lab.config ?? {}) as Record<string, unknown>, passScore: lab.passScore, points: lab.points,
        estimatedMinutes: lab.estimatedMinutes, isPublished: lab.isPublished, attempts: lab._count.attempts,
      } : null}
    />
  );
}
