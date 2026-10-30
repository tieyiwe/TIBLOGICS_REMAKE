import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getStudent, hasTrackAccess } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { trackTexts } from "@/lib/learn/community/text";
import DiscussionSection from "@/components/learn/community/DiscussionSection";
import TrackCommunityCards from "@/components/learn/community/TrackCommunityCards";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("community.track.metaTitle") };
}

// One track's community: its cohorts and every thread in the track (lesson
// threads, general questions, and cohort-only threads for members), with
// recent and unanswered views.
export default async function TrackCommunity({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const track = await prisma.learnTrack.findUnique({ where: { slug }, select: { id: true, slug: true, title: true, accentColor: true } }).catch(() => null);
  if (!track) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  if (!(await hasTrackAccess(student.id, track.id))) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
        <p className="text-sm font-semibold text-[var(--ink)]">{t("community.err.trackLocked")}</p>
        <Link href="/learn/tracks" className="mt-4 inline-block text-sm font-semibold text-[var(--blue2)] underline">
          {t("community.backToTracks")}
        </Link>
      </div>
    );
  }

  const text = (await trackTexts([track.id], locale)).get(track.id);
  const lessonTitles = Object.fromEntries(Object.entries(text?.lessons ?? {}).map(([id, l]) => [id, l.title]));

  return (
    <div className="space-y-6">
      <nav aria-label={t("community.breadcrumb")} className="text-sm text-[var(--ink3)]">
        <Link href="/learn/community" className="hover:text-[var(--ink)]">
          {t("community.nav")}
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link href={`/learn/track/${track.slug}`} className="hover:text-[var(--ink)]">
          {text?.title ?? track.title}
        </Link>
      </nav>
      <header>
        <h1 className="text-2xl font-black text-[var(--ink)]">{t("community.track.title", { track: text?.title ?? track.title })}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink2)]">{t("community.track.intro")}</p>
      </header>
      <TrackCommunityCards studentId={student.id} trackId={track.id} slug={track.slug} accent={track.accentColor} />
      <DiscussionSection studentId={student.id} trackId={track.id} lessonTitles={lessonTitles} showContext heading={t("community.track.threads")} />
    </div>
  );
}
