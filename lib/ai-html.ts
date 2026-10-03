// Allowlist clean-up for article HTML written by a model (AI Times news
// pieces, generated posts, repaired posts, tips). The news agent writes from
// articles anyone can link on Hacker News or DEV.to, so a hidden instruction in
// a source page could steer the model into adding markup; that HTML is then
// published and rendered as-is on the public article page.
//
// Only plain article markup survives: the tags below, a class attribute, and
// on links an http(s), relative or mailto href. Every other tag is dropped
// (its text is kept), and any "<" that does not open a well-formed tag is
// escaped, so nothing the browser could parse as markup is left behind.

const ALLOWED = new Set([
  "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "b", "i", "a",
  "blockquote", "br", "hr", "div", "span", "code", "pre",
]);
const VOID = new Set(["br", "hr"]);

const ATTR = /([^\s"'<>\/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
const SAFE_HREF = /^(?:https?:\/\/|mailto:|\/(?!\/)|#)[^\s"'<>\\\x00-\x1f]*$/i;

const attrEscape = (v: string) => v.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function rebuild(close: string, name: string, attrs: string): string {
  const tag = name.toLowerCase();
  if (!ALLOWED.has(tag)) return "";
  if (close) return VOID.has(tag) ? "" : `</${tag}>`;
  const kept: string[] = [];
  for (const m of attrs.matchAll(ATTR)) {
    const key = m[1].toLowerCase();
    const value = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (key === "class" && /^[\w\s-]{0,200}$/.test(value)) kept.push(`class="${value}"`);
    else if (tag === "a" && key === "href" && SAFE_HREF.test(value)) kept.push(`href="${attrEscape(value)}"`);
  }
  if (tag === "a" && kept.some((k) => k.startsWith("href="))) kept.push('rel="noopener noreferrer nofollow"', 'target="_blank"');
  return `<${tag}${kept.length ? ` ${kept.join(" ")}` : ""}>`;
}

export function sanitizeAiHtml(html: string): string {
  if (!html) return html;
  return html
    // Whole blocks whose text is not article content.
    .replace(/<(script|style|iframe|object|embed|template|noscript|svg|math|textarea|title|xmp|noembed|noframes)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>|</g, (m, close: string | undefined, name: string | undefined, attrs: string | undefined) =>
      name ? rebuild(close ?? "", name, attrs ?? "") : "&lt;",
    );
}

/** Text from a model, for inclusion in HTML as text. */
export function escapeAiText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
