import Link from "next/link";

const live = [
  {
    name: "InStory School",
    tagline: "AI-powered K-8 learning stories built for schools",
    desc: "Delivers adaptive educational narratives tailored to each student's reading level, interests, and curriculum. Built for schools, tutors, and parents who want learning to feel personal.",
    color: "#2251A3",
    emoji: "📚",
    tag: "EdTech SaaS",
    href: "#",
  },
  {
    name: "CareFlow AI",
    tagline: "AI voice assistant for healthcare & social care",
    desc: "An AI voice assistant that handles patient check-ins, appointment booking, follow-ups, and support — reducing staff workload while keeping every patient connected and cared for.",
    color: "#0F6E56",
    emoji: "❤️",
    tag: "HealthTech SaaS",
    href: "#",
  },
  {
    name: "ShipFrica",
    tagline: "White-label shipping SaaS for African diaspora logistics",
    desc: "A complete white-label shipping platform built for African diaspora logistics entrepreneurs. Handles booking, tracking, pricing, and customer communications end-to-end.",
    color: "#F47C20",
    emoji: "📦",
    tag: "Logistics SaaS",
    href: "#",
  },
  {
    name: "AI Academy",
    tagline: "90+ lessons across 3 AI implementation courses",
    desc: "The TIBLOGICS AI Academy on Skool features 3 comprehensive courses covering AI implementation, workflow automation, and business transformation — taught by our team.",
    color: "#7c3aed",
    emoji: "🎓",
    tag: "EdTech Platform",
    href: "#",
  },
  {
    name: "RoofGuard",
    tagline: "Smart roofing inspection and property maintenance platform",
    desc: "Helps roofing contractors and property managers document inspections, track maintenance schedules, and generate professional reports — all from a mobile-first interface.",
    color: "#D85A30",
    emoji: "🏠",
    tag: "PropTech SaaS",
    href: "#",
  },
  {
    name: "Tibintel",
    tagline: "AI-powered business intelligence and market insights",
    desc: "Tibintel aggregates market signals, competitive data, and business intelligence into actionable insights — giving decision-makers the clarity they need to move fast and strategically.",
    color: "#1B3A6B",
    emoji: "🧠",
    tag: "Business Intelligence",
    href: "https://tibintel.com",
  },
  {
    name: "Amber",
    tagline: "AI-powered communication and alert management platform",
    desc: "Amber streamlines critical communications and real-time alerts for organizations — ensuring the right message reaches the right people at exactly the right moment.",
    color: "#D97706",
    emoji: "🔔",
    tag: "Communication SaaS",
    href: "#",
  },
  {
    name: "GeoStrat",
    tagline: "Geospatial strategy and location intelligence for businesses",
    desc: "GeoStrat transforms location data into strategic decisions — mapping market opportunities, optimizing field operations, and delivering actionable geospatial intelligence at scale.",
    color: "#0F6E56",
    emoji: "🌍",
    tag: "Geospatial Intelligence",
    href: "#",
  },
];

const coming = [
  {
    name: "Goal Tester",
    tagline: "Validate your business goals before you invest",
    desc: "AI-powered goal validation tool that stress-tests strategies, scores idea viability, and generates execution plans — so entrepreneurs invest time and money in the right direction.",
    color: "#1B3A6B",
    emoji: "🎯",
    tag: "Business AI Tool",
  },
  {
    name: "AI Readiness Platform",
    tagline: "Know exactly where your business stands with AI",
    desc: "A comprehensive assessment platform that evaluates your data, processes, and team to produce a personalized AI adoption roadmap with prioritized action steps.",
    color: "#2251A3",
    emoji: "📊",
    tag: "AI Assessment SaaS",
  },
  {
    name: "AI Central",
    tagline: "Unified hub for all your AI agents and workflows",
    desc: "Consolidates your AI tools, agents, and automations into one dashboard — giving teams full visibility, control, and analytics over every AI-powered process in their business.",
    color: "#0F6E56",
    emoji: "⚡",
    tag: "AI Operations",
  },
  {
    name: "AutoIQ",
    tagline: "Intelligent workflow automation for SMBs",
    desc: "Makes no-code automation accessible to small and mid-size businesses. Connect tools, automate repetitive tasks, and get AI recommendations for even greater efficiency.",
    color: "#F47C20",
    emoji: "🤖",
    tag: "Automation SaaS",
  },
  {
    name: "Appreciate Songs",
    tagline: "Discover music that moves you, deeper",
    desc: "An AI-driven music appreciation platform that helps listeners understand the stories, theory, and emotion behind their favourite songs — turning passive listening into real connection.",
    color: "#7c3aed",
    emoji: "🎵",
    tag: "Music Tech",
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-[#1B3A6B] pt-24 sm:pt-44 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="section-tag">Our Startups &amp; Products</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-white mt-3 leading-tight">
            Built in-house.{" "}
            <span className="text-[#F47C20]">Deployed globally.</span>
          </h1>
          <p className="font-dm text-white/70 text-lg mt-4 max-w-2xl mx-auto">
            Every TIBLOGICS product is AI-first, built to solve a real problem, and
            designed to scale. From education to logistics to business intelligence.
          </p>
          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            <Link href="/book" className="btn-primary">Book a Demo</Link>
            <Link
              href="/contact"
              className="bg-white text-[#1B3A6B] hover:bg-[#EBF0FA] font-semibold rounded-lg px-5 py-2.5 transition-colors inline-flex items-center gap-2"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Live */}
        <div className="mb-8">
          <span className="section-tag">Live</span>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-1">Active &amp; deployed</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {live.map((p) => (
            <div
              key={p.name}
              className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex flex-col gap-3 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: p.color + "26" }}
                >
                  {p.emoji}
                </div>
                <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">● Live</span>
              </div>
              <span className="section-tag">{p.tag}</span>
              <h3 className="font-syne font-bold text-xl text-[#0D1B2A]">{p.name}</h3>
              <p className="font-dm text-sm text-[#3A4A5C] italic">{p.tagline}</p>
              <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed flex-1">{p.desc}</p>
              <Link
                href={p.href}
                className="inline-flex items-center gap-1.5 bg-[#1B3A6B] hover:bg-[#2251A3] text-white text-sm font-dm font-semibold px-4 py-2 rounded-xl transition-colors mt-auto w-fit"
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <div className="mb-8">
          <span className="section-tag">Coming Soon</span>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-1">In development</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {coming.map((p) => (
            <div
              key={p.name}
              className="bg-[#F4F7FB] border border-[#D2DCE8] rounded-2xl p-6 flex gap-4 items-start"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: p.color + "18" }}
              >
                {p.emoji}
              </div>
              <div className="flex flex-col gap-1">
                <span className="section-tag">{p.tag}</span>
                <h3 className="font-syne font-bold text-lg text-[#0D1B2A]">{p.name}</h3>
                <p className="font-dm text-xs text-[#3A4A5C] italic mb-1">{p.tagline}</p>
                <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed">{p.desc}</p>
                <span className="text-xs text-[#7A8FA6] font-medium mt-1">🔨 In development</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-[#1B3A6B] rounded-2xl p-10">
          <span className="section-tag text-[#F47C20]">Partnership Opportunities</span>
          <h2 className="font-syne font-extrabold text-2xl text-white mt-2">
            Want to partner or white-label?
          </h2>
          <p className="font-dm text-white/70 mt-2 max-w-md mx-auto">
            Several of our products are available for white-labeling or strategic partnerships. Let&apos;s talk.
          </p>
          <Link href="/contact" className="btn-primary mt-5 inline-flex">Get in Touch →</Link>
        </div>
      </div>
    </div>
  );
}
