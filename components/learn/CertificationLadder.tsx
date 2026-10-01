"use client";

import Link from "next/link";
import { CERT_LEVELS } from "@/lib/learn/levels";
import { fmtBreakdown, fmtPrice } from "@/lib/learn/format";
import { useLocale, useT } from "@/lib/i18n/client";
import { readableOn } from "@/lib/a11y/contrast";

/**
 * The Basic → Intermediate → Expert path, as three connected steps.
 *
 * Used on the public Learning Box page (no progress) and on the learner's
 * "My tracks" page (with progress and certificates). A level whose track is not
 * live yet renders as "coming soon" rather than disappearing, so the path
 * always reads as three steps.
 */

export interface LadderTrack {
  slug: string;
  title: string;
  accentColor: string;
  certificateName: string;
  estimatedHours: number;
  lessonMinutes?: number;
  handsOnMinutes?: number;
  outcomes?: string[];
  moduleCount?: number;
  labCount?: number;
  status?: string;
  /** One-time price for this track, in cents (shown when given). */
  priceCents?: number;
  /** Learner mode: not unlocked on this account. */
  locked?: boolean;
}

export interface LadderProgress {
  percent: number;
  certified: boolean;
  started: boolean;
}

export default function CertificationLadder({
  tracks,
  progress,
  mode,
  highlight,
  monthlyCents,
}: {
  tracks: LadderTrack[];
  /** All-tracks monthly price; with a track price, both options are shown. */
  monthlyCents?: number;
  progress?: Record<string, LadderProgress>;
  mode: "public" | "learner";
  /** Slug of the level the "find my level" questions recommended. */
  highlight?: string | null;
}) {
  const tr = useT();
  const locale = useLocale();
  const bySlug = new Map(tracks.map((t) => [t.slug, t]));

  return (
    <ol className="relative grid gap-5 lg:grid-cols-3 lg:gap-6">
      {CERT_LEVELS.map((lvl, i) => {
        const t = bySlug.get(lvl.slug);
        const live = !!t && (t.status === undefined || t.status === "live");
        const p = progress?.[lvl.slug];
        // Darkened just enough for AA: it colours text and sits under white text.
        const accent = readableOn(t?.accentColor ?? "#7A8FA6");
        const href = live
          ? mode === "learner"
            ? `/learn/track/${lvl.slug}`
            : `/learning-box/${lvl.slug}`
          : null;

        const name = tr(`learn.certLevel.${lvl.level}.name`);
        const locked = mode === "learner" && !!t?.locked;
        const cta = !live
          ? tr("learn.catalog.comingSoon")
          : locked
            ? tr("learn.locked.unlock")
          : mode === "public"
            ? i === 0
              ? tr("learn.ladder.startHere")
              : tr("learn.ladder.explore", { n: lvl.level })
            : p?.certified
              ? tr("learn.ladder.viewCertificate")
              : p?.started
                ? tr("learn.ladder.continue")
                : tr("learn.ladder.start");

        const Card = (
          <div
            className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-all ${
              live ? "border-[var(--border)] hover:shadow-lg" : "border-dashed border-[var(--border)] opacity-80"
            } ${highlight === lvl.slug ? "shadow-lg ring-2 ring-offset-2" : ""}`}
            style={highlight === lvl.slug ? ({ "--tw-ring-color": accent } as React.CSSProperties) : undefined}
          >
            {highlight === lvl.slug && (
              <span
                className="absolute -top-3 left-6 rounded-full px-3 py-0.5 text-[11px] font-bold text-white shadow"
                style={{ background: accent }}
              >
                {tr("learn.catalog.recommended")}
              </span>
            )}
            <div className="flex items-center justify-between gap-3">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white"
                style={{ background: accent }}
              >
                {tr("learn.ladder.levelTag", { n: lvl.level, name })}
              </span>
              {p?.certified && (
                <span className="rounded-full bg-[#0F6E56]/10 px-2.5 py-1 text-[11px] font-bold text-[#0F6E56]">
                  ✓ {tr("learn.ladder.certified")}
                </span>
              )}
            </div>

            <h3 className="mt-4 text-xl font-black leading-snug text-[var(--ink)]">
              {t?.title ?? name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{tr(`learn.certLevel.${lvl.level}.promise`)}</p>

            {t?.outcomes && t.outcomes.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {t.outcomes.slice(0, 3).map((o) => (
                  <li key={o} className="flex gap-2 text-[13px] leading-snug text-[var(--ink2)]">
                    <span className="mt-[3px] text-xs" style={{ color: accent }}>●</span>
                    {o}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto pt-5">
              <p className="text-xs text-[var(--ink3)]">
                {live && t
                  ? fmtBreakdown(tr, locale, {
                      lessonMinutes: t.lessonMinutes ?? 0,
                      handsOnMinutes: t.handsOnMinutes ?? 0,
                      estimatedHours: t.estimatedHours,
                    })
                  : tr(`learn.certLevel.${lvl.level}.assumes`)}
              </p>
              {live && t && (t.moduleCount || t.labCount) ? (
                <p className="mt-1 text-xs text-[var(--ink3)]">
                  {[
                    t.moduleCount ? tr(`learn.count.modules.${t.moduleCount === 1 ? "one" : "other"}`, { n: t.moduleCount }) : null,
                    t.labCount ? tr(`learn.count.labs.${t.labCount === 1 ? "one" : "other"}`, { n: t.labCount }) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}

              {live && t?.priceCents != null && (mode === "public" || locked) && (
                <div className="mt-3 rounded-xl bg-[var(--s2)] px-3 py-2.5 text-xs leading-snug text-[var(--ink2)]">
                  {locked && <p className="mb-1 font-bold text-[var(--ink)]">🔒 {tr("learn.locked.badge")}</p>}
                  <p className="font-semibold text-[var(--ink)]">{tr("learn.offer.trackLine", { price: fmtPrice(t.priceCents, locale) })}</p>
                  {monthlyCents != null && (
                    <p className="mt-0.5">
                      {tr("learn.offer.orAllLine", { price: fmtPrice(monthlyCents, locale) })}
                    </p>
                  )}
                </div>
              )}

              {mode === "learner" && live && p && !p.certified && !locked && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--s2)]">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${p.percent}%`, background: accent }} />
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--ink3)]">{tr("learn.ladder.percentComplete", { n: p.percent })}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                <span className="min-w-0 truncate text-[11px] font-semibold text-[var(--ink3)]" title={t?.certificateName}>
                  {/* The shared "TIBLOGICS Certified" prefix is dropped here: it
                      is the same on every card and pushed the part that
                      differs off the end of the line. */}
                  {t?.certificateName
                    ? tr("learn.ladder.certificate", { name: t.certificateName.replace(/^TIBLOGICS Certified\s*[—:-]?\s*/, "") })
                    : tr("learn.ladder.certificateOnCompletion")}
                </span>
                <span className="flex-shrink-0 text-sm font-bold" style={{ color: live ? accent : "var(--ink3)" }}>
                  {cta}
                  {live && " →"}
                </span>
              </div>
            </div>
          </div>
        );

        return (
          <li key={lvl.level} id={`track-${lvl.slug}`} className="relative scroll-mt-28">
            {href ? (
              <Link href={href} className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)]">
                {Card}
              </Link>
            ) : (
              Card
            )}
            {/* Connector to the next level */}
            {i < CERT_LEVELS.length - 1 && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-full z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center text-[var(--ink3)] lg:left-full lg:top-1/2 lg:h-6 lg:w-6 lg:-translate-y-1/2 lg:translate-x-0"
              >
                <span className="lg:hidden">↓</span>
                <span className="hidden lg:inline">→</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
