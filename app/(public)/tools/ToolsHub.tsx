"use client";
import Link from "next/link";
import { Search, Bot, Calculator, Radar, Wand2, FileText } from "lucide-react";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import { useEffect } from "react";
import { trackPageVisit } from "@/lib/recommendations";
import { useT } from "@/lib/i18n/client";

const ALL_TOOLS = [
  {
    icon: Search,
    id: "scanner",
    href: "/tools/scanner",
    color: "#2251A3",
    paid: false,
    retired: false,
  },
  {
    icon: Wand2,
    id: "toolkit",
    href: "/tools/toolkit-live",
    color: "#B8500A",
    paid: true,
    retired: false,
  },
  {
    icon: FileText,
    id: "blueprint",
    href: "/tools/automation-blueprint",
    color: "#B8500A",
    paid: true,
    retired: false,
  },
  {
    icon: Radar,
    id: "monitor",
    href: "/tools/readiness-monitor",
    color: "#B8500A",
    paid: true,
    retired: false,
  },
  {
    icon: Bot,
    id: "advisor",
    href: "/tools/advisor",
    color: "#F47C20",
    paid: false,
    retired: true,
  },
  {
    icon: Calculator,
    id: "calculator",
    href: "/tools/calculator",
    color: "#7c3aed",
    paid: false,
    retired: false,
  },
];

const tools = ALL_TOOLS.filter(
  (tool) => !tool.retired || process.env.NODE_ENV !== "production"
);

export default function ToolsHub() {
  const t = useT();
  useEffect(() => {
    trackPageVisit("/tools");
  }, []);

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">{t("tools.index.tag")}</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2">
            {t("tools.index.title")}
          </h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-3 max-w-xl mx-auto">
            {t("tools.index.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex flex-col gap-4 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: tool.color + "20" }}
              >
                <tool.icon size={22} style={{ color: tool.color }} aria-hidden />
              </div>
              <div>
                <div className="flex items-start gap-2 mb-1">
                  <h2 className="font-syne font-bold text-lg text-[#0D1B2A] min-w-0">{t(`tools.index.${tool.id}.name`)}</h2>
                  <span className={`shrink-0 whitespace-nowrap text-xs font-bold px-2 py-0.5 mt-1 rounded-full ${tool.paid ? "bg-[#7c3aed]/10 text-[#7c3aed]" : "bg-green-100 text-green-700"}`}>
                    {tool.paid ? t("tools.index.paid") : t("tools.index.free")}
                  </span>
                </div>
                <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed">{t(`tools.index.${tool.id}.desc`)}</p>
              </div>
              <span className="font-dm font-medium text-sm mt-auto" style={{ color: tool.color }}>
                {t("tools.index.tryNow")}
              </span>
            </Link>
          ))}
        </div>
      </div>
        <SmartRecommendations currentPage="/tools" compact />
      </div>
  );
}
