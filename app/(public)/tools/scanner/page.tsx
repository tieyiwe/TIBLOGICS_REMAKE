"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Zap,
  Clock,
  FileText,
  Activity,
} from "lucide-react";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import { trackPageVisit, trackToolUse } from "@/lib/recommendations";
import { useLocale, useT } from "@/lib/i18n/client";
import type { Locale, Vars } from "@/lib/i18n/config";

type T = (key: string, vars?: Vars) => string;

interface Finding {
  type: "critical" | "warning" | "good";
  text: string;
}

interface ScanResult {
  url: string;
  overallScore: number;
  seoScore: number;
  perfScore: number;
  uxScore: number;
  aiScore: number;
  findings: Finding[];
  aiDescription: string;
}

/** One honest paragraph, assembled from what was measured. */
function describeResult(t: T, locale: Locale, d: {
  overallScore: number; aiScore: number; perfScore: number; seoScore: number;
  measured?: { schemaTypes?: string[]; ttfb?: number | null; imagesWithAlt?: number; imagesTotal?: number };
}): string {
  const m = d.measured ?? {};
  const nf = new Intl.NumberFormat(locale);
  const parts: string[] = [];

  parts.push(
    d.overallScore >= 80 ? t("tools.scanner.desc.good")
      : d.overallScore >= 60 ? t("tools.scanner.desc.solid")
      : t("tools.scanner.desc.gaps"),
  );

  if ((m.schemaTypes?.length ?? 0) > 0) {
    parts.push(t("tools.scanner.desc.schema", { types: m.schemaTypes!.slice(0, 3).join(", ") }));
  } else {
    parts.push(t("tools.scanner.desc.noSchema"));
  }

  if (typeof m.ttfb === "number") {
    parts.push(t(m.ttfb < 600 ? "tools.scanner.desc.fast" : "tools.scanner.desc.slow", { ms: nf.format(m.ttfb) }));
  }

  if (m.imagesTotal && m.imagesWithAlt !== undefined && m.imagesWithAlt < m.imagesTotal) {
    const n = m.imagesTotal - m.imagesWithAlt;
    parts.push(n === 1 ? t("tools.scanner.desc.alt.one") : t("tools.scanner.desc.alt.other", { n: nf.format(n) }));
  }

  return parts.join(" ");
}

interface SpeedResult {
  ttfb: number | null;
  totalTime: number | null;
  responseSize: number;
  isGzipped: boolean;
  hasCaching: boolean;
  statusCode: number;
  speedRating: "fast" | "average" | "slow" | "unknown";
  error: string | null;
}

/** Progress messages: tools.scanner.stage.0 … 5. */
const SCAN_STAGES = 6;

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#F47C20";
  return "#ef4444";
}

function formatBytes(t: T, locale: Locale, bytes: number): string {
  const one = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (bytes < 1024) return `${new Intl.NumberFormat(locale).format(bytes)} ${t("tools.unit.b")}`;
  if (bytes < 1024 * 1024) return `${one.format(bytes / 1024)} ${t("tools.unit.kb")}`;
  return `${one.format(bytes / (1024 * 1024))} ${t("tools.unit.mb")}`;
}

