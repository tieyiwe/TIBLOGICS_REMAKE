import Link from "next/link";
import { getT } from "@/lib/i18n/server";

/**
 * The celebratory "You're in" state after a successful payment (?welcome=1,
 * set by the checkout confirm route). Server-rendered; the close link simply
 * drops the query parameter.
 */
export default async function YoureInBanner({
  trackTitle,
  startHref,
  closeHref,
  accent = "var(--orange)",
  lifetime = false,
}: {
  /** Bought this track outright (vs. the all-tracks plan). */
  lifetime?: boolean;
  /** Track bought (or landed on); null for the all-tracks plan on the dashboard. */
  trackTitle: string | null;
  /** Lesson 1 (or the tracks list). */
  startHref: string;
  closeHref: string;
  accent?: string;
}) {
  const t = await getT();
  return (
    <section
      role="status"
      aria-labelledby="youre-in-title"
      data-testid="youre-in"
      className="relative overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-white sm:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30" style={{ background: accent }} />
      <div aria-hidden="true" className="pointer-events-none absolute right-16 top-6 text-4xl">🎉</div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--orange)]">ARFA · AI Readiness For All</p>
      <h2 id="youre-in-title" className="mt-2 pr-10 text-2xl font-black leading-tight sm:text-3xl">
        {t("learn.join.welcome.kicker")}
      </h2>
      <p className="mt-2 max-w-2xl text-base font-semibold text-white/90">
        {trackTitle && lifetime ? t("learn.join.welcome.track", { track: trackTitle }) : t("learn.join.welcome.monthly")}
      </p>
      <p className="mt-1 max-w-2xl text-sm text-white/70">{t("learn.join.welcome.body")}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href={startHref}
          className="inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-6 py-2.5 text-sm font-black text-[var(--ink)] hover:opacity-90"
        >
          {trackTitle ? t("learn.join.welcome.start") : t("learn.join.welcome.tracks")} →
        </Link>
        <Link href={closeHref} className="text-sm text-white/70 underline underline-offset-2 hover:text-white">
          {t("learn.join.welcome.close")}
        </Link>
      </div>
    </section>
  );
}
