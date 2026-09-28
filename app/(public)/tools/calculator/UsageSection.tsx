"use client";

import { useId, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { CLAUDE_MODELS, PRICES_AS_OF, PRICING_URL, type ModelId } from "@/lib/calculator/pricing";
import { useCalc, useFmt } from "./context";
import { Field, InfoTip, NumField, Section, SliderField, Stat, SubHeading, Toggle, inputCls, labelCls } from "./ui";

/** Roughly 750 English words per 1,000 tokens. */
const WORDS_PER_TOKEN = 0.75;

export default function UsageSection() {
  const t = useT();
  const f = useFmt();
  const { inputs: i, update, results } = useCalc();
  const ai = results.m.ai;
  const [showTokens, setShowTokens] = useState(false);
  const [words, setWords] = useState(500);
  const routeId = useId();

  const modelOptions = [...CLAUDE_MODELS.map((m) => m.id), "custom" as const];
  const optimizations = ai.listTotal - ai.total;

  return (
    <Section
      id="usage"
      step={2}
      title={t("calculator.usage.title")}
      subtitle={t("calculator.usage.subtitle")}
      footer={
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label={t("calculator.usage.aiMonthly")} value={f.money(ai.total)} />
          <Stat label={t("calculator.usage.perUser")} value={f.moneyPrecise(results.m.users > 0 ? ai.total / results.m.users : 0)} />
          <Stat label={t("calculator.usage.perInteraction")} value={f.moneyPrecise(ai.perInteraction)} />
          <Stat
            label={t("calculator.usage.tokensMonth")}
            value={f.compact(ai.inputTokens + ai.outputTokens)}
            sub={optimizations > 0.5 ? t("calculator.usage.savedBy", { amount: f.money(optimizations) }) : undefined}
          />
        </div>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <NumField
          label={t("calculator.usage.users")}
          tip={t("calculator.usage.usersTip")}
          value={i.users}
          onChange={(v) => update({ users: Math.round(v) })}
          max={100_000_000}
        />
        <NumField
          label={t("calculator.usage.interactions")}
          tip={t("calculator.usage.interactionsTip")}
          value={i.interactionsPerUser}
          onChange={(v) => update({ interactionsPerUser: v })}
          max={100_000}
          hint={t("calculator.usage.interactionsTotal", { n: f.num(results.m.interactions) })}
        />
        <NumField
          label={t("calculator.usage.inputTokens")}
          tip={t("calculator.usage.inputTokensTip")}
          value={i.inputTokens}
          onChange={(v) => update({ inputTokens: Math.round(v) })}
          step={100}
          max={2_000_000}
          hint={t("calculator.usage.aboutWords", { n: f.num(i.inputTokens * WORDS_PER_TOKEN) })}
        />
        <NumField
          label={t("calculator.usage.outputTokens")}
          tip={t("calculator.usage.outputTokensTip")}
          value={i.outputTokens}
          onChange={(v) => update({ outputTokens: Math.round(v) })}
          step={50}
          max={200_000}
          hint={t("calculator.usage.aboutWords", { n: f.num(i.outputTokens * WORDS_PER_TOKEN) })}
        />
      </div>

      <div className="mt-3 no-print">
        <button
          type="button"
          aria-expanded={showTokens}
          onClick={() => setShowTokens((s) => !s)}
          className="font-dm text-sm font-semibold text-[#2251A3] hover:text-[#1B3A6B] underline underline-offset-2"
        >
          {t("calculator.tokens.toggle")}
        </button>
        {showTokens && (
          <div className="mt-2 rounded-xl bg-[#F4F7FB] p-4 font-dm text-sm text-[#3A4A5C] space-y-2">
            <p>{t("calculator.tokens.p1")}</p>
            <p>{t("calculator.tokens.p2")}</p>
            <p>{t("calculator.tokens.p3")}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label htmlFor="calc-words" className={labelCls}>
                {t("calculator.tokens.converter")}
              </label>
              <input
                id="calc-words"
                type="number"
                min={0}
                value={words}
                onChange={(e) => setWords(Math.max(0, Number(e.target.value) || 0))}
                className={`${inputCls} w-28`}
              />
              <span>{t("calculator.tokens.converterResult", { n: f.num(words / WORDS_PER_TOKEN) })}</span>
            </div>
          </div>
        )}
      </div>

      <SubHeading>{t("calculator.model.title")}</SubHeading>
      <div role="radiogroup" aria-label={t("calculator.model.title")} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {modelOptions.map((id) => {
          const m = CLAUDE_MODELS.find((x) => x.id === id);
          const active = i.model === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => update({ model: id as ModelId })}
              className={`text-left rounded-xl border px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2251A3] ${
                active ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3]"
              }`}
            >
              <span className="block font-dm text-sm font-semibold">{m ? m.name : t("calculator.model.custom")}</span>
              <span className={`block font-dm text-xs mt-0.5 ${active ? "text-white/80" : "text-[#7A8FA6]"}`}>
                {m
                  ? t("calculator.model.priceLine", { input: f.money(m.input), output: f.money(m.output) })
                  : t("calculator.model.customSub")}
              </span>
              {m && (
                <span className={`block font-dm text-[11px] mt-0.5 ${active ? "text-white/70" : "text-[#7A8FA6]"}`}>
                  {t(`calculator.model.tier.${m.tier}`)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {(i.model === "custom" || (i.routePct > 0 && i.routeModel === "custom")) && (
        <div className="mt-3 rounded-xl border border-[#D2DCE8] p-4">
          <p className="font-dm text-xs text-[#7A5A00] mb-3">{t("calculator.model.customNote")}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label={t("calculator.model.customName")}>
              <input
                type="text"
                value={i.customName}
                maxLength={60}
                onChange={(e) => update({ customName: e.target.value })}
                placeholder={t("calculator.model.customNamePh")}
                className={inputCls}
                aria-label={t("calculator.model.customName")}
              />
            </Field>
            <NumField label={t("calculator.model.customInput")} prefix="$" step={0.01} value={i.customInput} onChange={(v) => update({ customInput: v })} max={1000} />
            <NumField label={t("calculator.model.customOutput")} prefix="$" step={0.01} value={i.customOutput} onChange={(v) => update({ customOutput: v })} max={1000} />
            <NumField
              label={t("calculator.model.customCache")}
              tip={t("calculator.model.customCacheTip")}
              prefix="$"
              step={0.01}
              value={i.customCacheRead}
              onChange={(v) => update({ customCacheRead: v })}
              max={1000}
            />
          </div>
        </div>
      )}

      <details className="mt-3 rounded-xl border border-[#E4EAF2] bg-[#F9FBFD] group">
        <summary className="cursor-pointer px-4 py-2.5 font-dm text-sm font-semibold text-[#2251A3]">
          {t("calculator.prices.toggle", { date: f.month(PRICES_AS_OF) })}
        </summary>
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full min-w-[420px] font-dm text-sm">
            <caption className="sr-only">{t("calculator.prices.caption")}</caption>
            <thead>
              <tr className="text-left text-xs text-[#5B6B7F]">
                <th scope="col" className="py-2 pr-3 font-semibold">{t("calculator.prices.model")}</th>
                <th scope="col" className="py-2 pr-3 font-semibold text-right">{t("calculator.prices.input")}</th>
                <th scope="col" className="py-2 pr-3 font-semibold text-right">{t("calculator.prices.output")}</th>
                <th scope="col" className="py-2 font-semibold text-right">{t("calculator.prices.cacheRead")}</th>
              </tr>
            </thead>
            <tbody>
              {CLAUDE_MODELS.map((m) => (
                <tr key={m.id} className="border-t border-[#E4EAF2] text-[#0D1B2A]">
                  <th scope="row" className="py-2 pr-3 font-medium text-left">{m.name}</th>
                  <td className="py-2 pr-3 text-right tabular-nums">{f.money(m.input)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{f.money(m.output)}</td>
                  <td className="py-2 text-right tabular-nums">{f.money(m.cacheRead)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="font-dm text-xs text-[#5B6B7F] mt-3">{t("calculator.prices.notes")}</p>
          <p className="font-dm text-xs text-[#5B6B7F] mt-1">
            {t("calculator.prices.change")}{" "}
            <a href={PRICING_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2251A3] underline underline-offset-2">
              anthropic.com/pricing <ExternalLink size={12} aria-hidden />
            </a>
          </p>
        </div>
      </details>

      <SubHeading>{t("calculator.optimize.title")}</SubHeading>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <SliderField
          label={t("calculator.optimize.cacheable")}
          tip={t("calculator.optimize.cacheableTip")}
          value={i.cacheablePct}
          onChange={(v) => update({ cacheablePct: v })}
          min={0}
          max={100}
        />
        <SliderField
          label={t("calculator.optimize.cacheMiss")}
          tip={t("calculator.optimize.cacheMissTip")}
          value={i.cacheWritePct}
          onChange={(v) => update({ cacheWritePct: v })}
          min={0}
          max={100}
        />
        <div>
          <SliderField
            label={t("calculator.optimize.route")}
            tip={t("calculator.optimize.routeTip")}
            value={i.routePct}
            onChange={(v) => update({ routePct: v })}
            min={0}
            max={100}
          />
          <div className="flex items-center gap-2 mt-2">
            <label htmlFor={routeId} className="font-dm text-xs text-[#5B6B7F] shrink-0">
              {t("calculator.optimize.routeTo")}
            </label>
            <select
              id={routeId}
              value={i.routeModel}
              onChange={(e) => update({ routeModel: e.target.value as ModelId })}
              className={`${inputCls} py-1.5`}
            >
              {modelOptions.map((id) => (
                <option key={id} value={id}>
                  {CLAUDE_MODELS.find((m) => m.id === id)?.name ?? t("calculator.model.custom")}
                </option>
              ))}
            </select>
          </div>
          {i.routeModel === i.model && i.routePct > 0 && (
            <p className="font-dm text-xs text-[#9A4A00] mt-1">{t("calculator.optimize.routeSame")}</p>
          )}
        </div>
        <SliderField
          label={t("calculator.optimize.batch")}
          tip={t("calculator.optimize.batchTip")}
          value={i.batchPct}
          onChange={(v) => update({ batchPct: v })}
          min={0}
          max={100}
        />
        <SliderField
          label={t("calculator.optimize.overhead")}
          tip={t("calculator.optimize.overheadTip")}
          value={i.overheadPct}
          onChange={(v) => update({ overheadPct: v })}
          min={0}
          max={100}
        />
      </div>

      <SubHeading>
        {t("calculator.rag.title")}
        <InfoTip text={t("calculator.rag.tip")} label={t("calculator.rag.title")} />
      </SubHeading>
      <Toggle
        checked={i.features.rag}
        onChange={(v) => update({ features: { ...i.features, rag: v } })}
        label={t("calculator.feature.rag")}
        description={t("calculator.feature.ragDesc")}
      />
      {i.features.rag && (
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <NumField
            label={t("calculator.rag.docTokens")}
            tip={t("calculator.rag.docTokensTip")}
            value={i.embedDocTokensM}
            step={0.5}
            onChange={(v) => update({ embedDocTokensM: v })}
            max={100_000}
          />
          <NumField
            label={t("calculator.rag.queryTokens")}
            tip={t("calculator.rag.queryTokensTip")}
            value={i.embedQueryTokens}
            onChange={(v) => update({ embedQueryTokens: Math.round(v) })}
            max={100_000}
          />
          <NumField
            label={t("calculator.rag.price")}
            tip={t("calculator.rag.priceTip")}
            prefix="$"
            step={0.01}
            value={i.embedPrice}
            onChange={(v) => update({ embedPrice: v })}
            max={1000}
            hint={t("calculator.placeholderShort")}
          />
          <p className="sm:col-span-3 font-dm text-xs text-[#5B6B7F]">
            {t("calculator.rag.monthly", { amount: f.money(results.m.lines.embeddings) })}
          </p>
        </div>
      )}
    </Section>
  );
}
