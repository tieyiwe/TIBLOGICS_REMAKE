import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Globe, Zap, Users, Shield, Target, Lightbulb, TrendingUp } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import Html from "../_i18n/Html";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("pages.about.meta.title"),
    description: t("pages.about.meta.description"),
    keywords: [
      "about TIBLOGICS", "AI agency mission", "AI implementation company", "Tieyiwe Bassole",
      "AI consulting firm", "digital solutions agency", "AI for African businesses",
      "bilingual AI agency", "AI first principles",
    ],
    alternates: { canonical: "https://tiblogics.com/about" },
    openGraph: {
      title: t("pages.about.meta.ogTitle"),
      description: t("pages.about.meta.ogDescription"),
      url: "https://tiblogics.com/about",
      type: "website",
      images: [{ url: "https://tiblogics.com/opengraph-image?v=3", width: 1200, height: 630, alt: t("pages.about.hero.tag") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pages.about.hero.tag"),
      description: t("pages.about.meta.twitterDescription"),
      creator: "@tiblogics",
      images: ["https://tiblogics.com/opengraph-image?v=3"],
    },
  };
}

const principles = [
  { icon: Shield, id: "integrity" },
  { icon: Zap, id: "urgency" },
  { icon: Lightbulb, id: "first" },
  { icon: Target, id: "logic" },
  { icon: TrendingUp, id: "results" },
  { icon: Users, id: "growth" },
];

const industries = [
  { id: "healthcare", emoji: "🏥" },
  { id: "education", emoji: "📚" },
  { id: "logistics", emoji: "📦" },
  { id: "hospitality", emoji: "🍽️" },
  { id: "government", emoji: "🏛️" },
  { id: "startups", emoji: "🚀" },
  { id: "nonprofits", emoji: "🤝" },
  { id: "enterprise", emoji: "🏢" },
];

const services = [
  "implementation", "consulting", "automation",
  "web", "security", "data",
  "agents", "saas", "transformation",
];

