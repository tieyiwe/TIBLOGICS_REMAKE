import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent, hasTrackAccess } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTrack, trackText } from "@/lib/i18n/sources/learn";
import { diagnosticStatus } from "@/lib/learn/mastery/diagnostic";
import { DIAG_SECONDS_PER_QUESTION } from "@/lib/learn/mastery/rules";
import DiagnosticRunner from "@/components/learn/mastery/DiagnosticRunner";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("mastery.diag.metaTitle") };
}

// "Find your starting point": the track's placement diagnostic.
export default async function DiagnosticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const track = await prisma.learnTrack
    .findUnique({
      where: { slug },
      select: { id: true, slug: true, title: true, status: true, accentColor: true, modules: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true } } },
    })
    .catch(() => null);
  if (!track || track.status !== "live") notFound();
  if (!(await hasTrackAccess(student.id, track.id))) redirect(`/learn/track/${slug}`);

  const [t, locale, [src], status] = await Promise.all([getT(), getLocale(), loadTrackSources({ slug }), diagnosticStatus(student.id, track.id)]);
  const text = src ? (locale === "en" ? trackText(src) : (await localizedTrack(src, locale)).text) : null;
  const moduleTitles = Object.fromEntries(
    track.modules.map((m, i) => [m.id, { title: text?.modules[m.id]?.title ?? m.title, number: i + 1 }]),
  );
  const hoursLeft = status.retakeAt ? Math.max(1, Math.ceil((status.retakeAt.getTime() - Date.now()) / 3_600_000)) : 0;
  const n = track.modules.length;
  const minutes = {
    low: Math.max(1, Math.round((n * 2 * DIAG_SECONDS_PER_QUESTION) / 60)),
    high: Math.max(2, Math.round((n * 3 * DIAG_SECONDS_PER_QUESTION) / 60)),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <nav aria-label={t("mastery.breadcrumb")} className="mb-4 text-sm text-[var(--ink3)]">
        <Link href={`/learn/track/${slug}`} className="hover:text-[var(--ink)]">
          {text?.title ?? track.title}
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span>{t("mastery.diag.title")}</span>
      </nav>
      <h1 className="text-2xl font-black text-[var(--ink)]">
        <span aria-hidden="true">🧭 </span>
        {t("mastery.diag.title")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("mastery.diag.intro")}</p>
      <div className="mt-6">
        {status.canStart ? (
          <DiagnosticRunner
            trackSlug={slug}
            moduleTitles={moduleTitles}
            estimatedQuestions={Math.round(n * 2.5)}
            minutes={minutes}
            resuming={status.inProgress}
            accent={track.accentColor}
          />
        ) : (
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <p className="text-sm font-semibold text-[var(--ink)]">
              {t(hoursLeft === 1 ? "mastery.diag.retakeIn.one" : "mastery.diag.retakeIn.other", { n: hoursLeft })}
            </p>
            <Link
              href={`/learn/track/${slug}#your-path`}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full px-6 py-2.5 text-sm font-bold text-white"
              style={{ background: track.accentColor }}
            >
              {t("mastery.diag.seePath")} →
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
