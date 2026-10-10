import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, ArrowUpRight, Mail, Zap, Users, Shield, Target, Lightbulb, TrendingUp,
  Cpu, GraduationCap, Wrench, Newspaper, Check, Globe2, HeartPulse, BookOpen, Truck,
  UtensilsCrossed, Landmark, Rocket, HandHeart, Building2,
} from "lucide-react";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbNode, webPageNode } from "@/lib/seo/jsonld";
import { absUrl, ARFA_ID, FOUNDER_ID, ORG, ORG_ID, SHOW_FOUNDER } from "@/lib/seo/site";
import { accent } from "@/components/public/accent";
import Html from "../_i18n/Html";
import { DonateSection } from "@/components/donate/Donate";

// The About page. Every statement comes from copy already published on the
// site (lib/i18n/messages/pages/about.ts says where); nothing here invents
// numbers, clients, dates or testimonials.

const FOUNDER_PHOTO = "/tb_cover.png";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/about",
    locale,
    // Already names the brand, so no " | TIBLOGICS" suffix.
    title: t("pages.about.meta.title"),
    absoluteTitle: true,
    description: t("pages.about.meta.description"),
    socialTitle: t("pages.about.meta.ogTitle"),
    socialDescription: t("pages.about.meta.ogDescription"),
    keywords: [
      "about TIBLOGICS", "AI agency mission", "AI implementation company", ...(SHOW_FOUNDER ? [ORG.founder.name] : []),
      "AI consulting firm", "digital solutions agency", "AI for African businesses",
      "bilingual AI agency", "AI first principles", "ARFA AI Academy", "TILO GROUP LLC",
    ],
  });
}

const pillars = [
  { id: "services", href: "/services", icon: Cpu },
  { id: "academy", href: "/learning-box", icon: GraduationCap },
  { id: "tools", href: "/tools", icon: Wrench },
  { id: "aitimes", href: "/ai-times", icon: Newspaper },
] as const;

const principles = [
  { icon: Shield, id: "integrity" },
  { icon: Zap, id: "urgency" },
  { icon: Lightbulb, id: "first" },
  { icon: Target, id: "logic" },
  { icon: TrendingUp, id: "results" },
  { icon: Users, id: "growth" },
] as const;

const industries = [
  { id: "healthcare", icon: HeartPulse },
  { id: "education", icon: BookOpen },
  { id: "logistics", icon: Truck },
  { id: "hospitality", icon: UtensilsCrossed },
  { id: "government", icon: Landmark },
  { id: "startups", icon: Rocket },
  { id: "nonprofits", icon: HandHeart },
  { id: "enterprise", icon: Building2 },
] as const;

// The founder row (name) only while SHOW_FOUNDER is on.
const glance = (SHOW_FOUNDER ? ["company", "founder", "markets", "lang", "start"] : ["company", "markets", "lang", "start"]) as Array<"company" | "founder" | "markets" | "lang" | "start">;

const orangeAccent = (words: string, i: number) => (
  <span key={i} className="font-display italic font-semibold text-[#F47C20]">{words}</span>
);

