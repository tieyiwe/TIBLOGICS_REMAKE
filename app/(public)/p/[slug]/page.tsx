import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtNumber } from "@/lib/learn/format";
import { loadPortfolio, publicPortfolioOwner } from "@/lib/learn/method/portfolio";
import PortfolioView from "@/components/learn/method/PortfolioView";
import { cardUrl } from "@/lib/seo/og-card";
import { isScholar } from "@/lib/learn/scholarship/status";
import SkillsRadarCard from "@/components/learn/skills/SkillsRadarCard";
import { loadSkillProfile } from "@/lib/learn/skills/radar";

export const dynamic = "force-dynamic";

// A learner's public Proof-of-Skill Portfolio. Read-only, no sign-in. Only
// shown when the owner made it public, and only what they chose to share:
// first name and last initial, no email, reflections and work text only with
// "include my work samples". Kept out of search engines: it is for the
// people the learner sends the link to.
const load = cache(async (slug: string) => {
  const owner = await publicPortfolioOwner(slug).catch(() => null);
  if (!owner) return null;
  const locale = await getLocale();
  const data = await loadPortfolio(owner.studentId, locale, {
    publicView: true,
    includeWork: owner.settings.includeWork,
    hidden: owner.settings.hidden,
  }).catch(() => null);
  if (!data) return null;
  // The skills radar only when the owner left that section shown.
  const [scholar, skills] = await Promise.all([
    isScholar(owner.studentId),
    owner.settings.hidden.includes("skills") ? Promise.resolve(null) : loadSkillProfile(owner.studentId).catch(() => null),
  ]);
  return { data, settings: owner.settings, scholar, skills };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [t, hit] = await Promise.all([getT(), load(slug)]);
  if (!hit) return { title: t("method.public.notFoundTitle"), robots: { index: false, follow: false } };
  const name = hit.data.displayName;
  const title = t("method.public.metaTitle", { name });
  const description = t("method.public.metaDescription", {
    name,
    labs: hit.data.labs.length,
    certs: hit.data.certificates.length,
    badges: hit.data.badges.length,
  });
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/p/${slug}`,
      siteName: "TIBLOGICS",
      images: [{ url: cardUrl({ title, description, kicker: "Portfolio", brand: "arfa" }), width: 1200, height: 630 }],
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicPortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t, locale, hit] = await Promise.all([getT(), getLocale(), load(slug)]);

  if (!hit) notFound();

  const { data, settings, scholar, skills } = hit;
  return (
    <div className="bg-[var(--s2)] px-4 pb-16 pt-32 sm:pt-44">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl bg-[var(--ink)] p-6 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--orange)]">{t("method.public.eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">{t("method.public.title", { name: data.displayName })}</h1>
          {scholar ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#F9A738]" data-testid="portfolio-scholar">
              ★ {t("learn.scholar.badge")}
            </p>
          ) : null}
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">{t("method.public.intro")}</p>
          <p className="mt-4 text-sm font-bold text-[var(--orange)]">{t("method.portfolio.xp", { n: fmtNumber(data.totalXp, locale) })}</p>
        </header>

        {skills && skills.results > 0 && (
          <div className="mt-8">
            <SkillsRadarCard profile={skills} publicView sharePath={`/p/${slug}`} />
          </div>
        )}

        <div className="mt-8">
          <PortfolioView data={data} publicView hidden={settings.hidden} />
        </div>

        <aside className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
          <p className="text-sm text-[var(--ink2)]">{t("method.public.ctaBody")}</p>
          <Link
            href="/learning-box"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-6 py-3 text-sm font-bold text-[var(--ink)]"
          >
            {t("method.public.cta")} →
          </Link>
        </aside>
      </div>
    </div>
  );
}
