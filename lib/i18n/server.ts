import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, format, isLocale, learnLocale, negotiate, type Locale, type Vars } from "./config";
import { dictionary } from "./messages";

/** The visitor's language: their chosen cookie, else their browser's. */
export async function getLocale(): Promise<Locale> {
  try {
    const h = await headers();
    const c = (await cookies()).get(LOCALE_COOKIE)?.value;
    const chosen = isLocale(c) ? c : negotiate(h.get("accept-language"));
    // Learning Box pages and APIs (marked by proxy.ts): English and French only.
    return h.get("x-tib-area") === "learn" ? learnLocale(chosen) : chosen;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export type T = (key: string, vars?: Vars) => string;

export function translatorFor(locale: Locale): T {
  const dict = dictionary(locale);
  return (key, vars) => format(dict[key] ?? key, vars);
}

/** For server components: `const t = await getT(); t("home.hero.title")`. */
export async function getT(): Promise<T> {
  return translatorFor(await getLocale());
}
