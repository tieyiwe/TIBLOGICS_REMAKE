"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { fmtDate, fmtPrice } from "@/lib/learn/format";
import { TEAM_MAX_SEATS } from "@/lib/learn/team/config";
import { Kpi, call, cls, type DashCtx, type PriceInfo } from "./ui";

/** Owner only: seats, the price per seat, changing seats, Stripe's billing portal. */
export default function BillingTab({
  ctx,
  seatPriceCents,
  pricing,
  aiPool,
  portal,
}: {
  ctx: DashCtx;
  seatPriceCents: number;
  pricing: PriceInfo;
  aiPool: { used: number; limit: number };
  portal: () => void;
}) {
  const t = useT();
  const { team, used, busy, run, locale } = ctx;
  const [seats, setSeats] = useState(team.seats);
  const min = Math.max(pricing.minSeats, used);
  const valid = Number.isInteger(seats) && seats >= min && seats <= TEAM_MAX_SEATS;

  const changeSeats = (e: React.FormEvent) => {
    e.preventDefault();
    void run("seats", async () => {
      await call("/api/learn/team/seats", "POST", { seats });
      return t("team.seats.updated", { n: seats });
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t("team.kpi.seats")} value={`${used} / ${team.seats}`} detail={t(ctx.free === 1 ? "team.dash.free.one" : "team.dash.free.other", { n: ctx.free })} />
        <Kpi label={t("team.billing.perSeat")} value={team.comped ? t("team.teamStatus.comped") : fmtPrice(seatPriceCents, locale)} detail={team.comped ? undefined : t("team.billing.perMonth")} />
        <Kpi label={t("team.billing.monthly")} value={team.comped ? fmtPrice(0, locale) : fmtPrice(seatPriceCents * team.seats, locale)} />
        <Kpi
          label={t("team.billing.renews")}
          value={team.currentPeriodEnd ? fmtDate(team.currentPeriodEnd, locale) : "-"}
          detail={team.cancelAtPeriodEnd ? t("team.billing.endsThen") : undefined}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cls.card} aria-labelledby="seats-title">
          <h2 id="seats-title" className={cls.h2}>{t("team.seats.title")}</h2>
          {team.comped ? (
            <p className={cls.hint}>{t("team.seats.comped", { n: team.seats })}</p>
          ) : (
            <p className={cls.hint}>{t("team.seats.body", { n: team.seats, price: fmtPrice(seatPriceCents, locale), total: fmtPrice(seatPriceCents * team.seats, locale) })}</p>
          )}
          {!team.comped && team.hasBilling ? (
            <>
              <form onSubmit={changeSeats} className="mt-4 flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="seat-count" className={cls.label}>{t("team.seats.label")}</label>
                  <input
                    id="seat-count"
                    type="number"
                    min={min}
                    max={TEAM_MAX_SEATS}
                    value={Number.isFinite(seats) ? seats : ""}
                    onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                    className="mt-1.5 h-10 w-24 rounded-lg border border-[var(--border)] px-3 text-sm font-bold"
                  />
                </div>
                <button type="submit" disabled={busy !== null || seats === team.seats || !valid} className={cls.primary}>
                  {busy === "seats" ? t("team.busy") : t("team.seats.update")}
                </button>
              </form>
              <p className="mt-2 text-sm text-[var(--ink2)]" aria-live="polite">
                {valid
                  ? t("team.billing.newTotal", { n: seats, price: fmtPrice(seatPriceCents, locale), total: fmtPrice(seatPriceCents * seats, locale) })
                  : t("team.offer.minError", { n: min })}
              </p>
              <p className="mt-1 text-xs text-[var(--ink3)]">{t("team.seats.proration", { n: min })}</p>
            </>
          ) : (
            team.comped && <p className="mt-3 text-xs text-[var(--ink3)]">{t("team.api.seatsByStaff")}</p>
          )}
        </section>

        <section className={cls.card} aria-labelledby="billing-title">
          <h2 id="billing-title" className={cls.h2}>{t("team.billing.title")}</h2>
          <p className={cls.hint}>{t("team.billing.body")}</p>
          {team.hasBilling ? (
            <button type="button" onClick={portal} disabled={busy !== null} className={`${cls.btn} mt-4`}>{t("team.billing.portal")}</button>
          ) : (
            <p className="mt-3 text-xs text-[var(--ink3)]">{t("team.api.noBilling")}</p>
          )}
          {pricing.tiers.length > 0 && !team.comped && (
            <div className="mt-5">
              <p className={cls.kicker}>{t("team.offer.volume")}</p>
              <ul className="mt-1 space-y-1 text-sm text-[var(--ink2)]">
                <li>{t("team.offer.tierBase", { n: pricing.minSeats, price: fmtPrice(pricing.seatPriceCents, locale) })}</li>
                {pricing.tiers.map((x) => (
                  <li key={x.minSeats}>{t("team.offer.tierLine", { n: x.minSeats, price: fmtPrice(x.seatPriceCents, locale) })}</li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-[var(--ink3)]">{t("team.billing.tierNote")}</p>
            </div>
          )}
          <p className="mt-5 text-xs text-[var(--ink3)]">
            {t("team.overview.aiLine", { used: aiPool.used, limit: aiPool.limit })} · {t("team.dash.aiPoolHint")}
          </p>
        </section>
      </div>
    </div>
  );
}
