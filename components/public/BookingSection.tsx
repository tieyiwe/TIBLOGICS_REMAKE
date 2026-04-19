
import Link from "next/link";

interface Session {
  name: string;
  duration: string;
  badge: string | null;
  color: string;
  description: string;
}

const sessions: Session[] = [
  {
    name: "AI Strategy Session",
    duration: "60 min",
    badge: "Popular",
    color: "#2251A3",
    description: "Deep-dive into your AI opportunities with a custom action plan.",
  },
  {
    name: "AI Readiness Audit",
    duration: "90 min + PDF",
    badge: null,
    color: "#1B3A6B",
    description: "Full assessment of your tech stack and AI readiness with a written report.",
  },
  {
    name: "Website AI Transformation",
    duration: "45 min",
    badge: "New",
    color: "#0F6E56",
    description: "Review your site and design an AI-powered upgrade roadmap.",
  },
  {
    name: "AI Cost & Pricing Strategy",
    duration: "60 min",
    badge: null,
    color: "#7c3aed",
    description: "Build a profitable AI pricing model for your business.",
  },
  {
    name: "Project Discovery Meeting",
    duration: "30 min",
    badge: "Free",
    color: "#F47C20",
    description: "Intro call to explore your project — no commitment required.",
  },
];

export default function BookingSection() {
  return (
    <section className="py-20 bg-[#F4F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="section-tag">Work With Us</span>
          <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
            Book a consulting session.
          </h2>
          <p className="font-dm text-[#3A4A5C] mt-3 max-w-xl mx-auto">
            From free discovery meetings to deep AI audits — choose the session
            that fits your needs.
          </p>
        </div>

        {/* Session cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sessions.map((session) => (
            <div
              key={session.name}
              className="relative bg-white border border-[#D2DCE8] rounded-2xl p-5 flex flex-col gap-2 card-hover overflow-hidden"
            >
              {/* Left color border */}
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: session.color }}
              />

              {/* Badge (only if present) */}
              {session.badge && (
                <span className="absolute top-3 right-3 bg-[#FEF0E3] text-[#F47C20] text-xs font-bold px-2 py-0.5 rounded-full">
                  {session.badge}
                </span>
              )}

              {/* Name */}
              <p className="font-syne font-bold text-base text-[#0D1B2A] leading-snug pl-1 mt-1">
                {session.name}
              </p>

              {/* Description */}
              <p className="font-dm text-xs text-[#7A8FA6] pl-1 leading-relaxed flex-1">
                {session.description}
              </p>

              {/* Duration */}
              <p className="font-dm text-xs text-[#3A4A5C] font-medium pl-1 flex items-center gap-1">
                ⏱ {session.duration}
              </p>
            </div>
          ))}
        </div>

        {/* View all CTA */}
        <div className="flex justify-center mt-8">
          <Link href="/book" className="btn-primary">
            View All Sessions &amp; Book →
          </Link>
        </div>

      </div>
    </section>
  );
}
