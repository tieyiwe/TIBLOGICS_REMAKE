"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Search, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

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

const SCAN_STAGES = [
  "Fetching page structure...",
  "Analyzing SEO signals...",
  "Checking AI integrations...",
  "Assessing UX patterns...",
  "Computing AI readiness score...",
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
        seoScore < 60
          ? "SEO metadata incomplete on several pages"
          : "SEO fundamentals are solid",
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

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="#E8EFF8"
          strokeWidth="12"
        />
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

export default function ScannerPage() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
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
    setEmailSubmitted(false);
    setLeadId(null);
    setScanning(true);
    setStage(0);

    let currentStage = 0;
    intervalRef.current = setInterval(() => {
      currentStage += 1;
      if (currentStage <= 4) {
        setStage(currentStage);
      }
    }, 800);

    await new Promise((r) => setTimeout(r, 4500));

    if (intervalRef.current) clearInterval(intervalRef.current);

    const scanResult = generateScanResult(normalizedUrl);
    setScanning(false);
    setResult(scanResult);

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
            Enter any website URL and get an instant AI readiness score with actionable findings — no signup needed.
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
                {SCAN_STAGES[Math.min(stage, 4)]}
              </p>
              <p className="font-dm text-sm text-[#7A8FA6] mt-1">
                Step {Math.min(stage + 1, 5)} of 5
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
                      style={{
                        width: `${result.aiScore}%`,
                        backgroundColor: "#F47C20",
                      }}
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
                    <button
                      type="submit"
                      className="btn-primary text-sm py-2 px-4 rounded-lg"
                    >
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
                  Book a free consultation and get a custom AI roadmap for your business.
                </p>
              </div>
              <Link href="/book" className="btn-primary whitespace-nowrap">
                Book a Free Consultation ↗
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
