import { redirect } from "next/navigation";
import Link from "next/link";
import PlanPicker from "@/components/learn/PlanPicker";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import { getLearnContext } from "@/lib/learn/session";
import { getCatalog } from "@/lib/learn/catalog";
import { PLANS } from "@/lib/payments/provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Metadata } from "next";
import { fmtPrice } from "@/lib/learn/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks, withTrackText } from "@/lib/i18n/sources/learn";
import BuyTrackButton from "@/components/learn/BuyTrackButton";
import TeamsOffer from "@/components/learn/team/TeamsOffer";
import { getTeamPricing } from "@/lib/learn/team/settings";
import { pageSales, withTrackSales } from "@/lib/promotions/display";
import SalePrice from "@/components/promo/SalePrice";
import PromoBanner from "@/components/promo/PromoBanner";
import PendingEnrollmentCard from "@/components/learn/join/PendingEnrollmentCard";
import ScholarshipCard from "@/components/learn/scholarship/ScholarshipCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.subscribe.metaTitle") };
}

// Sits OUTSIDE the (member) group so a learner without any open track can
// reach it — the member layout would bounce them straight back here.
//
// Two ways in: one track, paid once, kept for life; or every track on the
// monthly subscription. A learner who bought a track can still subscribe, and
// a subscriber can buy a track to keep it (?track=slug).
export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; team?: string; seats?: string }>;
}) {
  const { track: trackParam, team: teamParam, seats: seatsParam } = await searchParams;
  // ?team=1: the Teams option is what they came for (from the public page).
  const wantsTeam = teamParam === "1";
  const { student, entitlement, access } = await getLearnContext();
  if (!student) redirect("/learn/login");

  const [catalog, t, locale, sales] = await Promise.all([getCatalog(), getT(), getLocale(), pageSales()]);
  const { texts } = await localizedTracks(
    locale === "en" ? [] : await loadTrackSources({ slug: { in: catalog.map((c) => c.slug) } }),
    locale,
  );
  // Live automatic sale prices (admin: /admin_pro/promotions), display only.
  const live = withTrackSales(catalog.filter((c) => c.status === "live").map((c) => withTrackText(c, texts.get(c.slug))), sales);
  const chosen = trackParam ? live.find((c) => c.slug === trackParam) ?? null : null;
  const owns = (id: string) => access.purchased.includes(id);

  // Every track is already open: only buying a chosen track to keep it
  // forever is left to do here.
  if (access.all && !wantsTeam && (!chosen || owns(chosen.id))) redirect("/learn");
  const teamPricing = await getTeamPricing();

  const lapsed = entitlement.status === "canceled" || entitlement.status === "past_due";
  const heading = access.all
    ? chosen ? t("learn.locked.keepForever", { price: fmtPrice(chosen.priceCents, locale) }) : t("team.offer.title")
    : access.any
      ? t("learn.subscribe.upgradeTitle")
      : lapsed
        ? t("learn.subscribe.reactivate")
        : t("learn.subscribe.youreIn", { name: student.name.split(" ")[0] });
  const body = access.all
    ? chosen ? t("learn.locked.keepForeverBody") : t("team.offer.subscribedBody")
    : access.any
      ? t("learn.subscribe.upgradeBody")
      : lapsed
        ? t("learn.subscribe.lapsedBody")
        : t("learn.subscribe.body");
  const others = live.filter((c) => c.id !== chosen?.id);

  const levelLabel = (c: (typeof live)[number]) =>
    c.levelEnd && c.levelEnd !== c.level
      ? `${t(`learn.level.${c.level}`)} → ${t(`learn.level.${c.levelEnd}`)}`
      : t(`learn.level.${c.level}`);
  const hoursLabel = (h: number) => t(h === 1 ? "learn.time.hours.one" : "learn.time.hours.other", { n: h });

  // Layout: a short header, then two columns on wide screens. The tracks
  // (the thing people compare) fill the left as a compact grid that fits
  // above the fold; the all-tracks plan and Teams sit in a sticky column on
  // the right. On phones the plan comes first, then the tracks.
  return (
    <div className="min-h-screen bg-[var(--s2)]">
      <PromoBanner variant="inline" />
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/learn" className="inline-block">
              <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
            </Link>
            <Link href="/" className="hidden border-l border-[var(--border)] pl-3 text-xs text-[var(--ink3)] hover:text-[var(--ink)] sm:inline">
              {t("learn.brand.by")} <span className="font-black tracking-tight text-[var(--ink)]">TIB<span className="text-[var(--orange)]">LOGICS</span></span>
            </Link>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-black text-[var(--ink)] sm:text-3xl">{heading}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{body}</p>
          {access.any && (
            <p className="mt-2 text-sm">
              <Link href="/learn/tracks" className="font-semibold text-[var(--blue2)] underline">
                {t("learn.subscribe.goToTracks")} →
              </Link>
            </p>
          )}
        </div>

        {/* One-page join flow: a plan chosen there but not paid yet. */}
        <div className="mt-6 empty:hidden">
          <PendingEnrollmentCard studentId={student.id} />
        </div>

        {/* A scholar with tracks left to choose: the scholarship comes first. */}
        <div className="mt-6 empty:hidden">
          <ScholarshipCard studentId={student.id} variant="nudge" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          {/* Phones: plan, tracks, Teams. Wide screens: tracks on the left, plan
              and Teams stacked on the right. */}
          <aside className="order-1 space-y-4 lg:order-none lg:col-start-2 lg:row-start-1">
            {!access.all && (
              <div>
                <PlanPicker
                  track={null}
                  showSubscribe
                  monthlySale={sales.monthly}
                  // A code typed here may be for one of the tracks in the grid.
                  extraPromoTargets={live.filter((c) => !owns(c.id)).slice(0, 11).map((c) => ({ kind: "track" as const, slug: c.slug }))}
                />
                <ul className="mt-3 space-y-1.5 rounded-2xl border border-[var(--border)] bg-white p-4">
                  {[1, 2, 3, 4, 5].map((n) => t(`learn.subscribe.item.${n}`)).map((x) => (
                    <li key={x} className="flex gap-2 text-xs leading-relaxed text-[var(--ink2)]">
                      <span aria-hidden="true" className="font-bold text-[var(--orange2)]">✓</span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <aside className="order-3 lg:order-none lg:col-start-2 lg:row-start-2">
            <TeamsOffer
              mode="checkout"
              seatPriceCents={teamPricing.seatPriceCents}
              minSeats={teamPricing.minSeats}
              initialSeats={Number(seatsParam) || undefined}
              defaultOpen={wantsTeam}
            />
          </aside>

          {/* Left column: the chosen track (if any), then every track as a compact grid. */}
          <section className="order-2 min-w-0 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1">
            {chosen && !owns(chosen.id) && (
              <div className="mb-6">
                <PlanPicker
                  track={{ slug: chosen.slug, title: chosen.title, priceCents: chosen.priceCents, owned: false, salePriceCents: chosen.salePriceCents }}
                  showSubscribe={false}
                />
              </div>
            )}

            {!access.all && others.length > 0 && (
            <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-bold text-[var(--ink)]">{t(chosen ? "learn.subscribe.singleTitle" : "learn.subscribe.pickTitle")}</h2>
              <p className="text-xs text-[var(--ink3)]">{t("learn.subscribe.singleBody")}</p>
            </div>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {others.map((c) => (
                <li
                  key={c.id}
                  className="flex min-w-0 flex-col rounded-xl border border-[var(--border)] border-t-4 bg-white p-4"
                  style={{ borderTopColor: c.accentColor }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink3)]">
                    {levelLabel(c)} · {hoursLabel(c.estimatedHours)}
                  </p>
                  <Link
                    href={`/learning-box/${c.slug}`}
                    className="mt-1 text-sm font-bold leading-snug text-[var(--ink)] hover:underline"
                  >
                    {c.title}
                  </Link>
                  {c.tagline && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--ink2)]">{c.tagline}</p>}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <div className="min-w-0">
                      {c.salePriceCents != null && c.salePriceCents < c.priceCents ? (
                        <SalePrice sale={{ saleCents: c.salePriceCents, originalCents: c.priceCents }} />
                      ) : null}
                      <p className="text-sm font-black text-[var(--ink)]">
                        {fmtPrice(c.salePriceCents ?? c.priceCents, locale)}{" "}
                        <span className="text-xs font-normal text-[var(--ink3)]">{t("learn.offer.oneTime")}</span>
                      </p>
                    </div>
                    {owns(c.id) ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">✓</span>
                    ) : (
                      <BuyTrackButton slug={c.slug} label={t("learn.subscribe.buyShort")} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
            </>
            )}

            <p className="mt-6 text-xs text-[var(--ink3)]">
              {t("learn.subscribe.notReady")}{" "}
              <Link href="/learning-box" className="underline">
                {t("learn.subscribe.browse")}
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
