// Dictionary keys for Toolkit Live labels that come from data (industries,
// prompt categories, Compliance Guard rules). Client-safe: no server imports.
// The English strings stay the ids in data; the interface shows t(key).

/** Industries a business profile or a Compliance Guard check can use, in menu order. */
export const INDUSTRY_IDS = [
  "realtor", "finance", "nonprofit", "agency", "restaurant", "social-work", "medical",
  "legal", "insurance", "home-services", "ecommerce", "hr", "general",
] as const;

export function slug(text: string): string {
  return text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** "Client Communication" -> "toolkit.cat.client-communication". */
export const categoryKey = (category: string) => `toolkit.cat.${slug(category)}`;
/** Industry name as used in the Compliance Guard and profile menus. */
export const industryKey = (id: string) => `toolkit.industry.${id}`;
/** Industry name as used for the prompt library ("Finance professionals"). */
export const libraryKey = (id: string) => `toolkit.library.${id}`;
/** A Compliance Guard rule's text: part is "why", "basis" or "fix". */
export const ruleKey = (ruleId: string, part: "why" | "basis" | "fix") => `toolkit.rule.${ruleId}.${part}`;
