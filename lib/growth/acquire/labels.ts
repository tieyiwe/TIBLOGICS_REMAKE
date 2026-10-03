import { dictionary } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";

/**
 * The "acquire.*" interface strings in one language, for client components.
 * A magnet written in French keeps French buttons and consent text even for
 * an English-speaking visitor, so the page reads as one language.
 */
export function acquireLabels(locale: Locale): Record<string, string> {
  const d = dictionary(locale);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(d)) if (k.startsWith("acquire.")) out[k] = v;
  return out;
}

export type { Labels } from "./fmt";
