"use client";

import { useState } from "react";
import {
  Bot,
  FileSearch,
  GraduationCap,
  Headphones,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  PenLine,
  Phone,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import { PRESET_IDS, type PresetId } from "@/lib/calculator/presets";
import { RATIONALE_KEYS, type Rationale } from "@/lib/calculator/ai";
import type { Inputs } from "@/lib/calculator/types";
import { inputCls } from "./ui";

const ICONS: Record<PresetId, typeof Bot> = {
  supportBot: Headphones,
  whatsapp: MessageCircle,
  docQa: FileSearch,
  writingSaas: PenLine,
  voiceReceptionist: Phone,
  tutor: GraduationCap,
  opsAgent: Bot,
  imageApp: ImageIcon,
  meetingNotes: Mic,
  productCopy: ShoppingBag,
};

export default function DescribeSection({
  description,
  setDescription,
  activePreset,
  onPreset,
  onEstimate,
  rationale,
  aiSummary,
}: {
  description: string;
  setDescription: (s: string) => void;
  activePreset: PresetId | null;
  onPreset: (id: PresetId) => void;
  onEstimate: (inputs: Inputs, rationale: Rationale, summary: string) => void;
  rationale: Rationale | null;
  aiSummary: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; fallback: boolean } | null>(null);

  async function estimate() {
    const text = description.trim();
    if (text.length < 10) {
      setError({ text: t("calculator.ai.errorShort"), fallback: false });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/calculator/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.inputs) {
        setError({ text: typeof data.error === "string" ? data.error : t("calculator.ai.errorFailed"), fallback: true });
        return;
      }
      onEstimate(data.inputs, data.rationale ?? {}, typeof data.summary === "string" ? data.summary : "");
    } catch {
      setError({ text: t("calculator.ai.errorFailed"), fallback: true });
    } finally {
      setBusy(false);
    }
  }

  const hasRationale = rationale && RATIONALE_KEYS.some((k) => rationale[k]);

  return (
    <section aria-labelledby="describe-title" className="calc-card bg-white border border-[#D2DCE8] rounded-2xl p-5 sm:p-6">
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-8">
        <div className="no-print-controls">
          <h2 id="describe-title" className="font-syne font-bold text-lg sm:text-xl text-[#0D1B2A]">
            {t("calculator.describe.title")}
          </h2>
          <p className="font-dm text-sm text-[#7A8FA6] mt-1">{t("calculator.describe.subtitle")}</p>
          <label htmlFor="calc-description" className="sr-only">
            {t("calculator.describe.title")}
          </label>
          <textarea
            id="calc-description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
            rows={4}
            maxLength={1000}
            placeholder={t("calculator.describe.placeholder")}
            className={`${inputCls} mt-4 resize-y min-h-[112px] leading-relaxed`}
          />
          <div className="flex flex-wrap items-center gap-3 mt-3 no-print">
            <button type="button" onClick={estimate} disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}
              {busy ? t("calculator.describe.working") : t("calculator.describe.button")}
            </button>
            <span className="font-dm text-xs text-[#7A8FA6]">{t("calculator.describe.note")}</span>
          </div>
          <div aria-live="polite">
            {error && (
              <div className="mt-3 rounded-xl border border-[#F5D9A8] bg-[#FFF7E6] px-3.5 py-2.5 font-dm text-sm text-[#7A4A00]">
                {error.text}
                {error.fallback && <span className="block mt-1">{t("calculator.ai.fallback")}</span>}
              </div>
            )}
            {hasRationale && (
              <div className="mt-4 rounded-xl border border-[#C9D8EE] bg-[#EEF3FB] p-4">
                <p className="font-syne font-bold text-sm text-[#1B3A6B]">{t("calculator.ai.why")}</p>
                {aiSummary && <p className="font-dm text-sm text-[#0D1B2A] mt-1">{aiSummary}</p>}
                <dl className="mt-2 space-y-1.5">
                  {RATIONALE_KEYS.filter((k) => rationale?.[k]).map((k) => (
                    <div key={k} className="font-dm text-sm text-[#3A4A5C]">
                      <dt className="font-semibold text-[#1B3A6B] text-xs uppercase tracking-wide">{t(`calculator.ai.group.${k}`)}</dt>
                      <dd>{rationale?.[k]}</dd>
                    </div>
                  ))}
                </dl>
                <p className="font-dm text-xs text-[#5B6B7F] mt-2">{t("calculator.ai.editable")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="no-print">
          <h3 className="font-syne font-bold text-sm text-[#1B3A6B]">{t("calculator.presets.title")}</h3>
          <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{t("calculator.presets.subtitle")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {PRESET_IDS.map((id) => {
              const Icon = ICONS[id];
              const active = activePreset === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onPreset(id)}
                  className={`flex items-start gap-2.5 text-left rounded-xl border px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2251A3] ${
                    active ? "border-[#B8500A] bg-[#FEF0E3]" : "border-[#D2DCE8] bg-white hover:border-[#F47C20]"
                  }`}
                >
                  <Icon size={18} className={`shrink-0 mt-0.5 ${active ? "text-[#B8500A]" : "text-[#2251A3]"}`} aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-dm text-sm font-semibold text-[#0D1B2A] leading-snug">{t(`calculator.preset.${id}.name`)}</span>
                    <span className="block font-dm text-xs text-[#7A8FA6] leading-snug mt-0.5">{t(`calculator.preset.${id}.desc`)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
