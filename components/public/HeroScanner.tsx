"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ScanSearch, AlertTriangle, RotateCcw } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";

// The hero's right column. It used to hold four slogan cards ("Our Method",
// "Our Promise"…) — the most valuable space on the site spent on adjectives.
// It now runs the real audit engine (/api/scanner/audit) on the visitor's own
// site, so the first thing the page proves is that we can measure something.
// Nothing here is a sample or a claim: every number shown came back from a
// request the visitor just made.

type Scores = {
  url: string;
  /** The saved report (/tools/scanner/report/<token>). */
  token?: string;
  overallScore: number;
  seoScore: number;
  perfScore: number;
  uxScore: number;
  aiScore: number;
  // The scanner API writes findings and errors in the visitor's language.
  findings: { area: string; type: "bad" | "warning" | "good"; text: string }[];
};

// `label` is the dictionary key suffix under home.scan.area.*
const AREAS: { key: keyof Pick<Scores, "aiScore" | "seoScore" | "perfScore" | "uxScore">; label: string }[] = [
  { key: "aiScore", label: "ai" },
  { key: "seoScore", label: "seo" },
  { key: "perfScore", label: "perf" },
  { key: "uxScore", label: "ux" },
];

// Dictionary key suffixes under home.scan.stage.*
const STAGES = ["fetch", "structure", "timing", "score"];

function tone(score: number) {
  if (score >= 80) return { bar: "#22c55e", text: "#86efac" };
  if (score >= 55) return { bar: "#F47C20", text: "#fdba74" };
  return { bar: "#ef4444", text: "#fca5a5" };
}

function verdict(score: number) {
  if (score >= 80) return "home.scan.verdict.strong";
  if (score >= 55) return "home.scan.verdict.gaps";
  return "home.scan.verdict.weak";
}

