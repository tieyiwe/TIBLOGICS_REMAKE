"use client";

import { useT } from "@/lib/i18n/client";
import type { RunFeature } from "@/lib/calculator/types";
import { useCalc, useFmt } from "./context";
import { NumField, PlaceholderNote, Section, Stat, SubHeading, Toggle } from "./ui";

export default function CostsSection() {
  const t = useT();
  const f = useFmt();
  const { inputs: i, update, results } = useCalc();
  const l = results.m.lines;
  const setFeature = (k: RunFeature, v: boolean) => update({ features: { ...i.features, [k]: v } });
  const perMonth = t("calculator.perMonthShort");

  const nonAi = results.m.total - l.aiPrimary - l.aiRouted - l.embeddings;
  const usageBased = l.voice + l.images + l.messaging + l.storage + l.email;

  return (
    <Section
      id="running"
      step={3}
      title={t("calculator.costs.title")}
      subtitle={t("calculator.costs.subtitle")}
      footer={
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label={t("calculator.costs.nonAi")} value={f.money(nonAi)} />
          <Stat label={t("calculator.costs.usageBased")} value={f.money(usageBased)} />
          <Stat label={t("calculator.costs.fixed")} value={f.money(results.m.fixed)} />
          <Stat label={t("calculator.costs.fees")} value={f.money(l.paymentFees)} />
        </div>
      }
    >
      <PlaceholderNote>{t("calculator.costs.placeholder")}</PlaceholderNote>

      <SubHeading>{t("calculator.costs.features")}</SubHeading>
      <div className="space-y-3">
        <div>
          <Toggle checked={i.features.voice} onChange={(v) => setFeature("voice", v)} label={t("calculator.feature.voice")} description={t("calculator.feature.voiceDesc")} />
          {i.features.voice && (
            <div className="grid sm:grid-cols-3 gap-3 mt-3 pl-1">
              <NumField label={t("calculator.costs.voiceMinutes")} tip={t("calculator.costs.voiceMinutesTip")} value={i.voiceMinutesPerUser} onChange={(v) => update({ voiceMinutesPerUser: v })} max={100_000} />
              <NumField label={t("calculator.costs.stt")} tip={t("calculator.costs.sttTip")} prefix="$" step={0.001} value={i.sttPerMin} onChange={(v) => update({ sttPerMin: v })} max={100} hint={t("calculator.placeholderShort")} />
              <NumField label={t("calculator.costs.tts")} tip={t("calculator.costs.ttsTip")} prefix="$" step={0.001} value={i.ttsPerMin} onChange={(v) => update({ ttsPerMin: v })} max={100} hint={t("calculator.placeholderShort")} />
              <p className="sm:col-span-3 font-dm text-xs text-[#5B6B7F]">{t("calculator.costs.lineTotal", { amount: f.money(l.voice), per: perMonth })}</p>
            </div>
          )}
        </div>
        <div>
          <Toggle checked={i.features.messaging} onChange={(v) => setFeature("messaging", v)} label={t("calculator.feature.messaging")} description={t("calculator.feature.messagingDesc")} />
          {i.features.messaging && (
            <div className="grid sm:grid-cols-3 gap-3 mt-3 pl-1">
              <NumField label={t("calculator.costs.messages")} tip={t("calculator.costs.messagesTip")} value={i.messagesPerUser} onChange={(v) => update({ messagesPerUser: v })} max={1_000_000} />
              <NumField label={t("calculator.costs.messagePrice")} tip={t("calculator.costs.messagePriceTip")} prefix="$" step={0.001} value={i.messagePrice} onChange={(v) => update({ messagePrice: v })} max={100} hint={t("calculator.placeholderShort")} />
              <p className="sm:col-span-3 font-dm text-xs text-[#5B6B7F] self-end">{t("calculator.costs.lineTotal", { amount: f.money(l.messaging), per: perMonth })}</p>
            </div>
          )}
        </div>
        <div>
          <Toggle checked={i.features.images} onChange={(v) => setFeature("images", v)} label={t("calculator.feature.images")} description={t("calculator.feature.imagesDesc")} />
          {i.features.images && (
            <div className="grid sm:grid-cols-3 gap-3 mt-3 pl-1">
              <NumField label={t("calculator.costs.images")} tip={t("calculator.costs.imagesTip")} value={i.imagesPerUser} onChange={(v) => update({ imagesPerUser: v })} max={100_000} />
              <NumField label={t("calculator.costs.imagePrice")} tip={t("calculator.costs.imagePriceTip")} prefix="$" step={0.001} value={i.imagePrice} onChange={(v) => update({ imagePrice: v })} max={100} hint={t("calculator.placeholderShort")} />
              <p className="sm:col-span-3 font-dm text-xs text-[#5B6B7F]">{t("calculator.costs.lineTotal", { amount: f.money(l.images), per: perMonth })}</p>
            </div>
          )}
        </div>
        <div>
          <Toggle checked={i.features.files} onChange={(v) => setFeature("files", v)} label={t("calculator.feature.files")} description={t("calculator.feature.filesDesc")} />
          {i.features.files && (
            <div className="grid sm:grid-cols-3 gap-3 mt-3 pl-1">
              <NumField label={t("calculator.costs.storage")} tip={t("calculator.costs.storageTip")} step={0.1} value={i.storageGbPerUser} onChange={(v) => update({ storageGbPerUser: v })} max={100_000} />
              <NumField label={t("calculator.costs.storagePrice")} tip={t("calculator.costs.storagePriceTip")} prefix="$" step={0.001} value={i.storagePerGb} onChange={(v) => update({ storagePerGb: v })} max={100} hint={t("calculator.placeholderShort")} />
              <p className="sm:col-span-3 font-dm text-xs text-[#5B6B7F]">{t("calculator.costs.lineTotal", { amount: f.money(l.storage), per: perMonth })}</p>
            </div>
          )}
        </div>
      </div>

      <SubHeading>{t("calculator.costs.infra")}</SubHeading>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NumField label={t("calculator.costs.hosting")} tip={t("calculator.costs.hostingTip")} prefix="$" value={i.hosting} onChange={(v) => update({ hosting: v })} hint={t("calculator.perMonthHint")} />
        <NumField label={t("calculator.costs.database")} tip={t("calculator.costs.databaseTip")} prefix="$" value={i.database} onChange={(v) => update({ database: v })} hint={t("calculator.perMonthHint")} />
        <NumField
          label={t("calculator.costs.vectorDb")}
          tip={t("calculator.costs.vectorDbTip")}
          prefix="$"
          value={i.vectorDb}
          onChange={(v) => update({ vectorDb: v })}
          disabled={!i.features.rag}
          hint={i.features.rag ? t("calculator.perMonthHint") : t("calculator.costs.vectorDbOff")}
        />
        <NumField label={t("calculator.costs.monitoring")} tip={t("calculator.costs.monitoringTip")} prefix="$" value={i.monitoring} onChange={(v) => update({ monitoring: v })} hint={t("calculator.perMonthHint")} />
        <NumField label={t("calculator.costs.auth")} tip={t("calculator.costs.authTip")} prefix="$" value={i.auth} onChange={(v) => update({ auth: v })} hint={t("calculator.perMonthHint")} />
      </div>

      <SubHeading>{t("calculator.costs.perUserServices")}</SubHeading>
      <div className="grid sm:grid-cols-3 gap-4">
        <NumField label={t("calculator.costs.emails")} tip={t("calculator.costs.emailsTip")} value={i.emailsPerUser} onChange={(v) => update({ emailsPerUser: v })} max={100_000} />
        <NumField label={t("calculator.costs.emailPrice")} tip={t("calculator.costs.emailPriceTip")} prefix="$" step={0.01} value={i.emailPer1000} onChange={(v) => update({ emailPer1000: v })} max={1000} />
        <NumField label={t("calculator.costs.payment")} tip={t("calculator.costs.paymentTip")} suffix="%" step={0.1} value={i.paymentPct} onChange={(v) => update({ paymentPct: v })} max={50} />
      </div>

      <SubHeading>{t("calculator.costs.people")}</SubHeading>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <NumField label={t("calculator.costs.supportHours")} tip={t("calculator.costs.supportHoursTip")} value={i.supportHours} onChange={(v) => update({ supportHours: v })} max={100_000} hint={t("calculator.perMonthHint")} />
        <NumField label={t("calculator.costs.supportRate")} prefix="$" value={i.supportRate} onChange={(v) => update({ supportRate: v })} max={10_000} hint={t("calculator.perHourHint")} />
        <NumField label={t("calculator.costs.maintenanceHours")} tip={t("calculator.costs.maintenanceHoursTip")} value={i.maintenanceHours} onChange={(v) => update({ maintenanceHours: v })} max={100_000} hint={t("calculator.perMonthHint")} />
        <NumField label={t("calculator.costs.maintenanceRate")} prefix="$" value={i.maintenanceRate} onChange={(v) => update({ maintenanceRate: v })} max={10_000} hint={t("calculator.perHourHint")} />
      </div>
    </Section>
  );
}
