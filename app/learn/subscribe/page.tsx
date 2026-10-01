import { redirect } from "next/navigation";
import Link from "next/link";
import PlanPicker from "@/components/learn/PlanPicker";
import { getLearnContext } from "@/lib/learn/session";
import { getCatalog } from "@/lib/learn/catalog";
import { PLANS } from "@/lib/payments/provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Metadata } from "next";
import { fmtPrice } from "@/lib/learn/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks, withTrackText } from "@/lib/i18n/sources/learn";
import BuyTrackButton from "@/components/learn/BuyTrackButton";

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
  searchParams: Promise<{ track?: string }>;
}) {
  const { track: trackParam } = await searchParams;
  const { student, entitlement, access } = await getLearnContext();
  if (!student) redirect("/learn/login");

  const [catalog, t, locale] = await Promise.all([getCatalog(), getT(), getLocale()]);
  const { texts } = await localizedTracks(
    locale === "en" ? [] : await loadTrackSources({ slug: { in: catalog.map((c) => c.slug) } }),
    locale,
  );
  const live = catalog.filter((c) => c.status === "live").map((c) => withTrackText(c, texts.get(c.slug)));
  const chosen = trackParam ? live.find((c) => c.slug === trackParam) ?? null : null;
  const owns = (id: string) => access.purchased.includes(id);

  // Every track is already open: only buying a chosen track to keep it
  // forever is left to do here.
  if (access.all && (!chosen || owns(chosen.id))) redirect("/learn");

  const lapsed = entitlement.status === "canceled" || entitlement.status === "past_due";
  const heading = access.all
    ? t("learn.locked.keepForever", { price: fmtPrice(chosen!.priceCents, locale) })
    : access.any
      ? t("learn.subscribe.upgradeTitle")
      : lapsed
        ? t("learn.subscribe.reactivate")
        : t("learn.subscribe.youreIn", { name: student.name.split(" ")[0] });
  const body = access.all
    ? t("learn.locked.keepForeverBody")
    : access.any
      ? t("learn.subscribe.upgradeBody")
      : lapsed
        ? t("learn.subscribe.lapsedBody")
        : t("learn.subscribe.body");
  const others = live.filter((c) => c.id !== chosen?.id);

  return (
    <div className="min-h-screen bg-[var(--s2)] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="block text-center text-lg font-black tracking-tight text-[var(--ink)]">
          TIB<span className="text-[var(--orange)]">LOGICS</span>
          <span className="ml-1.5 text-sm font-semibold text-[var(--ink3)]">Learn</span>
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)] sm:text-3xl">{heading}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--ink2)]">{body}</p>
          {access.any && (
            <p className="mt-3 text-sm">
              <Link href="/learn/tracks" className="font-semibold text-[var(--blue2)] underline">
                {t("learn.subscribe.goToTracks")} →
              </Link>
            </p>
          )}
        </div>

        <div className="mt-10">
          <PlanPicker
            track={chosen ? { slug: chosen.slug, title: chosen.title, priceCents: chosen.priceCents, owned: owns(chosen.id) } : null}
            showSubscribe={!access.all}
          />
        </div>

        {!access.all && others.length > 0 && (
          <section className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-base font-bold text-[var(--ink)]">{t("learn.subscribe.singleTitle")}</h2>
            <p className="mt-1 text-sm text-[var(--ink3)]">{t("learn.subscribe.singleBody")}</p>
            <ul className="mt-4 divide-y divide-[var(--border)]">
              {others.map((c) => (
                <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--ink)]">{c.title}</p>
                    <p className="text-xs text-[var(--ink3)]">
                      {t("learn.offer.trackLine", { price: fmtPrice(c.priceCents, locale) })}
                    </p>
                  </div>
                  {owns(c.id) ? (
                    <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800">
                      ✓ {t("learn.offer.owned")}
                    </span>
                  ) : (
                    <BuyTrackButton slug={c.slug} label={t("learn.offer.track.buy", { price: fmtPrice(c.priceCents, locale) })} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {!access.all && (
          <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-sm font-bold text-[var(--ink)]">
              {t("learn.subscribe.included")} · {t("learn.offer.allLine", { price: fmtPrice(PLANS.monthly.amount, locale) })}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {[1, 2, 3, 4, 5].map((n) => t(`learn.subscribe.item.${n}`)).map((x) => (
                <li key={x} className="flex gap-2.5 text-sm text-[var(--ink2)]">
                  <span aria-hidden="true" className="font-bold text-[var(--orange)]">
                    ✓
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[var(--ink3)]">
          {t("learn.subscribe.notReady")}{" "}
          <Link href="/learning-box" className="underline">
            {t("learn.subscribe.browse")}
          </Link>
        </p>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
