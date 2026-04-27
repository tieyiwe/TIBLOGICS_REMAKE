"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import { trackPageVisit, trackToolUse } from "@/lib/recommendations";

type Provider = "claude" | "gpt4" | "gpt35" | "gemini";
type ModelTier = "haiku" | "sonnet" | "opus";

const PRICING: Record<Provider, Record<ModelTier, { input: number; output: number }>> = {
  claude:  { haiku: { input: 0.25, output: 1.25 },  sonnet: { input: 3.00, output: 15.00 }, opus: { input: 15.00, output: 75.00 } },
  gpt4:    { haiku: { input: 2.50, output: 10.00 }, sonnet: { input: 5.00, output: 15.00 }, opus: { input: 10.00, output: 30.00 } },
  gpt35:   { haiku: { input: 0.50, output: 1.50 },  sonnet: { input: 0.50, output: 1.50 },  opus: { input: 0.50, output: 1.50 }  },
  gemini:  { haiku: { input: 0.35, output: 1.05 },  sonnet: { input: 1.25, output: 5.00 },  opus: { input: 7.00, output: 21.00 } },
};

const CASES = {
  chatbot:  { label: "Customer Chatbot",   inputTokens: 800,  outputTokens: 400,  monthlyRequests: 3000 },
  content:  { label: "Content Generation", inputTokens: 500,  outputTokens: 1500, monthlyRequests: 500  },
  analysis: { label: "Data Analysis",      inputTokens: 4000, outputTokens: 800,  monthlyRequests: 300  },
  voice:    { label: "Voice AI Agent",     inputTokens: 1200, outputTokens: 600,  monthlyRequests: 2000 },
  code:     { label: "Code Assistant",     inputTokens: 1500, outputTokens: 1000, monthlyRequests: 800  },
  custom:   { label: "Custom",             inputTokens: 500,  outputTokens: 300,  monthlyRequests: 5000 },
};

const PROVIDER_LABELS: Record<Provider, string> = {
  claude: "Claude (Anthropic)", gpt4: "GPT-4o (OpenAI)", gpt35: "GPT-3.5", gemini: "Gemini Pro"
};

const MODEL_LABELS: Record<ModelTier, string> = {
  haiku: "Haiku / Fast", sonnet: "Sonnet / Standard", opus: "Opus / Advanced"
};

function formatDollar(v: number): string {
  return `$${v.toFixed(v < 1 ? 4 : 2)}`;
}

