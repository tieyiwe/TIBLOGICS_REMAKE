import Link from "next/link";

const products = [
  {
    name: "InStory",
    tagline: "AI-personalized K-8 learning stories",
    desc: "InStory delivers personalized educational narratives for K-8 students using AI. Built for schools, tutors, and parents — it adapts each story to the child's reading level, interests, and curriculum goals.",
    color: "#2251A3",
    emoji: "📚",
    tag: "EdTech SaaS",
    status: "Live",
    href: "#",
  },
  {
    name: "CareFlow AI",
    tagline: "Automated wellness check-ins for social work",
    desc: "CareFlow automates wellness monitoring and follow-up calls via Twilio + AI voice for social work agencies. It reduces case worker burnout while keeping clients connected and cared for.",
    color: "#0F6E56",
    emoji: "❤️",
    tag: "HealthTech SaaS",
    status: "Live",
    href: "#",
  },
  {
    name: "ShipFrica",
    tagline: "White-label shipping SaaS for African logistics",
    desc: "A complete white-label shipping platform built for African diaspora logistics entrepreneurs. ShipFrica handles booking, tracking, pricing, and customer communications end-to-end.",
    color: "#F47C20",
    emoji: "📦",
    tag: "Logistics SaaS",
    status: "Live",
    href: "#",
  },
  {
    name: "AI Academy",
    tagline: "90+ lessons across 3 AI implementation courses",
    desc: "The TIBLOGICS AI Academy on Skool features 3 comprehensive courses with 90+ lessons covering AI implementation, workflow automation, and business transformation — taught by our team.",
    color: "#7c3aed",
    emoji: "🎓",
    tag: "EdTech Platform",
    status: "Live",
    href: "#",
  },
  {
    name: "Goal Tester",
    tagline: "AI-powered goal validation and strategy tool",
    desc: "Goal Tester helps entrepreneurs and business leaders validate ideas, stress-test strategies, and get AI-generated execution plans — before spending time or money on the wrong path.",
    color: "#1B3A6B",
    emoji: "🎯",
    tag: "Business AI Tool",
    status: "Coming Soon",
    href: "#",
  },
  {
    name: "AutoIQ",
    tagline: "Intelligent workflow automation for SMBs",
    desc: "AutoIQ makes no-code automation accessible to small and mid-size businesses. Connect your tools, automate repetitive tasks, and get AI recommendations for even more efficiency gains.",
    color: "#D85A30",
    emoji: "⚡",
    tag: "Automation SaaS",
    status: "Coming Soon",
    href: "#",
  },
];

export default function ProductsPage() {
  const live = products.filter((p) => p.status === "Live");
  const coming = products.filter((p) => p.status === "Coming Soon");

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-[#1B3A6B] pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="section-tag">Our Products</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-white mt-3 leading-tight">
            Built in-house.{" "}
            <span className="text-[#F47C20]">Deployed globally.</span>
          </h1>
          <p className="font-dm text-white/70 text-lg mt-4 max-w-2xl mx-auto">
            Every TIBLOGICS product is AI-first and built to solve real problems in
            education, health, logistics, and business.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/book" className="btn-primary">
              Book a Demo
            </Link>
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
        {/* Live products */}
        <div className="mb-8">
          <span className="section-tag">Live Products</span>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-1">
            Active &amp; deployed
          </h2>
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
                <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  ● Live
                </span>
              </div>
              <span className="section-tag">{p.tag}</span>
              <h3 className="font-syne font-bold text-xl text-[#0D1B2A]">{p.name}</h3>
              <p className="font-dm text-sm text-[#3A4A5C] italic">{p.tagline}</p>
              <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed flex-1">
                {p.desc}
              </p>
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
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-1">
            In development
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
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
                <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed">{p.desc}</p>
                <span className="text-xs text-[#7A8FA6] font-medium mt-1">
                  🔨 In development
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Partnership CTA */}
        <div className="text-center bg-[#1B3A6B] rounded-2xl p-10">
          <span className="section-tag text-[#F47C20]">Partnership Opportunities</span>
          <h2 className="font-syne font-extrabold text-2xl text-white mt-2">
            Want to partner or white-label?
          </h2>
          <p className="font-dm text-white/70 mt-2 max-w-md mx-auto">
            Several of our products are available for white-labeling or strategic
            partnerships. Let&apos;s talk.
          </p>
          <Link href="/contact" className="btn-primary mt-5 inline-flex">
            Get in Touch →
          </Link>
        </div>
      </div>
    </div>
  );
}
