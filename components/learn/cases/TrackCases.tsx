import Link from "next/link";
import type { T } from "@/lib/i18n/server";
import { casesForTrack, pick } from "@/lib/learn/cases/cases";

// "Real cases" on a track page: up to three illustrative scenarios from the
// case library (lib/learn/cases), each opening its full write-up.

export default function TrackCases({ t, locale, slug, accent }: { t: T; locale: string; slug: string; accent: string }) {
  const cases = casesForTrack(slug).slice(0, 3);
  if (!cases.length) return null;
  const firstSentence = (s: string) => /^.+?[.!?](\s|$)/.exec(s)?.[0].trim() ?? s;
  return (
    <section data-testid="track-cases" aria-labelledby="track-cases-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="track-cases-heading" className="text-base font-bold text-[var(--ink)]">
          {t("learn.cases.trackHeading")}
        </h2>
        <Link href={`/learn/cases?track=${encodeURIComponent(slug)}`} className="text-xs font-semibold text-[var(--blue2)] underline">
          {t("learn.cases.seeAll")} →
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--ink3)]">{t("learn.cases.trackIntro")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {cases.map((c) => (
          <Link
            key={c.id}
            href={`/learn/cases?track=${encodeURIComponent(slug)}#${c.id}`}
            data-testid="track-case-card"
            className="learn-lift flex flex-col rounded-2xl border border-[var(--border)] bg-white p-5"
          >
            <span className="self-start rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${accent}18`, color: accent }}>
              {t("learn.cases.illustrative")}
            </span>
            <span className="mt-2.5 text-sm font-bold leading-snug text-[var(--ink)]">{pick(c.title, locale)}</span>
            <span className="mt-1 text-xs text-[var(--ink3)]">
              {pick(c.place, locale)} · {pick(c.sector, locale)}
            </span>
            <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--ink2)]">{firstSentence(pick(c.situation, locale))}</span>
            <span className="mt-auto pt-3 text-xs font-bold text-[var(--blue2)]">{t("learn.cases.readCase")} →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
