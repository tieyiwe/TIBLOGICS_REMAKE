"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { LEVEL_META, type TrackLevel } from "@/lib/learn/types";
import { levelLabel, fmtPrice, totalHours } from "@/lib/learn/format";
import { trackMonthlyCents } from "@/lib/learn/track-monthly";
import { PLANS } from "@/lib/payments/provider";
import { readableOn } from "@/lib/a11y/contrast";
import { useLocale, useT } from "@/lib/i18n/client";
import BottomSheet from "./BottomSheet";
import WaitlistForm from "./WaitlistForm";

/**
 * A track as a compact phone tile, two to a row: level, title, time,
 * lessons and labs, certificate and price, the things to know before
 * tapping. A live track opens its page; a coming-soon one opens a sheet
 * with what it will teach and the waitlist.
 */
export interface TileTrack {
  slug: string;
  title: string;
  tagline?: string | null;
  level?: string;
  levelEnd?: string | null;
  accentColor: string;
  status?: string;
  lessonCount?: number;
  labCount?: number;
  lessonMinutes?: number;
  handsOnMinutes?: number;
  estimatedHours: number;
  priceCents?: number;
  salePriceCents?: number | null;
  outcomes?: string[];
  certificateName?: string;
}

export default function TrackTile({
  track,
  href,
  progress,
  locked,
  highlight,
  label,
}: {
  track: TileTrack;
  /** Where a live tile goes (the public page or the learner's track). */
  href: string;
  /** Learner mode: percent done. */
  progress?: number;
  /** Learner mode: not unlocked, so show the price. */
  locked?: boolean;
  highlight?: boolean;
  /** A small tag above the title, like "Level 1". Defaults to the level. */
  label?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [sheet, setSheet] = useState(false);
  const close = useCallback(() => setSheet(false), []);
  const comingSoon = track.status === "coming_soon";
  const accent = readableOn(track.accentColor);
  const meta = track.level ? LEVEL_META[track.level as TrackLevel] : undefined;
  const hours = totalHours(track.lessonMinutes ?? 0, track.handsOnMinutes ?? 0, track.estimatedHours);
  const price = track.salePriceCents ?? track.priceCents;
  const onSale = track.salePriceCents != null && track.priceCents != null && track.salePriceCents < track.priceCents;
  const monthly = trackMonthlyCents(track.slug) ?? PLANS.monthly.amount;
  const showPrice = !comingSoon && price != null && (progress === undefined || locked);
  const tag = label ?? (track.level ? levelLabel(t, track.level, track.levelEnd) : null);

  const body = (
    <>
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: track.accentColor }} />
      <div className="flex items-center justify-between gap-1">
        {tag ? (
          <span
            className="truncate rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={meta ? { background: meta.bg, color: readableOn(meta.color, "#EEF2F7") } : { background: "var(--s2)", color: accent }}
          >
            {tag}
          </span>
        ) : <span />}
        {progress !== undefined && !locked ? (
          <span className="shrink-0 text-[11px] font-bold" style={{ color: accent }}>{progress}%</span>
        ) : locked ? (
          <span aria-hidden className="shrink-0 text-xs">🔒</span>
        ) : null}
      </div>
      <h3 className="mt-2 line-clamp-3 text-[14px] font-bold leading-snug text-[var(--ink)]">{track.title}</h3>
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--ink3)]">
        ⏱ {t("learn.tile.hours", { n: hours })}
        {track.lessonCount ? ` · ${t("learn.tile.lessonsLabs", { lessons: track.lessonCount, labs: track.labCount ?? 0 })}` : ""}
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--ink3)]">🏅 {t("learn.tile.certificate")}</p>
      <div className="mt-auto pt-2.5">
        {progress !== undefined && !locked && (
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--s2)]">
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: track.accentColor }} />
          </div>
        )}
        {showPrice && (
          <>
            <p className="text-[13px] font-black text-[var(--ink)]">
              {onSale && <s className="mr-1 text-[11px] font-semibold text-[var(--ink3)]">{fmtPrice(track.priceCents!, locale)}</s>}
              {t("learn.tile.lifetime", { price: fmtPrice(price!, locale) })}
            </p>
            <p className="text-[11px] text-[var(--ink3)]">{t("learn.tile.monthly", { price: fmtPrice(monthly, locale) })}</p>
          </>
        )}
        {comingSoon && (
          <p className="text-[12px] font-bold text-[var(--ink2)]">
            {t("learn.catalog.comingSoon")} · <span style={{ color: accent }}>{t("learn.tile.details")} ›</span>
          </p>
        )}
      </div>
    </>
  );

  const cls = `learn-press relative flex h-full min-h-[11.5rem] w-full flex-col overflow-hidden rounded-2xl border bg-white p-3 pt-3.5 text-left shadow-[0_1px_3px_rgba(13,27,42,0.08)] ${
    highlight ? "border-[var(--orange)] ring-2 ring-[var(--orange)]" : "border-[var(--border)]"
  }`;

  if (!comingSoon) {
    return (
      <Link href={href} className={cls} data-testid={`tile-${track.slug}`}>
        {body}
      </Link>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setSheet(true)} className={cls} data-testid={`tile-${track.slug}`} aria-haspopup="dialog">
        {body}
      </button>
      <BottomSheet open={sheet} onClose={close} title={track.title}>
        <span className="rounded-full bg-[var(--s3)] px-2.5 py-1 text-xs font-semibold text-[var(--ink2)]">{t("learn.catalog.comingSoon")}</span>
        <h2 className="mt-3 pr-10 text-xl font-black leading-snug text-[var(--ink)]">{track.title}</h2>
        {track.tagline && <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{track.tagline}</p>}
        {track.outcomes && track.outcomes.length > 0 && (
          <>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.card.youWillBeAbleTo")}</p>
            <ul className="mt-2 space-y-1.5">
              {track.outcomes.slice(0, 5).map((o) => (
                <li key={o} className="flex gap-2 text-sm leading-relaxed text-[var(--ink2)]">
                  <span aria-hidden className="font-bold" style={{ color: accent }}>✓</span>
                  {o}
                </li>
              ))}
            </ul>
          </>
        )}
        {track.certificateName && <p className="mt-4 text-xs text-[var(--ink3)]">🏅 {track.certificateName}</p>}
        <div className="mt-5">
          <WaitlistForm trackSlug={track.slug} />
        </div>
      </BottomSheet>
    </>
  );
}