export default function CalculatorPage() {
  useEffect(() => {
    trackPageVisit("/tools/calculator");
    trackToolUse("calculator");
  }, []);

  const [provider, setProvider] = useState<Provider>("claude");
  const [model, setModel] = useState<ModelTier>("sonnet");
  const [useCase, setUseCase] = useState<keyof typeof CASES>("chatbot");
  const [inputTokens, setInputTokens] = useState(CASES.chatbot.inputTokens);
  const [outputTokens, setOutputTokens] = useState(CASES.chatbot.outputTokens);
  const [monthlyRequests, setMonthlyRequests] = useState(CASES.chatbot.monthlyRequests);
  const [marginPct, setMarginPct] = useState(50);
  const [cacheHitRate, setCacheHitRate] = useState(0);

  useEffect(() => {
    if (useCase !== "custom") {
      const c = CASES[useCase];
      setInputTokens(c.inputTokens);
      setOutputTokens(c.outputTokens);
      setMonthlyRequests(c.monthlyRequests);
    }
  }, [useCase]);

  useEffect(() => {
    fetch("/api/tool-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "calculator", metadata: { provider } }),
    }).catch(() => {});
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { inputCost, outputCost, cacheSavings, totalCost, clientCharge, perThousandCost } =
    useMemo(() => {
      const pricing = PRICING[provider][model];
      const cacheRate = cacheHitRate / 100;
      const uncached = monthlyRequests * (1 - cacheRate);
      const cached = monthlyRequests * cacheRate;
      const inputCost =
        (uncached * inputTokens * pricing.input) / 1_000_000 +
        (cached * inputTokens * pricing.input * 0.1) / 1_000_000;
      const outputCost = (monthlyRequests * outputTokens * pricing.output) / 1_000_000;
      const cacheSavings = (cached * inputTokens * pricing.input * 0.9) / 1_000_000;
      const totalCost = inputCost + outputCost;
      const clientCharge = totalCost * (1 + marginPct / 100);
      const perThousandCost = monthlyRequests > 0 ? (totalCost / monthlyRequests) * 1000 : 0;
      return { inputCost, outputCost, cacheSavings, totalCost, clientCharge, perThousandCost };
    }, [provider, model, inputTokens, outputTokens, monthlyRequests, marginPct, cacheHitRate]);

  const smartTip: string = (() => {
    if (totalCost < 10) return "Low volume — Claude Haiku could reduce your costs by up to 80%.";
    if (totalCost > 500) return "High spend detected — prompt caching at 60%+ can significantly cut costs.";
    if (cacheHitRate > 0) return `You're saving ~$${cacheSavings.toFixed(2)}/mo with ${cacheHitRate}% cache hit rate.`;
    return `Your ${marginPct}% margin adds $${(clientCharge - totalCost).toFixed(2)}/mo. Typical agencies charge 50–150%.`;
  })();

  const tabActive = "bg-[#1B3A6B] text-white border-[#1B3A6B]";
  const tabInactive =
    "bg-white text-[#3A4A5C] border-[#D2DCE8] hover:border-[#2251A3] hover:text-[#2251A3]";

  return (
    <div className="pt-32 sm:pt-44 pb-16 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-10 text-center">
          <span className="section-tag">AI Product Cost Calculator</span>
          <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#0D1B2A] mt-3 mb-3">
            Estimate Your AI API Costs
          </h1>
          <p className="font-dm text-[#3A4A5C] max-w-xl mx-auto text-base">
            Calculate real monthly costs for any AI provider, use case, and volume — then figure out
            what to charge clients.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Provider tabs */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
              <p className="font-syne font-bold text-[#0D1B2A] text-sm mb-3">AI Provider</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`border rounded-lg px-3 py-2 font-dm text-xs font-medium transition-colors duration-150 ${
                      provider === p ? tabActive : tabInactive
                    }`}
                  >
                    {PROVIDER_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Model tabs */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
              <p className="font-syne font-bold text-[#0D1B2A] text-sm mb-3">Model Tier</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(MODEL_LABELS) as ModelTier[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`border rounded-lg px-3 py-2.5 font-dm text-xs font-medium transition-colors duration-150 ${
                      model === m ? tabActive : tabInactive
                    }`}
                  >
                    {MODEL_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Use Case Presets */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
              <p className="font-syne font-bold text-[#0D1B2A] text-sm mb-3">Use Case Preset</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CASES) as (keyof typeof CASES)[]).map((uc) => (
                  <button
                    key={uc}
                    onClick={() => setUseCase(uc)}
                    className={`border rounded-lg px-2 py-2 font-dm text-xs font-medium transition-colors duration-150 ${
                      useCase === uc
                        ? "bg-[#FEF0E3] border-[#F47C20] text-[#F47C20]"
                        : "bg-white border-[#D2DCE8] text-[#3A4A5C] hover:border-[#F47C20] hover:text-[#F47C20]"
                    }`}
                  >
                    {CASES[uc].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Sliders */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 space-y-5">
              <p className="font-syne font-bold text-[#0D1B2A] text-sm">Usage Parameters</p>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-dm text-sm text-[#3A4A5C]">Input tokens per request</label>
                  <span className="font-dm text-sm font-semibold text-[#0D1B2A]">
                    {inputTokens.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={8000}
                  step={100}
                  value={inputTokens}
                  onChange={(e) => {
                    setUseCase("custom");
                    setInputTokens(Number(e.target.value));
                  }}
                  className="w-full accent-[#F47C20]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-dm text-sm text-[#3A4A5C]">Output tokens per request</label>
                  <span className="font-dm text-sm font-semibold text-[#0D1B2A]">
                    {outputTokens.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={4000}
                  step={50}
                  value={outputTokens}
                  onChange={(e) => {
                    setUseCase("custom");
                    setOutputTokens(Number(e.target.value));
                  }}
                  className="w-full accent-[#F47C20]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-dm text-sm text-[#3A4A5C]">Monthly requests</label>
                  <span className="font-dm text-sm font-semibold text-[#0D1B2A]">
                    {monthlyRequests.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={100000}
                  step={100}
                  value={monthlyRequests}
                  onChange={(e) => {
                    setUseCase("custom");
                    setMonthlyRequests(Number(e.target.value));
                  }}
                  className="w-full accent-[#F47C20]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-dm text-sm text-[#3A4A5C]">Your margin %</label>
                  <span className="font-dm text-sm font-semibold text-[#0D1B2A]">{marginPct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={5}
                  value={marginPct}
                  onChange={(e) => setMarginPct(Number(e.target.value))}
                  className="w-full accent-[#F47C20]"
                />
              </div>
            </div>

            {/* 5. Cache hit rate */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
              <p className="font-syne font-bold text-[#0D1B2A] text-sm mb-3">Cache Hit Rate</p>
              <div className="flex gap-2">
                {[0, 30, 60, 90].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setCacheHitRate(rate)}
                    className={`flex-1 border rounded-lg py-2 font-dm text-sm font-medium transition-colors duration-150 ${
                      cacheHitRate === rate ? tabActive : tabInactive
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right result panel */}
          <div className="sticky top-24">
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
              <span className="section-tag">Monthly API Cost</span>

              <div className="mt-3 mb-1">
                <span className="font-syne font-extrabold text-5xl text-[#1B3A6B]">
                  {formatDollar(totalCost)}
                </span>
              </div>
              <p className="font-dm text-[#7A8FA6] text-sm mb-4">
                Per 1,000 requests: ${perThousandCost.toFixed(2)}
              </p>

              {/* Breakdown */}
              <div className="bg-[#F4F7FB] rounded-xl p-4 space-y-2">
                <div className="flex justify-between font-dm text-sm text-[#3A4A5C]">
                  <span>Input cost</span>
                  <span>{formatDollar(inputCost)}</span>
                </div>
                <div className="flex justify-between font-dm text-sm text-[#3A4A5C]">
                  <span>Output cost</span>
                  <span>{formatDollar(outputCost)}</span>
                </div>
                {cacheHitRate > 0 && (
                  <div className="flex justify-between font-dm text-sm text-green-600">
                    <span>Cache savings</span>
                    <span>-{formatDollar(cacheSavings)}</span>
                  </div>
                )}
                <div className="border-t border-[#D2DCE8] pt-2 mt-1">
                  <div className="flex justify-between font-dm text-sm font-bold text-[#0D1B2A]">
                    <span>Total API Cost</span>
                    <span>{formatDollar(totalCost)}</span>
                  </div>
                  <div className="flex justify-between font-syne text-sm font-bold text-[#2251A3] mt-1">
                    <span>Client charge ({marginPct}% margin)</span>
                    <span>{formatDollar(clientCharge)}</span>
                  </div>
                </div>
              </div>

              {/* Smart tip */}
              <div className="border-l-4 border-[#F47C20] bg-[#FEF0E3] p-3 rounded-r-lg mt-4 text-sm font-dm text-[#3A4A5C]">
                {smartTip}
              </div>

              <Link
                href="/book"
                className="btn-primary w-full justify-center mt-4 text-center"
              >
                Get Pricing Strategy Help ↗
              </Link>
            </div>
          </div>
        </div>
        <SmartRecommendations currentPage="/tools/calculator" compact />
      </div>
    </div>
  );
}
