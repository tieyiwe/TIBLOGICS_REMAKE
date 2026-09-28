import prisma from "@/lib/prisma";
import LearnAdminClient from "./LearnAdminClient";
import { requireAdminPage } from "../_lib/admin-page-auth";

export const dynamic = "force-dynamic";

export default async function LearnAdminPage() {
  // This page reads learner names, emails and submissions straight from the
  // database, so it checks for a staff session itself like every other admin page.
  await requireAdminPage();
  // Every query is guarded — before Sync Database runs, none of these tables
  // exist and the page must still render with its setup instructions.
  const [tracks, students, subs, submissions, certificates, waitlist, recentCerts] = await Promise.all([
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
    prisma.learnCertificate
      .findMany({
        orderBy: { issuedAt: "desc" },
        take: 25,
        select: {
          id: true, verificationId: true, recipientName: true, certificateName: true,
          distinction: true, revoked: true, issuedAt: true,
          student: { select: { email: true } },
          track: { select: { title: true } },
        },
      })
      .catch(() => []),
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
      recentCertificates={(recentCerts ?? []).map((c) => ({
        id: c.id,
        verificationId: c.verificationId,
        recipientName: c.recipientName,
        certificateName: c.certificateName,
        studentEmail: c.student.email,
        trackTitle: c.track.title,
        distinction: c.distinction,
        revoked: c.revoked,
        issuedAt: c.issuedAt.toISOString(),
      }))}
    />
  );
}
