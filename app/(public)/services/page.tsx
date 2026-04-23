"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bot, Zap, Brain, Globe, Shield, BarChart3, Smartphone, GraduationCap, Cpu, ArrowRight } from "lucide-react";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import { trackPageVisit } from "@/lib/recommendations";

const services = [
  { icon: Bot, name: "AI Implementation & Agents", desc: "Custom AI agents, LLM integration, RAG systems, and intelligent workflow automation tailored to your exact operations. From chatbots to autonomous pipelines.", color: "#2251A3" },
  { icon: Zap, name: "Workflow Automation", desc: "End-to-end process automation using n8n, Make, Zapier, and custom pipelines. Eliminate repetitive work and scale without headcount.", color: "#F47C20" },
  { icon: Brain, name: "AI Strategy & Consulting", desc: "AI readiness audits, strategy sessions, and implementation roadmaps for leaders who want to move fast and smart.", color: "#0F6E56" },
  { icon: Globe, name: "Web & App Development", desc: "Next.js, React, full-stack web applications. We build fast, scalable, production-ready digital products.", color: "#2251A3" },
  { icon: Shield, name: "Cybersecurity", desc: "Security audits, penetration testing, hardened infrastructure, and compliance-ready systems for peace of mind.", color: "#7c3aed" },
  { icon: BarChart3, name: "Data Analytics", desc: "Business intelligence dashboards, data pipelines, and AI-powered insights that turn raw data into competitive advantage.", color: "#1B3A6B" },
  { icon: Smartphone, name: "Mobile Development", desc: "React Native cross-platform apps that deliver native-quality experiences on iOS and Android.", color: "#D85A30" },
  { icon: GraduationCap, name: "AI Training & Academy", desc: "Team workshops, on-site training, and access to 90+ lessons on the TIBLOGICS AI Academy on Skool.", color: "#7c3aed" },
  { icon: Cpu, name: "System Design & IoT", desc: "Multi-service architecture design, IoT integrations, and complex distributed systems for ambitious technical challenges.", color: "#0F6E56" },
];

export default function ServicesPage() {
  useEffect(() => {
    trackPageVisit("/services");
  }, []);

  return (
    <div className="pt-44 pb-20 min-h-screen">
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
            <Link href="/book" className="btn-primary">Book a Session</Link>
            <Link href="/tools/advisor" className="bg-white text-[#1B3A6B] hover:bg-[#EBF0FA] font-semibold rounded-lg px-5 py-2.5 transition-colors inline-flex items-center gap-2">
              Talk to Tibo
            </Link>
          </div>
        </div>
      </div>

      {/* Services grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <div key={svc.name} className="bg-white border border-[#D2DCE8] rounded-2xl p-6 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: svc.color + "20" }}>
                <svc.icon size={22} style={{ color: svc.color }} />
              </div>
              <h2 className="font-syne font-bold text-base text-[#0D1B2A] mb-2">{svc.name}</h2>
              <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mb-4 flex-1">{svc.desc}</p>
              <Link
                href={`/services/get-started?service=${encodeURIComponent(svc.name)}`}
                className="inline-flex items-center gap-1.5 bg-[#1B3A6B] hover:bg-[#2251A3] text-white text-sm font-dm font-semibold px-4 py-2 rounded-xl transition-colors mt-auto"
              >
                Get Started <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>

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
