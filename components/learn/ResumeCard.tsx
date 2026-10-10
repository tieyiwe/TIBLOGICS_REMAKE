import Link from "next/link";
import { getT, type T } from "@/lib/i18n/server";
import { fmtMinutes } from "@/lib/learn/format";
import type { TrackProgress } from "@/lib/learn/progress";
import { getResumeTarget, type ResumeTarget } from "@/lib/learn/resume";

interface TrackItem {
  track: { id: string; slug: string; title: string };
  progress: TrackProgress;
}

/** Localized title for a resume target: lesson titles from the track's text, tools by name. */
export function resumeTitle(
  t: T,
  target: ResumeTarget,
  lessonTitles?: Record<string, { title: string } | undefined>,
): string {
  if (target.kind === "studio") return t(`studio.${target.refId}.name`);
  if (target.kind === "lesson" || target.kind === "next") return lessonTitles?.[target.refId]?.title ?? target.title;
  return target.title;
}

/**
 * The dashboard's "Continue where you left off" card: the exact next thing
 * (a lesson part-read, a lab or exam in progress, a Studio design, or else
 * the next unfinished lesson), in the track the learner last worked in.
 * Falls back to the given track's next lesson when there is no activity yet.
 */
export default async function ResumeCard({
  studentId,
  tracks,
  fallback,
  lessonTitles,
}: {
  studentId: string;
  /** Tracks the learner can open. */
  tracks: TrackItem[];
  fallback?: TrackItem;
  /** Localized lesson titles by track slug. */
  lessonTitles?: Map<string, Record<string, { title: string } | undefined>>;
}) {
  const t = await getT();
  const target = await getResumeTarget(studentId, { trackIds: tracks.map((x) => x.track.id) }).catch((err) => {
    console.error("[ResumeCard]", err);
    return null;
  });
  const item = (target?.trackId && tracks.find((x) => x.track.id === target.trackId)) || fallback;
  const href = target?.href ?? (item?.progress.nextLessonId ? `/learn/lesson/${item.progress.nextLessonId}` : null);
  if (!href) return null;
  const started = !!target || (item?.progress.completedLessons ?? 0) > 0;
  const titles = item ? lessonTitles?.get(item.track.slug) : undefined;

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-[var(--ink)] p-6 text-white"
      aria-labelledby="resume-title"
      data-resume-kind={target?.kind ?? "start"}
    >
      <p id="resume-title" className="text-xs font-bold uppercase tracking-wide text-white/50">
        {started ? t("resume.title") : t("learn.dash.startHere")}
      </p>
      {item && target?.kind !== "studio" && <h2 className="mt-2 text-xl font-bold">{item.track.title}</h2>}
      {target && (
        <p className="mt-2 text-sm text-white/80">
          <span className="font-semibold text-white">{t(`resume.kind.${target.kind}`)}</span>
          {": "}
          <span className="break-words">{resumeTitle(t, target, titles)}</span>
        </p>
      )}
      {item && target?.kind !== "studio" && (
        <p className="mt-1 text-sm text-white/60">
          {t("learn.dash.lessonsDone", { done: item.progress.completedLessons, total: item.progress.totalLessons })} ·{" "}
          {t("learn.time.remaining", { time: fmtMinutes(t, item.progress.minutesRemaining) })}
        </p>
      )}
      <Link
        href={href}
        className="mt-5 inline-block rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-6 py-3 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
      >
        {started ? t("learn.dash.resume") : t("learn.dash.begin")} →
      </Link>
    </section>
  );
}
