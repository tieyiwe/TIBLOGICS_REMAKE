"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, format, type Locale, type Vars } from "./config";

// Client side of i18n. The root layout passes the core messages once; areas
// that need more (lib/i18n/client-messages.ts) nest another provider, which
// merges into this one. Client components read them with useT().

interface Ctx { locale: Locale; dict: Record<string, string>; loaded: readonly string[] }
const I18nContext = createContext<Ctx>({ locale: DEFAULT_LOCALE, dict: {}, loaded: [] });

export function I18nProvider({
  locale,
  dict,
  loaded,
  children,
}: { locale: Locale; dict: Record<string, string>; loaded?: readonly string[]; children: React.ReactNode }) {
  const parent = useContext(I18nContext);
  const value = useMemo<Ctx>(() => {
    const hasParent = Object.keys(parent.dict).length > 0;
    return {
      locale,
      dict: hasParent ? { ...parent.dict, ...dict } : dict,
      loaded: loaded?.length ? [...parent.loaded, ...loaded] : parent.loaded,
    };
  }, [parent, locale, dict, loaded]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}

/** `const t = useT(); t("learn.lesson.markComplete")`. Missing keys show the key. */
export function useT() {
  const { dict } = useContext(I18nContext);
  return useCallback((key: string, vars?: Vars) => format(dict[key] ?? key, vars), [dict]);
}

const lazy = new Map<string, Promise<Record<string, string>>>();

/**
 * Messages of an area that was not sent with the page (see
 * lib/i18n/client-messages.ts), fetched once per language. Returns {} at once
 * when the page already has them, null while loading. Wrap the components that
 * need them in <I18nProvider dict={result}>.
 */
export function useLazyMessages(area: string): Record<string, string> | null {
  const { locale, loaded } = useContext(I18nContext);
  const have = loaded.includes(area);
  const [msgs, setMsgs] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (have) return;
    const key = `${locale}:${area}`;
    let p = lazy.get(key);
    if (!p) {
      p = fetch(`/api/i18n/messages?area=${encodeURIComponent(area)}&locale=${locale}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .catch(() => {
          lazy.delete(key); // try again next time; keys show as-is meanwhile
          return {};
        });
      lazy.set(key, p);
    }
    let live = true;
    p.then((m) => live && setMsgs(m));
    return () => {
      live = false;
    };
  }, [have, locale, area]);
  return have ? EMPTY : msgs;
}
const EMPTY: Record<string, string> = {};

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
