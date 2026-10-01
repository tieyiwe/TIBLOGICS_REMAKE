"use client";

import { Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { LEARN_LOCALES, LEARN_PATH, LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";
import { useLocale, useSetLocale, useT } from "@/lib/i18n/client";

// Language picker used in the site header, footer, Learn and Toolkit.
export default function LanguageSwitcher({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const t = useT();
  // Learning Box tracks are offered in English and French only.
  const pathname = usePathname() ?? "";
  const options: readonly Locale[] = LEARN_PATH.test(pathname) ? LEARN_LOCALES : LOCALES;
  return (
    <label className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tone === "dark" ? "text-white/80" : "text-[#3A4A5C]"} ${className}`}>
      <Globe size={14} aria-hidden="true" />
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t("common.language")}
        className={`cursor-pointer rounded-md border bg-transparent py-1 pl-1.5 pr-5 text-xs font-semibold outline-none ${
          tone === "dark" ? "border-white/30 text-white [&>option]:text-[#0D1B2A]" : "border-[#D2DCE8] text-[#0D1B2A]"
        }`}
      >
        {options.map((l) => (
          <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
        ))}
      </select>
    </label>
  );
}
