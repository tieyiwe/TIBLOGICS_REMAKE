"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { nicePrice } from "@/lib/calculator/engine";
import { unitLabel, warningText } from "@/lib/calculator/summary";
import type { PricingMode } from "@/lib/calculator/types";
import { useCalc, useFmt } from "./context";
import { NumField, Section, Segmented, SliderField, Stat } from "./ui";

export function Warnings({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const f = useFmt();
  const { results } = useCalc();
  const list = results.warnings;
  if (!list.length) {
    return compact ? null : (
      <p className="flex items-start gap-2 rounded-xl border border-[#BFE3C9] bg-[#EEF9F1] px-3.5 py-2.5 font-dm text-sm text-[#166534]">
        <CheckCircle2 size={16} className="shrink-0 mt-0.5" aria-hidden />
        {t("calculator.warn.allGood")}
      </p>
    );
  }
  return (
    <ul className="space-y-2" aria-label={t("calculator.warn.title")}>
      {list.map((w) => {
        const danger = w.level === "danger";
        const Icon = danger ? XCircle : AlertTriangle;
        return (
          <li
            key={w.id}
            className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 font-dm ${compact ? "text-xs" : "text-sm"} ${
              danger ? "border-[#F4C7C3] bg-[#FEF3F2] text-[#912018]" : "border-[#F5D9A8] bg-[#FFF7E6] text-[#7A4A00]"
            }`}
          >
            <Icon size={compact ? 14 : 16} className="shrink-0 mt-0.5" aria-hidden />
            <span>
              <span className="sr-only">{danger ? t("calculator.warn.danger") : t("calculator.warn.caution")}: </span>
              {warningText(w, t, f)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function PricingSection() {
  const t = useT();
  const f = useFmt();
  const { inputs: i, update, results } = useCalc();
  const { m, unit: u } = results;
  const unit = unitLabel(i, t);
  const gm = m.grossMarginPct;
  const gmTone = gm === null ? "default" : gm < 0 ? "bad" : gm < i.targetMarginPct ? "warn" : "good";

  return (
    <Section id="pricing" step={5} title={t("calculator.pricing.title")} subtitle={t("calculator.pricing.subtitle")}>
      <Segmented<PricingMode>
        ariaLabel={t("calculator.pricing.mode")}
        value={i.pricingMode}
        onChange={(v) => update({ pricingMode: v })}
        className="grid-cols-1 sm:grid-cols-3"
        options={(["per_user", "per_account", "usage"] as const).map((mode) => ({
          value: mode,
          label: t(`calculator.pricing.mode.${mode}`),
          sub: t(`calculator.pricing.mode.${mode}Desc`),
        }))}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        <NumField
          label={t("calculator.pricing.price", { unit })}
          tip={t("calculator.pricing.priceTip")}
          prefix="$"
          step={0.5}
          value={i.price}
          onChange={(v) => update({ price: v })}
          hint={
            u.targetPrice ? (
              <button
                type="button"
                onClick={() => update({ price: nicePrice(u.targetPrice ?? 0) })}
                className="text-[#2251A3] font-semibold underline underline-offset-2 no-print"
              >
                {t("calculator.pricing.useSuggested", { price: f.money(nicePrice(u.targetPrice)) })}
              </button>
            ) : undefined
          }
        />
        {i.pricingMode === "per_account" && (
          <NumField
            label={t("calculator.pricing.usersPerAccount")}
            tip={t("calculator.pricing.usersPerAccountTip")}
            value={i.usersPerAccount}
            min={1}
            onChange={(v) => update({ usersPerAccount: Math.max(1, Math.round(v)) })}
            hint={t("calculator.pricing.accountsN", { n: f.num(m.users / Math.max(1, i.usersPerAccount), 1) })}
          />
        )}
        <SliderField label={t("calculator.pricing.paying")} tip={t("calculator.pricing.payingTip")} value={i.payingPct} onChange={(v) => update({ payingPct: v })} min={0} max={100} />
        <SliderField label={t("calculator.pricing.target")} tip={t("calculator.pricing.targetTip")} value={i.targetMarginPct} onChange={(v) => update({ targetMarginPct: v })} min={0} max={95} />
        <SliderField
          label={t("calculator.pricing.heavy")}
          tip={t("calculator.pricing.heavyTip")}
          value={i.heavyUserMultiplier}
          onChange={(v) => update({ heavyUserMultiplier: v })}
          min={1}
          max={20}
          step={0.5}
          suffix="x"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-6">
        <Stat label={t("calculator.pricing.revenue")} value={f.money(m.revenue)} sub={t("calculator.perMonthHint")} />
        <Stat
          label={t("calculator.pricing.grossMargin")}
          value={gm === null ? "-" : f.pct(gm)}
          tone={gmTone}
          sub={t("calculator.pricing.grossMarginSub")}
        />
        <Stat
          label={t("calculator.pricing.profit")}
          value={f.money(m.profit)}
          tone={m.profit < 0 ? "bad" : "default"}
          sub={t("calculator.pricing.profitSub")}
        />
        <Stat label={t("calculator.pricing.contribution")} value={f.moneyPrecise(u.contributionPerUser)} tone={u.contributionPerUser < 0 ? "bad" : "default"} sub={t("calculator.pricing.contributionSub")} />
        <Stat
          label={t("calculator.pricing.breakEven")}
          value={u.breakEvenUsers === null ? t("calculator.na") : f.num(u.breakEvenUsers)}
          sub={
            u.breakEvenAccounts !== null
              ? t("calculator.pricing.breakEvenAccounts", { n: f.num(u.breakEvenAccounts) })
              : t("calculator.pricing.breakEvenSub")
          }
        />
        <Stat
          label={t("calculator.pricing.recover")}
          value={u.monthsToRecoverBuild === null ? t("calculator.na") : t("calculator.pricing.monthsN", { n: f.num(u.monthsToRecoverBuild, 1) })}
          sub={t("calculator.pricing.recoverSub", { amount: f.money0(results.build.likely) })}
        />
      </div>

      <div className="mt-4 rounded-xl border border-[#C9D8EE] bg-[#EEF3FB] p-4">
        <p className="font-syne font-bold text-sm text-[#1B3A6B]">{t("calculator.pricing.suggestedTitle", { target: f.pct(i.targetMarginPct) })}</p>
        {u.targetPrice && u.comfortablePrice ? (
          <p className="font-dm font-bold text-xl sm:text-2xl text-[#0D1B2A] mt-1 tabular-nums">
            {t("calculator.pricing.range", { low: f.money(u.targetPrice), high: f.money(u.comfortablePrice), unit })}
          </p>
        ) : (
          <p className="font-dm text-sm text-[#3A4A5C] mt-1">{t("calculator.pricing.noSuggestion")}</p>
        )}
        <p className="font-dm text-xs text-[#5B6B7F] mt-1">
          {t("calculator.pricing.suggestedNote", { floor: u.breakEvenPrice ? f.money(u.breakEvenPrice) : t("calculator.na"), unit })}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-[#D2DCE8] p-4">
        <p className="font-syne font-bold text-sm text-[#0D1B2A]">{t("calculator.pricing.heavyTitle", { mult: f.num(i.heavyUserMultiplier, 1) })}</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label={t(`calculator.pricing.heavyCost.${i.pricingMode}`)} value={f.money(u.heavyUserCost)} tone={u.heavyUserLoss > 0 ? "bad" : "default"} />
          <Stat label={t("calculator.pricing.heavyPays")} value={f.money(u.heavyUserRevenue)} />
        </div>
      </div>

      <div className="mt-4">
        <Warnings />
      </div>
    </Section>
  );
}
