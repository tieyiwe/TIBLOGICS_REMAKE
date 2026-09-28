import type { Metadata } from "next";
import Link from "next/link";
import { Radar, Swords, BellRing, LineChart, Check } from "lucide-react";
import { monitorPricing, formatMonitorPrice, MAX_COMPETITORS, SCAN_INTERVAL_DAYS } from "@/lib/monitor/config";
import { getLocale, getT } from "@/lib/i18n/server";
import MonitorSignup from "./MonitorSignup";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tools.monitor.meta.title"),
    description: t("tools.monitor.meta.description"),
    alternates: { canonical: "https://tiblogics.com/tools/readiness-monitor" },
  };
}

// Price comes from server configuration at request time, so setting it in
// Replit Secrets opens sales without a rebuild.
export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Swords, id: "vs", n: MAX_COMPETITORS },
  { icon: Radar, id: "rescan", n: SCAN_INTERVAL_DAYS },
  { icon: BellRing, id: "email", n: 0 },
  { icon: LineChart, id: "history", n: 0 },
];

const CHECKS = [1, 2, 3, 4, 5, 6];

export default async function ReadinessMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; canceled?: string }>;
}) {
  const sp = await searchParams;
  const pricing = monitorPricing();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const [before, after] = t("tools.monitor.sameChecks").split("{link}");

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {sp.welcome && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5 font-dm text-sm text-green-800">
            <strong>{t("tools.common.paymentReceived")}</strong> {t("tools.monitor.welcome")}
          </div>
        )}
        {sp.canceled && (
          <div className="mb-8 rounded-2xl border border-[#D2DCE8] bg-white p-5 font-dm text-sm text-[#3A4A5C]">
            {t("tools.common.canceled")}
          </div>
        )}

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-start">
          <div className="min-w-0">
            <span className="section-tag">Readiness Monitor</span>
            <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2 leading-tight break-words">
              {t("tools.monitor.title")}
            </h1>
            <p className="font-dm text-[#3A4A5C] text-lg mt-4 max-w-xl">
              {t("tools.monitor.lead")}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {FEATURES.map((f) => (
                <div key={f.id} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
                  <f.icon size={20} className="text-[#B8500A]" aria-hidden />
                  <h2 className="font-syne font-bold text-base text-[#0D1B2A] mt-3">{t(`tools.monitor.f.${f.id}.title`, { n: f.n })}</h2>
                  <p className="font-dm text-sm text-[#7A8FA6] mt-1 leading-relaxed">{t(`tools.monitor.f.${f.id}.body`)}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">{t("tools.monitor.checksTitle")}</h2>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
                {CHECKS.map((c) => (
                  <li key={c} className="flex items-start gap-2 font-dm text-sm text-[#3A4A5C]">
                    <Check size={16} className="text-green-600 mt-0.5 shrink-0" aria-hidden />
                    {t(`tools.monitor.check.${c}`)}
                  </li>
                ))}
              </ul>
              <p className="font-dm text-sm text-[#7A8FA6] mt-4">
                {before}
                <Link href="/tools/scanner" className="text-[#2251A3] underline">
                  {t("tools.monitor.freeScanner")}
                </Link>
                {after}
              </p>
            </div>
          </div>

          <MonitorSignup
            price={pricing ? formatMonitorPrice(pricing, locale) : null}
            maxCompetitors={MAX_COMPETITORS}
          />
        </div>
      </div>
    </div>
  );
}
