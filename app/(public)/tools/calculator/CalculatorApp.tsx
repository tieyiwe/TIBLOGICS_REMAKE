"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, ClipboardList, Link2 } from "lucide-react";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import { trackPageVisit, trackToolUse } from "@/lib/recommendations";
import { useT } from "@/lib/i18n/client";
import { computeAll } from "@/lib/calculator/engine";
import { DEFAULT_INPUTS, cloneInputs } from "@/lib/calculator/defaults";
import { isPresetId, presetInputs, type PresetId } from "@/lib/calculator/presets";
import { sanitizeInputs } from "@/lib/calculator/schema";
import { decodeState, SHARE_PARAM } from "@/lib/calculator/share";
import { RATIONALE_KEYS, type Rationale } from "@/lib/calculator/ai";
import type { Inputs } from "@/lib/calculator/types";
import { CalcProvider } from "./context";
import DescribeSection from "./DescribeSection";
import UsageSection from "./UsageSection";
import CostsSection from "./CostsSection";
import BuildSection from "./BuildSection";
import PricingSection from "./PricingSection";
import ScenariosSection from "./ScenariosSection";
import RecommendationsSection from "./RecommendationsSection";
import SummaryPanel from "./SummaryPanel";

const STORAGE_KEY = "tib_calculator_v2";

