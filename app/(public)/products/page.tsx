"use client";

import Link from "next/link";

const products = [
  { name: "Goal Tester",            emoji: "🎯", industry: "Business Strategy",        color: "#1B3A6B" },
  { name: "InStory School",         emoji: "📚", industry: "Education & EdTech",        color: "#2251A3" },
  { name: "CareFlow AI",            emoji: "❤️", industry: "Healthcare & Social Care",  color: "#0F6E56" },
  { name: "ShipFrica",              emoji: "📦", industry: "Logistics & Shipping",       color: "#F47C20" },
  { name: "AI Academy",             emoji: "🎓", industry: "Education & Training",       color: "#7c3aed" },
  { name: "RoofGuard",              emoji: "🏠", industry: "Property & Construction",    color: "#D85A30" },
  { name: "Tibintel",               emoji: "🧠", industry: "Business Intelligence",      color: "#1B3A6B" },
  { name: "Amber",                  emoji: "🔔", industry: "Communications & Alerts",    color: "#D97706" },
  { name: "GeoStrat",               emoji: "🌍", industry: "Geospatial Intelligence",    color: "#0F6E56" },
  { name: "AI Readiness Platform",  emoji: "📊", industry: "AI Assessment",              color: "#2251A3" },
  { name: "AI Central",             emoji: "⚡", industry: "AI Operations",              color: "#0F6E56" },
  { name: "AutoIQ",                 emoji: "🚗", industry: "Automotive Technology",      color: "#F47C20" },
  { name: "Appreciate Songs",       emoji: "🎵", industry: "Music Technology",           color: "#7c3aed" },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-[#1B3A6B] pt-32 sm:pt-44 pb-16">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-16">
          {products.map((p) => (
            <div
              key={p.name}
              className="group relative bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden flex flex-col
                         transition-all duration-300 ease-out
                         hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] hover:border-transparent"
            >
              {/* Color accent bar */}
              <div
                className="h-1.5 w-full transition-all duration-300 group-hover:h-2"
                style={{ backgroundColor: p.color }}
              />

              {/* Subtle color wash on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none"
                style={{ backgroundColor: p.color }}
              />

              <div className="p-6 flex flex-col gap-3 flex-1">
                {/* Emoji */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: p.color + "18" }}
                >
                  {p.emoji}
                </div>

                {/* Industry */}
                <span className="font-dm text-xs font-semibold uppercase tracking-wider" style={{ color: p.color }}>
                  {p.industry}
                </span>

                {/* Name */}
                <h3 className="font-syne font-bold text-lg text-[#0D1B2A] leading-snug">
                  {p.name}
                </h3>

                {/* CTA */}
                <div className="mt-auto pt-2">
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-1.5 text-sm font-dm font-semibold px-4 py-2.5 rounded-xl text-white transition-all duration-200 group-hover:gap-2.5"
                    style={{ backgroundColor: p.color }}
                  >
                    Build yours now →
                  </Link>
                </div>
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
