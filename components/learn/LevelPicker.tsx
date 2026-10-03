"use client";

import { useEffect, useState } from "react";
import WhereToStart from "@/components/learn/WhereToStart";
import CertificationLadder from "@/components/learn/CertificationLadder";
import { PLANS } from "@/lib/payments/provider";
import CatalogBrowser from "@/components/learn/CatalogBrowser";
import { LEVEL_SLUGS } from "@/lib/learn/levels";
import type { CatalogTrack } from "@/lib/learn/catalog";
import { useT } from "@/lib/i18n/client";

/**
 * The "find my track" questions, the Basic → Intermediate → Expert ladder and
 * the specialist tracks, together. A recommendation highlights a card where
 * it already sits (the ladder or the specialist grid) and scrolls to it,
 * rather than reordering anything, so the path still reads in order.
 */
export default function LevelPicker({ tracks }: { tracks: CatalogTrack[] }) {
  const t = useT();
  const [recommended, setRecommended] = useState<string | null>(null);
  const core = tracks.filter((x) => LEVEL_SLUGS.has(x.slug));
  const specialists = tracks.filter((x) => !LEVEL_SLUGS.has(x.slug));

  useEffect(() => {
    if (!recommended) return;
    const el = document.getElementById(`track-${recommended}`);
    if (!el) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }), 150);
    return () => window.clearTimeout(id);
  }, [recommended]);

  return (
    <div className="space-y-8">
      <WhereToStart tracks={tracks} onRecommend={setRecommended} />
      <CertificationLadder
        mode="public"
        highlight={recommended}
        monthlyCents={PLANS.monthly.amount}
        tracks={core.map((x) => ({
          slug: x.slug,
          title: x.title,
          accentColor: x.accentColor,
          certificateName: x.certificateName,
          estimatedHours: x.estimatedHours,
          lessonMinutes: x.lessonMinutes,
          handsOnMinutes: x.handsOnMinutes,
          outcomes: x.outcomes,
          moduleCount: x.moduleCount,
          labCount: x.labCount,
          status: x.status,
          priceCents: x.priceCents,
          salePriceCents: x.salePriceCents ?? null,
        }))}
      />
      {specialists.length > 0 && (
        <section aria-labelledby="specialist-heading" className="pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8500A]">{t("learn.box.specialistEyebrow")}</p>
          <h2 id="specialist-heading" className="mt-2 text-2xl font-black text-[var(--ink)] sm:text-3xl">
            {t("learn.box.specialistTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink2)]">{t("learn.box.specialistBody")}</p>
          <div className="mt-6">
            <CatalogBrowser tracks={specialists} recommender={false} filter={specialists.length > 6} highlight={recommended} />
          </div>
        </section>
      )}
    </div>
  );
}
