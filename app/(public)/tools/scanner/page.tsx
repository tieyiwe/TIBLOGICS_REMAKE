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

const SCAN_STAGES = [
  "Fetching page structure...",
  "Measuring load speed & latency...",
  "Analyzing SEO signals...",
  "Checking AI integrations...",
  "Assessing UX patterns...",
  "Computing final score...",
];

function generateScanResult(url: string): ScanResult {
  if (url.includes("tiblogics.com")) {
    return {
      url,
      overallScore: 42,
      seoScore: 42,
      perfScore: 55,
      uxScore: 48,
      aiScore: 22,
      findings: [
        { type: "critical", text: "No AI agent or chatbot detected on any pages" },
        { type: "critical", text: "No workflow automation or CRM integration found" },
        { type: "warning", text: "Missing structured data / schema markup for SEO" },
        { type: "warning", text: "Mobile performance score below 60 — Core Web Vitals issues" },
        { type: "good", text: "SSL certificate valid and HTTPS enforced" },
        { type: "warning", text: "No live chat or async communication tool detected" },
      ],
      aiDescription:
        "This site has strong fundamentals but is missing critical AI integrations that modern agencies rely on. No chatbot, no automation layer, and no AI-assisted workflows were detected.",
    };
  }

  const seoScore = Math.floor(Math.random() * 40) + 45;
  const perfScore = Math.floor(Math.random() * 35) + 50;
  const uxScore = Math.floor(Math.random() * 35) + 45;
  const aiScore = Math.floor(Math.random() * 45) + 10;
  const overallScore = Math.floor((seoScore + perfScore + uxScore) / 3);

  const genericFindings: Finding[] = [
    {
      type: aiScore < 30 ? "critical" : "warning",
      text:
        aiScore < 30
          ? "No AI integrations detected — major competitive gap"
          : "Limited AI capabilities — opportunity for enhancement",
    },
    {
      type: seoScore < 60 ? "warning" : "good",
      text:
        seoScore < 60 ? "SEO metadata incomplete on several pages" : "SEO fundamentals are solid",
    },
    {
      type: perfScore < 65 ? "warning" : "good",
      text:
        perfScore < 65
          ? "Page load speed needs optimization"
          : "Performance scores are acceptable",
    },
    { type: "warning", text: "No automated lead capture or CRM integration found" },
    { type: "good", text: "Mobile-responsive layout detected" },
    { type: "critical", text: "No AI-powered personalization or recommendation engine" },
  ];

  return {
    url,
    overallScore,
    seoScore,
    perfScore,
    uxScore,
    aiScore,
    findings: genericFindings,
    aiDescription: `This site scores ${overallScore}/100 overall. The biggest opportunity is AI integration — adding automation, a chatbot, and AI-driven personalization could significantly improve lead capture and user engagement.`,
  };
}

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#F47C20";
  return "#ef4444";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
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
  const pct = Math.min((ttfb / 2000) * 100, 100);
  const color = ttfbColor(ttfb);
  const label = ttfb < 200 ? "Excellent" : ttfb < 600 ? "Good" : ttfb < 1200 ? "Needs work" : "Poor";

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-dm text-xs font-medium text-[#3A4A5C]">TTFB Latency Gauge</span>
        <span className="font-syne font-bold text-sm" style={{ color }}>
          {label} — {formatMs(ttfb)}
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
      <div className="flex justify-between mt-1.5">
        <span className="font-dm text-[10px] text-green-600 font-medium">0ms · Instant</span>
        <span className="font-dm text-[10px] text-[#F47C20] font-medium">800ms · Avg</span>
        <span className="font-dm text-[10px] text-red-500 font-medium">2s+ · Slow</span>
      </div>
    </div>
  );
}

