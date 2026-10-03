import { translated, type Fields } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";

// Magnets and landing pages are written in one language (their `language`).
// An English one is shown to French and Swahili visitors through the shared
// translation cache (lib/i18n/content.ts): the first visit queues the
// translation and shows English, later visits get the translated copy.
// Pages written in French or Swahili are shown as written.

// Keys whose values are never visitor-facing text.
const SKIP = new Set(["href", "id", "type", "kind", "points", "min", "enabled", "askBusiness", "askWhatsapp"]);

/** Every visible string leaf as "path" → text. */
export function flatten(value: unknown, prefix = "", out: Fields = {}): Fields {
  if (typeof value === "string") {
    if (value.trim() && prefix) out[prefix] = value;
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (SKIP.has(k)) continue;
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  }
  return out;
}

/** A copy of `value` with the flattened strings put back. */
export function unflatten<T>(value: T, fields: Fields): T {
  const copy = JSON.parse(JSON.stringify(value)) as unknown;
  for (const [path, text] of Object.entries(fields)) {
    const parts = path.split(".");
    let node = copy as Record<string, unknown> | unknown[];
    for (let i = 0; i < parts.length - 1; i++) {
      const next = (node as Record<string, unknown>)[parts[i]];
      if (!next || typeof next !== "object") {
        node = null as never;
        break;
      }
      node = next as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (node && typeof (node as Record<string, unknown>)[last] === "string") (node as Record<string, unknown>)[last] = text;
  }
  return copy as T;
}

export interface Localized<T> {
  content: T;
  /** The language the content is actually shown in. */
  locale: Locale;
  /** A translation for the visitor is on its way (English shown meanwhile). */
  pending: boolean;
}

export async function localizeContent<T>(
  key: string,
  sourceLang: string,
  content: T,
  visitor: Locale,
  mode: "queue" | "wait" = "queue",
): Promise<Localized<T>> {
  const src = (sourceLang === "fr" || sourceLang === "sw" ? sourceLang : "en") as Locale;
  if (src !== "en" || visitor === "en") return { content, locale: src, pending: false };
  const flat = flatten(content);
  if (!Object.keys(flat).length) return { content, locale: visitor, pending: false };
  const t = await translated(key, visitor, flat, mode).catch(() => null);
  if (!t) return { content, locale: "en", pending: true };
  return { content: unflatten(content, t), locale: visitor, pending: false };
}
