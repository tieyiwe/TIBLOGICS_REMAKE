"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, ClipboardList, Link2 } from "lucide-react";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import { trackPageVisit, trackToolUse } from "@/lib/recommendations";
import { useT } from "@/lib/i18n/client";
import { computeFree } from "@/lib/calculator/core";
import type { FullResults } from "@/lib/calculator/engine";
import { DEFAULT_INPUTS, cloneInputs } from "@/lib/calculator/defaults";
import { isPresetId, presetInputs, type PresetId } from "@/lib/calculator/presets";
import { sanitizeInputs } from "@/lib/calculator/schema";
import { decodeState, SHARE_PARAM } from "@/lib/calculator/share";
import { RATIONALE_KEYS, type Rationale } from "@/lib/calculator/rationale";
import type { Inputs } from "@/lib/calculator/types";
import { CalcProvider, type PlanState } from "./context";
import { PaidSection, PlanCard } from "./Plan";
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
  const [plan, setPlan] = useState<PlanState>({ full: false, via: null, expiresAt: null, price: null, days: 365, loaded: false });
  const [full, setFull] = useState<FullResults | null>(null);
  const [fullFor, setFullFor] = useState<Inputs | null>(null);
  const [planNotice, setPlanNotice] = useState<"paid" | "pending" | "canceled" | "link" | "badLink" | null>(null);

  // The Full Plan on this browser: back from Stripe (?plan=paid&session_id=),
  // the email's access link (?plan=<key>), or the status from the cookie. The
  // query is removed from the address bar either way, so a key is not left
  // in the history or sent on as a referrer.
  const loadPlan = useCallback(async () => {
    const res = await fetch("/api/tools/calculator/plan", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    setPlan({
      full: !!res?.full,
      via: res?.via ?? null,
      expiresAt: res?.expiresAt ?? null,
      price: typeof res?.price === "string" ? res.price : null,
      days: typeof res?.days === "number" ? res.days : 365,
      loaded: true,
    });
  }, []);

  useEffect(() => {
    (async () => {
      const q = new URLSearchParams(window.location.search);
      const p = q.get("plan");
      const sessionId = q.get("session_id");
      if (p) {
        try {
          window.history.replaceState(null, "", window.location.pathname + window.location.hash);
        } catch {
          /* ignore */
        }
      }
      if (p === "paid" && sessionId) {
        // The webhook may take a moment: try a few times.
        let ok = false;
        for (let n = 0; n < 4 && !ok; n++) {
          if (n) await new Promise((r) => setTimeout(r, 1500));
          ok = await fetch("/api/tools/calculator/plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          }).then((r) => r.ok).catch(() => false);
        }
        setPlanNotice(ok ? "paid" : "pending");
      } else if (p === "canceled") {
        setPlanNotice("canceled");
      } else if (p && p !== "paid") {
        const ok = await fetch("/api/tools/calculator/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: p }),
        }).then((r) => r.ok).catch(() => false);
        setPlanNotice(ok ? "link" : "badLink");
      }
      await loadPlan();
    })();
  }, [loadPlan]);

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

  const results = useMemo(() => computeFree(inputs), [inputs]);

  // The Full Plan numbers come from the server, a moment after the last edit.
  useEffect(() => {
    if (!plan.full || !hydrated) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const r = await fetch("/api/tools/calculator/full", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs }),
          signal: ctrl.signal,
        });
        if (r.status === 402) {
          // The plan ended (refund, expiry) or the cookie went.
          setFull(null);
          void loadPlan();
          return;
        }
        if (!r.ok) return;
        setFull((await r.json()) as FullResults);
        setFullFor(inputs);
      } catch {
        /* aborted or offline: keep the last numbers */
      }
    }, full ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
    // `full` only picks the delay; refetching on its change would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, plan.full, hydrated, loadPlan]);

  const buyPlan = useCallback(
    async (email?: string): Promise<string | null> => {
      const r = await fetch("/api/tools/calculator/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email ?? "" }),
      }).catch(() => null);
      const j = await r?.json().catch(() => null);
      if (r?.ok && typeof j?.url === "string") {
        window.location.href = j.url;
        return null;
      }
      return typeof j?.error === "string" ? j.error : t("calculator.plan.errFailed");
    },
    [t],
  );

  const forgetPlan = useCallback(async () => {
    await fetch("/api/tools/calculator/plan", { method: "DELETE" }).catch(() => null);
    setFull(null);
    await loadPlan();
  }, [loadPlan]);

  const fullStale = !!full && fullFor !== inputs;
  const ctx = useMemo(
    () => ({ inputs, update, results, full, fullStale, plan, buyPlan, forgetPlan }),
    [inputs, update, results, full, fullStale, plan, buyPlan, forgetPlan],
  );

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

        {planNotice && (
          <div
            role="status"
            data-testid={`plan-notice-${planNotice}`}
            className={`no-print flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 font-dm text-sm ${
              planNotice === "paid" || planNotice === "link" ? "border-[#BFE3C9] bg-[#EEF9F1] text-[#166534]" : "border-[#F5D9A8] bg-[#FFF7E6] text-[#7A4A00]"
            }`}
          >
            <span>{t(`calculator.plan.notice.${planNotice}`)}</span>
            <button type="button" onClick={() => setPlanNotice(null)} className="text-xs font-semibold underline underline-offset-2">
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
            <PlanCard />
            <PaidSection id="build" step={4} titleKey="calculator.build.title" teaserKey="calculator.plan.teaser.build">
              <BuildSection />
            </PaidSection>
            <PaidSection id="pricing" step={5} titleKey="calculator.pricing.title" teaserKey="calculator.plan.teaser.pricing">
              <PricingSection />
            </PaidSection>
          </div>
          <SummaryPanel description={description} onReset={reset} />
        </div>

        <PaidSection id="scenarios" step={6} titleKey="calculator.scenarios.title" teaserKey="calculator.plan.teaser.scenarios">
          <ScenariosSection />
        </PaidSection>
        <PaidSection id="savings" step={7} titleKey="calculator.recs.title" teaserKey="calculator.plan.teaser.savings">
          <RecommendationsSection />
        </PaidSection>

        <details className="calc-card bg-white border border-[#D2DCE8] rounded-2xl px-5 sm:px-6 py-4">
          <summary className="cursor-pointer font-syne font-bold text-base text-[#0D1B2A]">{t("calculator.method.title")}</summary>
          <div className="font-dm text-sm text-[#3A4A5C] space-y-2 mt-3 leading-relaxed">
            {["ai", "work", "cache", "range", "providers", "running", "margin", "breakEven", "price", "build", "limits"].map((k) => (
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
