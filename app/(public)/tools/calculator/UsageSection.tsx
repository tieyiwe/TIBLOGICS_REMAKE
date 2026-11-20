"use client";

import { useId, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { CURRENT_MODELS, LEGACY_MODELS, MODELS, PRICES_AS_OF, PROVIDERS, modelById, type ModelId, type ModelPrice } from "@/lib/calculator/pricing";
import { useCalc, useFmt } from "./context";
import { Field, InfoTip, NumField, Section, SliderField, Stat, SubHeading, Toggle, inputCls, labelCls } from "./ui";
import ModelComparison from "./ModelComparison";
import { promptTokens } from "@/lib/calculator/core";

/** Quick picks for thinking tokens per call (editable). */
const THINKING_PICKS = [0, 300, 1000, 4000] as const;

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

  const modelOptions: ModelId[] = [...MODELS.map((m) => m.id), "custom"];
  const optimizations = ai.listTotal - ai.total;
  const selected = i.model === "custom" ? undefined : modelById(i.model);
  const range = results.range;
  const modelName = (id: ModelId) => modelById(id)?.name ?? t("calculator.model.custom");

  return (
    <Section
      id="usage"
      step={2}
      title={t("calculator.usage.title")}
      subtitle={t("calculator.usage.subtitle")}
      footer={
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat
            label={t("calculator.usage.aiMonthly")}
            value={f.money(ai.total)}
            sub={t("calculator.usage.rangeShort", { low: f.money(range.aiLow), high: f.money(range.aiHigh) })}
          />
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

      <SubHeading>{t("calculator.work.title")}</SubHeading>
      <div className="grid sm:grid-cols-3 gap-4">
        <NumField
          label={t("calculator.work.thinking")}
          tip={t("calculator.work.thinkingTip")}
          value={i.thinkingTokens}
          onChange={(v) => update({ thinkingTokens: Math.round(v) })}
          step={100}
          max={128_000}
          hint={
            <span className="flex flex-wrap gap-1 no-print">
              {THINKING_PICKS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update({ thinkingTokens: n })}
                  aria-pressed={i.thinkingTokens === n}
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${i.thinkingTokens === n ? "border-[#1B3A6B] bg-[#1B3A6B] text-white" : "border-[#D2DCE8] text-[#2251A3]"}`}
                >
                  {t(`calculator.work.pick.${n}`)}
                </button>
              ))}
            </span>
          }
        />
        <NumField
          label={t("calculator.work.calls")}
          tip={t("calculator.work.callsTip")}
          value={i.callsPerInteraction}
          min={1}
          onChange={(v) => update({ callsPerInteraction: Math.max(1, Math.round(v)) })}
          max={100}
          hint={t("calculator.work.callsHint", { n: f.compact(ai.calls) })}
        />
        <NumField
          label={t("calculator.work.history")}
          tip={t("calculator.work.historyTip")}
          value={i.historyTurns}
          min={1}
          onChange={(v) => update({ historyTurns: Math.max(1, Math.round(v)) })}
          max={500}
          hint={i.historyTurns > 1 ? t("calculator.work.historyHint", { n: f.num(Math.round(promptTokens(i))) }) : t("calculator.work.historyNone")}
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
      {PROVIDERS.map((p) => (
        <div key={p} className="mb-3">
          <p className="font-dm text-[11px] font-semibold uppercase tracking-wide text-[#7A8FA6] mb-1.5">{t(`calculator.provider.${p}`)}</p>
          <div role="radiogroup" aria-label={`${t("calculator.model.title")}: ${t(`calculator.provider.${p}`)}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {CURRENT_MODELS.filter((m) => m.provider === p).map((m) => (
              <ModelButton key={m.id} m={m} active={i.model === m.id} onPick={() => update({ model: m.id })} />
            ))}
            {p === "google" && (
              <button
                type="button"
                role="radio"
                aria-checked={i.model === "custom"}
                onClick={() => update({ model: "custom" })}
                className={`text-left rounded-xl border px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2251A3] ${
                  i.model === "custom" ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3]"
                }`}
              >
                <span className="block font-dm text-sm font-semibold">{t("calculator.model.custom")}</span>
                <span className={`block font-dm text-xs mt-0.5 ${i.model === "custom" ? "text-white/80" : "text-[#7A8FA6]"}`}>{t("calculator.model.customSub")}</span>
              </button>
            )}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="calc-legacy" className="font-dm text-xs text-[#5B6B7F]">{t("calculator.model.older")}</label>
        <select
          id="calc-legacy"
          value={selected?.legacy ? i.model : ""}
          onChange={(e) => e.target.value && update({ model: e.target.value as ModelId })}
          className={`${inputCls} py-1.5 w-auto`}
        >
          <option value="">{t("calculator.model.olderPick")}</option>
          {LEGACY_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({t("calculator.model.priceLine", { input: f.money(m.input), output: f.money(m.output) })})
            </option>
          ))}
        </select>
      </div>

      {selected?.fast && (
        <div className="mt-3">
          <Toggle
            checked={i.fastMode}
            onChange={(v) => update({ fastMode: v })}
            label={t("calculator.model.fast")}
            description={t("calculator.model.fastDesc", { input: f.money(selected.fast.input), output: f.money(selected.fast.output) })}
          />
        </div>
      )}

      {results.notes.length > 0 && (
        <ul className="mt-3 space-y-1.5" data-testid="calc-notes">
          {results.notes.map((n) => (
            <li key={n} className="rounded-xl border border-[#F5D9A8] bg-[#FFF7E6] px-3.5 py-2 font-dm text-xs text-[#7A4A00]">
              {t(`calculator.note.${n}`)}
            </li>
          ))}
        </ul>
      )}

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
          <table className="w-full min-w-[520px] font-dm text-sm">
            <caption className="sr-only">{t("calculator.prices.caption")}</caption>
            <thead>
              <tr className="text-left text-xs text-[#5B6B7F]">
                <th scope="col" className="py-2 pr-3 font-semibold">{t("calculator.prices.model")}</th>
                <th scope="col" className="py-2 pr-3 font-semibold">{t("calculator.prices.provider")}</th>
                <th scope="col" className="py-2 pr-3 font-semibold text-right">{t("calculator.prices.input")}</th>
                <th scope="col" className="py-2 pr-3 font-semibold text-right">{t("calculator.prices.output")}</th>
                <th scope="col" className="py-2 font-semibold text-right">{t("calculator.prices.cacheRead")}</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m) => (
                <tr key={m.id} className={`border-t border-[#E4EAF2] ${m.legacy ? "text-[#5B6B7F]" : "text-[#0D1B2A]"}`}>
                  <th scope="row" className="py-2 pr-3 font-medium text-left">
                    <a href={m.source} target="_blank" rel="noopener noreferrer" className="hover:underline">{m.name}</a>
                    {m.legacy && <span className="ml-1 text-[11px]">({t("calculator.prices.older")})</span>}
                  </th>
                  <td className="py-2 pr-3">{t(`calculator.provider.${m.provider}`)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{f.money(m.input)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{f.money(m.output)}</td>
                  <td className="py-2 text-right tabular-nums">{m.cacheRead === null ? "-" : f.money(m.cacheRead)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="font-dm text-xs text-[#5B6B7F] mt-3">{t("calculator.prices.notes")}</p>
          <p className="font-dm text-xs text-[#5B6B7F] mt-1 flex items-start gap-1">
            <ExternalLink size={12} className="shrink-0 mt-0.5" aria-hidden />
            {t("calculator.prices.change")}
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
                  {modelName(id)}
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

      <ModelComparison />

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

function ModelButton({ m, active, onPick }: { m: ModelPrice; active: boolean; onPick: () => void }) {
  const t = useT();
  const f = useFmt();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onPick}
      className={`text-left rounded-xl border px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2251A3] ${
        active ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3]"
      }`}
    >
      <span className="block font-dm text-sm font-semibold">{m.name}</span>
      <span className={`block font-dm text-xs mt-0.5 ${active ? "text-white/80" : "text-[#7A8FA6]"}`}>
        {t("calculator.model.priceLine", { input: f.money(m.input), output: f.money(m.output) })}
      </span>
      <span className={`block font-dm text-[11px] mt-0.5 ${active ? "text-white/70" : "text-[#7A8FA6]"}`}>{t(`calculator.model.tier.${m.tier}`)}</span>
    </button>
  );
}
