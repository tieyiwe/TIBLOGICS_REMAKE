import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";
import { CASES, pick } from "@/lib/learn/cases/cases";
import { caseLabs } from "@/lib/learn/cases/view";

// The real-case library (lib/learn/cases): illustrative business scenarios
// for every track, each linked to a lab of that track. ?track=<slug> filters.

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.cases.title") };
}

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  const trackSlugs = [...new Set(CASES.map((c) => c.trackSlug))];
  const sources = await loadTrackSources({ slug: { in: trackSlugs }, status: "live" });
  const { texts } = await localizedTracks(sources, locale);
  // Tracks in catalog order; cases of tracks that are not live are not shown.
  const tracks = sources.map((s) => ({ slug: s.slug, title: texts.get(s.slug)?.title ?? s.title }));
  const live = new Set(tracks.map((x) => x.slug));

  const wanted = (await searchParams).track;
  const filter = wanted && live.has(wanted) ? wanted : null;
  const order = new Map(tracks.map((x, i) => [x.slug, i]));
  const shown = CASES.filter((c) => live.has(c.trackSlug) && (!filter || c.trackSlug === filter)).sort(
    (a, b) => (order.get(a.trackSlug) ?? 0) - (order.get(b.trackSlug) ?? 0),
  );
  const labs = await caseLabs(shown, locale);
  const titleOf = new Map(tracks.map((x) => [x.slug, x.title]));

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      active ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--border)] bg-white text-[var(--ink2)] hover:bg-[var(--s2)]"
    }`;

  return (
    <div className="mx-auto max-w-3xl" data-testid="cases-page">
      <h1 className="text-2xl font-black text-[var(--ink)]">
        <span aria-hidden="true">💼 </span>
        {t("learn.cases.title")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.cases.intro")}</p>
      <p className="mt-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-xs leading-relaxed text-[var(--ink2)]" data-testid="cases-disclaimer">
        <span className="font-bold text-[var(--ink)]">{t("learn.cases.illustrative")}.</span> {t("learn.cases.disclaimer")}
      </p>

      <nav aria-label={t("learn.cases.filter")} className="mt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.cases.filter")}</p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href="/learn/cases" className={chip(!filter)} aria-current={!filter ? "page" : undefined} data-testid="cases-filter-all">
              {t("learn.cases.all")}
            </Link>
          </li>
          {tracks.map((x) => (
            <li key={x.slug}>
              <Link
                href={`/learn/cases?track=${encodeURIComponent(x.slug)}`}
                className={chip(filter === x.slug)}
                aria-current={filter === x.slug ? "page" : undefined}
                data-testid={`cases-filter-${x.slug}`}
              >
                {x.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-5 text-xs text-[var(--ink3)]" role="status">
        {t("learn.cases.count", { n: shown.length })}
      </p>

      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink2)]">{t("learn.cases.none")}</p>
      ) : (
        <div className="mt-3 space-y-5">
          {shown.map((c) => {
            const lab = labs.get(c.id);
            return (
              <article
                key={c.id}
                id={c.id}
                data-testid="case-card"
                data-track={c.trackSlug}
                className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-white p-5 target:ring-2 target:ring-[var(--orange)] sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--s2)] px-2.5 py-1 text-[11px] font-bold text-[var(--ink2)]">
                    {t("learn.cases.illustrative")}
                  </span>
                  <span className="text-xs text-[var(--ink3)]">
                    {pick(c.place, locale)} · {pick(c.sector, locale)}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-bold leading-snug text-[var(--ink)]">{pick(c.title, locale)}</h2>
                {titleOf.get(c.trackSlug) && (
                  <p className="mt-1 text-xs text-[var(--ink3)]">
                    <Link href={`/learn/track/${c.trackSlug}`} className="hover:underline">
                      {t("learn.cases.track", { track: titleOf.get(c.trackSlug)! })}
                    </Link>
                  </p>
                )}

                <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.cases.situation")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{pick(c.situation, locale)}</p>

                <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.cases.did")}</h3>
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[var(--ink2)]">
                  {pick(c.steps, locale).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>

                <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.cases.result")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{pick(c.result, locale)}</p>

                <p className="mt-4 text-xs leading-relaxed text-[var(--ink2)]">
                  <span className="font-bold text-[var(--ink)]">{t("learn.cases.skills")}</span> {pick(c.skills, locale)}
                </p>

                {lab && (
                  <Link
                    href={lab.href}
                    data-testid="case-lab-link"
                    className="mt-4 inline-block max-w-full rounded-xl bg-[var(--ink)] px-5 py-2.5 text-xs font-bold text-white hover:opacity-90"
                  >
                    {lab.title ? t("learn.cases.practise", { lab: lab.title }) : t("learn.cases.practiseTrack")} →
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
