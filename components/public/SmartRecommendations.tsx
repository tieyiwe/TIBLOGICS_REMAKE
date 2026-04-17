"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { getContext, trackPageVisit } from "@/lib/recommendations";

interface Recommendation {
  type: "service" | "tool" | "session";
  name: string;
  tagline: string;
  href: string;
  priority: number;
}

interface RecommendationPayload {
  headline: string;
  reason: string;
  recommendations: Recommendation[];
}

const TYPE_STYLES: Record<string, string> = {
  service: "bg-[#EBF0FA] text-[#2251A3]",
  tool: "bg-green-100 text-green-700",
  session: "bg-[#FEF0E3] text-[#F47C20]",
};

interface Props {
  currentPage: string;
  compact?: boolean;
}

export default function SmartRecommendations({ currentPage, compact = false }: Props) {
  const [data, setData] = useState<RecommendationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    trackPageVisit(currentPage);

    // Only show after 8 seconds on page, and only if not dismissed this session
    const dismissed = sessionStorage.getItem("tib_rec_dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => {
      setShown(true);
      fetchRecommendations();
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentPage]);

  async function fetchRecommendations() {
    setLoading(true);
    try {
      const ctx = getContext();
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: { ...ctx, currentPage } }),
      });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch {
      // silently fail — recommendations are enhancement, not core
    }
    setLoading(false);
  }

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("tib_rec_dismissed", "1");
  }

  if (!shown || dismissed || (!loading && !data)) return null;

  if (compact) {
    // Inline strip for tool/service pages
    return (
      <div className="bg-[#F4F7FB] border border-[#D2DCE8] rounded-2xl p-5 my-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={15} className="text-[#F47C20]" />
          <span className="font-syne font-bold text-sm text-[#0D1B2A]">
            {loading ? "Personalizing your experience…" : (data?.headline ?? "Recommended for you")}
          </span>
        </div>
        {loading ? (
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-[#E8EFF8] rounded-lg flex-1 animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="flex flex-wrap gap-2">
            {data.recommendations.map((rec) => (
              <Link key={rec.name} href={rec.href}
                className="flex items-center gap-2 bg-white border border-[#D2DCE8] rounded-xl px-3 py-2 hover:border-[#2251A3] hover:bg-[#EBF0FA] transition-all group text-sm">
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-dm font-medium ${TYPE_STYLES[rec.type]}`}>
                  {rec.type}
                </span>
                <span className="font-dm text-[#0D1B2A] font-medium">{rec.name}</span>
                <ArrowRight size={13} className="text-[#7A8FA6] group-hover:text-[#2251A3] transition-colors" />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  // Full floating panel (bottom-left, appears after delay)
  return (
    <div className="fixed bottom-6 left-6 z-40 w-80 bg-white border border-[#D2DCE8] rounded-2xl shadow-[0_8px_32px_rgba(27,58,107,0.18)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2251A3] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#F47C20]" />
          <span className="font-syne font-bold text-white text-sm">
            {loading ? "Personalizing…" : "Recommended for you"}
          </span>
        </div>
        <button onClick={dismiss} className="text-white/50 hover:text-white transition-colors">
          <X size={15} />
        </button>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-[#F4F7FB] rounded animate-pulse w-3/4" />
              <div className="h-2.5 bg-[#F4F7FB] rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="p-4">
          {data.reason && (
            <p className="text-[#7A8FA6] text-xs font-dm mb-3 leading-relaxed">{data.reason}</p>
          )}
          <div className="space-y-2">
            {data.recommendations.map((rec) => (
              <Link key={rec.name} href={rec.href} onClick={dismiss}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F7FB] transition-colors group">
                <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-dm font-medium mt-0.5 ${TYPE_STYLES[rec.type]}`}>
                  {rec.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-dm font-medium text-sm text-[#0D1B2A] leading-tight">{rec.name}</p>
                  <p className="font-dm text-xs text-[#7A8FA6] mt-0.5 leading-relaxed">{rec.tagline}</p>
                </div>
                <ArrowRight size={13} className="text-[#D2DCE8] group-hover:text-[#F47C20] transition-colors shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
