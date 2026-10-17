// Every messages file exports one of these. English is complete; a key
// missing from French or Swahili falls back to English rather than showing a
// raw key.
export interface Messages {
  en: Record<string, string>;
  fr: Record<string, string>;
  sw: Record<string, string>;
}
