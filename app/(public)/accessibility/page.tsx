import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";

// Public accessibility statement. Text in lib/i18n/messages/a11y.ts
// (a11y.page.*), in English, French and Swahili. Update REVIEWED when the
// audit is repeated.
const REVIEWED = new Date(Date.UTC(2026, 9, 1));
const EMAIL = "info@tiblogics.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("a11y.page.meta.title"),
    description: t("a11y.page.meta.description"),
    alternates: { canonical: "https://tiblogics.com/accessibility" },
  };
}

const FEATURES = ["listen", "prefs", "mode", "keyboard", "captions", "language"];
const LIMITS = ["ai", "thirdParty", "voices", "drag", "admin"];

export default async function AccessibilityPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const reviewed = REVIEWED.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const [before, after] = t("a11y.page.feedback", { email: "\u0000" }).split("\u0000");

  const h2 = "font-syne font-bold text-xl text-[#0D1B2A]";
  const p = "mt-3 font-dm text-[#3A4A5C] leading-relaxed";

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="section-tag">{t("a11y.page.tag")}</span>
          <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#0D1B2A] mt-3">{t("a11y.page.title")}</h1>
          <p className="font-dm text-[#5A6E84] text-sm mt-2">{t("a11y.page.updated", { date: reviewed })}</p>
          <p className="mt-5 font-dm text-lg text-[#3A4A5C] leading-relaxed">{t("a11y.page.intro")}</p>
        </div>

        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 sm:p-8 md:p-10 space-y-10 break-words">
          <section aria-labelledby="a11y-standard">
            <h2 id="a11y-standard" className={h2}>{t("a11y.page.standardTitle")}</h2>
            <p className={p}>{t("a11y.page.standard")}</p>
          </section>

          <section aria-labelledby="a11y-features">
            <h2 id="a11y-features" className={h2}>{t("a11y.page.featuresTitle")}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 font-dm text-[#3A4A5C] leading-relaxed">
              {FEATURES.map((k) => (
                <li key={k}>{t(`a11y.page.f.${k}`)}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="a11y-testing">
            <h2 id="a11y-testing" className={h2}>{t("a11y.page.testingTitle")}</h2>
            <p className={p}>{t("a11y.page.testing")}</p>
          </section>

          <section aria-labelledby="a11y-limits">
            <h2 id="a11y-limits" className={h2}>{t("a11y.page.limitsTitle")}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 font-dm text-[#3A4A5C] leading-relaxed">
              {LIMITS.map((k) => (
                <li key={k}>{t(`a11y.page.l.${k}`)}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="a11y-feedback">
            <h2 id="a11y-feedback" className={h2}>{t("a11y.page.feedbackTitle")}</h2>
            <p className={p}>
              {before}
              <a href={`mailto:${EMAIL}`} className="font-semibold text-[#2251A3] underline underline-offset-2">
                {EMAIL}
              </a>
              {after}
            </p>
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent(t("a11y.page.title"))}`}
              className="btn-primary mt-5"
            >
              {t("a11y.page.feedbackCta")}
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
