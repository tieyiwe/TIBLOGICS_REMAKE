import Link from "next/link";
import LevelBadge from "./LevelBadge";
import WaitlistForm from "./WaitlistForm";
import { formatHours, pacingHint } from "@/lib/learn/types";
import type { CatalogTrack } from "@/lib/learn/catalog";

export default function TrackCard({ track }: { track: CatalogTrack }) {
  const comingSoon = track.status === "coming_soon";
  const outcomes = track.outcomes.slice(0, 3);

  // What the learner actually gets. Coming-soon tracks have the structure
  // planned but no content yet, so we only claim what exists.
  const includes: string[] = [];
  if (track.lessonCount > 0) includes.push(`${track.lessonCount} lessons`);
  if (track.labCount > 0) includes.push(`${track.labCount} hands-on labs`);
  if (track.quizCount > 0) includes.push(`${track.quizCount} module quizzes`);
  if (track.hasExam) includes.push("Timed final exam");
  if (track.hasCapstone) includes.push("Reviewed capstone");

  return (
    <article
      className="learn-lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      style={{ borderTopWidth: 4, borderTopColor: track.accentColor }}
    >
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <LevelBadge level={track.level} levelEnd={track.levelEnd} />
          {comingSoon && (
            <span className="shrink-0 rounded-full bg-[var(--s3)] px-2.5 py-1 text-xs font-semibold text-[var(--ink2)]">
              Coming soon
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold leading-snug text-[var(--ink)]">
          {comingSoon ? (
            track.title
          ) : (
            <Link href={`/courses/${track.slug}`} className="after:absolute after:inset-0">
              {track.title}
            </Link>
          )}
        </h3>

        {track.tagline && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{track.tagline}</p>
        )}

        {/* What you'll be able to do */}
        {outcomes.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
              You'll be able to
            </p>
            <ul className="mt-2 space-y-1.5">
              {outcomes.map((o) => (
                <li key={o} className="flex gap-2 text-xs leading-relaxed text-[var(--ink2)]">
                  <span aria-hidden="true" className="shrink-0 font-bold" style={{ color: track.accentColor }}>
                    ✓
                  </span>
                  <span className="line-clamp-2">{o}</span>
                </li>
              ))}
            </ul>
            {track.outcomes.length > outcomes.length && (
              <p className="mt-1.5 pl-4 text-xs text-[var(--ink3)]">
                +{track.outcomes.length - outcomes.length} more
              </p>
            )}
          </div>
        )}

        {/* Who it's for */}
        {track.audience && (
          <p className="mt-4 rounded-lg bg-[var(--s2)] px-3 py-2 text-xs leading-relaxed text-[var(--ink2)]">
            <strong className="text-[var(--ink)]">For: </strong>
            <span className="line-clamp-2">{track.audience}</span>
          </p>
        )}

        {/* What's included */}
        {includes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {includes.map((x) => (
              <span
                key={x}
                className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink2)]"
              >
                {x}
              </span>
            ))}
          </div>
        )}

        {/* Duration + pacing */}
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 text-xs">
          <div>
            <dt className="text-[var(--ink3)]">Length</dt>
            <dd className="font-semibold text-[var(--ink)]">{formatHours(track.estimatedHours)}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink3)]">Structure</dt>
            <dd className="font-semibold text-[var(--ink)]">
              {track.moduleCount} modules
              {track.lessonCount > 0 && ` · ${track.lessonCount} lessons`}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-[var(--ink3)]">
          {pacingHint(track.estimatedHours, track.estimatedWeeksAt3Hrs)}
        </p>

        {/* Certificate */}
        <p className="mt-3 flex items-start gap-1.5 text-xs text-[var(--ink3)]">
          <span aria-hidden="true">🏅</span>
          <span className="line-clamp-2">{track.certificateName}</span>
        </p>

        <div className="mt-5 pt-1">
          {comingSoon ? (
            // relative z-10 keeps the form clickable above the card's stretched link
            <div className="relative z-10">
              <WaitlistForm trackSlug={track.slug} />
            </div>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: track.accentColor }}
            >
              View track &amp; start
              <span aria-hidden="true" className="learn-rotate group-hover:translate-x-1">
                →
              </span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
