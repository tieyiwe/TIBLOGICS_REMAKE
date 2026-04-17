import Link from "next/link";
import { MapPin, Mail, Globe, Award, Users, Zap, BookOpen } from "lucide-react";

const milestones = [
  { year: "2022", event: "Founded TIBLOGICS in Wheaton, Maryland" },
  { year: "2023", event: "Launched AI Academy — 90+ lessons across 3 courses" },
  { year: "2024", event: "InStory Method Platform — K-8 AI personalized learning" },
  { year: "2024", event: "Caribbean Flavor Restaurant full digital transformation" },
  { year: "2025", event: "SSR International Airport — Mauritius AI operations contract" },
  { year: "2026", event: "CareFlow AI + ShipFrica in beta — Francophone Africa expansion" },
];

const values = [
  { icon: Zap, title: "AI-First, Always", desc: "Every engagement starts with an AI architecture review. We don't retrofit AI — we build it in from day one." },
  { icon: Users, title: "Your Success Is Ours", desc: "We measure our work by the outcomes we create for clients, not the hours we bill." },
  { icon: Globe, title: "Two Continents, One Vision", desc: "Serving North America and Francophone Africa with equal commitment, in both English and French." },
  { icon: BookOpen, title: "We Build AND Teach", desc: "We share everything we learn. Our academy, free tools, and open approach reflect our belief in knowledge sharing." },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      {/* Hero */}
      <div className="bg-[#1B3A6B] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="section-tag">About TIBLOGICS</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-white mt-3 leading-tight">
            Built by a builder.<br /><span className="text-[#F47C20]">For builders.</span>
          </h1>
          <p className="font-dm text-white/70 text-lg mt-4 max-w-2xl leading-relaxed">
            TIBLOGICS was founded by Tieyiwe Bassole (Tieyiwe) — a self-taught developer, AI strategist, and entrepreneur who built everything from scratch in Wheaton, Maryland.
          </p>
        </div>
      </div>

      {/* Founder section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-24 h-24 bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] rounded-2xl flex items-center justify-center mb-6">
              <span className="font-syne font-extrabold text-4xl text-white">T</span>
            </div>
            <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mb-3">Tieyiwe Bassole</h2>
            <p className="font-dm text-[#3A4A5C] text-sm mb-1 font-medium">Founder & CEO, TIBLOGICS</p>
            <div className="flex items-center gap-2 text-[#7A8FA6] text-sm font-dm mb-4">
              <MapPin size={14} /> Wheaton, MD / Washington D.C.
            </div>
            <p className="font-dm text-[#3A4A5C] leading-relaxed mb-4">
              Tieyiwe is a developer and AI strategist who has shipped full-stack products across EdTech, HealthTech, logistics, hospitality, and government sectors. He's equally comfortable writing code, architecting AI pipelines, and closing enterprise contracts.
            </p>
            <p className="font-dm text-[#3A4A5C] leading-relaxed mb-6">
              Originally from Burkina Faso, he brings a global perspective to every engagement — bridging North American tech standards with Francophone African market realities.
            </p>
            <div className="flex gap-3">
              <a href="mailto:ai@tiblogics.com" className="btn-primary text-sm py-2">
                <Mail size={14} /> ai@tiblogics.com
              </a>
              <Link href="/book" className="btn-secondary text-sm py-2">Book a Meeting</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-syne font-bold text-base text-[#0D1B2A] mb-4">Timeline</h3>
            {milestones.map((m) => (
              <div key={m.year + m.event} className="flex gap-4">
                <div className="w-12 shrink-0">
                  <span className="font-syne font-bold text-sm text-[#F47C20]">{m.year}</span>
                </div>
                <div className="flex-1 pb-3 border-b border-[#F4F7FB]">
                  <p className="font-dm text-sm text-[#3A4A5C]">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <span className="section-tag">Our Values</span>
            <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-2">What drives us.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-[#F4F7FB] rounded-2xl p-6">
                <div className="w-10 h-10 bg-[#EBF0FA] rounded-xl flex items-center justify-center mb-3">
                  <v.icon size={18} className="text-[#2251A3]" />
                </div>
                <h3 className="font-syne font-bold text-base text-[#0D1B2A] mb-2">{v.title}</h3>
                <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
