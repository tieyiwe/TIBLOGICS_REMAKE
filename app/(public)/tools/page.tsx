import Link from "next/link";
import { Search, Bot, Calculator } from "lucide-react";

const tools = [
  {
    icon: Search,
    name: "Website AI Scanner",
    desc: "Scan any website and get an instant AI readiness score with actionable findings.",
    href: "/tools/scanner",
    color: "#2251A3",
    tag: "Free",
  },
  {
    icon: Bot,
    name: "AI Project Advisor",
    desc: "Chat with TIBS to get personalized AI implementation recommendations for your business.",
    href: "/tools/advisor",
    color: "#F47C20",
    tag: "Free",
  },
  {
    icon: Calculator,
    name: "AI Cost Calculator",
    desc: "Calculate your monthly AI API costs across Claude, GPT-4o, Gemini and more.",
    href: "/tools/calculator",
    color: "#7c3aed",
    tag: "Free",
  },
];

export default function ToolsPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">Free Tools</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2">
            AI tools, on us.
          </h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-3 max-w-xl mx-auto">
            No signup required. Get real insights about your business and AI costs in minutes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((t) => (
            <Link
              key={t.name}
              href={t.href}
              className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex flex-col gap-4 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: t.color + "20" }}
              >
                <t.icon size={22} style={{ color: t.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">{t.name}</h2>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {t.tag}
                  </span>
                </div>
                <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed">{t.desc}</p>
              </div>
              <span className="font-dm font-medium text-sm mt-auto" style={{ color: t.color }}>
                Try it now →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
