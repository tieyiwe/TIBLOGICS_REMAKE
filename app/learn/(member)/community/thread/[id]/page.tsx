import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { accessibleTrackIds, getStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { communityTablesReady } from "@/lib/learn/community/db";
import { visibleThread } from "@/lib/learn/community/discussion";
import ThreadView from "@/components/learn/community/ThreadView";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("community.discussion") };
}

// One thread on its own page (the link in reply digests).
export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  if (!(await communityTablesReady())) notFound();
  const tracks = await accessibleTrackIds(student.id);
  const thread = await visibleThread(student.id, tracks, id);
  if (!thread) notFound();
  const [t, track] = await Promise.all([
    getT(),
    prisma.learnTrack.findUnique({ where: { id: thread.trackId }, select: { slug: true, title: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label={t("community.breadcrumb")} className="mb-4 text-sm text-[var(--ink3)]">
        <Link href="/learn/community" className="hover:text-[var(--ink)]">
          {t("community.nav")}
        </Link>
        {track && (
          <>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link href={thread.cohortId ? `/learn/community/cohort/${thread.cohortId}` : `/learn/community/track/${track.slug}`} className="hover:text-[var(--ink)]">
              {track.title}
            </Link>
          </>
        )}
      </nav>
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <ThreadView threadId={thread.id} standalone />
      </div>
    </div>
  );
}
