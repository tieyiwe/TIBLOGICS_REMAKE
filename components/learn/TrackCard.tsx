"use client";

import Link from "next/link";
import LevelBadge from "./LevelBadge";
import WaitlistForm from "./WaitlistForm";
import { fmtBreakdown, fmtPacing, fmtPrice, totalHours } from "@/lib/learn/format";
import { PLANS } from "@/lib/payments/provider";
import type { CatalogTrack } from "@/lib/learn/catalog";
import { useLocale, useT } from "@/lib/i18n/client";

export default function TrackCard({ track }: { track: CatalogTrack }) {
  const t = useT();
  const locale = useLocale();
  const comingSoon = track.status === "coming_soon";
  const outcomes = track.outcomes.slice(0, 3);
  const hours = totalHours(track.lessonMinutes, track.handsOnMinutes, track.estimatedHours);

  // What the learner actually gets. Coming-soon tracks have the structure
  // planned but no content yet, so we only claim what exists.
  const count = (n: number, key: string) => t(`${key}.${n === 1 ? "one" : "other"}`, { n });
  const includes: string[] = [];
  if (track.lessonCount > 0) includes.push(count(track.lessonCount, "learn.count.lessons"));
  if (track.labCount > 0) includes.push(count(track.labCount, "learn.count.labs"));
  if (track.quizCount > 0) includes.push(count(track.quizCount, "learn.count.quizzes"));
  if (track.hasExam) includes.push(t("learn.card.finalExam"));
  if (track.hasCapstone) includes.push(t("learn.card.capstone"));

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
              {t("learn.catalog.comingSoon")}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold leading-snug text-[var(--ink)]">
          {comingSoon ? (
            track.title
          ) : (
            <Link href={`/learning-box/${track.slug}`} className="after:absolute after:inset-0">
              {track.title}
            </Link>
          )}
        </h3>

        {track.tagline && <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{track.tagline}</p>}

        {/* What you'll be able to do */}
        {outcomes.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.card.youWillBeAbleTo")}</p>
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
                {t("learn.card.more", { n: track.outcomes.length - outcomes.length })}
              </p>
            )}
          </div>
        )}

        {/* Who it's for */}
        {track.audience && (
          <p className="mt-4 rounded-lg bg-[var(--s2)] px-3 py-2 text-xs leading-relaxed text-[var(--ink2)]">
            <strong className="text-[var(--ink)]">{t("learn.card.for")} </strong>
            <span className="line-clamp-2">{track.audience}</span>
          </p>
        )}

        {/* What's included */}
        {includes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {includes.map((x) => (
              <span key={x} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink2)]">
                {x}
              </span>
            ))}
          </div>
        )}

        {/* Duration + pacing */}
        <div className="mt-4 border-t border-[var(--border)] pt-4 text-xs">
          <p className="font-semibold text-[var(--ink)]">
            {fmtBreakdown(t, locale, track)}
          </p>
          <p className="mt-1 text-[var(--ink3)]">
            {count(track.moduleCount, "learn.count.modules")} · {fmtPacing(t, hours)}
          </p>
        </div>

        {/* Certificate */}
        <p className="mt-3 flex items-start gap-1.5 text-xs text-[var(--ink3)]">
          <span aria-hidden="true">🏅</span>
          <span className="line-clamp-2">{track.certificateName}</span>
        </p>

        {/* Both ways to buy */}
        {!comingSoon && (
          <div className="mt-4 rounded-xl bg-[var(--s2)] px-3 py-2.5 text-xs leading-snug text-[var(--ink2)]">
            <p className="font-semibold text-[var(--ink)]">{t("learn.offer.trackLine", { price: fmtPrice(track.priceCents, locale) })}</p>
            <p className="mt-0.5">
              {t("learn.offer.or")} {t("learn.offer.allLine", { price: fmtPrice(PLANS.monthly.amount, locale) })}
            </p>
          </div>
        )}

        <div className="mt-5 pt-1">
          {comingSoon ? (
            // relative z-10 keeps the form clickable above the card's stretched link
            <div className="relative z-10">
              <WaitlistForm trackSlug={track.slug} />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: track.accentColor }}>
              {t("learn.card.viewAndStart")}
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