// Print: just the estimate. Site chrome, controls and floating widgets go.
const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  body { background: #fff !important; }
  body header, body footer, body nav, .no-print, [class*="fixed"] { display: none !important; }
  main { padding: 0 !important; }
  .calc-root { padding: 0 !important; background: #fff !important; min-height: 0 !important; }
  .calc-grid { display: block !important; }
  .calc-card { break-inside: avoid-page; box-shadow: none !important; margin-bottom: 12px; position: static !important; }
  .calc-charts { break-inside: avoid; }
  input, select, textarea { border-color: transparent !important; background: transparent !important; }
  input[type="range"] { display: none !important; }
}`;

function cleanRationale(r: unknown): Rationale | null {
  if (!r || typeof r !== "object") return null;
  const out: Rationale = {};
  for (const k of RATIONALE_KEYS) {
    const v = (r as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) out[k] = v.slice(0, 400);
  }
  return Object.keys(out).length ? out : null;
}

export default function CalculatorApp() {
  const t = useT();
  const [inputs, setInputs] = useState<Inputs>(() => cloneInputs(DEFAULT_INPUTS));
  const [description, setDescription] = useState("");
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const [rationale, setRationale] = useState<Rationale | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [notice, setNotice] = useState<"shared" | "restored" | "estimated" | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const fromLink = useRef(false);

  // Analytics, as before the rebuild: the recommendations context and the
  // admin tool-usage counter.
  useEffect(() => {
    trackPageVisit("/tools/calculator");
    trackToolUse("calculator");
    fetch("/api/tool-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "calculator", metadata: { version: 2 } }),
    }).catch(() => {});
  }, []);

  // Load a shared link first, else the last session in this browser.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const code = new URLSearchParams(window.location.hash.slice(1)).get(SHARE_PARAM);
      if (code) {
        const shared = await decodeState(code);
        if (cancelled) return;
        if (shared) {
          setInputs(shared.inputs);
          setDescription(shared.description);
          setNotice("shared");
          fromLink.current = true;
          setHydrated(true);
          return;
        }
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (!cancelled && saved && typeof saved === "object") {
            setInputs(sanitizeInputs(saved.inputs));
            if (typeof saved.description === "string") setDescription(saved.description.slice(0, 1000));
            if (isPresetId(saved.preset)) setActivePreset(saved.preset);
            setRationale(cleanRationale(saved.rationale));
            if (typeof saved.aiSummary === "string") setAiSummary(saved.aiSummary.slice(0, 200));
            setNotice("restored");
          }
        }
      } catch {
        // Storage blocked or corrupt: start fresh.
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ v: 2, inputs, description, preset: activePreset, rationale, aiSummary }),
      );
    } catch {
      // Private mode or full storage: the calculator still works.
    }
  }, [hydrated, inputs, description, activePreset, rationale, aiSummary]);

  /** A stale share hash would reload old numbers on refresh, so drop it once edited. */
  const dropShareHash = useCallback(() => {
    if (!fromLink.current) return;
    fromLink.current = false;
    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback(
    (patch: Partial<Inputs>) => {
      dropShareHash();
      setInputs((prev) => ({ ...prev, ...patch }));
    },
    [dropShareHash],
  );

  const results = useMemo(() => computeAll(inputs), [inputs]);
  const ctx = useMemo(() => ({ inputs, update, results }), [inputs, update, results]);

  function applyPreset(id: PresetId) {
    dropShareHash();
    setInputs(presetInputs(id));
    setActivePreset(id);
    setRationale(null);
    setAiSummary("");
    setNotice(null);
  }

  function applyEstimate(next: Inputs, r: Rationale, summary: string) {
    dropShareHash();
    setInputs(sanitizeInputs(next));
    setRationale(cleanRationale(r));
    setAiSummary(summary.slice(0, 200));
    setActivePreset(null);
    setNotice("estimated");
  }

  function reset() {
    dropShareHash();
    setInputs(cloneInputs(DEFAULT_INPUTS));
    setDescription("");
    setActivePreset(null);
    setRationale(null);
    setAiSummary("");
    setNotice(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <CalcProvider value={ctx}>
      <style>{PRINT_CSS}</style>
      <div className="space-y-6">
        {notice && (
          <div
            role="status"
            className="no-print flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#C9D8EE] bg-[#EEF3FB] px-4 py-3 font-dm text-sm text-[#1B3A6B]"
          >
            <span className="flex items-center gap-2">
              {notice === "shared" && <Link2 size={16} aria-hidden />}
              {t(`calculator.notice.${notice}`)}
            </span>
            <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold underline underline-offset-2">
              {t("calculator.notice.dismiss")}
            </button>
          </div>
        )}

        <DescribeSection
          description={description}
          setDescription={setDescription}
          activePreset={activePreset}
          onPreset={applyPreset}
          onEstimate={applyEstimate}
          rationale={rationale}
          aiSummary={aiSummary}
        />

        <div className="calc-grid grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            <UsageSection />
            <CostsSection />
            <BuildSection />
            <PricingSection />
          </div>
          <SummaryPanel description={description} onReset={reset} />
        </div>

        <ScenariosSection />
        <RecommendationsSection />

        <details className="calc-card bg-white border border-[#D2DCE8] rounded-2xl px-5 sm:px-6 py-4">
          <summary className="cursor-pointer font-syne font-bold text-base text-[#0D1B2A]">{t("calculator.method.title")}</summary>
          <div className="font-dm text-sm text-[#3A4A5C] space-y-2 mt-3 leading-relaxed">
            {["ai", "cache", "running", "margin", "breakEven", "price", "build", "limits"].map((k) => (
              <p key={k}>{t(`calculator.method.${k}`)}</p>
            ))}
          </div>
        </details>

        <section className="no-print rounded-2xl bg-[#0D1B2A] text-white p-6 sm:p-8" aria-labelledby="calc-cta-title">
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 items-center">
            <div>
              <h2 id="calc-cta-title" className="font-syne font-extrabold text-2xl sm:text-3xl">
                {t("calculator.cta.title")}
              </h2>
              <p className="font-dm text-white/80 mt-2">{t("calculator.cta.body")}</p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3">
              <Link href="/book" className="btn-primary justify-center">
                <CalendarCheck size={18} aria-hidden />
                {t("calculator.cta.book")}
              </Link>
              <Link
                href="/tools/automation-blueprint"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/70 px-5 py-2.5 font-semibold text-white hover:bg-white hover:text-[#0D1B2A] transition-colors"
              >
                <ClipboardList size={18} aria-hidden />
                {t("calculator.cta.blueprint")}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <div className="no-print">
          <SmartRecommendations currentPage="/tools/calculator" compact />
        </div>
      </div>
    </CalcProvider>
  );
}
