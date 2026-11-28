"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, TrendingUp, User } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";

// AI agents vs humans: the latest published share of web traffic (lib/ai-traffic.ts,
// updated by staff), drawn as a split bar, with a counter that plays out
// "the next 1,000 visits" at that ratio. The counter is an illustration of the
// published figure and says so; nothing is presented as live measurement.

export interface MeterEntry {
  date: string;
  botsPct: number;
  humansPct: number;
  source: string;
  sourceUrl: string;
  scope: string;
  growthPct: number | null;
  growthSource: string;
  growthUrl: string;
}

const TOTAL = 1000;

export default function AiVsHumans({ entry, variant = "home" }: { entry: MeterEntry; variant?: "home" | "page" }) {
  const t = useT();
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const [shown, setShown] = useState(false);
  const [n, setN] = useState({ bots: 0, humans: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // Start when scrolled into view; play the next 1,000 visits at the published
  // ratio (a fixed pattern spread evenly, so it lands on the exact split), then hold.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setShown(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!shown) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const bots = Math.round((entry.botsPct / 100) * TOTAL);
    if (reduce) {
      setN({ bots, humans: TOTAL - bots });
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i = Math.min(TOTAL, i + 9);
      const b = Math.round((i * bots) / TOTAL);
      setN({ bots: b, humans: i - b });
      if (i >= TOTAL) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [shown, entry.botsPct]);

  const date = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(`${entry.date}T12:00:00Z`));
  const big = variant === "page";

  return (
    <div ref={ref} className={`overflow-hidden rounded-3xl bg-[#0D1B2A] text-white ${big ? "p-6 sm:p-10" : "p-6 sm:p-8"}`} data-testid="ai-vs-humans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-dm text-[11px] font-bold uppercase tracking-[0.16em] text-[#F47C20]">{t("aivh.tag")}</p>
          <h2 className={`mt-2 font-syne font-extrabold leading-tight ${big ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>{t("aivh.title")}</h2>
        </div>
        <p className="font-dm text-xs text-white/50">{t("aivh.updated", { date })}</p>
      </div>

      {/* The split */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="flex items-center gap-1.5 font-dm text-sm text-white/70"><Bot size={16} className="text-[#F47C20]" aria-hidden /> {t("aivh.bots")}</p>
          <p className="font-syne text-5xl font-extrabold text-[#F47C20] sm:text-6xl" data-testid="aivh-bots">{nf.format(entry.botsPct)}%</p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1.5 font-dm text-sm text-white/70">{t("aivh.humans")} <User size={16} className="text-[#7FB2FF]" aria-hidden /></p>
          <p className="font-syne text-5xl font-extrabold text-[#7FB2FF] sm:text-6xl" data-testid="aivh-humans">{nf.format(entry.humansPct)}%</p>
        </div>
      </div>
      <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`${t("aivh.bots")} ${nf.format(entry.botsPct)}%, ${t("aivh.humans")} ${nf.format(entry.humansPct)}%`}>
        <div className="h-full bg-gradient-to-r from-[#F47C20] to-[#FF9D52] transition-[width] duration-[1600ms] ease-out" style={{ width: shown ? `${entry.botsPct}%` : "0%" }} />
        <div className="h-full flex-1 bg-[#7FB2FF]/80" />
      </div>

      {/* The next 1,000 visits */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <p className="font-dm text-sm font-semibold text-white/85">{t("aivh.ticker")}</p>
        <div className="mt-3 grid grid-cols-2 gap-4 font-syne tabular-nums">
          <p><span className="text-3xl font-extrabold text-[#F47C20]" data-testid="aivh-count-bots">{n.bots.toLocaleString(locale)}</span> <span className="font-dm text-xs text-white/60">{t("aivh.tickerBots")}</span></p>
          <p className="text-right"><span className="text-3xl font-extrabold text-[#7FB2FF]" data-testid="aivh-count-humans">{n.humans.toLocaleString(locale)}</span> <span className="font-dm text-xs text-white/60">{t("aivh.tickerHumans")}</span></p>
        </div>
        <p className="mt-2 font-dm text-[11px] text-white/45">{t("aivh.tickerNote")}</p>
      </div>

      {entry.growthPct !== null && (
        <p className="mt-4 flex items-start gap-2 font-dm text-sm text-white/80">
          <TrendingUp size={16} className="mt-0.5 shrink-0 text-[#F47C20]" aria-hidden />
          <span>
            {t("aivh.growth", { pct: `${entry.growthPct > 0 ? "+" : ""}${entry.growthPct.toLocaleString(locale)}%` })}{" "}
            {entry.growthUrl ? (
              <a href={entry.growthUrl} target="_blank" rel="noopener noreferrer" className="text-white/50 underline hover:text-white">({entry.growthSource})</a>
            ) : entry.growthSource ? <span className="text-white/50">({entry.growthSource})</span> : null}
          </span>
        </p>
      )}

      <p className="mt-4 font-dm text-xs text-white/50">
        {t("aivh.source")}{" "}
        <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white" data-testid="aivh-source">{entry.source}</a>
        {entry.scope ? `, ${entry.scope}` : ""} ({date}).
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/tools/ai-agent-ready" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47C20] px-5 py-3 font-dm text-sm font-bold text-white hover:bg-[#E06A0E]" data-track="cta-aivh-agent-ready">
          {t("aivh.cta")} <ArrowRight size={16} aria-hidden />
        </Link>
        {variant === "home" && (
          <Link href="/ai-vs-humans" className="inline-flex items-center justify-center gap-1.5 font-dm text-sm font-semibold text-white/80 hover:text-white" data-testid="aivh-more">
            {t("aivh.more")} <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
