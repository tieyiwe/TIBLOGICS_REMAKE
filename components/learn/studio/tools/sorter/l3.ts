// Game content in the three site languages (shared by the Task Sorter, Spot
// the Risk and Wireframe Builder data files).

import type { Locale } from "@/lib/i18n/config";

export type L3 = { en: string; fr: string; sw: string };

export const tx = (l: L3, locale: Locale): string => l[locale] || l.en;

/** Build an L3 from a [en, fr, sw] tuple (keeps data files compact). */
export const l3 = (t: readonly [string, string, string]): L3 => ({ en: t[0], fr: t[1], sw: t[2] });
