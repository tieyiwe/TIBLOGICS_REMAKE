import type { Metadata } from "next";
import Link from "next/link";
import LevelPicker from "@/components/learn/LevelPicker";
import Reveal from "@/components/learn/Reveal";
import HowItWorks from "@/components/learn/method/HowItWorks";
import { getCatalog } from "@/lib/learn/catalog";
import { getStudent } from "@/lib/learn/session";
import { fmtPrice } from "@/lib/learn/format";
import { PLANS, FOUNDING_PRICING } from "@/lib/payments/provider";
import { TRACK_BASE_PRICE_CENTS } from "@/lib/learn/pricing";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks, withTrackText } from "@/lib/i18n/sources/learn";
import TeamsOffer from "@/components/learn/team/TeamsOffer";
import ScholarSeal from "@/components/learn/scholarship/ScholarSeal";
import { DonateSection } from "@/components/donate/Donate";
import { getTeamPricing } from "@/lib/learn/team/settings";
import { pageSales, withTrackSales } from "@/lib/promotions/display";
import SalePrice from "@/components/promo/SalePrice";
import { pageMetadata } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { FaqBlock, KeyTakeaways } from "@/components/seo/AnswerBlocks";
import { academyFaq, academySummary, academyTakeaways } from "@/lib/seo/academy";
import { arfaNode, breadcrumbNode, itemListNode } from "@/lib/seo/jsonld";
import { ARFA_OG_IMAGE } from "@/lib/seo/site";
import Testimonials from "@/components/reviews/Testimonials";
import { learnAlternates, learnLangParam, learnLangPath } from "@/lib/seo/learn-lang";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

/** ?lang=fr is the French page (lib/seo/learn-lang.ts); otherwise the visitor's language. */
async function pageLocale(searchParams: Props["searchParams"]) {
  const [lang, siteLocale] = await Promise.all([searchParams.then((p) => learnLangParam(p.lang)), getLocale()]);
  return { lang, locale: lang ?? siteLocale, siteLocale };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ lang, locale }, catalog] = await Promise.all([pageLocale(searchParams), getCatalog()]);
  const t = translatorFor(locale);
  // The lowest one-time price, from the same catalog the page lists.
  const live = catalog.filter((c) => c.status === "live");
  const from = live.length ? Math.min(...live.map((c) => c.priceCents)) : 0;
  return pageMetadata({
    path: learnLangPath("/learning-box", lang),
    // The page's interface is translated in both languages, so both URLs are
    // real pages from the start (track texts follow as they are translated).
    languages: learnAlternates("/learning-box"),
    markdown: "/learning-box.md",
    locale,
    // Absolute: the title already names ARFA.
    title: t("seo.meta.arfa.title"),
    absoluteTitle: true,
    description: live.length ? t("seo.meta.arfa.description", { n: live.length, from: fmtPrice(from, locale) }) : t("learn.box.metaDescription"),
    // The academy's own preview, not the main site's.
    image: ARFA_OG_IMAGE,
  });
}

