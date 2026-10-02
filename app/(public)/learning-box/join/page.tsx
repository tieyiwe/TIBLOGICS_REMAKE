import type { Metadata } from "next";
import Link from "next/link";
import JoinFlow, { type JoinTrack } from "@/components/learn/join/JoinFlow";
import HelpWidget from "@/components/learn/support/HelpWidget";
import { getCatalog } from "@/lib/learn/catalog";
import { getAccess, getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks, withTrackText } from "@/lib/i18n/sources/learn";
import { pageSales, withTrackSales } from "@/lib/promotions/display";
import { getTeamPricing } from "@/lib/learn/team/settings";
import { FOUNDING_PRICING, PLANS } from "@/lib/payments/provider";
import { googleLoginEnabled } from "@/lib/learn/google-auth";
import { choiceOf, getPendingChoice } from "@/lib/learn/join/pending";
import { cleanPromoCode, parseChoice } from "@/lib/learn/join/choice";
import { pageMetadata } from "@/lib/seo/meta";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return {
    ...pageMetadata({ path: "/learning-box/join", locale, title: t("learn.join.metaTitle"), description: t("learn.join.metaDescription") }),
    // A checkout step: reachable from every buy button, not a search result.
    robots: { index: false, follow: true },
  };
}

// The one-page "Join ARFA" flow: choose, create the account and pay without
// leaving the page (components/learn/join/JoinFlow.tsx). Server-rendered with
// live prices (automatic sales included); the form is the only client island.
export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; plan?: string; team?: string; seats?: string; code?: string; go?: string; checkout?: string }>;
}) {
  const sp = await searchParams;
  const [catalog, t, locale, sales, teamPricing, student] = await Promise.all([
    getCatalog(),
    getT(),
    getLocale(),
    pageSales(),
    getTeamPricing(),
    getStudent(),
  ]);
  const [access, pending] = student ? await Promise.all([getAccess(student.id), getPendingChoice(student.id)]) : [null, null];

  const liveCatalog = catalog.filter((c) => c.status === "live");
  const { texts } = await localizedTracks(
    locale === "en" ? [] : await loadTrackSources({ slug: { in: liveCatalog.map((c) => c.slug) } }),
    locale,
  );
  const live = withTrackSales(liveCatalog.map((c) => withTrackText(c, texts.get(c.slug))), sales);
  const levelLabel = (c: (typeof live)[number]) =>
    c.levelEnd && c.levelEnd !== c.level ? `${t(`learn.level.${c.level}`)} → ${t(`learn.level.${c.levelEnd}`)}` : t(`learn.level.${c.level}`);
  const tracks: JoinTrack[] = live.map((c) => ({
    slug: c.slug,
    title: c.title,
    tagline: c.tagline,
    meta: `${levelLabel(c)} · ${t(c.estimatedHours === 1 ? "learn.time.hours.one" : "learn.time.hours.other", { n: c.estimatedHours })}`,
    accentColor: c.accentColor,
    priceCents: c.priceCents,
    saleCents: c.salePriceCents,
    owned: !!access && access.purchased.includes(c.id),
  }));

  // ?track / ?plan / ?team first; else what this learner chose last time.
  const fromUrl = parseChoice(sp);
  const initial = fromUrl ?? (pending ? choiceOf(pending) : null);
  const initialCode = cleanPromoCode(sp.code) ?? (fromUrl ? null : pending?.promoCode ?? null);
  const first = student?.name.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-[var(--s2)]">
      {/* pt clears the fixed site Nav (see /learning-box). */}
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-28 sm:pt-36">
        <nav aria-label={t("learn.join.crumbs")} className="text-xs text-[var(--ink3)]">
          <Link href="/learning-box" className="hover:text-[var(--ink)] hover:underline">
            ARFA · {t("learn.brand.academy")}
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{t("learn.join.crumb")}</span>
        </nav>
        <header className="mt-2 max-w-3xl">
          <h1 className="text-2xl font-black leading-tight text-[var(--ink)] sm:text-3xl">
            {student ? t("learn.join.titleSignedIn", { name: first }) : t("learn.join.title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)] sm:text-base">
            {student ? t("learn.join.introSignedIn") : t("learn.join.intro")}
          </p>
          <ol className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-[var(--ink2)]" aria-label={t("learn.join.stepsLabel")}>
            {[t("learn.join.step1"), t("learn.join.step2"), t("learn.join.step3")].map((s, i) => (
              <li key={s} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)] text-[10px] font-black text-white">
                  {i + 1}
                </span>
                {s}
                {i === 1 && student ? <span className="text-green-700">✓</span> : null}
              </li>
            ))}
          </ol>
        </header>

        <div className="mt-6">
          <JoinFlow
            tracks={tracks}
            monthly={{
              cents: PLANS.monthly.amount,
              sale: sales.monthly,
              compareAtCents: PLANS.monthly.compareAtAmount ?? null,
              founding: FOUNDING_PRICING,
              active: !!access?.all,
            }}
            team={{ seatPriceCents: teamPricing.seatPriceCents, minSeats: teamPricing.minSeats, tiers: teamPricing.tiers }}
            initial={initial}
            initialCode={initialCode}
            autoGo={sp.go === "1" && !!student}
            cancelled={sp.checkout === "cancelled"}
            student={student ? { name: student.name, email: student.email } : null}
            google={!student && googleLoginEnabled()}
          />
        </div>
        {/* "Need help?" (bottom left here, clear of the site chat button). */}
        <HelpWidget place="public" />
      </div>
    </div>
  );
}
