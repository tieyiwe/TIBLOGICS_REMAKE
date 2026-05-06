"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Monitor, Smartphone, Tablet, Globe, TrendingUp, Eye, Loader2, RefreshCw, Radio, Zap, MapPin } from "lucide-react";

interface LiveSession {
  sessionId: string;
  page: string;
  device: string;
  browser: string;
  os: string;
  origin: string;
  ip: string;
  lastSeen: string;
}

interface PageView {
  id: string;
  page: string;
  origin: string;
  device: string;
  browser: string;
  os: string;
  createdAt: string;
}

interface AnalyticsData {
  liveCount: number;
  liveSessions: LiveSession[];
  recentViews: PageView[];
  topPages: { page: string; count: number }[];
  topOrigins: { origin: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topFeatures: { feature: string; count: number }[];
  deviceBreakdown: { desktop: number; mobile: number; tablet: number; total: number };
  hourly: { hour: number; count: number }[];
}

const DEVICE_ICONS: Record<string, React.ElementType> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function DevicePct({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const Icon = DEVICE_ICONS[label.toLowerCase()] ?? Monitor;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-dm text-xs text-[#3A4A5C]">
          <Icon size={12} /> {label}
        </span>
        <span className="font-dm text-xs font-semibold text-[#0D1B2A]">{pct}%</span>
      </div>
      <div className="h-2 bg-[#E8EFF8] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-dm text-[11px] text-[#7A8FA6]">{count} sessions</span>
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const now = new Date().getHours();
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d) => (
        <div key={d.hour} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t transition-all duration-500"
            style={{
              height: `${Math.max(4, (d.count / max) * 72)}px`,
              backgroundColor: d.hour === now ? "#F47C20" : "#2251A3",
              opacity: d.hour === now ? 1 : 0.5 + (d.count / max) * 0.5,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/realtime");
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-[#7A8FA6]" />
      </div>
    );
  }

  const d = data!;
  const total = d.deviceBreakdown.total || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Visitor Analytics</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
            Real-time site visitors · updates every minute
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-dm text-[#7A8FA6]">
          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: "5s" }} />
          {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())}` : "Loading…"}
        </div>
      </div>

      {/* Live count hero */}
      <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] rounded-2xl p-6 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-green-400" />
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-400 animate-ping opacity-60" />
          </div>
          <div>
            <p className="font-dm text-white/70 text-sm">Live on site right now</p>
            <p className="font-syne font-extrabold text-5xl text-white leading-none mt-1">
              {d.liveCount}
            </p>
          </div>
        </div>
        <div className="ml-auto flex gap-4 flex-wrap">
          {[
            { label: "Last 100 sessions", value: d.deviceBreakdown.total },
            { label: "Top page", value: d.topPages[0]?.page?.split("/").pop() || "—" },
            { label: "Top origin", value: d.topOrigins[0]?.origin || "direct" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-syne font-bold text-xl text-white">{stat.value}</p>
              <p className="font-dm text-white/50 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device breakdown */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={15} className="text-[#2251A3]" />
            <h2 className="font-syne font-bold text-sm text-[#0D1B2A]">Device Types</h2>
          </div>
          <div className="space-y-4">
            <DevicePct label="Desktop" count={d.deviceBreakdown.desktop} total={total} color="#2251A3" />
            <DevicePct label="Mobile" count={d.deviceBreakdown.mobile} total={total} color="#F47C20" />
            <DevicePct label="Tablet" count={d.deviceBreakdown.tablet} total={total} color="#0F6E56" />
          </div>
        </div>

        {/* Top origins */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={15} className="text-[#2251A3]" />
            <h2 className="font-syne font-bold text-sm text-[#0D1B2A]">Traffic Sources</h2>
          </div>
          <div className="space-y-2.5">
            {d.topOrigins.length === 0 ? (
              <p className="font-dm text-xs text-[#7A8FA6]">No data yet</p>
            ) : (
              d.topOrigins.map((o) => (
                <div key={o.origin} className="flex items-center justify-between">
                  <span className="font-dm text-sm text-[#3A4A5C] capitalize truncate max-w-[70%]">{o.origin}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-[#E8EFF8] rounded-full overflow-hidden w-16">
                      <div
                        className="h-full bg-[#2251A3] rounded-full"
                        style={{ width: `${Math.min(100, (o.count / (d.topOrigins[0]?.count ?? 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="font-dm text-xs font-semibold text-[#0D1B2A] w-6 text-right">{o.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top pages */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-[#2251A3]" />
            <h2 className="font-syne font-bold text-sm text-[#0D1B2A]">Top Pages</h2>
          </div>
          <div className="space-y-2.5">
            {d.topPages.length === 0 ? (
              <p className="font-dm text-xs text-[#7A8FA6]">No data yet</p>
            ) : (
              d.topPages.map((p) => (
                <div key={p.page} className="flex items-center justify-between">
                  <span className="font-dm text-sm text-[#3A4A5C] truncate max-w-[70%]">
                    {p.page === "/" ? "Home" : p.page}
                  </span>
                  <span className="font-dm text-xs font-semibold text-[#0D1B2A]">{p.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Country + Feature tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={15} className="text-[#2251A3]" />
            <h2 className="font-syne font-bold text-sm text-[#0D1B2A]">Top Countries</h2>
          </div>
          <div className="space-y-2.5">
            {(!d.topCountries || d.topCountries.length === 0) ? (
              <p className="font-dm text-xs text-[#7A8FA6]">No location data yet — requires Cloudflare or Vercel hosting headers</p>
            ) : (
              d.topCountries.map((c) => (
                <div key={c.country} className="flex items-center justify-between">
                  <span className="font-dm text-sm text-[#3A4A5C]">{c.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-[#E8EFF8] rounded-full overflow-hidden w-16">
                      <div className="h-full bg-[#0F6E56] rounded-full" style={{ width: `${Math.min(100, (c.count / (d.topCountries[0]?.count ?? 1)) * 100)}%` }} />
                    </div>
                    <span className="font-dm text-xs font-semibold text-[#0D1B2A] w-6 text-right">{c.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Features / Buttons Clicked */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} className="text-[#F47C20]" />
            <h2 className="font-syne font-bold text-sm text-[#0D1B2A]">Top Features Used <span className="text-[#7A8FA6] font-normal text-xs">(7 days)</span></h2>
          </div>
          <div className="space-y-2.5">
            {(!d.topFeatures || d.topFeatures.length === 0) ? (
              <p className="font-dm text-xs text-[#7A8FA6]">No feature clicks tracked yet. Add data-track=&quot;feature-name&quot; to buttons.</p>
            ) : (
              d.topFeatures.map((f) => (
                <div key={f.feature} className="flex items-center justify-between">
                  <span className="font-dm text-sm text-[#3A4A5C] truncate max-w-[70%] capitalize">{f.feature.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-[#E8EFF8] rounded-full overflow-hidden w-16">
                      <div className="h-full bg-[#F47C20] rounded-full" style={{ width: `${Math.min(100, (f.count / (d.topFeatures[0]?.count ?? 1)) * 100)}%` }} />
                    </div>
                    <span className="font-dm text-xs font-semibold text-[#0D1B2A] w-6 text-right">{f.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hourly chart */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye size={15} className="text-[#2251A3]" />
            <h2 className="font-syne font-bold text-sm text-[#0D1B2A]">Pageviews — Last 24h</h2>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-dm text-[#7A8FA6]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#F47C20] inline-block" /> Current hour</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#2251A3]/50 inline-block" /> Past hours</span>
          </div>
        </div>
        <HourlyChart data={d.hourly} />
        <div className="flex justify-between mt-1.5">
          <span className="font-dm text-[10px] text-[#7A8FA6]">12am</span>
          <span className="font-dm text-[10px] text-[#7A8FA6]">6am</span>
          <span className="font-dm text-[10px] text-[#7A8FA6]">12pm</span>
          <span className="font-dm text-[10px] text-[#7A8FA6]">6pm</span>
          <span className="font-dm text-[10px] text-[#7A8FA6]">11pm</span>
        </div>
      </div>

      {/* Live sessions + recent views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live sessions */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F4F7FB]">
            <Radio size={14} className="text-green-500" />
            <h2 className="font-syne font-bold text-sm text-[#0D1B2A]">Live Sessions ({d.liveCount})</h2>
          </div>
          <div className="divide-y divide-[#F4F7FB] max-h-72 overflow-y-auto">
            {d.liveSessions.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="font-dm text-xs text-[#7A8FA6]">No active visitors right now</p>
              </div>
            ) : (
              d.liveSessions.map((s) => {
                const DevIcon = DEVICE_ICONS[s.device] ?? Monitor;
                return (
                  <div key={s.sessionId} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-dm text-sm text-[#0D1B2A] truncate">{s.page}</p>
                        <p className="font-dm text-xs text-[#7A8FA6]">
                          <DevIcon size={10} className="inline mr-0.5" />{s.os} · {s.browser}{(s as LiveSession & { country?: string }).country ? ` · ${(s as LiveSession & { country?: string }).country}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-dm text-[11px] text-[#7A8FA6] flex-shrink-0 ml-2">{timeAgo(s.lastSeen)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent page views */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F4F7FB]">
            <Users size={14} className="text-[#2251A3]" />
            <h2 className="font-syne font-bold text-sm text-[#0D1B2A]">Recent Visitors</h2>
          </div>
          <div className="divide-y divide-[#F4F7FB] max-h-72 overflow-y-auto">
            {d.recentViews.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="font-dm text-xs text-[#7A8FA6]">No visits recorded yet</p>
              </div>
            ) : (
              d.recentViews.slice(0, 20).map((v) => {
                const DevIcon = DEVICE_ICONS[v.device] ?? Monitor;
                return (
                  <div key={v.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <DevIcon size={13} className="text-[#7A8FA6] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-dm text-sm text-[#0D1B2A] truncate">{v.page}</p>
                        <p className="font-dm text-xs text-[#7A8FA6]">{v.origin} · {v.browser} · {v.os}</p>
                      </div>
                    </div>
                    <span className="font-dm text-[11px] text-[#7A8FA6] flex-shrink-0 ml-2">{timeAgo(v.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
