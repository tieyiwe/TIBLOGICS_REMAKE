import Link from "next/link";
import type { T } from "@/lib/i18n/server";
import type { NewLesson } from "@/lib/learn/track-updates";

// "New in this track": lessons added to modules the learner had finished.
// Completed lessons and issued certificates are untouched; this only points
// the additions out until they are done.

/** The track page's panel, listing each new lesson with a link. */
export function NewLessonsPanel({
  t,
  lessons,
  titles,
  accentColor,
}: {
  t: T;
  lessons: NewLesson[];
  titles?: Record<string, { title: string } | undefined>;
  accentColor: string;
}) {
  if (lessons.length === 0) return null;
  return (
    <section
      aria-labelledby="new-in-track"
      data-new-lessons={lessons.length}
      className="rounded-2xl border-2 bg-white p-5"
      style={{ borderColor: accentColor }}
    >
      <h2 id="new-in-track" className="flex items-center gap-2 text-base font-bold text-[var(--ink)]">
        <NewPill t={t} accentColor={accentColor} />
        {t("updates.title")}
      </h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">
        {lessons.length === 1 ? t("updates.body.one") : t("updates.body.other", { n: lessons.length })}
      </p>
      <ul className="mt-3 space-y-1">
        {lessons.map((l) => (
          <li key={l.id}>
            <Link href={`/learn/lesson/${l.id}`} className="text-sm font-semibold text-[var(--blue2)] underline">
              {titles?.[l.id]?.title ?? l.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The small "New" pill, next to a lesson in the outline. */
export function NewPill({ t, accentColor }: { t: T; accentColor: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
      style={{ background: accentColor }}
    >
      {t("updates.badge")}
    </span>
  );
}

/** The dashboard track card's line: "2 new lessons" and their titles. */
export function NewLessonsChip({
  t,
  lessons,
  titles,
  accentColor,
}: {
  t: T;
  lessons: NewLesson[];
  titles?: Record<string, { title: string } | undefined>;
  accentColor: string;
}) {
  if (lessons.length === 0) return null;
  const names = lessons.map((l) => titles?.[l.id]?.title ?? l.title);
  return (
    <span className="mt-1.5 block text-xs" data-new-lessons={lessons.length}>
      <NewPill t={t} accentColor={accentColor} />{" "}
      <span className="font-semibold text-[var(--ink)]">
        {lessons.length === 1 ? t("updates.dash.one") : t("updates.dash.other", { n: lessons.length })}
      </span>
      <span className="mt-0.5 block truncate text-[var(--ink3)]" title={names.join(", ")}>
        {names.slice(0, 3).join(", ")}
        {names.length > 3 ? ", …" : ""}
      </span>
    </span>
  );
}