export default async function LearningBoxPage({ searchParams }: Props) {
  const [catalog, { lang, locale, siteLocale }, teamPricing, sales, student] = await Promise.all([getCatalog(), pageLocale(searchParams), getTeamPricing(), pageSales(), getStudent()]);
  const t = translatorFor(locale);
  const { texts, pending } = await localizedTracks(
    locale === "en" ? [] : await loadTrackSources({ slug: { in: catalog.map((c) => c.slug) } }),
    locale,
  );
  // Live automatic sale (admin: /admin_pro/promotions), read on the server.
  const tracks = withTrackSales(catalog.map((c) => withTrackText(c, texts.get(c.slug))), sales);
  const brand = t("learn.box.heroBrand");
  const monthly = PLANS.monthly;
  // The lowest one-time price among the tracks on sale.
  const onSale = tracks.filter((x) => x.status === "live").map((x) => x.salePriceCents ?? x.priceCents);
  const fromCents = onSale.length ? Math.min(...onSale) : TRACK_BASE_PRICE_CENTS;
  // Takeaways and FAQ: the facts people ask AI assistants about ARFA, from
  // the same catalog and prices this page shows (lib/seo/academy.ts).
  const money = (c: number) => fmtPrice(c, locale);
  const summary = await academySummary(tracks, sales.monthly?.saleCents ?? monthly.amount, teamPricing);

  const approach = [
    { l: t("learn.certLevel.1.name"), t: t("learn.box.approach.1.title"), d: t("learn.box.approach.1.body") },
    { l: t("learn.certLevel.2.name"), t: t("learn.box.approach.2.title"), d: t("learn.box.approach.2.body") },
    { l: t("learn.certLevel.3.name"), t: t("learn.box.approach.3.title"), d: t("learn.box.approach.3.body") },
  ];
  const includes = [1, 2, 3, 4, 5].map((n) => ({
    n: `0${n}`,
    t: t(`learn.box.includes.${n}.title`),
    d: t(`learn.box.includes.${n}.body`),
  }));

  return (
    // lang: the root <html lang> follows the visitor's cookie and cannot see
    // ?lang=, so the French page marks its own content as French.
    <div className="bg-[var(--s2)]" lang={lang ?? undefined}>
      {/* Hero */}
      {/* pt clears the fixed Nav (5.5rem tall, 7.5rem from sm up) — without it
          the white header sits on top of the eyebrow and headline. */}
      <section className="bg-[var(--ink)] px-4 pb-12 pt-32 text-white sm:pb-14 sm:pt-44">
        <div className="learn-hero mx-auto max-w-6xl">
          {/* ARFA is the TIBLOGICS AI Academy platform: the brand is the headline,
              on one line from tablet width up. */}
          <h1
            className="text-3xl font-black leading-tight sm:text-4xl md:whitespace-nowrap lg:text-5xl"
            style={{ "--stagger-index": 0 } as React.CSSProperties}
          >
            {brand.startsWith("ARFA") ? (
              <>
                AR<span className="text-[var(--orange)]">FA</span>
                {brand.slice(4)}
              </>
            ) : (
              brand
            )}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ "--stagger-index": 1 } as React.CSSProperties}>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--orange)]">AI Readiness For All</p>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-black text-[var(--ink)]"
              data-testid="arfa-online-badge"
            >
              <span aria-hidden="true">🌐</span>
              {t("learn.box.online")}
            </span>
          </div>
          {/* A crawlable link to the French page (and a shortcut for people). */}
          {locale !== "fr" && (
            <p className="mt-2 text-sm">
              <Link href={learnLangPath("/learning-box", "fr")} hrefLang="fr" className="text-white/60 underline-offset-2 hover:text-white hover:underline">
                {t("seo.lang.alsoIn")} <span lang="fr">Français</span>
              </Link>
            </p>
          )}
          {/* The French URL opened by someone whose site language is not French. */}
          {lang === "fr" && siteLocale !== "fr" && (
            <p className="mt-2 text-sm">
              <Link href="/learning-box" hrefLang="en" className="text-white/60 underline-offset-2 hover:text-white hover:underline">
                {t("seo.lang.alsoIn")} <span lang="en">English</span>
              </Link>
            </p>
          )}

          {/* Left: the offer and the weekly live sessions. Right: the key
              takeaways, so the tracks start higher up the page. */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
            <div className="min-w-0">
              <div
                className="flex items-start gap-3 rounded-2xl border-2 border-[var(--orange)] bg-[var(--orange)]/10 px-4 py-3.5 sm:max-w-xl"
                style={{ "--stagger-index": 1 } as React.CSSProperties}
                data-testid="live-sessions-badge"
              >
                <span className="relative mt-1.5 flex h-3 w-3 shrink-0" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#22C55E]" />
                </span>
                <span>
                  <span className="block text-base font-black text-white sm:text-lg">{t("learn.box.liveTitle")}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-white/80">{t("learn.box.liveBody")}</span>
                </span>
              </div>
              <p
                className="mt-6 max-w-3xl text-xl font-bold leading-snug sm:text-2xl"
                style={{ "--stagger-index": 1 } as React.CSSProperties}
              >
                {t("learn.box.heroTitle")}
              </p>
              <p
                className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg"
                style={{ "--stagger-index": 2 } as React.CSSProperties}
              >
                {t("learn.box.heroBody")}
              </p>
              <div
                className="mt-7 flex flex-wrap items-center gap-4"
                style={{ "--stagger-index": 3 } as React.CSSProperties}
              >
                <Link
                  data-track="cta-start-learning"
                  href="/learning-box/join"
                  className="rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-7 py-3.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
                >
                  {t("learn.cta.startLearning")}
                </Link>
                <Link
                  href="/learning-box/join?team=1"
                  className="rounded-full border border-white/40 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  data-testid="hero-teams-cta"
                >
                  {t("learn.box.teamsCta", { price: fmtPrice(Math.min(teamPricing.seatPriceCents, ...teamPricing.tiers.map((x) => x.seatPriceCents)), locale) })}
                </Link>
                <p className="basis-full text-sm text-white/60">
                  {FOUNDING_PRICING && (
                    <span className="mr-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-[var(--orange)]">
                      {t("learn.billing.foundingRate")}
                    </span>
                  )}
                  {sales.monthly ? <SalePrice sale={sales.monthly} recurring tone="dark" className="mr-2" /> : null}
                  <strong className="text-white">{t("learn.price.perMonth", { price: fmtPrice(sales.monthly?.saleCents ?? monthly.amount, locale) })}</strong>{" "}
                  {t("learn.box.heroPriceTail", { from: fmtPrice(fromCents, locale) })}
                </p>
              </div>
              {/* Returning learners: one click to their tracks. */}
              <div
                className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-5 text-sm"
                style={{ "--stagger-index": 3 } as React.CSSProperties}
                data-testid="hero-signin"
              >
                {student ? (
                  <>
                    <span className="text-white/70">{t("learn.box.welcomeBack", { name: student.name.split(" ")[0] })}</span>
                    <Link href="/learn" className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 font-bold text-[var(--ink)] hover:bg-white/90">
                      {t("learn.box.continueLearning")} →
                    </Link>
                  </>
                ) : (
                  <>
                    <span className="text-white/70">{t("learn.box.haveAccount")}</span>
                    <Link href="/learn/login" className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 font-bold text-[var(--ink)] hover:bg-white/90">
                      {t("learn.nav.signIn")} →
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div style={{ "--stagger-index": 2 } as React.CSSProperties}>
              <KeyTakeaways title={t("seo.takeaways")} items={academyTakeaways(t, summary, money)} />
            </div>
          </div>
        </div>
      </section>

      {pending && (
        <p role="status" className="mx-auto mt-6 max-w-6xl px-4 text-xs text-[var(--ink3)]">
          {t("common.translationPending")}
        </p>
      )}

      {/* The certification path, the specialist tracks, and the questions
          that point at one of them */}
      <section id="path" className="mx-auto max-w-6xl scroll-mt-32 px-4 pt-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8500A]">{t("learn.box.pathEyebrow")}</p>
        <h2 className="mt-2 text-2xl font-black text-[var(--ink)] sm:text-3xl">{t("learn.box.pathTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink2)]">{t("learn.box.pathBody")}</p>
        <div className="mt-8">
          <LevelPicker tracks={tracks} />
        </div>
      </section>

      {/* Systems thinking */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="grid gap-8 rounded-3xl bg-[var(--ink)] p-8 text-white sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--orange)]">{t("learn.box.approachEyebrow")}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{t("learn.box.approachTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{t("learn.box.approachBody")}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {approach.map((x) => (
              <li key={x.l} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--orange)]">{x.l}</p>
                <p className="mt-1 text-sm font-bold">{x.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{x.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How ARFA works: the Learning Loop, Daily Review, Portfolio */}
      <HowItWorks />

      {tracks.length === 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-12 text-center">
            <h2 className="text-lg font-bold text-[var(--ink)]">{t("learn.box.emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink2)]">
              {t("learn.box.emptyBody")}{" "}
              <Link href="/contact" className="font-semibold text-[var(--blue2)] underline">
                {t("learn.box.emptyContact")}
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* What every track includes */}
      <section className="mt-14 border-t border-[var(--border)] bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-[var(--ink)]">{t("learn.box.includesTitle")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {includes.map((x, i) => (
              <Reveal key={x.n} delay={i * 80}>
                <div className="learn-lift h-full rounded-2xl border border-[var(--border)] p-6">
                  <span className="text-xs font-black text-[#B8500A]">{x.n}</span>
                  <h3 className="mt-2 text-base font-bold text-[var(--ink)]">{x.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{x.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Real ARFA learner reviews, approved by staff. Nothing renders until one is. */}
      <Testimonials scope="arfa" locale={locale} />

      {/* Team plans: seats for a company */}
      <div className="mx-auto max-w-6xl px-4 py-14">
        <TeamsOffer mode="link" seatPriceCents={teamPricing.seatPriceCents} minSeats={teamPricing.minSeats} />
        {/* The Tilo Vision Scholarship (/tilo-vision-scholarship) */}
        <Link
          href="/tilo-vision-scholarship"
          className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-[#F4C9A0] bg-gradient-to-r from-[#FFFBF6] to-white p-5 hover:border-[#F47C20]"
          data-testid="academy-scholarship"
        >
          <ScholarSeal size={48} />
          <span className="min-w-0 flex-1">
            <span className="block font-black text-[var(--ink)]">{t("learn.scholarApply.promo.title")}</span>
            <span className="block text-sm text-[var(--ink2)]">{t("learn.scholarApply.promo.body")}</span>
          </span>
          <span className="text-sm font-bold text-[var(--orange2)]">{t("learn.scholarApply.cta")} →</span>
        </Link>
        <div className="mt-4">
          <DonateSection from="arfa" />
        </div>
      </div>

      {/* FAQ: visible answers, repeated as FAQPage structured data */}
      <div className="mx-auto max-w-4xl px-4 pb-16">
        <FaqBlock title={t("seo.faq")} path={learnLangPath("/learning-box", lang)} items={academyFaq(t, summary, money)} />
      </div>
      <JsonLd
        data={[
          arfaNode(),
          itemListNode({
            name: t("learn.box.metaTitle"),
            path: "/learning-box",
            items: tracks.filter((x) => x.status === "live").map((x) => ({ url: `/learning-box/${x.slug}`, name: x.title })),
          }),
          breadcrumbNode([
            { name: t("seo.home"), path: "/" },
            { name: t("seo.academy"), path: learnLangPath("/learning-box", lang) },
          ]),
        ]}
      />
    </div>
  );
}
