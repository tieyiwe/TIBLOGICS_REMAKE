import Link from "next/link";

const live = [
  {
    name: "Goal Tester",
    tagline: "Validate your business goals before you invest",
    desc: "AI-powered goal validation tool that stress-tests strategies, scores idea viability, and generates execution plans — so entrepreneurs invest time and money in the right direction.",
    color: "#1B3A6B",
    emoji: "🎯",
    tag: "Business AI Tool",
    href: "#",
    deployed: true,
  },
  {
    name: "InStory School",
    tagline: "AI-powered K-8 learning stories built for schools",
    desc: "A live AI product in the EdTech space. We built it — we can build yours.",
    color: "#2251A3",
    emoji: "📚",
    tag: "EdTech SaaS",
    href: "/book",
    deployed: false,
  },
  {
    name: "CareFlow AI",
    tagline: "AI voice assistant for healthcare & social care",
    desc: "Deployed and serving real patients. AI-powered, voice-first, and built for scale.",
    color: "#0F6E56",
    emoji: "❤️",
    tag: "HealthTech SaaS",
    href: "/book",
    deployed: false,
  },
  {
    name: "ShipFrica",
    tagline: "White-label shipping SaaS for African diaspora logistics",
    desc: "A live SaaS platform built for a niche logistics market. Fully white-label ready.",
    color: "#F47C20",
    emoji: "📦",
    tag: "Logistics SaaS",
    href: "/book",
    deployed: false,
  },
  {
    name: "AI Academy",
    tagline: "90+ lessons across 3 AI implementation courses",
    desc: "Live on Skool and growing. Teaching AI implementation to builders across two continents.",
    color: "#7c3aed",
    emoji: "🎓",
    tag: "EdTech Platform",
    href: "/book",
    deployed: false,
  },
  {
    name: "RoofGuard",
    tagline: "Smart roofing inspection and property maintenance platform",
    desc: "Deployed in the property sector. Built for professionals who work in the field.",
    color: "#D85A30",
    emoji: "🏠",
    tag: "PropTech SaaS",
    href: "/book",
    deployed: false,
  },
  {
    name: "Tibintel",
    tagline: "AI-powered business intelligence and market insights",
    desc: "Live at tibintel.com — AI-powered intelligence built for decision-makers who move fast.",
    color: "#1B3A6B",
    emoji: "🧠",
    tag: "Business Intelligence",
    href: "https://tibintel.com",
    deployed: true,
  },
  {
    name: "Amber",
    tagline: "AI-powered communication and alert management platform",
    desc: "Deployed and running. Built for organizations where communication is mission-critical.",
    color: "#D97706",
    emoji: "🔔",
    tag: "Communication SaaS",
    href: "/book",
    deployed: false,
  },
  {
    name: "GeoStrat",
    tagline: "Geospatial strategy and location intelligence for businesses",
    desc: "A live intelligence product for businesses that compete on location and territory.",
    color: "#0F6E56",
    emoji: "🌍",
    tag: "Geospatial Intelligence",
    href: "/book",
    deployed: false,
  },
];

const coming = [
  {
    name: "AI Readiness Platform",
    tagline: "Know exactly where your business stands with AI",
    desc: "An assessment product for businesses serious about AI adoption. Coming soon.",
    color: "#2251A3",
    emoji: "📊",
    tag: "AI Assessment SaaS",
  },
  {
    name: "AI Central",
    tagline: "Unified hub for all your AI agents and workflows",
    desc: "One dashboard. All your AI. Built for teams that run on automation.",
    color: "#0F6E56",
    emoji: "⚡",
    tag: "AI Operations",
  },
  {
    name: "AutoIQ",
    tagline: "AI-powered automotive diagnostic platform",
    desc: "A smart diagnostic product built for the automotive space. Coming soon.",
    color: "#F47C20",
    emoji: "🚗",
    tag: "AutoTech SaaS",
  },
  {
    name: "Appreciate Songs",
    tagline: "Discover music that moves you, deeper",
    desc: "A music product built for people who don't just listen — they feel.",
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
                {p.deployed ? "Learn more →" : "Build yours now →"}
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
