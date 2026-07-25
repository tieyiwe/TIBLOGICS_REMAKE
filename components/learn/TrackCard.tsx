import Link from "next/link";
import LevelBadge from "./LevelBadge";
import WaitlistForm from "./WaitlistForm";
import { formatHours, pacingHint } from "@/lib/learn/types";
import type { CatalogTrack } from "@/lib/learn/catalog";

export default function TrackCard({ track }: { track: CatalogTrack }) {
  const comingSoon = track.status === "coming_soon";

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white transition-shadow hover:shadow-lg"
      style={{ borderTopWidth: 4, borderTopColor: track.accentColor }}
    >
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <LevelBadge level={track.level} levelEnd={track.levelEnd} />
          {comingSoon && (
            <span className="rounded-full bg-[var(--s3)] px-2.5 py-1 text-xs font-semibold text-[var(--ink2)]">
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

        {/* Duration + pacing on every card (Part C1) */}
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 text-xs">
          <div>
            <dt className="text-[var(--ink3)]">Length</dt>
            <dd className="font-semibold text-[var(--ink)]">{formatHours(track.estimatedHours)}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink3)]">Content</dt>
            <dd className="font-semibold text-[var(--ink)]">
              {track.moduleCount} modules · {track.lessonCount} lessons
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-[var(--ink3)]">
          {pacingHint(track.estimatedHours, track.estimatedWeeksAt3Hrs)}
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
              View track
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