function formatMs(locale: Locale, ms: number): string {
  if (ms < 1000) return `${new Intl.NumberFormat(locale).format(ms)} ms`;
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ms / 1000)} s`;
}

function ttfbColor(ms: number): string {
  if (ms < 200) return "#22c55e";
  if (ms < 800) return "#F47C20";
  return "#ef4444";
}

function loadTimeColor(ms: number): string {
  if (ms < 1000) return "#22c55e";
  if (ms < 3000) return "#F47C20";
  return "#ef4444";
}

function pageSizeColor(bytes: number): string {
  if (bytes < 500 * 1024) return "#22c55e";
  if (bytes < 2 * 1024 * 1024) return "#F47C20";
  return "#ef4444";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#E8EFF8" strokeWidth="12" />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-syne font-extrabold text-3xl text-[#0D1B2A]">{score}</span>
        <span className="font-dm text-xs text-[#7A8FA6]">/ 100</span>
      </div>
    </div>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="font-dm text-xs text-[#7A8FA6]">{label}</span>
        <span className="font-dm text-xs font-semibold" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="h-1.5 bg-[#E8EFF8] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  if (finding.type === "critical") {
    return (
      <div className="flex items-start gap-3">
        <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
        <span className="font-dm text-sm text-[#3A4A5C]">{finding.text}</span>
      </div>
    );
  }
  if (finding.type === "warning") {
    return (
      <div className="flex items-start gap-3">
        <AlertTriangle size={16} className="text-[#F47C20] mt-0.5 shrink-0" />
        <span className="font-dm text-sm text-[#3A4A5C]">{finding.text}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
      <span className="font-dm text-sm text-[#3A4A5C]">{finding.text}</span>
    </div>
  );
}

function LatencyGauge({ ttfb }: { ttfb: number }) {
  const t = useT();
  const locale = useLocale();
  const pct = Math.min((ttfb / 2000) * 100, 100);
  const color = ttfbColor(ttfb);
  const label = t(`tools.speed.gauge.${ttfb < 200 ? "excellent" : ttfb < 600 ? "good" : ttfb < 1200 ? "work" : "poor"}`);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-x-3 mb-2">
        <span className="font-dm text-xs font-medium text-[#3A4A5C]">{t("tools.speed.gauge")}</span>
        <span className="font-syne font-bold text-sm" style={{ color }}>
          {label} · {formatMs(locale, ttfb)}
        </span>
      </div>
      <div className="relative h-4 rounded-full overflow-hidden bg-[#E8EFF8]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #22c55e 0%, #22c55e 10%, #F47C20 40%, #ef4444 100%)",
            opacity: 0.18,
          }}
        />
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between gap-2 mt-1.5">
        <span className="font-dm text-[10px] text-green-600 font-medium">0 ms · {t("tools.speed.gauge.instant")}</span>
        <span className="font-dm text-[10px] text-[#F47C20] font-medium text-center">800 ms · {t("tools.speed.gauge.avg")}</span>
        <span className="font-dm text-[10px] text-red-500 font-medium text-right">2 s+ · {t("tools.speed.gauge.slow")}</span>
      </div>
    </div>
  );
}

function SpeedPanel({ data, loading }: { data: SpeedResult | null; loading: boolean }) {
  const t = useT();
  const locale = useLocale();
  const ms = (v: number) => formatMs(locale, v);
  const bytes = (v: number) => formatBytes(t, locale, v);
  if (loading) {
    return (
      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={16} className="text-[#2251A3]" />
          <h2 className="font-syne font-bold text-[#0D1B2A] text-lg">{t("tools.speed.title")}</h2>
          <span className="flex items-center gap-1.5 font-dm text-xs text-[#7A8FA6] ml-1">
            <Loader2 size={12} className="animate-spin" /> {t("tools.speed.measuring")}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#F4F7FB] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-4 bg-[#F4F7FB] rounded-full animate-pulse" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={16} className="text-[#2251A3]" />
          <h2 className="font-syne font-bold text-[#0D1B2A] text-lg">{t("tools.speed.title")}</h2>
        </div>
        <p className="font-dm text-sm text-[#7A8FA6]">
          {data?.error ?? t("tools.speed.unavailable")}
        </p>
      </div>
    );
  }

  const ratingMap = {
    fast: { bg: "bg-green-100", text: "text-green-700", label: t("tools.speed.rating.fast") },
    average: { bg: "bg-orange-100", text: "text-orange-600", label: t("tools.speed.rating.average") },
    slow: { bg: "bg-red-100", text: "text-red-600", label: t("tools.speed.rating.slow") },
    unknown: { bg: "bg-gray-100", text: "text-gray-600", label: t("tools.speed.rating.unknown") },
  };
  const ratingStyle = ratingMap[data.speedRating];

  const sub = (k: string) => t(`tools.speed.sub.${k}`);
  const na = t("tools.speed.na");
  const metrics = [
    {
      Icon: Clock,
      label: t("tools.speed.ttfb"),
      value: data.ttfb !== null ? ms(data.ttfb) : na,
      sub: sub(data.ttfb !== null ? (data.ttfb < 200 ? "excellent" : data.ttfb < 800 ? "acceptable" : "slow") : "unavailable"),
      color: data.ttfb !== null ? ttfbColor(data.ttfb) : "#7A8FA6",
    },
    {
      Icon: Zap,
      label: t("tools.speed.loadTime"),
      value: data.totalTime !== null ? ms(data.totalTime) : na,
      sub: sub(data.totalTime !== null ? (data.totalTime < 1000 ? "fast" : data.totalTime < 3000 ? "average" : "slow") : "unavailable"),
      color: data.totalTime !== null ? loadTimeColor(data.totalTime) : "#7A8FA6",
    },
    {
      Icon: FileText,
      label: t("tools.speed.pageSize"),
      value: data.responseSize > 0 ? bytes(data.responseSize) : na,
      sub: sub(data.responseSize > 0 ? (data.responseSize < 500_000 ? "light" : data.responseSize < 2_000_000 ? "medium" : "heavy") : "unavailable"),
      color: data.responseSize > 0 ? pageSizeColor(data.responseSize) : "#7A8FA6",
    },
    {
      Icon: Activity,
      label: t("tools.speed.compression"),
      value: data.isGzipped ? t("tools.speed.enabled") : t("tools.speed.disabled"),
      sub: data.isGzipped ? "gzip / brotli" : t("tools.speed.noEncoding"),
      color: data.isGzipped ? "#22c55e" : "#ef4444",
    },
  ];

  const speedFindings: Finding[] = [];
  if (data.ttfb !== null) {
    if (data.ttfb > 800) {
      speedFindings.push({ type: "critical", text: t("tools.speed.f.ttfbHigh", { v: ms(data.ttfb) }) });
    } else if (data.ttfb > 200) {
      speedFindings.push({ type: "warning", text: t("tools.speed.f.ttfbMid", { v: ms(data.ttfb) }) });
    } else {
      speedFindings.push({ type: "good", text: t("tools.speed.f.ttfbGood", { v: ms(data.ttfb) }) });
    }
  }
  if (data.totalTime !== null && data.totalTime > 3000) {
    speedFindings.push({ type: "critical", text: t("tools.speed.f.slowTotal", { v: ms(data.totalTime) }) });
  }
  speedFindings.push(
    data.isGzipped
      ? { type: "good", text: t("tools.speed.f.compression") }
      : { type: "warning", text: t("tools.speed.f.noCompression") },
  );
  speedFindings.push(
    data.hasCaching
      ? { type: "good", text: t("tools.speed.f.cache") }
      : { type: "warning", text: t("tools.speed.f.noCache") },
  );
  if (data.responseSize > 2_000_000) {
    speedFindings.push({ type: "warning", text: t("tools.speed.f.large", { v: bytes(data.responseSize) }) });
  }

  return (
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#2251A3]" />
          <h2 className="font-syne font-bold text-[#0D1B2A] text-lg">{t("tools.speed.title")}</h2>
        </div>
        <span
          className={`font-dm font-semibold text-xs px-2.5 py-1 rounded-full ${ratingStyle.bg} ${ratingStyle.text}`}
        >
          {ratingStyle.label}
        </span>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {metrics.map((m) => (
          <div key={m.label} className="bg-[#F4F7FB] rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <m.Icon size={12} style={{ color: m.color }} />
              <span className="font-dm text-xs text-[#7A8FA6] break-words">{m.label}</span>
            </div>
            <span
              className="font-syne font-bold text-xl leading-none"
              style={{ color: m.color }}
            >
              {m.value}
            </span>
            <span className="font-dm text-[11px] text-[#7A8FA6] mt-0.5">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* TTFB gauge */}
      {data.ttfb !== null && (
        <div className="mb-4">
          <LatencyGauge ttfb={data.ttfb} />
        </div>
      )}

      {/* Speed findings */}
      {speedFindings.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-4 border-t border-[#E8EFF8]">
          {speedFindings.map((f, i) => (
            <FindingRow key={i} finding={f} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScannerPage() {
  const t = useT();
  const locale = useLocale();
  useEffect(() => {
    trackPageVisit("/tools/scanner");
    trackToolUse("scanner");
  }, []);

  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  // A scan that cannot reach the site has to say so. Silently showing nothing
  // reads as a broken tool.
  const [scanError, setScanError] = useState<string | null>(null);
  const [speedResult, setSpeedResult] = useState<SpeedResult | null>(null);
  const [speedLoading, setSpeedLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    await runScan(url);
  }

  // The home page hero runs a quick scan and links here for the full report
  // as /tools/scanner?url=… — pick that up and run it, so the visitor lands on
  // their result rather than on an empty form they have to fill in again.
  useEffect(() => {
    const handed = new URLSearchParams(window.location.search).get("url");
    if (handed && handed.length < 500) {
      setUrl(handed);
      void runScan(handed);
    }
    // Runs once on arrival; runScan is stable enough for that purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runScan(rawUrl: string) {
    if (!rawUrl.trim()) return;

    let normalizedUrl = rawUrl.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    setResult(null);
    setScanError(null);
    setSpeedResult(null);
    setSpeedLoading(true);
    setEmailSubmitted(false);
    setLeadId(null);
    setScanning(true);
    setStage(0);

    // Fire real speed test immediately, resolve async
    const speedPromise = fetch("/api/scanner/speed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: normalizedUrl }),
    });

    let currentStage = 0;
    intervalRef.current = setInterval(() => {
      currentStage += 1;
      if (currentStage <= 5) setStage(currentStage);
    }, 800);

    // The audit is the scan. The staged progress above is presentation; this
    // is the request that actually measures the site.
    let scanResult: ScanResult;
    try {
      const auditRes = await fetch("/api/scanner/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      const data = await auditRes.json();
      if (!auditRes.ok) throw new Error(data?.error || t("tools.scanner.failed"));

      scanResult = {
        url: data.url ?? normalizedUrl,
        overallScore: data.overallScore,
        seoScore: data.seoScore,
        perfScore: data.perfScore,
        uxScore: data.uxScore,
        aiScore: data.aiScore,
        // The engine grades bad/warning/good; this UI has always said "critical".
        findings: (data.findings ?? []).map((f: { type: string; text: string }) => ({
          type: f.type === "bad" ? "critical" : (f.type as "warning" | "good"),
          text: f.text,
        })),
        aiDescription: describeResult(t, locale, data),
      };
    } catch (err) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setScanning(false);
      // A network failure has no useful message of its own.
      setScanError(err instanceof Error && err.name === "Error" ? err.message : t("tools.scanner.failed"));
      setSpeedLoading(false);
      return;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);
    setScanning(false);
    setResult(scanResult);

    // Trigger Echelon proactive engagement after scan
    const criticals = scanResult.findings.filter((f) => f.type === "critical").length;
    let domain = normalizedUrl;
    try { domain = new URL(normalizedUrl).hostname; } catch { /* keep full url */ }
    window.dispatchEvent(
      new CustomEvent("tibo:scan-complete", {
        detail: { url: domain, overallScore: scanResult.overallScore, criticals, aiScore: scanResult.aiScore },
      })
    );

    // Resolve speed data (may still be in-flight)
    speedPromise
      .then(async (res) => {
        if (res.ok) setSpeedResult(await res.json());
      })
      .catch(() => {})
      .finally(() => setSpeedLoading(false));

    try {
      const res = await fetch("/api/scanner-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scanResult),
      });
      if (res.ok) {
        const data = await res.json();
        setLeadId(data.id ?? null);
      }
    } catch {
      // Non-blocking
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !leadId) return;
    try {
      await fetch(`/api/scanner-leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Non-blocking
    }
    setEmailSubmitted(true);
  }

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="section-tag">{t("tools.scanner.tag")}</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2 break-words">
            {t("tools.scanner.title")}
          </h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-3 max-w-xl mx-auto">
            {t("tools.scanner.subtitle")}
          </p>
        </div>

        {/* URL Input */}
        <form onSubmit={handleScan} className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 mb-12">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8FA6]"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("tools.scanner.placeholder")}
              aria-label={t("tools.scanner.urlLabel")}
              className="w-full pl-10 pr-4 py-3 border border-[#D2DCE8] focus:border-[#2251A3] rounded-xl outline-none focus:ring-2 focus:ring-[#2251A3]/20 font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] bg-white transition-all duration-200 text-sm"
              disabled={scanning}
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !url.trim()}
            className="btn-primary justify-center px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {scanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("tools.scanner.scanning")}
              </>
            ) : (
              t("tools.scanner.scan")
            )}
          </button>
        </form>

        {/* Scanning State */}
        {scanError && !scanning && (
          <div className="max-w-xl mx-auto mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center">
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
              <p className="font-syne font-semibold text-[#0D1B2A] text-lg">
                {t(`tools.scanner.stage.${Math.min(stage, SCAN_STAGES - 1)}`)}
              </p>
              <p className="font-dm text-sm text-[#7A8FA6] mt-1">
                {t("tools.scanner.step", { n: Math.min(stage + 1, SCAN_STAGES), total: SCAN_STAGES })}
              </p>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: SCAN_STAGES }, (_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: i <= stage ? "#2251A3" : "#D2DCE8" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !scanning && (
          <div className="space-y-6">
            {/* Score + Findings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Scores */}
              <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex flex-col gap-5">
                <div>
                  <p className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider mb-3 text-center">
                    {t("tools.scanner.overall")}
                  </p>
                  <ScoreRing score={result.overallScore} />
                  <p
                    className="font-syne font-bold text-center text-base mt-3"
                    style={{ color: scoreColor(result.overallScore) }}
                  >
                    {t(`tools.scanner.verdict.${result.overallScore >= 70 ? "ready" : result.overallScore >= 50 ? "work" : "critical"}`)}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <ScorePill label={t("tools.scanner.pill.seo")} score={result.seoScore} />
                  <ScorePill label={t("tools.scanner.pill.perf")} score={result.perfScore} />
                  <ScorePill label={t("tools.scanner.pill.ux")} score={result.uxScore} />
                </div>

                {/* AI Readiness bar */}
                <div className="bg-[#FEF0E3] rounded-xl p-4">
                  <div className="flex justify-between items-center gap-3 mb-2">
                    <span className="font-dm text-sm font-semibold text-[#0D1B2A]">
                      {t("tools.scanner.aiScore")}
                    </span>
                    <span className="font-syne font-bold text-[#F47C20] text-lg">
                      {result.aiScore}
                      <span className="text-sm font-dm font-normal text-[#7A8FA6]">/100</span>
                    </span>
                  </div>
                  <div className="h-3 bg-[#D2DCE8] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${result.aiScore}%`, backgroundColor: "#F47C20" }}
                    />
                  </div>
                  <p className="font-dm text-xs text-[#7A8FA6] mt-2">
                    {t(`tools.scanner.ai.${result.aiScore < 30 ? "low" : result.aiScore < 60 ? "mid" : "high"}`)}
                  </p>
                </div>
              </div>

              {/* Right: Findings */}
              <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex flex-col gap-4">
                <h2 className="font-syne font-bold text-[#0D1B2A] text-lg">{t("tools.scanner.findings")}</h2>
                <div className="flex flex-col gap-3">
                  {result.findings.map((f, i) => (
                    <FindingRow key={i} finding={f} />
                  ))}
                </div>
                <div className="mt-2 pt-4 border-t border-[#E8EFF8]">
                  <p className="font-dm text-sm text-[#3A4A5C] italic leading-relaxed">
                    &ldquo;{result.aiDescription}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Speed & Latency Panel */}
            <SpeedPanel data={speedResult} loading={speedLoading} />

            {/* Email Capture */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
              {emailSubmitted ? (
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle2 size={20} />
                  <p className="font-dm font-medium">
                    {t("tools.scanner.email.done")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h3 className="font-syne font-bold text-[#0D1B2A] text-base">
                      {t("tools.scanner.email.title")}
                    </h3>
                    <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
                      {t("tools.scanner.email.body")}
                    </p>
                  </div>
                  <form onSubmit={handleEmailSubmit} className="flex gap-2 w-full sm:w-auto shrink-0">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("tools.scanner.email.placeholder")}
                      aria-label={t("tools.common.yourEmail")}
                      required
                      className="input-base text-sm px-3 py-2 flex-1 min-w-0 sm:w-56"
                    />
                    <button type="submit" className="btn-primary text-sm py-2 px-4 rounded-lg shrink-0">
                      {t("tools.scanner.email.send")}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="bg-[#1B3A6B] rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-syne font-bold text-white text-xl">
                  {t("tools.scanner.cta.title")}
                </h3>
                <p className="font-dm text-[#7A9BBF] text-sm mt-1">
                  {t("tools.scanner.cta.body")}
                </p>
              </div>
              <Link href="/book" className="btn-primary justify-center text-center shrink-0">
                {t("tools.scanner.cta.button")}
              </Link>
            </div>

            <Link
              href="/tools/readiness-monitor"
              className="block bg-white border border-[#D2DCE8] rounded-2xl p-5 hover:border-[#B8500A] transition-colors"
            >
              <p className="font-syne font-bold text-[#0D1B2A] text-base">
                {t("tools.scanner.monitor.q")} <span className="text-[#B8500A]">Readiness Monitor →</span>
              </p>
              <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
                {t("tools.scanner.monitor.body")}
              </p>
            </Link>
          </div>
        )}
        <SmartRecommendations currentPage="/tools/scanner" compact />
      </div>
    </div>
  );
}
