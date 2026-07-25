import prisma from "@/lib/prisma";
import LearnAdminClient from "./LearnAdminClient";

export const dynamic = "force-dynamic";

export default async function LearnAdminPage() {
  // Every query is guarded — before Sync Database runs, none of these tables
  // exist and the page must still render with its setup instructions.
  const [tracks, students, subs, submissions, certificates, waitlist] = await Promise.all([
    prisma.learnTrack
      .findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          id: true, slug: true, title: true, status: true, level: true,
          estimatedHours: true,
          modules: { select: { _count: { select: { lessons: true } } } },
        },
      })
      .catch(() => null),
    prisma.student.count().catch(() => null),
    prisma.learnSubscription
      .groupBy({ by: ["status"], _count: { _all: true } })
      .catch(() => null),
    prisma.capstoneSubmission
      .findMany({
        where: { status: { in: ["submitted", "in_review"] } },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          id: true, status: true, createdAt: true, submissionUrl: true,
          submissionMd: true, aiPrereviewMd: true,
          student: { select: { name: true, email: true } },
          capstone: { select: { passThreshold: true, track: { select: { title: true } } } },
        },
      })
      .catch(() => null),
    prisma.learnCertificate.count().catch(() => null),
    prisma.learnWaitlist
      .groupBy({ by: ["trackSlug"], _count: { _all: true } })
      .catch(() => null),
  ]);

  const tablesReady = tracks !== null;

  const subCounts = (subs ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = s._count._all;
    return acc;
  }, {});

  return (
    <LearnAdminClient
      tablesReady={tablesReady}
      tracks={(tracks ?? []).map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        status: t.status,
        level: t.level,
        estimatedHours: t.estimatedHours,
        moduleCount: t.modules.length,
        lessonCount: t.modules.reduce((n, m) => n + m._count.lessons, 0),
      }))}
      studentCount={students ?? 0}
      subCounts={subCounts}
      certificateCount={certificates ?? 0}
      waitlist={(waitlist ?? []).map((w) => ({ trackSlug: w.trackSlug, count: w._count._all }))}
      queue={(submissions ?? []).map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        submissionUrl: s.submissionUrl,
        submissionMd: s.submissionMd,
        aiPrereviewMd: s.aiPrereviewMd,
        studentName: s.student.name,
        studentEmail: s.student.email,
        trackTitle: s.capstone.track.title,
        passThreshold: s.capstone.passThreshold,
      }))}
    />
  );
}