export default async function AboutPage() {
  const t = await getT();
  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen">

      {/* Hero */}
      <div className="bg-[#1B3A6B] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="section-tag">{t("pages.about.hero.tag")}</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-white mt-4 leading-tight">
            {t("pages.about.hero.title")}{" "}
            <span className="text-[#F47C20]">{t("pages.about.hero.titleAccent")}</span>
          </h1>
          <p className="font-dm text-white/75 text-lg mt-5 max-w-3xl leading-relaxed">
            {t("pages.about.hero.body")}
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="bg-white border-b border-[#E8EFF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2">
              <span className="section-tag">{t("pages.about.mission.tag")}</span>
              <Html as="p" className="font-dm text-[#3A4A5C] text-lg leading-relaxed mt-4" html={t("pages.about.mission.p1")} />
              <p className="font-dm text-[#3A4A5C] leading-relaxed mt-4">
                {t("pages.about.mission.p2")}
              </p>
            </div>
            <div className="bg-[#F4F7FB] rounded-2xl p-6 border border-[#E8EFF8]">
              <Globe size={20} className="text-[#2251A3] mb-3" />
              <p className="font-syne font-bold text-sm text-[#0D1B2A] mb-2">{t("pages.about.markets.title")}</p>
              <Html as="p" className="font-dm text-sm text-[#3A4A5C] leading-relaxed" html={t("pages.about.markets.body")} />
            </div>
          </div>
        </div>
      </div>

      {/* What Sets Us Apart */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <span className="section-tag">{t("pages.about.apart.tag")}</span>
          <h2 className="font-syne font-extrabold text-2xl md:text-3xl text-[#0D1B2A] mt-2 leading-snug">
            {t("pages.about.apart.title")}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-7">
            <Html as="p" className="font-dm text-[#3A4A5C] leading-relaxed" html={t("pages.about.apart.p1")} />
          </div>

          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-7">
            <Html as="p" className="font-dm text-[#3A4A5C] leading-relaxed" html={t("pages.about.apart.p2")} />
          </div>

          <div className="bg-gradient-to-br from-[#EBF0FA] to-[#F4F7FB] border border-[#D2DCE8] rounded-2xl p-7">
            <h3 className="font-syne font-bold text-base text-[#1B3A6B] mb-3">{t("pages.about.apart.smallTitle")}</h3>
            <Html as="p" className="font-dm text-[#3A4A5C] leading-relaxed" html={t("pages.about.apart.smallBody")} />
          </div>
        </div>
      </div>

      {/* Founder */}
      <div className="bg-[#F4F7FB] border-y border-[#E8EFF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <span className="section-tag">{t("pages.about.founder.tag")}</span>
          <div className="mt-6 flex flex-col sm:flex-row gap-8 items-start">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] rounded-2xl flex items-center justify-center shrink-0">
              <span className="font-syne font-extrabold text-3xl text-white">T</span>
            </div>
            <div>
              <blockquote className="border-l-4 border-[#F47C20] pl-5 mb-6">
                <p className="font-dm text-[#3A4A5C] leading-relaxed italic">
                  &ldquo;{t("pages.about.founder.quote")}&rdquo;
                </p>
              </blockquote>
              <div className="flex flex-wrap gap-3">
                <a href="mailto:ai@tiblogics.com" className="btn-primary text-sm py-2 inline-flex items-center gap-2">
                  <Mail size={14} /> ai@tiblogics.com
                </a>
                <Link href="/book" className="btn-secondary text-sm py-2">{t("pages.about.founder.book")}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Track Record */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="section-tag">{t("pages.about.track.tag")}</span>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-2">{t("pages.about.track.title")}</h2>
          <p className="font-dm text-[#7A8FA6] mt-3 max-w-2xl mx-auto leading-relaxed">
            {t("pages.about.track.body")}
          </p>
        </div>

        {/* Who we work with */}
        <div className="mb-12">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A] mb-4 text-center">{t("pages.about.track.who")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {industries.map((ind) => (
              <div key={ind.id} className="bg-white border border-[#D2DCE8] rounded-xl px-4 py-3 flex items-center gap-2.5">
                <span className="text-lg">{ind.emoji}</span>
                <span className="font-dm text-xs text-[#3A4A5C] font-medium leading-tight">{t(`pages.about.industry.${ind.id}`)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Principles */}
        <div className="text-center mb-8">
          <span className="section-tag">{t("pages.about.principles.tag")}</span>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mt-2">{t("pages.about.principles.title")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {principles.map((p) => (
            <div key={p.id} className="bg-[#F4F7FB] rounded-2xl p-6 border border-[#E8EFF8]">
              <div className="w-10 h-10 bg-[#EBF0FA] rounded-xl flex items-center justify-center mb-3">
                <p.icon size={18} className="text-[#2251A3]" />
              </div>
              <h3 className="font-syne font-bold text-base text-[#0D1B2A] mb-2">{t(`pages.about.principle.${p.id}.title`)}</h3>
              <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed">{t(`pages.about.principle.${p.id}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Services */}
      <div className="bg-[#F4F7FB] border-t border-[#E8EFF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-7">
            <span className="section-tag">{t("pages.about.services.tag")}</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {services.map((s) => (
              <span key={s} className="bg-white border border-[#D2DCE8] text-[#3A4A5C] font-dm text-sm px-4 py-2 rounded-full">
                {t(`pages.about.service.${s}`)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#F4F7FB] py-16 px-4">
        <div className="max-w-xl mx-auto bg-[#1B3A6B] rounded-2xl px-8 py-12 text-center">
          <p className="font-dm text-[#7A9BBF] text-sm uppercase tracking-widest mb-4">{t("pages.about.cta.kicker")}</p>
          <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-white leading-tight mb-4">
            {t("pages.about.cta.title")}<br />
            <span className="text-[#F47C20]">{t("pages.about.cta.titleAccent")}</span>
          </h2>
          <p className="font-dm text-white/70 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            {t("pages.about.cta.body")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book" className="btn-primary">{t("pages.about.cta.book")}</Link>
            <Link href="/services" className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg px-5 py-2.5 transition-colors inline-flex items-center gap-2 border border-white/20">
              {t("pages.about.cta.services")}
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
