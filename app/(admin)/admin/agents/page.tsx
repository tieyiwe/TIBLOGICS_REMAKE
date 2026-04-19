import Link from "next/link";

const agents = [
  {
    slug: "aria",
    name: "Aria",
    title: "Marketing & Content Specialist",
    desc: "Creates social media posts, blog drafts, email campaigns, and brand content. Your go-to for anything marketing — from LinkedIn copy to full content calendars.",
    avatar: "✍️",
    color: "#F47C20",
    bg: "#FEF0E3",
    capabilities: [
      "Social media posts (LinkedIn, X, Instagram, Facebook)",
      "Blog post outlines & full drafts",
      "Email marketing campaigns",
      "Hashtag & SEO strategies",
      "Brand copy & promotional content",
    ],
    badge: "Social Media Ready",
  },
  {
    slug: "rex",
    name: "Rex",
    title: "Sales & Business Development",
    desc: "Helps close deals, analyze prospects, draft personalized outreach, and build proposals. Rex knows the pipeline and moves fast.",
    avatar: "🎯",
    color: "#0F6E56",
    bg: "#E6F5F0",
    capabilities: [
      "Prospect scoring & analysis",
      "Personalized outreach emails",
      "Proposal & pitch deck drafts",
      "Objection-handling scripts",
      "Upsell & cross-sell strategy",
    ],
    badge: "Sales Focused",
  },
  {
    slug: "nova",
    name: "Nova",
    title: "Operations & Analytics",
    desc: "Analyzes business metrics, generates performance reports, identifies bottlenecks, and keeps operations running efficiently.",
    avatar: "📊",
    color: "#7c3aed",
    bg: "#F3EEFF",
    capabilities: [
      "Revenue & appointment analytics",
      "Weekly & monthly reports",
      "Process improvement recommendations",
      "Pipeline health monitoring",
      "Financial forecasting",
    ],
    badge: "Data Driven",
  },
];

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-extrabold text-2xl text-[#0D1B2A]">AI Agent Team</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-1">
          Your virtual TIBLOGICS employees — each specialized in a key business function.
        </p>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Link
            key={agent.slug}
            href={`/admin/agents/${agent.slug}`}
            className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex flex-col gap-4 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200 group"
          >
            {/* Avatar + badge */}
            <div className="flex items-start justify-between">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: agent.bg }}
              >
                {agent.avatar}
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full font-dm"
                style={{ backgroundColor: agent.bg, color: agent.color }}
              >
                {agent.badge}
              </span>
            </div>

            {/* Name + title */}
            <div>
              <h2 className="font-syne font-bold text-xl text-[#0D1B2A]">{agent.name}</h2>
              <p className="font-dm text-sm font-medium mt-0.5" style={{ color: agent.color }}>
                {agent.title}
              </p>
            </div>

            {/* Description */}
            <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed">{agent.desc}</p>

            {/* Capabilities */}
            <ul className="space-y-1.5 flex-1">
              {agent.capabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-2 font-dm text-xs text-[#3A4A5C]">
                  <span style={{ color: agent.color }} className="mt-0.5 flex-shrink-0">✓</span>
                  {cap}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div
              className="inline-flex items-center gap-2 text-sm font-dm font-semibold mt-auto transition-colors group-hover:gap-3"
              style={{ color: agent.color }}
            >
              Chat with {agent.name} →
            </div>
          </Link>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-[#F4F7FB] border border-[#D2DCE8] rounded-2xl p-5 flex items-start gap-4">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div>
          <p className="font-syne font-bold text-sm text-[#0D1B2A]">About your AI team</p>
          <p className="font-dm text-sm text-[#7A8FA6] mt-1">
            Each agent is powered by Claude and specialized with deep TIBLOGICS context.
            Aria can prepare social media posts ready for publishing — live social media API connections
            (LinkedIn, X, Facebook, Instagram) will be activated once you provide your credentials in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
