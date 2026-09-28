"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, format, type Locale, type Vars } from "./config";

// Client side of i18n. The root layout passes the visitor's dictionary once;
// client components read it with useT().

interface Ctx { locale: Locale; dict: Record<string, string> }
const I18nContext = createContext<Ctx>({ locale: DEFAULT_LOCALE, dict: {} });

export function I18nProvider({ locale, dict, children }: Ctx & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}

/** `const t = useT(); t("learn.lesson.markComplete")`. Missing keys show the key. */
export function useT() {
  const { dict } = useContext(I18nContext);
  return useCallback((key: string, vars?: Vars) => format(dict[key] ?? key, vars), [dict]);
}

/** Switch language: remember it for a year and re-render the page. */
export function useSetLocale() {
  const router = useRouter();
  return useCallback(
    async (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      // Signed-in learners keep the choice on their account too.
      fetch("/api/i18n/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: next }) }).catch(() => {});
      router.refresh();
    },
    [router],
  );
}
