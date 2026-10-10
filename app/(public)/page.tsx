import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/public/Hero";
import AIBanner from "@/components/public/AIBanner";
import { Bot, Zap, Brain, BookOpen, HeartPulse, Package, GraduationCap } from "lucide-react";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import { FaqBlock } from "@/components/seo/AnswerBlocks";
import JsonLd from "@/components/seo/JsonLd";
import { webPageNode } from "@/lib/seo/jsonld";
import { ORG_ID } from "@/lib/seo/site";
import Testimonials from "@/components/reviews/Testimonials";

const SERVICE_COUNT = 9;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = translatorFor(locale);
  return pageMetadata({
    path: "/",
    locale,
    // The layout template appends " | TIBLOGICS", so naming the brand here
    // repeated it in every search result.
    title: t("home.meta.title"),
    description: t("home.meta.description"),
    socialTitle: t("home.meta.ogTitle"),
    socialDescription: t("home.meta.ogDescription"),
    keywords: [
      "AI implementation agency", "AI agents", "workflow automation", "AI consulting",
      "digital transformation", "AI for small business", "LLM integration", "AI strategy",
      "web development", "mobile development", "cybersecurity", "data analytics", "TIBLOGICS",
    ],
  });
}

/** The questions people ask search and AI assistants about the company. */
const HOME_FAQ = [1, 2, 3, 4];

// Text lives in home.services.<key>.name / .desc
const featuredServices = [
  { icon: Bot, key: "ai", color: "#2251A3" },
  { icon: Zap, key: "automation", color: "#F47C20" },
  { icon: Brain, key: "strategy", color: "#0F6E56" },
];

const featuredProducts = [
  // Icons rather than emoji: emoji render differently on every platform and are
  // the quickest way for a page to read as a template.
  // Product names stay in English; descriptions are home.products.<key>.
  { name: "InStory", key: "instory", icon: BookOpen, color: "#2251A3", tag: "edtech" },
  { name: "CareFlow AI", key: "careflow", icon: HeartPulse, color: "#0F6E56", tag: "healthtech" },
  { name: "ShipFrica", key: "shipfrica", icon: Package, color: "#F47C20", tag: "logistics" },
  { name: "AI Academy", key: "academy", icon: GraduationCap, color: "#7c3aed", tag: "edtech" },
];

export default async function HomePage() {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const serviceCount = SERVICE_COUNT.toLocaleString(locale);
  return (
    <>
      <Hero />
      {/* StatsBar is not rendered: all four of its values are hardcoded null in
          components/public/StatsBar.tsx, so it drew a navy band of labels with no
          numbers above them, directly above a panel that does show real figures.
          Put the real numbers in that file and restore this line. */}

      {/* AI Banner */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AIBanner />
        </div>
      </section>

      {/* Services teaser */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="section-tag">{t("home.services.tag")}</span>
              <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
                {t("home.services.title")}
              </h2>
            </div>
            <Link
              href="/services"
              className="hidden sm:inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-[#2251A3] font-medium text-sm hover:text-[#1B3A6B] transition-colors"
            >
              {t("home.services.all", { n: serviceCount })}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {featuredServices.map((svc) => {
              const Icon = svc.icon;
              return (
                <div
                  key={svc.key}
                  className="bg-white border border-[#D2DCE8] rounded-2xl p-6 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: svc.color + "20" }}
                  >
                    <Icon size={22} style={{ color: svc.color }} />
                  </div>
                  <h3 className="font-syne font-bold text-base text-[#0D1B2A]">{t(`home.services.${svc.key}.name`)}</h3>
                  <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-1">{t(`home.services.${svc.key}.desc`)}</p>
                </div>
              );
            })}
          </div>
          <Link href="/services" className="sm:hidden btn-ghost text-sm">
            {t("home.services.viewAll", { n: serviceCount })}
          </Link>
        </div>
      </section>

      {/* Products teaser */}
      <section className="py-16 bg-[#F4F7FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="section-tag">{t("home.products.tag")}</span>
              <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
                {t("home.products.title")}
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-[#2251A3] font-medium text-sm hover:text-[#1B3A6B] transition-colors"
            >
              {t("home.products.all")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {featuredProducts.map((p) => (
              <div
                key={p.name}
                className="bg-white border border-[#D2DCE8] rounded-2xl p-5 flex flex-col gap-2 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: p.color + "1A" }}
                >
                  <p.icon size={21} style={{ color: p.color }} />
                </div>
                <span className="section-tag">{t(`home.products.tag.${p.tag}`)}</span>
                <h3 className="font-syne font-bold text-base text-[#0D1B2A]">{p.name}</h3>
                <p className="font-dm text-xs text-[#7A8FA6] leading-relaxed flex-1">{t(`home.products.${p.key}`)}</p>
              </div>
            ))}
          </div>
          <Link href="/products" className="sm:hidden btn-ghost text-sm">
            {t("home.products.viewAll")}
          </Link>
        </div>
      </section>

      {/* Real client reviews, approved by staff. Nothing renders until one is. */}
      <Testimonials scope="site" locale={locale} />

      {/* FAQ: visible answers, repeated as FAQPage structured data */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FaqBlock
            title={t("seo.faq")}
            path="/"
            items={HOME_FAQ.map((n) => ({ q: t(`seo.home.faq.${n}.q`), a: t(`seo.home.faq.${n}.a`) }))}
          />
        </div>
      </section>
      <JsonLd data={webPageNode({ path: "/", name: t("home.meta.ogTitle"), description: t("home.meta.description"), about: ORG_ID, inLanguage: locale })} />

      {/* Booking CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="section-tag">{t("home.cta.tag")}</span>
          <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
            {t("home.cta.title")}
          </h2>
          <p className="font-dm text-[#3A4A5C] text-lg mt-3">
            {t("home.cta.body")}
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 mt-6">
            <Link href="/book" className="btn-primary justify-center" data-track="cta-book-call-home">
              {t("home.cta.book")}
            </Link>
            <Link href="/services" className="btn-secondary justify-center">
              {t("home.cta.explore")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
