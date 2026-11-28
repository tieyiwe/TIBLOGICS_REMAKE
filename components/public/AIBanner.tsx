
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { accent } from "./accent";

// Dictionary key suffixes under home.banner.pill.*
const aiPills = ["agents", "automation", "voice"] as const;
const techPills = ["web", "mobile", "security"] as const;

// This grid used to show "3× Revenue Lift", "68% Cost Reduction", "24/7" and
// "14d Deploy Time". None of them had a source — they were placeholder figures
// from when the site was first generated — and an unsourced number is worse
// than none for the buyers this page is for. The grid now shows how an
// engagement actually starts. Step 1 is what the booking system enforces
// (Project Discovery: free, 30 minutes); steps 2–4 are the process the copy to
// the left already describes.
// Text lives in home.banner.step{n}.title / .body
const steps = [1, 2, 3, 4] as const;

export default async function AIBanner() {
  const t = await getT();
  return (
    <div className="relative overflow-hidden bg-[#1B3A6B] rounded-[20px] p-8 md:p-12">
      {/* Subtle gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #1B3A6B 0%, #2251A3 100%)",
          opacity: 0.6,
        }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">
          <span className="section-tag">{t("home.banner.tag")}</span>

          <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-white leading-tight">
            {t("home.banner.titleA")}{" "}
            <br className="hidden sm:block" />
            {accent(t("home.banner.titleB"), (words, i) => (
              <span key={i} className="text-[#F47C20]">{words}</span>
            ))}
          </h2>

          <p className="text-white/70 font-dm text-base leading-relaxed max-w-lg">
            {t("home.banner.body")}
          </p>

          {/* Capability pills */}
          <div className="flex flex-wrap gap-2">
            {aiPills.map((pill) => (
              <span
                key={pill}
                className="bg-[#F47C20]/20 text-[#F47C20] border border-[#F47C20]/30 rounded-full px-3 py-1 text-xs font-medium font-dm"
              >
                {t(`home.banner.pill.${pill}`)}
              </span>
            ))}
            {techPills.map((pill) => (
              <span
                key={pill}
                className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs font-medium font-dm"
              >
                {t(`home.banner.pill.${pill}`)}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div>
            {/* Was "Get Your AI Readiness Score" -> /tools/advisor, a tool marked
                retired in production. The readiness scan now lives in the hero. */}
            <Link
              href="/book"
              className="bg-white text-[#1B3A6B] hover:bg-[#EBF0FA] rounded-lg px-5 py-2.5 font-semibold text-sm inline-flex items-center gap-2 transition-colors duration-200"
            >
              {t("home.banner.cta")}
            </Link>
          </div>
        </div>

        {/* ── Right column — how an engagement starts ── */}
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steps.map((n) => (
            <li
              key={n}
              className="border border-white/10 bg-white/[0.03] rounded-xl p-4 flex flex-col gap-1.5"
            >
              <span className="font-dm text-xs font-semibold tracking-[0.18em] text-[#F47C20]">
                {String(n).padStart(2, "0")}
              </span>
              <span className="font-syne font-bold text-lg leading-snug text-white">{t(`home.banner.step${n}.title`)}</span>
              <span className="text-white/60 text-sm font-dm leading-relaxed">{t(`home.banner.step${n}.body`)}</span>
            </li>
          ))}
        </ol>

      </div>
    </div>
  );
}
