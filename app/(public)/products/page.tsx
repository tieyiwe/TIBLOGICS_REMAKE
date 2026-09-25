import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lightbulb, Compass, Hammer, Rocket } from "lucide-react";

export const metadata: Metadata = {
  title: "Startups & Products | TIBLOGICS",
  description:
    "TIBLOGICS builds AI-first startups across education, health, logistics, business intelligence and more — and partners with founders who have an idea worth building.",
};

// The page leads with problem spaces, not a product catalogue. A wall of
// twelve names tells a visitor nothing about whether the studio can help them;
// the domain says where we work and why.
const DOMAINS = [
  {
    name: "Education & Learning",
    color: "#2251A3",
    premise:
      "Learning software that adapts to the student, instead of asking the student to adapt to the software.",
  },
  {
    name: "Healthcare & Medical",
    color: "#0F6E56",
    premise:
      "Clinical and care work has a long tail nobody has hours for — the follow-up, the check-in, the note written after the appointment. That tail is where we build.",
  },
  {
    name: "Logistics & Mobility",
    color: "#F47C20",
    premise:
      "Moving goods and vehicles through markets where the process still runs on phone calls and spreadsheets.",
  },
  {
    name: "Business Intelligence & Operations",
    color: "#1B3A6B",
    premise:
      "Most companies already hold the data that answers their hardest question. The gap is turning it into a decision someone can act on this week.",
  },
  {
    name: "Finance",
    color: "#0E7490",
    premise:
      "The numbers already exist; the analysis is the bottleneck. Reporting, reconciliation, pricing — and working out what an AI feature actually costs to run before it ships.",
  },
  {
    name: "Cybersecurity",
    color: "#9F1239",
    premise:
      "Defending systems that now include models, and using models to catch what a human reviewer scrolling through logs would miss.",
  },
  {
    name: "AI Adoption",
    color: "#7c3aed",
    premise:
      "Working out where AI genuinely fits — and where it does not — before an organisation commits budget to it.",
  },
  {
    name: "Property & Geospatial",
    color: "#D85A30",
    premise:
      "Reading the physical world — buildings, land, location — from data rather than from a site visit.",
  },
  {
    name: "Creative & Culture",
    color: "#D97706",
    premise: "Where AI supports the craft rather than replacing the person doing it.",
  },
];

// Only two ventures are surfaced by name. The page is about the domains; these
// are the evidence that the studio ships, not a catalogue.
//
// Blindwhisper has no description anywhere in the codebase, so it carries none
// here — the card renders without one rather than with something invented.
const HIGHLIGHTS: { name: string; note: string; blurb: string; href?: string; color: string }[] = [
  {
    name: "Goal Tester",
    note: "Live",
    blurb: "An AI-powered SMART goal platform, with its Tax Tester feature in production.",
    href: "https://goaltester.com",
    color: "#2251A3",
  },
  {
    name: "Blindwhisper",
    // No status claimed — the site could not be reached from here, so whether
    // it is live, in beta or a waitlist is unknown. Goal Tester's "Live" comes
    // from prisma/seed.ts, which says so.
    note: "",
    // Intentionally empty: no description of this product exists in the
    // codebase and the site could not be read from here. The card renders
    // without a blurb rather than with an invented one — fill it in when the
    // real wording is to hand.
    blurb: "",
    href: "https://blindwhisper.com",
    color: "#F47C20",
  },
];