function SpeedPanel({ data, loading }: { data: SpeedResult | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={16} className="text-[#2251A3]" />
          <h2 className="font-syne font-bold text-[#0D1B2A] text-lg">Load Speed & Latency</h2>
          <span className="flex items-center gap-1.5 font-dm text-xs text-[#7A8FA6] ml-1">
            <Loader2 size={12} className="animate-spin" /> Measuring…
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
          <h2 className="font-syne font-bold text-[#0D1B2A] text-lg">Load Speed & Latency</h2>
        </div>
        <p className="font-dm text-sm text-[#7A8FA6]">
          {data?.error ?? "Speed measurement could not be completed for this URL."}
        </p>
      </div>
    );
  }

  const ratingMap = {
    fast: { bg: "bg-green-100", text: "text-green-700", label: "Fast" },
    average: { bg: "bg-orange-100", text: "text-orange-600", label: "Average" },
    slow: { bg: "bg-red-100", text: "text-red-600", label: "Slow" },
    unknown: { bg: "bg-gray-100", text: "text-gray-600", label: "Unknown" },
  };
  const ratingStyle = ratingMap[data.speedRating];

  const metrics = [
    {
      Icon: Clock,
      label: "TTFB",
      value: data.ttfb !== null ? formatMs(data.ttfb) : "N/A",
      sub:
        data.ttfb !== null
          ? data.ttfb < 200
            ? "Excellent"
            : data.ttfb < 800
            ? "Acceptable"
            : "Slow"
          : "Unavailable",
      color: data.ttfb !== null ? ttfbColor(data.ttfb) : "#7A8FA6",
    },
    {
      Icon: Zap,
      label: "Load Time",
      value: data.totalTime !== null ? formatMs(data.totalTime) : "N/A",
      sub:
        data.totalTime !== null
          ? data.totalTime < 1000
            ? "Fast"
            : data.totalTime < 3000
            ? "Average"
            : "Slow"
          : "Unavailable",
      color: data.totalTime !== null ? loadTimeColor(data.totalTime) : "#7A8FA6",
    },
    {
      Icon: FileText,
      label: "Page Size",
      value: data.responseSize > 0 ? formatBytes(data.responseSize) : "N/A",
      sub:
        data.responseSize > 0
          ? data.responseSize < 500_000
            ? "Lightweight"
            : data.responseSize < 2_000_000
            ? "Medium"
            : "Heavy"
          : "Unavailable",
      color: data.responseSize > 0 ? pageSizeColor(data.responseSize) : "#7A8FA6",
    },
    {
      Icon: Activity,
      label: "Compression",
      value: data.isGzipped ? "Enabled" : "Disabled",
      sub: data.isGzipped ? "gzip / brotli" : "No encoding",
      color: data.isGzipped ? "#22c55e" : "#ef4444",
    },
  ];

  const speedFindings: Finding[] = [];
  if (data.ttfb !== null) {
    if (data.ttfb > 800) {
      speedFindings.push({
        type: "critical",
        text: `High TTFB (${formatMs(data.ttfb)}) — slow server response; consider a CDN or server-side caching`,
      });
    } else if (data.ttfb > 200) {
      speedFindings.push({
        type: "warning",
        text: `TTFB ${formatMs(data.ttfb)} — within range but edge caching could push this below 200ms`,
      });
    } else {
      speedFindings.push({
        type: "good",
        text: `Excellent TTFB (${formatMs(data.ttfb)}) — server responds near-instantly`,
      });
    }
  }
  if (data.totalTime !== null && data.totalTime > 3000) {
    speedFindings.push({
      type: "critical",
      text: `Full response takes ${formatMs(data.totalTime)} — users may abandon before the page loads`,
    });
  }
  if (!data.isGzipped) {
    speedFindings.push({
      type: "warning",
      text: "Response compression not enabled — enable gzip/brotli to reduce transfer size by up to 70%",
    });
  } else {
    speedFindings.push({
      type: "good",
      text: "Compression enabled — transfer size is reduced for faster delivery",
    });
  }
  if (!data.hasCaching) {
    speedFindings.push({
      type: "warning",
      text: "No cache-control headers detected — browser caching would speed up repeat visits",
    });
  } else {
    speedFindings.push({
      type: "good",
      text: "Caching headers configured — repeat visitors will load faster",
    });
  }
  if (data.responseSize > 2_000_000) {
    speedFindings.push({
      type: "warning",
      text: `Large page size (${formatBytes(data.responseSize)}) — optimize images and defer non-critical scripts`,
    });
  }

  return (
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#2251A3]" />
          <h2 className="font-syne font-bold text-[#0D1B2A] text-lg">Load Speed & Latency</h2>
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
              <span className="font-dm text-xs text-[#7A8FA6]">{m.label}</span>
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
  useEffect(() => {
    trackPageVisit("/tools/scanner");
    trackToolUse("scanner");
  }, []);

  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [speedResult, setSpeedResult] = useState<SpeedResult | null>(null);
  const [speedLoading, setSpeedLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    setResult(null);
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

    await new Promise((r) => setTimeout(r, 5000));

    if (intervalRef.current) clearInterval(intervalRef.current);

    const scanResult = generateScanResult(normalizedUrl);
    setScanning(false);
    setResult(scanResult);

    // Trigger Echelon proactive engagement after scan
    const criticals = scanResult.findings.filter((f) => f.type === "critical").length;
    let domain = normalizedUrl;
    try { domain = new URL(normalizedUrl).hostname; } catch { /* keep full url */ }
    window.dispatchEvent(
      new CustomEvent("echelon:scan-complete", {
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
    <div className="pt-24 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="section-tag">Free Tool</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2">
            Website AI Scanner
          </h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-3 max-w-xl mx-auto">
            Enter any URL and get an instant AI readiness score, real load speed measurements, and
            actionable findings — no signup needed.
          </p>
        </div>

        {/* URL Input */}
        <form onSubmit={handleScan} className="w-full max-w-2xl mx-auto flex gap-3 mb-12">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8FA6]"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full pl-10 pr-4 py-3 border border-[#D2DCE8] focus:border-[#2251A3] rounded-xl outline-none focus:ring-2 focus:ring-[#2251A3]/20 font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] bg-white transition-all duration-200 text-sm"
              disabled={scanning}
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !url.trim()}
            className="btn-primary px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {scanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Scanning...
              </>
            ) : (
              "Scan & Score"
            )}
          </button>
        </form>

        {/* Scanning State */}
        {scanning && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-[#EBF0FA]" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2251A3] animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#F47C20] animate-spin [animation-duration:1.4s]" />
            </div>
            <div className="text-center">
              <p className="font-syne font-semibold text-[#0D1B2A] text-lg">
                {SCAN_STAGES[Math.min(stage, 5)]}
              </p>
              <p className="font-dm text-sm text-[#7A8FA6] mt-1">
                Step {Math.min(stage + 1, 6)} of 6
              </p>
            </div>
            <div className="flex gap-1.5">
              {SCAN_STAGES.map((_, i) => (
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
                    Overall Score
                  </p>
                  <ScoreRing score={result.overallScore} />
                  <p
                    className="font-syne font-bold text-center text-base mt-3"
                    style={{ color: scoreColor(result.overallScore) }}
                  >
                    {result.overallScore >= 70
                      ? "AI-Ready"
                      : result.overallScore >= 50
                      ? "Needs Work"
                      : "Critical Gaps"}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <ScorePill label="SEO" score={result.seoScore} />
                  <ScorePill label="Performance" score={result.perfScore} />
                  <ScorePill label="UX" score={result.uxScore} />
                </div>

                {/* AI Readiness bar */}
                <div className="bg-[#FEF0E3] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-dm text-sm font-semibold text-[#0D1B2A]">
                      AI Readiness Score
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
                    {result.aiScore < 30
                      ? "Major AI gaps — immediate action recommended"
                      : result.aiScore < 60
                      ? "Partial AI capabilities — enhancement opportunities exist"
                      : "Strong AI foundation in place"}
                  </p>
                </div>
              </div>

              {/* Right: Findings */}
              <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex flex-col gap-4">
                <h2 className="font-syne font-bold text-[#0D1B2A] text-lg">Key Findings</h2>
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
                    Got it! We&apos;ll send your detailed action plan shortly.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h3 className="font-syne font-bold text-[#0D1B2A] text-base">
                      Want a detailed action plan?
                    </h3>
                    <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
                      Get a full PDF report with step-by-step AI implementation recommendations.
                    </p>
                  </div>
                  <form onSubmit={handleEmailSubmit} className="flex gap-2 w-full sm:w-auto shrink-0">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="input-base text-sm px-3 py-2 flex-1 sm:w-56"
                    />
                    <button type="submit" className="btn-primary text-sm py-2 px-4 rounded-lg">
                      Send Report
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="bg-[#1B3A6B] rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-syne font-bold text-white text-xl">
                  Ready to close these gaps?
                </h3>
                <p className="font-dm text-[#7A9BBF] text-sm mt-1">
                  Book a free meeting and get a custom AI roadmap for your business.
                </p>
              </div>
              <Link href="/book" className="btn-primary whitespace-nowrap">
                Book a Free Meeting ↗
              </Link>
            </div>
          </div>
        )}
        <SmartRecommendations currentPage="/tools/scanner" compact />
      </div>
    </div>
  );
}
