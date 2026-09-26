"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bot, Zap, Brain, Globe, Shield, BarChart3, Smartphone, GraduationCap, Cpu, ArrowRight } from "lucide-react";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import VideoEmbed from "@/components/video/VideoEmbed";
import { trackPageVisit } from "@/lib/recommendations";

// Split into what we lead with and what we round out with. Nine equal cards
// asked every visitor to rank us themselves; three of these are already the
// core offer everywhere else on the site, so the page says so.
const CORE = [
  {
    icon: Bot,
    name: "AI Implementation & Agents",
    desc: "Custom agents, LLM integration, RAG systems and workflow automation built around how your operation actually runs — from a single chatbot to autonomous pipelines.",
    color: "#2251A3",
  },
  {
    icon: Zap,
    name: "Workflow Automation",
    desc: "End-to-end process automation with n8n, Make, Zapier and custom pipelines. The repetitive work stops being someone's job.",
    color: "#F47C20",
  },
  {
    icon: Brain,
    name: "AI Strategy & Consulting",
    desc: "Readiness audits, strategy sessions and an implementation roadmap — including the honest answer about where AI is not the right tool.",
    color: "#0F6E56",
  },
];

const ALSO = [
  { icon: Globe, name: "Web & App Development", desc: "Next.js, React, full-stack — production-ready, not a prototype.", color: "#2251A3" },
  { icon: Shield, name: "Cybersecurity", desc: "Security audits, penetration testing and hardened, compliance-ready infrastructure.", color: "#7c3aed" },
  { icon: BarChart3, name: "Data Analytics", desc: "Dashboards, pipelines and insight from the data you already hold.", color: "#1B3A6B" },
  { icon: Smartphone, name: "Mobile Development", desc: "React Native apps that feel native on iOS and Android.", color: "#D85A30" },
  { icon: GraduationCap, name: "AI Training & Academy", desc: "Team workshops, on-site training and 90+ lessons on the TIBLOGICS AI Academy.", color: "#7c3aed" },
  { icon: Cpu, name: "System Design & IoT", desc: "Multi-service architecture, IoT integration and distributed systems.", color: "#0F6E56" },
];

// What a visitor actually wants to know before enquiring: what happens next.
const ENGAGEMENT = [
  { step: "01", title: "A conversation", body: "Free, 30 minutes. You describe the problem; we say whether we are the right people for it." },
  { step: "02", title: "A written plan", body: "Scope, approach, timeline and cost — before anyone commits to anything." },
  { step: "03", title: "We build", body: "In the open, with something working in front of you early rather than a reveal at the end." },
  { step: "04", title: "We stay", body: "Handover, training, or we keep running it. Whichever leaves you in the better position." },
];

export default function ServicesPage() {
  useEffect(() => {
    trackPageVisit("/services");
  }, []);

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen">
      {/* Hero */}
      <div className="bg-[#1B3A6B] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="section-tag">Services</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-white mt-3 leading-tight">
            AI-first. <span className="text-[#F47C20]">Tech-complete.</span>
          </h1>
          <p className="font-dm text-white/70 text-lg mt-4 max-w-2xl mx-auto">
            Every service we offer starts with an AI lens. We identify automation opportunities, recommend AI tools, and architect systems that scale.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/book" className="btn-primary">Book a Consulting</Link>
            <Link href="/tools/advisor" className="bg-white text-[#1B3A6B] hover:bg-[#EBF0FA] font-semibold rounded-lg px-5 py-2.5 transition-colors inline-flex items-center gap-2">
              Talk to Tibo
            </Link>
          </div>
        </div>
      </div>

      {/* Video Showcase */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-6">
          <span className="section-tag">See It in Action</span>
          <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mt-2">What We Do</h2>
        </div>
        <VideoEmbed />
      </div>

      {/* What we do — core three, then the rest */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="max-w-2xl mb-8">
          <span className="section-tag">What we do</span>
          <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
            Three things we are known for.
          </h2>
          <p className="font-dm text-[#3A4A5C] mt-3 leading-relaxed">
            Most engagements start in one of these. The rest of what we do supports them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {CORE.map((svc) => (
            <Link
              key={svc.name}
              href={`/services/get-started?service=${encodeURIComponent(svc.name)}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#D2DCE8] bg-white p-7
                         transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(27,58,107,0.12)]"
            >
              <div
                className="absolute left-0 top-0 h-1 w-full transition-all duration-300 group-hover:h-1.5"
                style={{ backgroundColor: svc.color }}
              />
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: svc.color + "18" }}
              >
                <svc.icon size={23} style={{ color: svc.color }} />
              </div>
              <h3 className="font-syne font-bold text-lg text-[#0D1B2A] leading-snug">{svc.name}</h3>
              <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-2 flex-1">{svc.desc}</p>
              <span
                className="mt-5 inline-flex items-center gap-1.5 font-dm text-sm font-semibold transition-all duration-200 group-hover:gap-2.5"
                style={{ color: svc.color }}
              >
                Start here <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-[#D2DCE8] bg-[#F4F7FB] p-6 sm:p-8">
          <h3 className="font-syne font-bold text-lg text-[#0D1B2A] mb-5">
            And everything around them
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {ALSO.map((svc) => (
              <Link
                key={svc.name}
                href={`/services/get-started?service=${encodeURIComponent(svc.name)}`}
                className="group flex items-start gap-3"
              >
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: svc.color + "18" }}
                >
                  <svc.icon size={17} style={{ color: svc.color }} />
                </div>
                <div className="min-w-0">
                  <span className="font-syne font-bold text-sm text-[#0D1B2A] group-hover:text-[#2251A3] transition-colors">
                    {svc.name}
                  </span>
                  <p className="font-dm text-xs text-[#7A8FA6] leading-relaxed mt-0.5">{svc.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* How an engagement runs */}
      <div className="bg-[#0D1B2A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mb-10">
            <span className="section-tag">How it works</span>
            <h2 className="font-syne font-extrabold text-3xl text-white mt-2">
              What happens after you get in touch.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ENGAGEMENT.map((e) => (
              <div key={e.step} className="relative pt-5 border-t border-white/15">
                <span className="absolute -top-px left-0 h-px w-10 bg-[#F47C20]" />
                <span className="font-dm text-xs font-bold text-[#F47C20]">{e.step}</span>
                <h3 className="font-syne font-bold text-lg text-white mt-2">{e.title}</h3>
                <p className="font-dm text-sm text-white/60 leading-relaxed mt-1.5">{e.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mt-16 text-center bg-[#F4F7FB] rounded-2xl p-10">
          <span className="section-tag">Not sure where to start?</span>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-2">Book a free discovery meeting.</h2>
          <p className="font-dm text-[#3A4A5C] mt-2 max-w-md mx-auto">30 minutes, zero commitment. We'll listen to your challenges and tell you exactly what we'd recommend.</p>
          <Link href="/book" className="btn-primary mt-5 inline-flex">Get Started for Free</Link>
        </div>
        <SmartRecommendations currentPage="/services" compact />
      </div>
    </div>
  );
}
