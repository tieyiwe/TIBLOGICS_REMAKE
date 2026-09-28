import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, format, isLocale, negotiate, type Locale, type Vars } from "./config";
import { dictionary } from "./messages";

/** The visitor's language: their chosen cookie, else their browser's. */
export async function getLocale(): Promise<Locale> {
  try {
    const c = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (isLocale(c)) return c;
    return negotiate((await headers()).get("accept-language"));
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
