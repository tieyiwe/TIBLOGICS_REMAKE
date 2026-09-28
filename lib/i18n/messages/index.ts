import type { Locale } from "../config";
import type { Messages } from "./types";
import common from "./common";
import home from "./home";
import site from "./site";
import tools from "./tools";
import learn from "./learn";
import labs from "./labs";
import toolkit from "./toolkit";
import calculator from "./calculator";
import pages from "./pages";

const ALL: Messages[] = [common, home, site, tools, learn, labs, toolkit, calculator, pages];

const cache = new Map<Locale, Record<string, string>>();

/** The full dictionary for a locale, with English filling any gaps. */
export function dictionary(locale: Locale): Record<string, string> {
  const hit = cache.get(locale);
  if (hit) return hit;
  const out: Record<string, string> = {};
  for (const m of ALL) {
    Object.assign(out, m.en);
    if (locale !== "en") for (const [k, v] of Object.entries(m[locale])) if (v) out[k] = v;
  }
  cache.set(locale, out);
  return out;
}

/** How much of a locale is translated, for the admin and tests. */
export function coverage(locale: Locale): { total: number; missing: string[] } {
  const missing: string[] = [];
  let total = 0;
  for (const m of ALL) {
    for (const k of Object.keys(m.en)) {
      total++;
      if (!m[locale][k]) missing.push(k);
    }
  }
  return { total, missing };
}
