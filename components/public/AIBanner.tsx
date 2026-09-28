
import Link from "next/link";

const aiPills = ["AI Agents", "Automation", "Voice AI"] as const;
const techPills = ["Web Dev", "Mobile", "Cybersecurity"] as const;

// This grid used to show "3× Revenue Lift", "68% Cost Reduction", "24/7" and
// "14d Deploy Time". None of them had a source — they were placeholder figures
// from when the site was first generated — and an unsourced number is worse
// than none for the buyers this page is for. The grid now shows how an
// engagement actually starts. Step 1 is what the booking system enforces
// (Project Discovery: free, 30 minutes); steps 2–4 are the process the copy to
// the left already describes.
const steps = [
  { n: "01", title: "A free 30-minute call", body: "No commitment. Tell us what is slowing the business down." },
  { n: "02", title: "Map your workflows", body: "Where the hours actually go, not where they seem to." },
  { n: "03", title: "Find what to automate", body: "And, just as usefully, what is not worth automating." },
  { n: "04", title: "Design systems that scale", body: "Built around how your team already works." },
] as const;

export default function AIBanner() {
  return (
    <div className="relative overflow-hidden bg-[#1B3A6B] rounded-[20px] p-8 md:p-12">
      {/* Subtle gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #1B3A6B 0%, #2251A3 100%)",
          opacity: 0.6,
        }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">
          <span className="section-tag">AI Is Our Core</span>

          <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-white leading-tight">
            We don&apos;t add AI to projects.{" "}
            <br className="hidden sm:block" />
            We <span className="text-[#F47C20]">start</span> with it.
          </h2>

          <p className="text-white/70 font-dm text-base leading-relaxed max-w-lg">
            Every engagement begins with an AI architecture review. We map your
            workflows, identify automation opportunities, and design systems that
            scale.
          </p>

          {/* Capability pills */}
          <div className="flex flex-wrap gap-2">
            {aiPills.map((pill) => (
              <span
                key={pill}
                className="bg-[#F47C20]/20 text-[#F47C20] border border-[#F47C20]/30 rounded-full px-3 py-1 text-xs font-medium font-dm"
              >
                {pill}
              </span>
            ))}
            {techPills.map((pill) => (
              <span
                key={pill}
                className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs font-medium font-dm"
              >
                {pill}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div>
            {/* Was "Get Your AI Readiness Score" -> /tools/advisor, a tool marked
                retired in production. The readiness scan now lives in the hero. */}
            <Link
              href="/book"
              className="bg-white text-[#1B3A6B] hover:bg-[#EBF0FA] rounded-lg px-5 py-2.5 font-semibold text-sm inline-flex items-center gap-2 transition-colors duration-200"
            >
              Start with a free call →
            </Link>
          </div>
        </div>

        {/* ── Right column — how an engagement starts ── */}
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steps.map((st) => (
            <li
              key={st.n}
              className="border border-white/10 bg-white/[0.03] rounded-xl p-4 flex flex-col gap-1.5"
            >
              <span className="font-dm text-xs font-semibold tracking-[0.18em] text-[#F47C20]">
                {st.n}
              </span>
              <span className="font-syne font-bold text-lg leading-snug text-white">{st.title}</span>
              <span className="text-white/60 text-sm font-dm leading-relaxed">{st.body}</span>
            </li>
          ))}
        </ol>

      </div>
    </div>
  );
}
