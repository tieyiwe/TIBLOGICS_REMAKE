import type { Metadata } from "next";
import Link from "next/link";
import LevelPicker from "@/components/learn/LevelPicker";
import Reveal from "@/components/learn/Reveal";
import HowItWorks from "@/components/learn/method/HowItWorks";
import { getCatalog } from "@/lib/learn/catalog";
import { fmtPrice } from "@/lib/learn/format";
import { PLANS, FOUNDING_PRICING } from "@/lib/payments/provider";
import { TRACK_BASE_PRICE_CENTS } from "@/lib/learn/pricing";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks, withTrackText } from "@/lib/i18n/sources/learn";
import TeamsOffer from "@/components/learn/team/TeamsOffer";
import { getTeamPricing } from "@/lib/learn/team/settings";
import { pageSales, withTrackSales } from "@/lib/promotions/display";
import SalePrice from "@/components/promo/SalePrice";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const title = t("learn.box.metaTitle");
  const description = t("learn.box.metaDescription");
  return {
    // Absolute: the brand lockup already names TIBLOGICS.
    title: { absolute: title },
    description,
    // Page-level openGraph/twitter replace the root ones, so keep the image.
    openGraph: { type: "website", url: "/learning-box", siteName: "TIBLOGICS", title, description, images: ["/opengraph-image?v=3"] },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image?v=3"] },
  };
}

export default async function LearningBoxPage() {
  const [catalog, locale, t, teamPricing, sales] = await Promise.all([getCatalog(), getLocale(), getT(), getTeamPricing(), pageSales()]);
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
    <div className="bg-[var(--s2)]">
      {/* Hero */}
      {/* pt clears the fixed Nav (5.5rem tall, 7.5rem from sm up) — without it
          the white header sits on top of the eyebrow and headline. */}
      <section className="bg-[var(--ink)] px-4 pb-16 pt-32 text-white sm:pb-20 sm:pt-44">
        <div className="learn-hero mx-auto max-w-6xl">
          {/* ARFA is the TIBLOGICS AI Academy platform: the brand is the headline. */}
          <h1
            className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl"
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
          <p
            className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-[var(--orange)]"
            style={{ "--stagger-index": 1 } as React.CSSProperties}
          >
            AI Readiness For All
          </p>
          <p
            className="mt-6 max-w-3xl text-xl font-bold leading-snug sm:text-2xl"
            style={{ "--stagger-index": 1 } as React.CSSProperties}
          >
            {t("learn.box.heroTitle")}
          </p>
          <p
            className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg"
            style={{ "--stagger-index": 2 } as React.CSSProperties}
          >
            {t("learn.box.heroBody")}
          </p>
          <div
            className="mt-8 flex flex-wrap items-center gap-4"
            style={{ "--stagger-index": 3 } as React.CSSProperties}
          >
            <Link
              href="/learn/signup"
              className="rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-7 py-3.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
            >
              {t("learn.cta.startLearning")}
            </Link>
            <p className="text-sm text-white/60">
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

      {/* Team plans: seats for a company */}
      <div className="mx-auto max-w-6xl px-4 py-14">
        <TeamsOffer mode="link" seatPriceCents={teamPricing.seatPriceCents} minSeats={teamPricing.minSeats} />
      </div>
    </div>
  );
}
