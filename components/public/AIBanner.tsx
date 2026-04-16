"use client";

import Link from "next/link";

const aiPills = ["AI Agents", "Automation", "Voice AI"] as const;
const techPills = ["Web Dev", "Mobile", "Cybersecurity"] as const;

const metrics = [
  { number: "3×",   label: "Revenue Lift" },
  { number: "68%",  label: "Cost Reduction" },
  { number: "24/7", label: "AI Availability" },
  { number: "14d",  label: "Deploy Time" },
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
            <Link
              href="/tools/advisor"
              className="bg-white text-[#1B3A6B] hover:bg-[#EBF0FA] rounded-lg px-5 py-2.5 font-semibold text-sm inline-flex items-center gap-2 transition-colors duration-200"
            >
              Get Your AI Readiness Score →
            </Link>
          </div>
        </div>

        {/* ── Right column — 2×2 metrics grid ── */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="border border-white/10 rounded-xl p-4 flex flex-col gap-1"
            >
              <span className="font-syne font-extrabold text-3xl text-[#F47C20]">
                {m.number}
              </span>
              <span className="text-white/60 text-sm font-dm">{m.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
