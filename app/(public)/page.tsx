import Link from "next/link";
import Hero from "@/components/public/Hero";
import StatsBar from "@/components/public/StatsBar";
import AIBanner from "@/components/public/AIBanner";
import { Bot, Zap, Brain } from "lucide-react";

const featuredServices = [
  {
    icon: Bot,
    name: "AI Implementation & Agents",
    desc: "Custom AI agents, LLM integration, and intelligent automation tailored to your operations.",
    color: "#2251A3",
  },
  {
    icon: Zap,
    name: "Workflow Automation",
    desc: "End-to-end automation using n8n, Make, and custom pipelines. Eliminate repetitive work.",
    color: "#F47C20",
  },
  {
    icon: Brain,
    name: "AI Strategy & Consulting",
    desc: "AI readiness audits, strategy sessions, and implementation roadmaps for leaders who move fast.",
    color: "#0F6E56",
  },
];

const featuredProducts = [
  { name: "InStory", desc: "AI-powered K-8 learning stories built for schools.", emoji: "📚", color: "#2251A3", tag: "EdTech" },
  { name: "CareFlow AI", desc: "Automated wellness check-ins via AI voice for social work agencies.", emoji: "❤️", color: "#0F6E56", tag: "HealthTech" },
  { name: "ShipFrica", desc: "White-label shipping SaaS for African diaspora logistics.", emoji: "📦", color: "#F47C20", tag: "Logistics" },
  { name: "AI Academy", desc: "90+ lessons across 3 AI courses on Skool.", emoji: "🎓", color: "#7c3aed", tag: "EdTech" },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />

      {/* AI Banner */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AIBanner />
        </div>
      </section>

      {/* Services teaser */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-tag">Full-Spectrum Solutions</span>
              <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
                AI-first. Tech-complete.
              </h2>
            </div>
            <Link
              href="/services"
              className="hidden sm:inline-flex items-center gap-1 text-[#2251A3] font-medium text-sm hover:text-[#1B3A6B] transition-colors"
            >
              All 9 services →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {featuredServices.map((svc) => {
              const Icon = svc.icon;
              return (
                <div
                  key={svc.name}
                  className="bg-white border border-[#D2DCE8] rounded-2xl p-6 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: svc.color + "20" }}
                  >
                    <Icon size={22} style={{ color: svc.color }} />
                  </div>
                  <h3 className="font-syne font-bold text-base text-[#0D1B2A]">{svc.name}</h3>
                  <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-1">{svc.desc}</p>
                </div>
              );
            })}
          </div>
          <Link href="/services" className="sm:hidden btn-ghost text-sm">
            View all 9 services →
          </Link>
        </div>
      </section>

      {/* Products teaser */}
      <section className="py-16 bg-[#F4F7FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-tag">Our Startups &amp; Products</span>
              <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
                Built in-house. Deployed globally.
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1 text-[#2251A3] font-medium text-sm hover:text-[#1B3A6B] transition-colors"
            >
              All products →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {featuredProducts.map((p) => (
              <div
                key={p.name}
                className="bg-white border border-[#D2DCE8] rounded-2xl p-5 flex flex-col gap-2 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: p.color + "26" }}
                >
                  {p.emoji}
                </div>
                <span className="section-tag">{p.tag}</span>
                <h3 className="font-syne font-bold text-base text-[#0D1B2A]">{p.name}</h3>
                <p className="font-dm text-xs text-[#7A8FA6] leading-relaxed flex-1">{p.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/products" className="sm:hidden btn-ghost text-sm">
            View all products →
          </Link>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="section-tag">Work With Us</span>
          <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
            Ready to move fast?
          </h2>
          <p className="font-dm text-[#3A4A5C] text-lg mt-3">
            Book a free 30-minute discovery meeting. We&apos;ll listen to your
            challenges and tell you exactly what we&apos;d recommend.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <Link href="/book" className="btn-primary justify-center">
              Book a Free Session →
            </Link>
            <Link href="/services" className="btn-secondary justify-center">
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