export default function HeroScanner() {
  const t = useT();
  const locale = useLocale();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<Scores | null>(null);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function scan(e: React.FormEvent) {
    e.preventDefault();
    const raw = url.trim();
    if (!raw) {
      inputRef.current?.focus();
      return;
    }
    setState("scanning");
    setStage(0);
    setError("");
    setResult(null);
    timer.current = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1400);

    try {
      const res = await fetch("/api/scanner/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" && data.error ? data.error : t("home.scan.err.generic"));
        setState("error");
        return;
      }
      setResult(data as Scores);
      setState("done");
    } catch {
      setError(t("home.scan.err.unreachable"));
      setState("error");
    } finally {
      if (timer.current) clearInterval(timer.current);
    }
  }

  function reset() {
    setState("idle");
    setResult(null);
    setError("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const topIssues = result?.findings.filter((f) => f.type === "bad").slice(0, 2) ?? [];
  // The scan is saved: the full report opens it rather than scanning again
  // (each site has two free scans a month).
  const fullReport = result?.token ? `/tools/scanner/report/${result.token}` : "/tools/scanner";

  return (
    <div className="relative">
      {/* Soft glow behind the card — depth without a stock image. */}
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] opacity-60 blur-2xl"
        style={{ background: "radial-gradient(60% 60% at 70% 30%, rgba(244,124,32,0.25), transparent 70%), radial-gradient(60% 60% at 20% 80%, rgba(34,81,163,0.35), transparent 70%)" }}
      />

      <div className="relative overflow-hidden rounded-3xl bg-[#0D1B2A] p-6 sm:p-8 text-white shadow-[0_24px_80px_-20px_rgba(13,27,42,0.55)] ring-1 ring-white/10">
        {/* Fine grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(80% 70% at 50% 0%, black, transparent)",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-dm font-semibold uppercase tracking-[0.18em] text-[#F47C20]">
            {/* Green "live" pulse with an orange ring, so it reads as on-air rather than as a brand accent. */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-70 motion-safe:animate-ping" />
              <span className="live-pulse relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E] ring-2 ring-[#F47C20]" data-testid="live-dot" />
            </span>
            {t("home.scan.live")}
          </div>

          <h2 className="mt-3 font-syne text-2xl sm:text-[1.7rem] font-bold leading-tight">
            {t("home.scan.title")}
          </h2>
          <p className="mt-2 font-dm text-sm text-white/60 leading-relaxed">
            {t("home.scan.intro")}
          </p>

          {state !== "done" && (
            <form onSubmit={scan} className="mt-6 flex flex-col gap-2 sm:flex-row" noValidate>
              <label htmlFor="hero-scan-url" className="sr-only">{t("home.scan.urlLabel")}</label>
              <input
                ref={inputRef}
                id="hero-scan-url"
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder={t("home.scan.placeholder")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={state === "scanning"}
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 font-dm text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-[#F47C20]/70 focus:bg-white/[0.09] focus:ring-4 focus:ring-[#F47C20]/15 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={state === "scanning"}
                className="inline-flex flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#F47C20] px-5 py-3 font-dm text-[15px] font-semibold text-white transition hover:bg-[#e06d12] active:scale-[0.98] disabled:opacity-70"
              >
                {state === "scanning" ? (
                  <><Loader2 size={17} className="animate-spin" aria-hidden="true" /> {t("home.scan.scanning")}</>
                ) : (
                  <><ScanSearch size={17} aria-hidden="true" /> {t("home.scan.submit")}</>
                )}
              </button>
            </form>
          )}

          <div aria-live="polite" className="mt-6">
            {state === "idle" && (
              <ul className="grid grid-cols-2 gap-2">
                {AREAS.map((a) => (
                  <li key={a.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="font-dm text-xs text-white/50">{t(`home.scan.area.${a.label}`)}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10" />
                  </li>
                ))}
              </ul>
            )}

            {state === "scanning" && (
              <ol className="space-y-2.5">
                {STAGES.map((label, i) => (
                  <li key={label} className="flex items-center gap-3 font-dm text-sm">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition-colors ${
                        i < stage ? "border-[#22c55e] bg-[#22c55e] text-[#0D1B2A]"
                        : i === stage ? "border-[#F47C20] text-[#F47C20]"
                        : "border-white/20 text-white/30"
                      }`}
                    >
                      {i < stage ? "✓" : i === stage ? <Loader2 size={11} className="animate-spin" /> : ""}
                    </span>
                    <span className={i <= stage ? "text-white/90" : "text-white/35"}>{t(`home.scan.stage.${label}`)}</span>
                  </li>
                ))}
              </ol>
            )}

            {state === "error" && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
                <p className="flex items-start gap-2 font-dm text-sm text-red-200">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  {error}
                </p>
                <button onClick={reset} className="mt-3 inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-white/80 hover:text-white">
                  <RotateCcw size={14} aria-hidden="true" /> {t("home.scan.retry")}
                </button>
              </div>
            )}

            {state === "done" && result && (
              <div>
                <div className="flex items-center gap-5">
                  <div className="relative h-20 w-20 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90" role="img" aria-label={t("home.scan.overall", { n: result.overallScore.toLocaleString(locale) })}>
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round"
                        stroke={tone(result.overallScore).bar}
                        strokeDasharray={`${(result.overallScore / 100) * 97.4} 97.4`}
                        className="transition-[stroke-dasharray] duration-700"
                      />
                    </svg>
                    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-syne text-2xl font-bold">
                      {result.overallScore.toLocaleString(locale)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-syne text-lg font-bold" style={{ color: tone(result.overallScore).text }}>
                      {t(verdict(result.overallScore))}
                    </p>
                    <p className="truncate font-dm text-sm text-white/50">
                      {result.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {AREAS.map((a) => {
                    const v = result[a.key];
                    return (
                      <li key={a.key}>
                        <div className="flex justify-between font-dm text-xs">
                          <span className="text-white/60">{t(`home.scan.area.${a.label}`)}</span>
                          <span className="font-semibold tabular-nums" style={{ color: tone(v).text }}>{v.toLocaleString(locale)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${v}%`, background: tone(v).bar }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {topIssues.length > 0 && (
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                    <p className="font-dm text-[11px] font-semibold uppercase tracking-wider text-white/45">{t("home.scan.gaps")}</p>
                    <ul className="mt-2 space-y-1.5">
                      {topIssues.map((f) => (
                        <li key={f.text} className="flex gap-2 font-dm text-[13px] leading-snug text-white/80">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                          {f.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={fullReport}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 font-dm text-sm font-semibold text-[#0D1B2A] transition hover:bg-white/90"
                  >
                    {t("home.scan.fullReport")} <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/book"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-center font-dm text-sm font-semibold text-white transition hover:border-white/40"
                  >
                    {t("home.scan.talk")}
                  </Link>
                </div>
                <button onClick={reset} className="mt-3 font-dm text-xs text-white/40 hover:text-white/70">
                  {t("home.scan.again")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
