"use client";

import { useT } from "@/lib/i18n/client";
import { FEATURE_HOURS, SCOPE_FACTOR } from "@/lib/calculator/engine";
import { BUILD_FEATURES, type Scope } from "@/lib/calculator/types";
import { useCalc, useFmt } from "./context";
import { NumField, PlaceholderNote, Row, Section, Segmented, SliderField, SubHeading, Toggle } from "./ui";

const RATE_PRESETS = [25, 50, 75, 100, 150];

export default function BuildSection() {
  const t = useT();
  const f = useFmt();
  const { inputs: i, update, results } = useCalc();
  const b = results.build;
  const factor = SCOPE_FACTOR[i.scope];
  const hoursText = (h: number) => t("calculator.build.hoursN", { n: f.num(h) });

  return (
    <Section
      id="build"
      step={4}
      title={t("calculator.build.title")}
      subtitle={t("calculator.build.subtitle")}
      footer={
        <div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(["low", "likely", "high"] as const).map((k) => (
              <div key={k} className={`rounded-xl px-1.5 py-3 sm:p-3 ${k === "likely" ? "bg-[#1B3A6B] text-white" : "bg-[#F4F7FB] text-[#0D1B2A]"}`}>
                <p className={`font-dm text-xs ${k === "likely" ? "text-white/80" : "text-[#5B6B7F]"}`}>{t(`calculator.range.${k}`)}</p>
                <p className="font-syne font-bold text-[13px] min-[400px]:text-base sm:text-xl mt-1 tabular-nums whitespace-nowrap">{f.money0(b[k])}</p>
              </div>
            ))}
          </div>
          <p className="font-dm text-xs text-[#5B6B7F] mt-2">{t("calculator.build.rangeNote")}</p>
        </div>
      }
    >
      <Segmented<Scope>
        ariaLabel={t("calculator.build.scope")}
        value={i.scope}
        onChange={(v) => update({ scope: v })}
        className="grid-cols-1 sm:grid-cols-3"
        options={(["prototype", "mvp", "production"] as const).map((s) => ({
          value: s,
          label: t(`calculator.scope.${s}`),
          sub: t(`calculator.scope.${s}Desc`),
        }))}
      />

      <SubHeading>{t("calculator.build.features")}</SubHeading>
      <p className="font-dm text-xs text-[#5B6B7F] -mt-2 mb-3">
        {t("calculator.build.featuresNote", { core: hoursText(b.coreHours) })}
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {BUILD_FEATURES.map((id) => (
          <Toggle
            key={id}
            checked={i.buildFeatures[id]}
            onChange={(v) => update({ buildFeatures: { ...i.buildFeatures, [id]: v } })}
            label={`${t(`calculator.bf.${id}`)} · ${hoursText(Math.round(FEATURE_HOURS[id] * factor))}`}
            description={t(`calculator.bf.${id}Desc`)}
          />
        ))}
      </div>

      <SubHeading>{t("calculator.build.rate")}</SubHeading>
      <div className="grid sm:grid-cols-[200px_1fr] gap-4 items-start">
        <NumField label={t("calculator.build.hourlyRate")} tip={t("calculator.build.hourlyRateTip")} prefix="$" value={i.hourlyRate} onChange={(v) => update({ hourlyRate: v })} max={10_000} hint={t("calculator.perHourHint")} />
        <div>
          <p className="font-dm text-[13px] font-semibold text-[#3A4A5C] mb-1.5">{t("calculator.build.quickRates")}</p>
          <div className="flex flex-wrap gap-2 no-print">
            {RATE_PRESETS.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={i.hourlyRate === r}
                onClick={() => update({ hourlyRate: r })}
                className={`rounded-lg border px-3 py-1.5 font-dm text-sm tabular-nums ${
                  i.hourlyRate === r ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3]"
                }`}
              >
                {f.money0(r)}
              </button>
            ))}
          </div>
          <p className="font-dm text-xs text-[#5B6B7F] mt-2">{t("calculator.build.rateNote")}</p>
        </div>
      </div>

      <SubHeading>{t("calculator.build.extras")}</SubHeading>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <SliderField label={t("calculator.build.design")} tip={t("calculator.build.designTip")} value={i.designPct} onChange={(v) => update({ designPct: v })} min={0} max={50} />
        <SliderField label={t("calculator.build.qa")} tip={t("calculator.build.qaTip")} value={i.qaPct} onChange={(v) => update({ qaPct: v })} min={0} max={50} />
        <div className="space-y-2">
          <Toggle checked={i.securityReview} onChange={(v) => update({ securityReview: v })} label={t("calculator.build.security")} description={t("calculator.build.securityDesc")} />
          {i.securityReview && (
            <NumField label={t("calculator.build.securityHours")} value={i.securityHours} onChange={(v) => update({ securityHours: v })} max={10_000} />
          )}
        </div>
        <NumField
          label={t("calculator.build.compliance")}
          tip={t("calculator.build.complianceTip")}
          prefix="$"
          value={i.complianceCost}
          onChange={(v) => update({ complianceCost: v })}
          hint={t("calculator.build.complianceHint")}
        />
        <SliderField label={t("calculator.build.contingency")} tip={t("calculator.build.contingencyTip")} value={i.contingencyPct} onChange={(v) => update({ contingencyPct: v })} min={0} max={60} />
      </div>

      <div className="mt-6 rounded-xl bg-[#F4F7FB] p-4 space-y-1.5">
        <Row label={`${t("calculator.build.core")} (${hoursText(b.coreHours)})`} value={f.money0(b.coreHours * i.hourlyRate)} />
        {b.features.map((x) => (
          <Row key={x.id} label={`${t(`calculator.bf.${x.id}`)} (${hoursText(x.hours)})`} value={f.money0(x.cost)} />
        ))}
        <Row label={`${t("calculator.build.design")} (${hoursText(b.designHours)})`} value={f.money0(b.designHours * i.hourlyRate)} />
        <Row label={`${t("calculator.build.qa")} (${hoursText(b.qaHours)})`} value={f.money0(b.qaHours * i.hourlyRate)} />
        {b.securityHours > 0 && <Row label={`${t("calculator.build.security")} (${hoursText(b.securityHours)})`} value={f.money0(b.securityHours * i.hourlyRate)} />}
        {b.compliance > 0 && <Row label={t("calculator.build.compliance")} value={f.money0(b.compliance)} />}
        <Row label={t("calculator.build.contingencyLine", { pct: f.pct(i.contingencyPct) })} value={f.money0(b.contingency)} />
        <div className="border-t border-[#D2DCE8] pt-2 mt-2">
          <Row strong label={t("calculator.build.totalLine", { hours: hoursText(b.totalHours) })} value={f.money0(b.likely)} />
        </div>
      </div>
      <div className="mt-3">
        <PlaceholderNote>{t("calculator.build.estimateNote")}</PlaceholderNote>
      </div>
    </Section>
  );
}