const HOW = [
  {
    icon: Compass,
    title: "Find the real problem",
    body: "We start in a sector we understand, with a problem someone is already paying to work around.",
  },
  {
    icon: Hammer,
    title: "Build it AI-first",
    body: "Not a product with AI bolted on afterwards — the model is part of how the thing works from the first sketch.",
  },
  {
    icon: Rocket,
    title: "Launch, then stay",
    body: "We run what we ship. Every venture below is something we operate, not a case study we walked away from.",
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-[#1B3A6B] pt-32 sm:pt-44 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="section-tag">Venture Studio</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-white mt-3 leading-tight">
            We don&apos;t just advise on AI.{" "}
            <span className="text-[#F47C20]">We build companies with it.</span>
          </h1>
          <p className="font-dm text-white/70 text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
            TIBLOGICS is a studio. We pick a sector, find the problem people are already
            paying to work around, and build the company that solves it. {DOMAINS.length} domains, and
            counting.
          </p>
          <div className="flex justify-center gap-3 mt-8 flex-wrap">
            <Link href="#startup-idea" className="btn-primary">
              Have a startup idea?
            </Link>
            <Link
              href="#domains"
              className="bg-white/10 text-white hover:bg-white/15 font-semibold rounded-lg px-5 py-2.5 transition-colors inline-flex items-center gap-2 backdrop-blur"
            >
              See where we build
            </Link>
          </div>
        </div>
      </div>

      {/* How we build */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW.map((h, i) => (
            <div key={h.title} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F7FB] border border-[#D2DCE8] flex items-center justify-center">
                  <h.icon size={18} className="text-[#1B3A6B]" />
                </div>
                <span className="font-dm text-xs font-bold text-[#B9C7D8]">0{i + 1}</span>
              </div>
              <h3 className="font-syne font-bold text-lg text-[#0D1B2A]">{h.title}</h3>
              <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-1.5">{h.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Domains */}
      <div id="domains" className="bg-[#F4F7FB] border-y border-[#D2DCE8] scroll-mt-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mb-10">
            <span className="section-tag">Where we build</span>
            <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
              {DOMAINS.length} domains, one way of working.
            </h2>
            <p className="font-dm text-[#3A4A5C] mt-3 leading-relaxed">
              We go deep in a handful of sectors rather than shallow across all of them. Each
              one below is a problem space we have built in and still work in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DOMAINS.map((d) => (
              <div
                key={d.name}
                className="group relative bg-white border border-[#D2DCE8] rounded-2xl p-6 overflow-hidden
                           transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
                  style={{ backgroundColor: d.color }}
                />
                <div className="pl-3">
                  <h3 className="font-syne font-bold text-xl text-[#0D1B2A]">{d.name}</h3>
                  <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-2">{d.premise}</p>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two ventures, named — proof the studio ships, not a catalogue */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="max-w-2xl mb-8">
          <span className="section-tag">In the open</span>
          <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
            Two you can look at today.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {HIGHLIGHTS.map((h) => {
            const inner = (
              <>
                {h.note && (
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color }} />
                    <span
                      className="font-dm text-xs font-bold uppercase tracking-wider"
                      style={{ color: h.color }}
                    >
                      {h.note}
                    </span>
                  </div>
                )}
                <h3 className="font-syne font-extrabold text-2xl text-[#0D1B2A]">{h.name}</h3>
                {h.blurb && (
                  <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-2">{h.blurb}</p>
                )}
                {h.href && (
                  <span className="mt-4 inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-[#1B3A6B]">
                    Visit the site <ArrowRight size={14} />
                  </span>
                )}
              </>
            );
            const shell =
              "group block bg-white border border-[#D2DCE8] rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]";
            return h.href ? (
              <a key={h.name} href={h.href} target="_blank" rel="noopener noreferrer" className={shell}>
                {inner}
              </a>
            ) : (
              <div key={h.name} className={shell}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      {/* Have a startup idea */}
      <div id="startup-idea" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-32">
        <div className="relative overflow-hidden rounded-3xl bg-[#0D1B2A] p-8 sm:p-12">
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40"
            style={{ background: "radial-gradient(circle,#F47C20,transparent 70%)" }}
          />
          <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 bg-[#F47C20]/15 border border-[#F47C20]/30">
                <Lightbulb size={13} className="text-[#F9A738]" />
                <span className="font-dm text-xs font-semibold text-[#F9A738]">For founders</span>
              </div>
              <h2 className="font-syne font-extrabold text-3xl sm:text-4xl text-white leading-tight">
                Have a startup idea?
              </h2>
              <p className="font-dm text-white/70 mt-3 leading-relaxed max-w-xl">
                Bring it to us. We will tell you honestly whether it is worth building, what it
                would actually take, and whether we are the right people to build it with you.
                No pitch deck required.
              </p>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3">
              <Link
                href="/book"
                className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#F47C4C] to-[#F9A738] px-5 py-4 text-[#131A1B] transition-transform hover:-translate-y-0.5"
              >
                <span>
                  <span className="block font-syne font-extrabold text-base">Talk it through</span>
                  <span className="block font-dm text-sm opacity-80">Free call, no commitment</span>
                </span>
                <ArrowRight size={18} className="shrink-0" />
              </Link>

              <Link
                href="/services"
                className="flex items-center justify-between gap-3 rounded-xl bg-white/10 border border-white/15 px-5 py-4 text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                <span>
                  <span className="block font-syne font-bold text-base">See how we build</span>
                  <span className="block font-dm text-sm text-white/60">What working with us looks like</span>
                </span>
                <ArrowRight size={18} className="shrink-0" />
              </Link>
            </div>
          </div>
        </div>

        {/* Partnership — kept, but secondary to the founder path above */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D2DCE8] bg-[#F4F7FB] px-6 py-5">
          <div>
            <p className="font-syne font-bold text-[#0D1B2A]">Already running something?</p>
            <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
              Several of the ventures we run are open to white-labelling or a strategic partnership.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B3A6B] px-4 py-2.5 text-sm font-dm font-semibold text-white transition-colors hover:bg-[#2251A3]"
          >
            Get in touch <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
