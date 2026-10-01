import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getT } from "@/lib/i18n/server";
import doc from "@/lib/i18n/messages/pages/privacy";
import LegalDoc from "../_i18n/LegalDoc";
import { pageMetadata } from "@/lib/seo/meta";

// The text lives in lib/i18n/messages/pages/privacy.ts. English is the legally
// binding version; French and Swahili carry a note saying so.
const EFFECTIVE = new Date(Date.UTC(2026, 3, 20));
const UPDATED = new Date(Date.UTC(2026, 3, 20));

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/privacy",
    locale,
    title: t("pages.privacy.meta.title"),
    description: t("pages.privacy.meta.description"),
  });
}

export default async function PrivacyPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const fmt = (d: Date) => d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const note = locale === "en" ? "" : t("pages.legal.bindingNote");

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <Image src="/logo.svg" alt="TIBLOGICS" width={120} height={36} className="h-9 w-auto" />
          </div>
          <span className="section-tag">{t("pages.legal.tag")}</span>
          <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#0D1B2A] mt-3">{t("pages.privacy.title")}</h1>
          <p className="font-dm text-[#7A8FA6] text-sm mt-2">
            {t("pages.legal.dates", { effective: fmt(EFFECTIVE), updated: fmt(UPDATED) })}
          </p>
          {note && (
            <p lang={locale} className="mt-4 rounded-xl border border-[#F47C20]/30 bg-[#FEF0E3] px-4 py-3 font-dm text-sm text-[#7A3E0E]">
              {note}
            </p>
          )}
        </div>

        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 sm:p-8 md:p-10 space-y-10 font-dm text-[#3A4A5C] leading-relaxed break-words">
          <LegalDoc
            keys={Object.keys(doc.en)}
            prefix="pages.privacy.doc."
            t={t}
            contact={
              <div className="mt-4 bg-[#F4F7FB] rounded-xl p-5 border border-[#E8EFF8]">
                <p><strong>TIBLOGICS LLC</strong></p>
                <p className="mt-2">
                  {t("pages.legal.email")}{" "}
                  <a href="mailto:info@tiblogics.com" className="text-[#2251A3] hover:underline">info@tiblogics.com</a>
                </p>
                <p>
                  {t("pages.legal.website")}{" "}
                  <a href="https://tiblogics.com" className="text-[#2251A3] hover:underline">tiblogics.com</a>
                </p>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
