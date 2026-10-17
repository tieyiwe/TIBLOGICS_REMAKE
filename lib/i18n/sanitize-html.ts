// Defensive clean-up for model-translated article HTML before it is rendered.
// The English source is authored by us; the translation is written by a
// model, which a hidden instruction in a source article could steer into
// adding markup. This keeps ordinary article markup and removes anything that
// can run code or load active content. It is a denylist on purpose: the
// source HTML is trusted, only additions by the model are in question.

const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|template|noscript|svg|math|form)\b[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_SINGLE = /<\/?(script|style|iframe|object|embed|template|noscript|svg|math|form|input|button|textarea|select|meta|link|base|frame|frameset)\b[^>]*>/gi;
// Attributes may be separated by "/" as well as whitespace (<img src=x/onerror=...>).
const EVENT_ATTR = /[\s/]+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const STYLE_ATTR = /[\s/]+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const URL_ATTR = /[\s/]+(href|src|xlink:href|action|formaction|srcset|poster|background)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

const codePoint = (n: number) => (Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "");

/** The scheme as the browser reads it: entities decoded, whitespace and controls removed. */
function schemeOf(raw: string): string {
  const v = raw.replace(/^["']|["']$/g, "")
    .replace(/&#x([0-9a-f]+);?/gi, (_m, h: string) => codePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_m, d: string) => codePoint(Number(d)))
    .replace(/&(tab|newline|colon);/gi, (_m, n: string) => (n.toLowerCase() === "colon" ? ":" : ""))
    .replace(/[\s\x00-\x1f]+/g, "");
  return v.toLowerCase();
}

export function sanitizeTranslatedHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(DANGEROUS_BLOCKS, "")
    .replace(DANGEROUS_SINGLE, "")
    .replace(EVENT_ATTR, "")
    .replace(STYLE_ATTR, "")
    .replace(URL_ATTR, (m, _name: string, value: string) => (/^(?:javascript|data|vbscript):/.test(schemeOf(value)) ? "" : m));
}
