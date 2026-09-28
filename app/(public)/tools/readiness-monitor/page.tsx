import type { Metadata } from "next";
import Link from "next/link";
import { Radar, Swords, BellRing, LineChart, Check } from "lucide-react";
import { monitorPricing, formatMonitorPrice, MAX_COMPETITORS, SCAN_INTERVAL_DAYS } from "@/lib/monitor/config";
import MonitorSignup from "./MonitorSignup";

export const metadata: Metadata = {
  title: "Readiness Monitor: track your AI readiness against competitors",
  description:
    "Weekly AI-readiness, search, speed and usability scans of your website and up to three competitors, with an email when something changes.",
  alternates: { canonical: "https://tiblogics.com/tools/readiness-monitor" },
};

// Price comes from server configuration at request time, so setting it in
// Replit Secrets opens sales without a rebuild.
export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Swords,
    title: `You vs ${MAX_COMPETITORS} competitors`,
    body: "The same checks on every site, side by side. See exactly which checks a competitor passes and you fail.",
  },
  {
    icon: Radar,
    title: `Rescanned every ${SCAN_INTERVAL_DAYS} days`,
    body: "AI readiness, search, speed and usability, measured from the live pages, not estimated.",
  },
  {
    icon: BellRing,
    title: "An email only when something moves",
    body: "A score that rises or falls, a problem fixed, a new one introduced. No news means no email.",
  },
  {
    icon: LineChart,
    title: "A history you can show",
    body: "Every run is kept, so you can see whether the work you paid for moved the numbers.",
  },
];

const CHECKS = [
  "Structured data AI assistants can read",
  "Whether AI crawlers are blocked",
  "llms.txt, sitemap and robots.txt",
  "Title, description and social previews",
  "Server response time and page weight",
  "Mobile viewport, alt text and headings",
];

export default async function ReadinessMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; canceled?: string }>;
}) {
  const sp = await searchParams;
  const pricing = monitorPricing();

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {sp.welcome && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5 font-dm text-sm text-green-800">
            <strong>Payment received.</strong> Your dashboard link is on its way to your inbox, and the first scan has
            started. If the email hasn&apos;t arrived in a few minutes, check spam or request the link again below.
          </div>
        )}
        {sp.canceled && (
          <div className="mb-8 rounded-2xl border border-[#D2DCE8] bg-white p-5 font-dm text-sm text-[#3A4A5C]">
            Checkout was canceled and you have not been charged.
          </div>
        )}

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-start">
          <div>
            <span className="section-tag">Readiness Monitor</span>
            <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2 leading-tight">
              Know when a competitor gets ahead of you.
            </h1>
            <p className="font-dm text-[#3A4A5C] text-lg mt-4 max-w-xl">
              The free scanner tells you where your site stands today. The Readiness Monitor watches it every week
              next to the businesses you compete with, and tells you what changed.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
                  <f.icon size={20} className="text-[#B8500A]" />
                  <h2 className="font-syne font-bold text-base text-[#0D1B2A] mt-3">{f.title}</h2>
                  <p className="font-dm text-sm text-[#7A8FA6] mt-1 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">What every scan checks</h2>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
                {CHECKS.map((c) => (
                  <li key={c} className="flex items-start gap-2 font-dm text-sm text-[#3A4A5C]">
                    <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
              <p className="font-dm text-sm text-[#7A8FA6] mt-4">
                These are the same checks as the{" "}
                <Link href="/tools/scanner" className="text-[#2251A3] underline">
                  free scanner
                </Link>
                , so you can try them on your site first.
              </p>
            </div>
          </div>

          <MonitorSignup
            price={pricing ? formatMonitorPrice(pricing) : null}
            maxCompetitors={MAX_COMPETITORS}
          />
        </div>
      </div>
    </div>
  );
}
