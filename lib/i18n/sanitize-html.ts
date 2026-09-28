// Defensive clean-up for model-translated article HTML before it is rendered.
// The English source is authored by us; the translation is written by a
// model, which a hidden instruction in a source article could steer into
// adding markup. This keeps ordinary article markup and removes anything that
// can run code or load active content. It is a denylist on purpose: the
// source HTML is trusted, only additions by the model are in question.

const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|template|noscript|svg|math|form)\b[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_SINGLE = /<\/?(script|style|iframe|object|embed|template|noscript|svg|math|form|input|button|textarea|select|meta|link|base|frame|frameset)\b[^>]*>/gi;
const EVENT_ATTR = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const STYLE_ATTR = /\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const BAD_URL_ATTR = /\s+(href|src|xlink:href|action|formaction|srcset)\s*=\s*("\s*(?:javascript|data|vbscript):[^"]*"|'\s*(?:javascript|data|vbscript):[^']*'|(?:javascript|data|vbscript):[^\s>]*)/gi;

export function sanitizeTranslatedHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(DANGEROUS_BLOCKS, "")
    .replace(DANGEROUS_SINGLE, "")
    .replace(EVENT_ATTR, "")
    .replace(STYLE_ATTR, "")
    .replace(BAD_URL_ATTR, "");
}
