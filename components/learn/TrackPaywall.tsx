import { Lock } from "lucide-react";
import prisma from "@/lib/prisma";
import PlanPicker from "./PlanPicker";
import { PLANS } from "@/lib/payments/provider";
import { trackPriceCents } from "@/lib/learn/pricing";
import { fmtPrice } from "@/lib/learn/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTrack } from "@/lib/i18n/sources/learn";

/**
 * Shown in place of a lesson, quiz, lab, exam or capstone the learner has not
 * unlocked: "Buy this track ($X once) or get all tracks for $89/month".
 * Server component; the buttons start checkout.
 */
export default async function TrackPaywall({ trackId, compact = false }: { trackId: string; compact?: boolean }) {
  const [track, t, locale] = await Promise.all([
    prisma.learnTrack
      .findUnique({ where: { id: trackId }, select: { slug: true, title: true, level: true, priceCents: true, accentColor: true, status: true } })
      .catch(() => null),
    getT(),
    getLocale(),
  ]);
  if (!track) return null;
  const [src] = await loadTrackSources({ id: trackId });
  const title = src && locale !== "en" ? (await localizedTrack(src, locale)).text.title : track.title;
  const price = trackPriceCents(track.level, track.priceCents);
  const forSale = track.status === "live";

  return (
    <section
      className={`mx-auto rounded-2xl border border-[var(--border)] bg-white ${compact ? "p-5 sm:p-6" : "max-w-3xl p-6 sm:p-8"}`}
      aria-labelledby="paywall-title"
    >
      <div className="text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: `${track.accentColor}1A`, color: track.accentColor }}
        >
          <Lock size={22} aria-hidden="true" />
        </span>
        <h2 id="paywall-title" className="mt-3 text-xl font-black text-[var(--ink)]">
          {t("learn.locked.title")}
        </h2>
        <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{title}</p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--ink2)]">
          {t("learn.locked.body", { price: fmtPrice(price, locale), monthly: fmtPrice(PLANS.monthly.amount, locale) })}
        </p>
      </div>
      <div className="mt-6">
        <PlanPicker
          track={forSale ? { slug: track.slug, title, priceCents: price } : null}
        />
      </div>
    </section>
  );
}
