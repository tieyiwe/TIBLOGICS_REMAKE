"use client";

import { useLocale, useT } from "@/lib/i18n/client";
import { fmtPrice } from "@/lib/learn/format";
import type { SeatTier } from "@/lib/learn/team/config";

/**
 * The team price by size ("2 to 10 seats: $69 per seat", … "51+ seats: $33.97
 * per seat"), with the band that applies to `seats` highlighted. Shown only
 * when volume bands are set.
 */
export default function SeatBands({ seatPriceCents, minSeats, tiers, seats }: { seatPriceCents: number; minSeats: number; tiers: SeatTier[]; seats?: number }) {
  const t = useT();
  const locale = useLocale();
  if (!tiers.length) return null;
  const bands = [{ minSeats, seatPriceCents }, ...tiers.filter((x) => x.minSeats > minSeats)];
  return (
    <div className="rounded-xl bg-[var(--s2)] px-4 py-3 text-sm" data-testid="seat-bands">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.offer.volume")}</p>
      <ul className="mt-1.5 space-y-1">
        {bands.map((b, i) => {
          const next = bands[i + 1];
          const active = seats != null && seats >= b.minSeats && (!next || seats < next.minSeats);
          const price = fmtPrice(b.seatPriceCents, locale);
          return (
            <li
              key={b.minSeats}
              className={`flex flex-wrap justify-between gap-x-3 rounded-md px-2 py-0.5 ${active ? "bg-white font-semibold text-[var(--ink)] ring-1 ring-[var(--orange)]" : "text-[var(--ink2)]"}`}
            >
              <span>{next ? t("team.offer.band.range", { from: b.minSeats, to: next.minSeats - 1 }) : t("team.offer.band.plus", { from: b.minSeats })}</span>
              <span className="tabular-nums">{t("team.offer.band.price", { price })}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
