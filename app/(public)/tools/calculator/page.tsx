import type { Metadata } from "next";
import { BadgeCheck, CalendarClock, SlidersHorizontal } from "lucide-react";
import { getLocale, getT } from "@/lib/i18n/server";
import { PRICES_AS_OF } from "@/lib/calculator/pricing";
import { makeFormatters } from "@/lib/calculator/format";
import CalculatorApp from "./CalculatorApp";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const title = t("calculator.meta.title");
  const description = t("calculator.meta.description");
  return {
    title,
    description,
    alternates: { canonical: "https://tiblogics.com/tools/calculator" },
    openGraph: { title, description, url: "https://tiblogics.com/tools/calculator", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CalculatorPage() {
  const t = await getT();
  const f = makeFormatters(await getLocale());
  const chips = [
    { icon: CalendarClock, text: t("calculator.hero.chipPrices", { date: f.month(PRICES_AS_OF) }) },
    { icon: SlidersHorizontal, text: t("calculator.hero.chipEditable") },
    { icon: BadgeCheck, text: t("calculator.hero.chipHonest") },
  ];

  return (
    <div className="calc-root pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8">
          <span className="section-tag">{t("calculator.hero.tag")}</span>
          <h1 className="font-syne font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0D1B2A] mt-2 leading-tight">
            {t("calculator.hero.title")}
          </h1>
          <p className="font-dm text-[#3A4A5C] text-base sm:text-lg mt-4">{t("calculator.hero.body")}</p>
          <ul className="flex flex-wrap gap-2 mt-5">
            {chips.map((c) => (
              <li
                key={c.text}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#D2DCE8] px-3 py-1 font-dm text-xs text-[#3A4A5C]"
              >
                <c.icon size={14} className="text-[#B8500A]" aria-hidden />
                {c.text}
              </li>
            ))}
          </ul>
        </div>
        <CalculatorApp />
      </div>
    </div>
  );
}