export default async function AboutPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const founder = ORG.founder.name;

  return (
    <div className="overflow-x-clip">
      <JsonLd
        data={[
          {
            ...webPageNode({
              path: "/about",
              type: "AboutPage",
              name: t("pages.about.meta.ogTitle"),
              description: t("pages.about.meta.description"),
              about: ORG_ID,
              inLanguage: locale,
            }),
            mainEntity: { "@id": ORG_ID },
            mentions: SHOW_FOUNDER ? [{ "@id": FOUNDER_ID }, { "@id": ARFA_ID }] : [{ "@id": ARFA_ID }],
            ...(SHOW_FOUNDER ? { primaryImageOfPage: { "@type": "ImageObject", url: absUrl(FOUNDER_PHOTO), width: 1200, height: 500 } } : {}),
          },
          // Adds the photo to the founder entity the root layout already declares.
          ...(SHOW_FOUNDER ? [{ "@type": "Person", "@id": FOUNDER_ID, name: founder, jobTitle: ORG.founder.jobTitle, image: absUrl(FOUNDER_PHOTO) }] : []),
          breadcrumbNode([{ name: t("seo.home"), path: "/" }, { name: t("seo.about"), path: "/about" }]),
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-28 pb-16 sm:pt-36 sm:pb-20 lg:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(27,58,107,0.10) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(70% 60% at 85% 20%, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(70% 60% at 85% 20%, black, transparent 75%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:px-8">
          <div className="flex min-w-0 flex-col gap-6">
            <p className="anim-fade-in inline-flex items-center gap-2 self-start rounded-full border border-[#D2DCE8] bg-white/80 px-3 py-1.5 font-dm text-xs font-semibold tracking-wide text-[#3A4A5C] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F47C20]" aria-hidden />
              {t("pages.about.hero.tag")}
            </p>
            <h1
              className="anim-fade-up font-syne text-[2.3rem] font-extrabold leading-[1.08] tracking-tight text-[#0D1B2A] [text-wrap:balance] sm:text-5xl lg:text-[3.5rem]"
              style={{ animationDelay: "0.08s" }}
            >
              {accent(t("pages.about.hero.title"), orangeAccent)}
            </h1>
            <p className="anim-fade-up max-w-xl font-dm text-lg leading-relaxed text-[#3A4A5C]" style={{ animationDelay: "0.16s" }}>
              {t("pages.about.hero.body")}
            </p>
            <div className="anim-fade-up flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ animationDelay: "0.24s" }}>
              <Link href="/book" className="btn-primary justify-center">
                {t("pages.about.hero.ctaBook")} <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/learning-box" className="btn-secondary justify-center">
                {t("pages.about.hero.ctaLearn")}
              </Link>
            </div>
          </div>

          {/* At a glance */}
          <aside
            aria-labelledby="about-glance"
            className="anim-fade-up relative min-w-0 overflow-hidden rounded-3xl bg-[#0D1B2A] p-6 text-white shadow-[0_24px_60px_-20px_rgba(13,27,42,0.45)] sm:p-8"
            style={{ animationDelay: "0.2s" }}
          >
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#F47C20]/20 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#2251A3]/40 blur-3xl" />
            <h2 id="about-glance" className="relative font-dm text-xs font-bold uppercase tracking-[0.18em] text-[#F9A738]">
              {t("pages.about.glance.title")}
            </h2>
            <dl className="relative mt-5 divide-y divide-white/10">
              {glance.map((k) => (
                <div key={k} className="grid gap-1 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[120px_1fr] sm:gap-4">
                  <dt className="font-dm text-xs font-semibold uppercase tracking-wide text-white/50 sm:pt-0.5">
                    {t(`pages.about.glance.${k}.k`)}
                  </dt>
                  <dd className="font-dm text-[15px] leading-snug text-white/90">
                    {t(`pages.about.glance.${k}.v`, { name: founder })}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/about/facts"
              className="relative mt-6 inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-[#F9A738] underline-offset-4 hover:underline"
            >
              {t("seo.facts.link")} <ArrowRight size={14} aria-hidden />
            </Link>
          </aside>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="about-mission" className="border-y border-[#E8EFF8] bg-[#F4F7FB]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 id="about-mission" className="section-tag">{t("pages.about.mission.tag")}</h2>
          <Html
            as="p"
            className="mt-5 font-syne text-2xl font-medium leading-snug text-[#1B3A6B] [text-wrap:pretty] sm:text-3xl sm:leading-snug"
            html={t("pages.about.mission.p1")}
          />
          <div className="mt-8 h-px w-16 bg-[#F47C20]" aria-hidden />
          <p className="mt-8 max-w-3xl font-dm text-base leading-relaxed text-[#3A4A5C] sm:text-lg">
            {t("pages.about.mission.p2")}
          </p>
        </div>
      </section>

      {/* ── What we do ───────────────────────────────────────────────────── */}
      <section aria-labelledby="about-do" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="section-tag">{t("pages.about.do.tag")}</p>
            <h2 id="about-do" className="mt-3 font-syne text-3xl font-extrabold leading-tight text-[#0D1B2A] sm:text-4xl">
              {t("pages.about.do.title")}
            </h2>
            <p className="mt-4 font-dm text-lg leading-relaxed text-[#3A4A5C]">{t("pages.about.do.body")}</p>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map(({ id, href, icon: Icon }) => (
              <li key={id} className="min-w-0">
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-2xl border border-[#D2DCE8] bg-white p-6 transition-all duration-200 hover:border-[#2251A3]/40 hover:shadow-[0_8px_30px_rgba(27,58,107,0.12)] motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2251A3]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF0FA] text-[#1B3A6B] transition-colors group-hover:bg-[#1B3A6B] group-hover:text-white">
                    <Icon size={20} aria-hidden />
                  </span>
                  <h3 className="mt-5 font-syne text-lg font-bold leading-snug text-[#0D1B2A]">{t(`pages.about.pillar.${id}.title`)}</h3>
                  <p className="mt-2 flex-1 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t(`pages.about.pillar.${id}.desc`)}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-[#B8500A]">
                    {t(`pages.about.pillar.${id}.cta`)}
                    <ArrowUpRight size={15} aria-hidden className="transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── What sets us apart ───────────────────────────────────────────── */}
      <section aria-labelledby="about-apart" className="border-t border-[#E8EFF8] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:px-8">
          <div className="min-w-0">
            <p className="section-tag">{t("pages.about.apart.tag")}</p>
            <h2 id="about-apart" className="mt-3 font-syne text-3xl font-extrabold leading-tight text-[#0D1B2A] sm:text-4xl">
              {t("pages.about.apart.title")}
            </h2>
            <h3 className="mt-10 font-dm text-xs font-bold uppercase tracking-[0.16em] text-[#7A8FA6]">{t("pages.about.track.who")}</h3>
            <ul className="mt-4 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              {industries.map(({ id, icon: Icon }) => (
                <li key={id} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#E3E9F1] bg-[#F9FBFD] px-3 py-2.5">
                  <Icon size={16} className="shrink-0 text-[#2251A3]" aria-hidden />
                  <span className="font-dm text-[13px] font-medium leading-tight text-[#3A4A5C]">{t(`pages.about.industry.${id}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 space-y-5">
            <Html as="p" className="font-dm text-base leading-relaxed text-[#3A4A5C] sm:text-lg" html={t("pages.about.apart.p1")} />
            <Html as="p" className="font-dm text-base leading-relaxed text-[#3A4A5C] sm:text-lg" html={t("pages.about.apart.p2")} />
            <div className="grid grid-cols-1 gap-4 pt-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[#D2DCE8] bg-gradient-to-br from-[#EBF0FA] to-white p-6">
                <h3 className="font-syne text-base font-bold text-[#1B3A6B]">{t("pages.about.apart.smallTitle")}</h3>
                <Html as="p" className="mt-2 font-dm text-sm leading-relaxed text-[#3A4A5C]" html={t("pages.about.apart.smallBody")} />
              </div>
              <div className="rounded-2xl border border-[#D2DCE8] bg-gradient-to-br from-[#FFF4EB] to-white p-6">
                <h3 className="flex items-center gap-2 font-syne text-base font-bold text-[#1B3A6B]">
                  <Globe2 size={18} className="text-[#B8500A]" aria-hidden />
                  {t("pages.about.markets.title")}
                </h3>
                <Html as="p" className="mt-2 font-dm text-sm leading-relaxed text-[#3A4A5C]" html={t("pages.about.markets.body")} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How we work ──────────────────────────────────────────────────── */}
      <section aria-labelledby="about-how" className="bg-[#F4F7FB]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="section-tag">{t("pages.about.principles.tag")}</p>
            <h2 id="about-how" className="mt-3 font-syne text-3xl font-extrabold leading-tight text-[#0D1B2A] sm:text-4xl">
              {t("pages.about.principles.title")}
            </h2>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#D2DCE8] bg-[#D2DCE8] sm:grid-cols-2 lg:grid-cols-3">
            {principles.map(({ id, icon: Icon }) => (
              <li key={id} className="bg-white p-6 sm:p-7">
                <Icon size={20} className="text-[#F47C20]" aria-hidden />
                <h3 className="mt-4 font-syne text-lg font-bold text-[#0D1B2A]">{t(`pages.about.principle.${id}.title`)}</h3>
                <p className="mt-2 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t(`pages.about.principle.${id}.desc`)}</p>
              </li>
            ))}
          </ul>

          <h3 className="mt-16 font-dm text-xs font-bold uppercase tracking-[0.16em] text-[#7A8FA6]">{t("pages.about.steps.tag")}</h3>
          <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="relative rounded-2xl border border-[#D2DCE8] bg-white p-6">
                <span className="font-display text-4xl font-semibold italic leading-none text-[#F47C20]" aria-hidden>
                  0{n}
                </span>
                <p className="mt-3 font-syne text-base font-bold text-[#0D1B2A]">{t(`pages.services.step${n}.title`)}</p>
                <p className="mt-1.5 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t(`pages.services.step${n}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Founder ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="about-founder" className="bg-white">
        <div className={SHOW_FOUNDER
          ? "mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[minmax(0,320px)_1fr] lg:gap-16 lg:px-8"
          : "mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"}>
          {SHOW_FOUNDER && <figure className="mx-auto w-full max-w-[320px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#F47C20] shadow-[0_24px_60px_-24px_rgba(184,80,10,0.55)]">
              <Image
                src={FOUNDER_PHOTO}
                alt={t("pages.about.founder.photoAlt", { name: founder })}
                fill
                sizes="(min-width: 768px) 320px, 90vw"
                className="object-cover object-[53%_50%]"
              />
            </div>
            <figcaption className="mt-4 text-center md:text-left">
              <span className="block font-syne text-lg font-bold text-[#0D1B2A]">{founder}</span>
              <span className="block font-dm text-sm text-[#5A6E84]">{t("pages.about.founder.role")}</span>
            </figcaption>
          </figure>}
          <div className="min-w-0">
            <h2 id="about-founder" className="section-tag">{t("pages.about.founder.tag")}</h2>
            <blockquote className="mt-5">
              <p className="font-syne text-lg italic leading-relaxed text-[#1B3A6B] [text-wrap:pretty] sm:text-xl sm:leading-relaxed">
                <span className="font-display text-5xl not-italic leading-[0] text-[#F47C20] align-[-0.35em] mr-1" aria-hidden>&ldquo;</span>
                {t("pages.about.founder.quote")}
              </p>
            </blockquote>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/book" className="btn-primary justify-center text-sm">
                {t("pages.about.founder.book")} <ArrowRight size={15} aria-hidden />
              </Link>
              <a href={`mailto:${ORG.founderEmail}`} className="btn-secondary justify-center text-sm">
                <Mail size={15} aria-hidden /> {ORG.founderEmail}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── ARFA ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="about-arfa" className="relative overflow-hidden bg-[#0D1B2A] text-white">
        <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[28rem] w-[28rem] rounded-full bg-[#F47C20]/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[24rem] w-[24rem] rounded-full bg-[#2251A3]/35 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:px-8">
          <div className="min-w-0">
            <p className="font-dm text-[0.8125rem] font-bold uppercase tracking-[0.13em] text-[#F9A738]">{t("pages.about.arfa.tag")}</p>
            <h2 id="about-arfa" className="mt-3 font-syne text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              {accent(t("pages.about.arfa.title"), orangeAccent)}
            </h2>
            <p className="mt-5 max-w-xl font-dm text-lg leading-relaxed text-white/75">{t("pages.about.arfa.body")}</p>
            <Link
              href="/learning-box"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-[#F47C20] px-5 py-3 font-dm font-semibold text-[#0D1B2A] transition-colors hover:bg-[#F9A738] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t("pages.about.arfa.cta")} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <ul className="grid min-w-0 grid-cols-1 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F47C20]/20 text-[#F9A738]">
                  <Check size={14} aria-hidden />
                </span>
                <span className="font-dm text-[15px] leading-snug text-white/90">{t(`pages.about.arfa.f${n}`)}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Fund a Tilo Vision Scholarship (components/donate) */}
        <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <DonateSection from="about" tone="dark" />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section aria-labelledby="about-cta" className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#D2DCE8] bg-gradient-to-br from-[#F4F7FB] via-white to-[#FFF4EB] px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="section-tag">{t("pages.about.cta.kicker")}</p>
          <h2 id="about-cta" className="mt-4 font-syne text-3xl font-extrabold leading-tight text-[#0D1B2A] [text-wrap:balance] sm:text-4xl">
            {t("pages.about.cta.title")}{" "}
            <span className="font-display italic font-semibold text-[#F47C20]">{t("pages.about.cta.titleAccent")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-dm text-base leading-relaxed text-[#3A4A5C] sm:text-lg">{t("pages.about.cta.body")}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/book" className="btn-primary justify-center">
              {t("pages.about.cta.book")} <ArrowRight size={16} aria-hidden />
            </Link>
            <Link href="/learning-box" className="btn-secondary justify-center">
              {t("pages.about.cta.learn")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
