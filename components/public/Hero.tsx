import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroScanner from "./HeroScanner";
import { getT } from "@/lib/i18n/server";
import { accent } from "./accent";

// Products built in-house, the same list the footer carries. Worded as "built
// in-house" to match what the rest of the site already says, rather than
// "trusted by", which would imply client logos we don't show. Only names with a
// real destination are links; the rest are plain text rather than dead links.
const BUILT: { name: string; href?: string }[] = [
  { name: "InStory" },
  { name: "CareFlow AI" },
  { name: "ShipFrica" },
  { name: "AI Academy" },
  { name: "RoofGuard" },
  { name: "Tibintel", href: "https://tibintel.com" },
  { name: "AI Central" },
];

export default async function Hero() {
  const t = await getT();
  return (
    <section className="relative overflow-hidden bg-white pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-20">
      {/* Quiet backdrop: a faint dot field fading out from the top right, so the
          white has some depth without competing with the headline. */}
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 lg:items-start">
          {/* Top-aligned, not centred: the scanner card grows when a result
              comes back, and centring made the headline jump down ~190px
              while the visitor was reading their score. */}
          <div className="flex flex-col gap-6 lg:pt-6">
            <p className="anim-fade-in inline-flex items-center gap-2 self-start rounded-full border border-[#D2DCE8] bg-white/80 px-3 py-1.5 font-dm text-xs font-semibold tracking-wide text-[#3A4A5C] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F47C20]" />
              {t("home.hero.badge")}
            </p>

            {/* One accent, three lines. The previous headline ran to seven lines
                on desktop with three competing type treatments and two orphaned
                words; it was a third of the first screen by itself. */}
            <h1
              className="anim-fade-up font-syne font-extrabold tracking-tight text-[#0D1B2A] text-[2.4rem] leading-[1.08] sm:text-5xl lg:text-[3.6rem]"
              style={{ animationDelay: "0.08s" }}
            >
              {accent(t("home.hero.title"), (words, i) => (
                <span key={i} className="font-display italic font-semibold text-[#F47C20]">
                  {words}
                </span>
              ))}
            </h1>

            <p
              className="anim-fade-up max-w-xl font-dm text-lg leading-relaxed text-[#3A4A5C]"
              style={{ animationDelay: "0.16s" }}
            >
              {t("home.hero.subtitle")}
            </p>

            <div className="anim-fade-up flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ animationDelay: "0.24s" }}>
              <Link href="/book" className="btn-primary justify-center">
                {t("home.hero.ctaBook")} <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/services" className="btn-secondary justify-center">
                {t("home.hero.ctaServices")}
              </Link>
            </div>
          </div>

          <div className="anim-fade-up" style={{ animationDelay: "0.2s" }}>
            <HeroScanner />
          </div>
        </div>

        {/* Proof strip */}
        <div className="mt-16 sm:mt-20 border-t border-[#E8EFF8] pt-8">
          <p className="text-center font-dm text-xs font-semibold uppercase tracking-[0.18em] text-[#7A8FA6]">
            {t("home.hero.built")}
          </p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
            {BUILT.map(({ name, href }) => (
              <li key={name} className="font-syne text-lg font-bold tracking-tight text-[#0D1B2A]/40">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#0D1B2A]">
                    {name}
                  </a>
                ) : (
                  name
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
