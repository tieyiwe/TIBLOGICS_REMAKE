// "Markdown lite" for admin messages and learner replies, rendered the same
// way in emails, the learner Inbox and the admin views.
//
// Safe by construction: the whole text is HTML-escaped FIRST, then a small
// set of patterns is turned into tags this module writes itself. Nothing the
// author typed can become a tag or an attribute. Links only for http(s) and
// mailto, with rel="noopener noreferrer nofollow".
//
// Supported: paragraphs (blank line), line breaks, **bold**, *italic*,
// [text](https://url), bare https:// URLs, "- " bullet lists.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface MdStyle {
  p?: string;
  a?: string;
  ul?: string;
}

function safeHref(raw: string): string | null {
  // `raw` is already escaped; &amp; is fine inside an attribute.
  if (/^(https?:\/\/|mailto:)/i.test(raw) && !/["\s<>]/.test(raw)) return raw;
  return null;
}

function inline(escaped: string, style: MdStyle): string {
  const a = style.a ? ` style="${style.a}"` : "";
  let out = escaped
    // [text](url)
    .replace(/\[([^\]\n]{1,200})\]\(([^)\s]{1,500})\)/g, (m, text: string, href: string) => {
      const h = safeHref(href);
      return h ? `<a href="${h}" target="_blank" rel="noopener noreferrer nofollow"${a}>${text}</a>` : m;
    })
    .replace(/\*\*([^*\n]{1,500})\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]{1,500})\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
  // Bare URLs not already inside a link.
  out = out.replace(/(^|[\s(])(https?:\/\/[^\s<"]{3,500})/g, (m, pre: string, url: string) => {
    const trimmed = url.replace(/[.,!?:;)]+$/, "");
    const rest = url.slice(trimmed.length);
    return `${pre}<a href="${trimmed}" target="_blank" rel="noopener noreferrer nofollow"${a}>${trimmed}</a>${rest}`;
  });
  return out;
}

/** Text to HTML. The input is untrusted; the output is safe to inject. */
export function renderMarkdownLite(text: string, style: MdStyle = {}): string {
  const p = style.p ? ` style="${style.p}"` : "";
  const ul = style.ul ? ` style="${style.ul}"` : "";
  const blocks = escapeHtml(text.replace(/\r\n?/g, "\n").trim()).split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((l) => /^\s*[-*] +/.test(l))) {
        return `<ul${ul}>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*] +/, ""), style)}</li>`).join("")}</ul>`;
      }
      return `<p${p}>${lines.map((l) => inline(l, style)).join("<br/>")}</p>`;
    })
    .join("");
}

/** Plain text preview (lists and the inbox), markup stripped. */
export function plainPreview(text: string, max = 140): string {
  const flat = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*?([^*]+)\*\*?/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

// ── Merge fields ───────────────────────────────────────────────────────────

export const MERGE_FIELDS = ["firstName", "trackTitle", "progress", "loginLink"] as const;
export type MergeField = (typeof MERGE_FIELDS)[number];
export type MergeValues = Record<MergeField, string>;

/** Replaces {firstName} etc. Unknown {fields} are left as typed. */
export function applyMerge(text: string, v: MergeValues): string {
  return text.replace(/\{(firstName|trackTitle|progress|loginLink)\}/g, (_, k: MergeField) => v[k] ?? "");
}
