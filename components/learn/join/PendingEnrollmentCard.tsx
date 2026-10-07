import Link from "next/link";
import prisma from "@/lib/prisma";
import { getT, getLocale } from "@/lib/i18n/server";
import { fmtPrice } from "@/lib/learn/format";
import { trackPriceCents } from "@/lib/learn/pricing";
import { PLANS } from "@/lib/payments/provider";
import { canAccessTrack, getAccess } from "@/lib/learn/session";
import { trackMonthlyCents } from "@/lib/learn/track-monthly";
import { choiceOf, getPendingChoice } from "@/lib/learn/join/pending";
import { joinPath } from "@/lib/learn/join/choice";
import { pageSales } from "@/lib/promotions/display";
import DismissPendingButton from "./DismissPendingButton";

/**
 * "Finish your enrolment": the plan a learner chose on the one-page join
 * flow and did not pay for yet, with a one-click way back to payment.
 * Renders nothing when there is no such choice, or when it is already
 * covered by the learner's access (bought another way).
 */
export default async function PendingEnrollmentCard({ studentId }: { studentId: string }) {
  const row = await getPendingChoice(studentId);
  const choice = row ? choiceOf(row) : null;
  if (!row || !choice) return null;
  const [t, locale, access, sales] = await Promise.all([getT(), getLocale(), getAccess(studentId), pageSales()]);

  let label: string;
  if (choice.kind === "track") {
    const track = await prisma.learnTrack
      .findUnique({ where: { slug: choice.slug }, select: { id: true, title: true, titleFr: true, level: true, priceCents: true, status: true } })
      .catch(() => null);
    if (!track || track.status !== "live" || access.purchased.includes(track.id)) return null;
    const price = trackPriceCents(track.level, track.priceCents);
    const sale = sales.track(track.id, price)?.saleCents ?? price;
    label = t("learn.join.choice.track", { track: (locale === "fr" && track.titleFr) || track.title, price: fmtPrice(sale, locale) });
  } else if (choice.kind === "monthly" && trackMonthlyCents(choice.track) != null) {
    // A track sold on its own monthly plan.
    const track = await prisma.learnTrack
      .findUnique({ where: { slug: choice.track as string }, select: { id: true, title: true, titleFr: true, status: true } })
      .catch(() => null);
    if (!track || track.status !== "live" || canAccessTrack(access, track.id)) return null;
    label = t("learn.join.choice.trackMonthly", { track: (locale === "fr" && track.titleFr) || track.title, price: fmtPrice(trackMonthlyCents(choice.track) as number, locale) });
  } else if (choice.kind === "monthly") {
    if (access.all) return null;
    label = t("learn.join.choice.monthly", { price: fmtPrice(sales.monthly?.saleCents ?? PLANS.monthly.amount, locale) });
  } else {
    if (access.entitlement.team?.role === "owner") return null;
    label = t("learn.join.choice.team", { n: Math.max(1, choice.seats) });
  }

  return (
    <section
      aria-labelledby="pending-enrolment-title"
      className="rounded-2xl border-2 border-[var(--orange)] bg-[#FFF8F1] p-5 sm:p-6"
      data-testid="pending-enrolment"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-[#B8500A]">{t("learn.join.resume.kicker")}</p>
      <h2 id="pending-enrolment-title" className="mt-1 text-lg font-black text-[var(--ink)]">
        {t("learn.join.resume.title")}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">
        {t("learn.join.resume.body", { choice: label })}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={joinPath(choice, { go: choice.kind !== "team", code: row.promoCode })}
          className="inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-6 py-2.5 text-sm font-black text-[var(--ink)] hover:opacity-90"
        >
          {t("learn.join.resume.cta")} →
        </Link>
        <Link href={joinPath(choice, { code: row.promoCode })} className="text-sm font-semibold text-[var(--ink2)] underline underline-offset-2">
          {t("learn.join.resume.change")}
        </Link>
        <DismissPendingButton label={t("learn.join.resume.dismiss")} />
      </div>
    </section>
  );
}
