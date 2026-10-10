"use client";

import { useState } from "react";
import { Check, ClipboardCopy, Download, Link2, Printer, RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { PRICES_AS_OF } from "@/lib/calculator/pricing";
import { encodeState, MAX_SHARE_LENGTH, SHARE_PARAM } from "@/lib/calculator/share";
import { summaryCsv, summaryText } from "@/lib/calculator/summary";
import { COST_CATEGORIES } from "@/lib/calculator/types";
import { useCalc, useFmt } from "./context";
import { CATEGORY_COLORS } from "./colors";
import { Warnings } from "./PricingSection";
import { Row } from "./ui";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure contexts.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function SummaryPanel({ description, onReset }: { description: string; onReset: () => void }) {
  const t = useT();
  const f = useFmt();
  const { inputs, results } = useCalc();
  const { m, build, unit } = results;
  const [status, setStatus] = useState<{ key: string; ok: boolean } | null>(null);

  const flash = (key: string, ok: boolean) => {
    setStatus({ key, ok });
    window.setTimeout(() => setStatus((s) => (s?.key === key ? null : s)), 2500);
  };

  async function copySummary() {
    flash("summary", await copyText(summaryText(inputs, results, t, f, description)));
  }

  function downloadCsv() {
    // BOM so spreadsheet apps read accented characters correctly.
    const blob = new Blob(["﻿" + summaryCsv(inputs, results, t)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-product-cost-estimate.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function share() {
    const code = await encodeState(inputs, description);
    if (code.length > MAX_SHARE_LENGTH) {
      flash("share", false);
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}#${SHARE_PARAM}=${code}`;
    try {
      window.history.replaceState(null, "", url);
    } catch {
      /* ignore */
    }
    flash("share", await copyText(url));
  }

  const gm = m.grossMarginPct;
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#D2DCE8] bg-white px-3 py-2 font-dm text-sm font-semibold text-[#1B3A6B] hover:border-[#2251A3] hover:bg-[#F4F7FB] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2251A3]";
  const label = (key: string, text: string) =>
    status?.key === key ? (
      <>
        <Check size={16} aria-hidden className={status.ok ? "text-[#166534]" : "text-[#B42318]"} />
        {status.ok ? t("calculator.export.copied") : t("calculator.export.failed")}
      </>
    ) : (
      text
    );

  return (
    <aside aria-labelledby="summary-title" className="calc-card bg-white border border-[#D2DCE8] rounded-2xl p-5 sm:p-6 lg:sticky lg:top-28">
      <div className="flex items-center justify-between gap-2">
        <h2 id="summary-title" className="font-syne font-bold text-lg text-[#0D1B2A]">
          {t("calculator.summary.title")}
        </h2>
        <span className="font-dm text-[11px] text-[#5B6B7F] bg-[#F4F7FB] rounded-full px-2 py-0.5">
          {t("calculator.summary.pricesAsOf", { date: f.month(PRICES_AS_OF) })}
        </span>
      </div>

      <p className="font-dm text-xs text-[#5B6B7F] mt-3">{t("calculator.summary.monthlyRunning")}</p>
      <p className="font-syne font-extrabold text-4xl text-[#1B3A6B] tabular-nums mt-0.5" aria-live="polite">
        {f.money(m.total)}
      </p>
      <p className="font-dm text-xs text-[#5B6B7F] mt-1">
        {t("calculator.summary.perUserLine", { perUser: f.moneyPrecise(unit.costPerUser), perInteraction: f.moneyPrecise(m.ai.perInteraction) })}
      </p>

      <div className="mt-4 space-y-1.5">
        {COST_CATEGORIES.map((c) => (
          <div key={c} className="flex items-center justify-between gap-3 font-dm text-sm text-[#3A4A5C]">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CATEGORY_COLORS[c] }} aria-hidden />
              {t(`calculator.cat.${c}`)}
            </span>
            <span className="tabular-nums whitespace-nowrap shrink-0">{f.money(m.categories[c])}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[#E4EAF2] space-y-1.5">
        <Row label={t("calculator.pricing.revenue")} value={f.money(m.revenue)} />
        <Row label={t("calculator.pricing.grossMargin")} value={gm === null ? "-" : f.pct(gm)} strong />
        <Row label={t("calculator.pricing.profit")} value={f.money(m.profit)} />
        <Row
          label={t("calculator.pricing.breakEven")}
          value={unit.breakEvenUsers === null ? t("calculator.na") : f.num(unit.breakEvenUsers)}
          muted
        />
      </div>

      <div className="mt-4 pt-4 border-t border-[#E4EAF2]">
        <p className="font-dm text-xs text-[#5B6B7F]">{t("calculator.summary.buildLabel")}</p>
        <p className="font-syne font-bold text-2xl text-[#0D1B2A] tabular-nums">{f.money0(build.likely)}</p>
        <p className="font-dm text-xs text-[#5B6B7F]">
          {t("calculator.summary.buildRange", { low: f.money0(build.low), high: f.money0(build.high) })}
        </p>
        {unit.targetPrice && (
          <p className="font-dm text-xs text-[#3A4A5C] mt-2">
            {t("calculator.summary.priceHint", {
              target: f.pct(inputs.targetMarginPct),
              price: f.money(unit.targetPrice),
              unit: t(`calculator.unit.${inputs.pricingMode}`),
            })}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Warnings compact />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-5 no-print">
        <button type="button" onClick={copySummary} className={btn}>
          {status?.key === "summary" ? null : <ClipboardCopy size={16} aria-hidden />}
          {label("summary", t("calculator.export.copy"))}
        </button>
        <button type="button" onClick={downloadCsv} className={btn}>
          <Download size={16} aria-hidden />
          {t("calculator.export.csv")}
        </button>
        <button type="button" onClick={() => window.print()} className={btn}>
          <Printer size={16} aria-hidden />
          {t("calculator.export.print")}
        </button>
        <button type="button" onClick={share} className={btn}>
          {status?.key === "share" ? null : <Link2 size={16} aria-hidden />}
          {label("share", t("calculator.export.share"))}
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 mt-3 no-print">
        <p className="font-dm text-[11px] text-[#7A8FA6]">{t("calculator.export.saved")}</p>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1 font-dm text-xs text-[#5B6B7F] hover:text-[#B42318]">
          <RotateCcw size={12} aria-hidden />
          {t("calculator.export.reset")}
        </button>
      </div>
      <p role="status" className="sr-only">
        {status ? (status.ok ? t("calculator.export.copied") : t("calculator.export.failed")) : ""}
      </p>
    </aside>
  );
}
