"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2, Lock, CalendarCheck, FileText } from "lucide-react";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import { trackPageVisit, trackToolUse } from "@/lib/recommendations";
import { useLocale, useT } from "@/lib/i18n/client";

// The Website Scanner. The scan runs on the server (/api/scanner/audit), which
// measures, scores and saves it and answers with a report token; the report
// lives at /tools/scanner/report/<token> (components/scanner/ReportView.tsx).
// Each site gets two free scans per 30 days; past that this page offers the
// paid report (which scans then), a free call, or the visitor's own reports.

/** Progress messages: tools.scanner.stage.0 … 5. */
const SCAN_STAGES = 6;

interface Limit {
  domain: string;
  resetAt: string;
  price: string | null;
  message: string;
}

interface Recent {
  domain: string;
  token: string;
  at: number;
}

export default function ScannerPage() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  useEffect(() => {
    trackPageVisit("/tools/scanner");
    trackToolUse("scanner");
  }, []);

  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [limit, setLimit] = useState<Limit | null>(null);
  const [buying, setBuying] = useState(false);
  const [recent, setRecent] = useState<Recent[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("tib:scanner:reports") ?? "[]") as Recent[];
      if (Array.isArray(list)) setRecent(list.filter((r) => r && typeof r.token === "string" && typeof r.domain === "string").slice(0, 5));
    } catch {
      /* storage blocked */
    }
  }, []);

  // The home page quick scan used to link here as /tools/scanner?url=…; a
  // link like that still runs the scan on arrival.
  useEffect(() => {
    const handed = new URLSearchParams(window.location.search).get("url");
    if (handed && handed.length < 500) {
      setUrl(handed);
      void runScan(handed);
    }
    // Runs once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  async function runScan(rawUrl: string, purchase = false) {
    const target = rawUrl.trim();
    if (!target) return;
    setScanError(null);
    if (!purchase) setLimit(null);
    setScanning(true);
    setStage(0);
    let n = 0;
    intervalRef.current = setInterval(() => {
      n += 1;
      if (n <= 5) setStage(n);
    }, 1100);
    try {
      const res = await fetch("/api/scanner/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, from: window.location.pathname, ...(purchase ? { purchase: true } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402 && data?.code === "limit") {
        setLimit({ domain: data.domain, resetAt: data.resetAt, price: data.price, message: data.error });
        return;
      }
      if (!res.ok) throw new Error(typeof data?.error === "string" && data.error ? data.error : t("tools.scanner.failed"));
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      const view = data.view;
      window.dispatchEvent(
        new CustomEvent("tibo:scan-complete", {
          detail: { url: view?.domain ?? target, overallScore: data.overallScore, criticals: view?.counts ? Object.values(view.counts as Record<string, { bad: number }>).reduce((a, c) => a + c.bad, 0) : 0, aiScore: data.aiScore },
        }),
      );
      router.push(`/tools/scanner/report/${data.token}`);
    } catch (err) {
      setScanError(err instanceof Error && err.message ? err.message : t("tools.scanner.failed"));
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setScanning(false);
      setBuying(false);
    }
  }

  const resetDate = limit ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(limit.resetAt)) : "";
  const mine = limit ? recent.filter((r) => r.domain === limit.domain) : [];

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="section-tag">{t("tools.scanner.tag")}</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2 break-words">{t("tools.scanner.title")}</h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-3 max-w-xl mx-auto">{t("tools.scanner.subtitle")}</p>
          <p className="font-dm text-sm text-[#7A8FA6] mt-2">{t("tools.sr.page.free")}</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void runScan(url); }} className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 mb-12">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
            <input
              type="text" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder={t("tools.scanner.placeholder")} aria-label={t("tools.scanner.urlLabel")}
              className="w-full pl-10 pr-4 py-3 border border-[#D2DCE8] focus:border-[#2251A3] rounded-xl outline-none focus:ring-2 focus:ring-[#2251A3]/20 font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] bg-white transition-all duration-200 text-sm"
              disabled={scanning}
            />
          </div>
          <button type="submit" data-track="cta-scan-site" disabled={scanning || !url.trim()} className="btn-primary justify-center px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            {scanning ? (<><Loader2 size={16} className="animate-spin" />{t("tools.scanner.scanning")}</>) : t("tools.scanner.scan")}
          </button>
        </form>

        {scanError && !scanning && (
          <div className="max-w-xl mx-auto mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center" role="alert">
            <p className="font-syne font-bold text-[#0D1B2A]">{t("tools.scanner.failedTitle")}</p>
            <p className="font-dm text-sm text-[#7A8FA6] mt-1">{scanError}</p>
          </div>
        )}

        {scanning && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-[#EBF0FA]" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2251A3] animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#F47C20] animate-spin [animation-duration:1.4s]" />
            </div>
            <div className="text-center">
              <p className="font-syne font-semibold text-[#0D1B2A] text-lg">{t(`tools.scanner.stage.${Math.min(stage, SCAN_STAGES - 1)}`)}</p>
              <p className="font-dm text-sm text-[#7A8FA6] mt-1">{t("tools.scanner.step", { n: Math.min(stage + 1, SCAN_STAGES), total: SCAN_STAGES })}</p>
            </div>
          </div>
        )}

        {limit && !scanning && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#D2DCE8] bg-white p-6 sm:p-8" data-testid="scan-limit">
            <Lock className="text-[#1B3A6B]" size={26} aria-hidden />
            <h2 className="mt-3 font-syne text-xl font-bold text-[#0D1B2A]">{limit.message}</h2>
            <p className="mt-2 font-dm text-sm text-[#3A4A5C]">{t("tools.sr.limit.body", { date: resetDate })}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {limit.price && (
                <button
                  type="button" disabled={buying}
                  onClick={() => { setBuying(true); void runScan(url || limit.domain, true); }}
                  className="btn-primary justify-center rounded-xl px-5 py-3" data-testid="limit-buy" data-track="cta-buy-scan-report"
                >
                  {buying ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} aria-hidden />} {t("tools.sr.limit.buy", { price: limit.price })}
                </button>
              )}
              <Link href="/book" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1B3A6B] px-5 py-3 font-dm text-sm font-semibold text-[#1B3A6B] hover:bg-[#EBF0FA]">
                <CalendarCheck size={16} aria-hidden /> {t("tools.sr.limit.call")}
              </Link>
            </div>
            {mine.length > 0 && (
              <div className="mt-6">
                <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{t("tools.sr.limit.yours")}</p>
                <ul className="mt-2 space-y-1.5">
                  {mine.map((r) => (
                    <li key={r.token}>
                      <Link href={`/tools/scanner/report/${r.token}`} className="inline-flex items-center gap-1.5 font-dm text-sm text-[#2251A3] hover:underline">
                        <FileText size={14} aria-hidden /> {r.domain} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(r.at))}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-dm text-xs text-[#7A8FA6]">{t("tools.sr.limit.rescanHint")}</p>
              </div>
            )}
          </div>
        )}

        {!scanning && !limit && recent.length > 0 && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#D2DCE8] bg-white p-5" data-testid="recent-reports">
            <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{t("tools.sr.recent")}</p>
            <ul className="mt-2 space-y-1.5">
              {recent.map((r) => (
                <li key={r.token}>
                  <Link href={`/tools/scanner/report/${r.token}`} className="inline-flex items-center gap-1.5 font-dm text-sm text-[#2251A3] hover:underline">
                    <FileText size={14} aria-hidden /> {r.domain} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(r.at))}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12">
          <SmartRecommendations currentPage="/tools/scanner" compact />
        </div>
      </div>
    </div>
  );
}
