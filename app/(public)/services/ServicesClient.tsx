"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bot, Zap, Brain, Globe, Shield, BarChart3, Smartphone, GraduationCap, Cpu, ArrowRight } from "lucide-react";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import VideoEmbed from "@/components/video/LazyVideoEmbed";
import { trackPageVisit } from "@/lib/recommendations";
import OpenTiboButton from "@/components/public/OpenTiboButton";
import { useT } from "@/lib/i18n/client";

// Split into what we lead with and what we round out with. Nine equal cards
// asked every visitor to rank us themselves; three of these are already the
// core offer everywhere else on the site, so the page says so.
//
// `name` stays English: it is the value passed to /services/get-started and
// stored with the request. What the visitor reads comes from the dictionary.
const CORE = [
  { id: "agents", icon: Bot, name: "AI Implementation & Agents", color: "#2251A3" },
  { id: "automation", icon: Zap, name: "Workflow Automation", color: "#F47C20" },
  { id: "strategy", icon: Brain, name: "AI Strategy & Consulting", color: "#0F6E56" },
];

const ALSO = [
  { id: "web", icon: Globe, name: "Web & App Development", color: "#2251A3" },
  { id: "security", icon: Shield, name: "Cybersecurity", color: "#7c3aed" },
  { id: "data", icon: BarChart3, name: "Data Analytics", color: "#1B3A6B" },
  { id: "mobile", icon: Smartphone, name: "Mobile Development", color: "#D85A30" },
  { id: "training", icon: GraduationCap, name: "AI Training & Academy", color: "#7c3aed" },
  { id: "iot", icon: Cpu, name: "System Design & IoT", color: "#0F6E56" },
];

// What a visitor actually wants to know before enquiring: what happens next.
const ENGAGEMENT = ["01", "02", "03", "04"];

export default function ServicesClient() {
  const t = useT();
  useEffect(() => {
    trackPageVisit("/services");
  }, []);

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen">
      {/* Hero */}
      <div className="bg-[#1B3A6B] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="section-tag">{t("pages.services.hero.tag")}</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-white mt-3 leading-tight">
            {t("pages.services.hero.title")} <span className="text-[#F47C20]">{t("pages.services.hero.titleAccent")}</span>
          </h1>
          <p className="font-dm text-white/70 text-lg mt-4 max-w-2xl mx-auto">
            {t("pages.services.hero.body")}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/book" className="btn-primary">{t("pages.services.hero.book")}</Link>
            <OpenTiboButton className="bg-white text-[#1B3A6B] hover:bg-[#EBF0FA] font-semibold rounded-lg px-5 py-2.5 transition-colors inline-flex items-center gap-2">
              {t("pages.services.hero.tibo")}
            </OpenTiboButton>
          </div>
        </div>
      </div>

      {/* Video Showcase */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-6">
          <span className="section-tag">{t("pages.services.video.tag")}</span>
          <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mt-2">{t("pages.services.video.title")}</h2>
        </div>
        <VideoEmbed />
      </div>

      {/* What we do — core three, then the rest */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="max-w-2xl mb-8">
          <span className="section-tag">{t("pages.services.what.tag")}</span>
          <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
            {t("pages.services.what.title")}
          </h2>
          <p className="font-dm text-[#3A4A5C] mt-3 leading-relaxed">
            {t("pages.services.what.body")}
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
              <h3 className="font-syne font-bold text-lg text-[#0D1B2A] leading-snug">{t(`pages.services.svc.${svc.id}.name`)}</h3>
              <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-2 flex-1">{t(`pages.services.svc.${svc.id}.desc`)}</p>
              <span
                className="mt-5 inline-flex items-center gap-1.5 font-dm text-sm font-semibold transition-all duration-200 group-hover:gap-2.5"
                style={{ color: svc.color }}
              >
                {t("pages.services.startHere")} <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-[#D2DCE8] bg-[#F4F7FB] p-6 sm:p-8">
          <h3 className="font-syne font-bold text-lg text-[#0D1B2A] mb-5">
            {t("pages.services.also.title")}
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
                    {t(`pages.services.svc.${svc.id}.name`)}
                  </span>
                  <p className="font-dm text-xs text-[#7A8FA6] leading-relaxed mt-0.5">{t(`pages.services.svc.${svc.id}.desc`)}</p>
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
            <span className="section-tag">{t("pages.services.how.tag")}</span>
            <h2 className="font-syne font-extrabold text-3xl text-white mt-2">
              {t("pages.services.how.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ENGAGEMENT.map((step, i) => (
              <div key={step} className="relative pt-5 border-t border-white/15">
                <span className="absolute -top-px left-0 h-px w-10 bg-[#F47C20]" />
                <span className="font-dm text-xs font-bold text-[#F47C20]">{step}</span>
                <h3 className="font-syne font-bold text-lg text-white mt-2">{t(`pages.services.step${i + 1}.title`)}</h3>
                <p className="font-dm text-sm text-white/60 leading-relaxed mt-1.5">{t(`pages.services.step${i + 1}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mt-16 text-center bg-[#F4F7FB] rounded-2xl p-10">
          <span className="section-tag">{t("pages.services.cta.tag")}</span>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-2">{t("pages.services.cta.title")}</h2>
          <p className="font-dm text-[#3A4A5C] mt-2 max-w-md mx-auto">{t("pages.services.cta.body")}</p>
          <Link href="/book" className="btn-primary mt-5 inline-flex">{t("pages.services.cta.button")}</Link>
        </div>
        <SmartRecommendations currentPage="/services" compact />
      </div>
    </div>
  );
}
