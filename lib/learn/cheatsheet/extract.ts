// Pure helpers for the module cheat sheet (lib/learn/cheatsheet): pull the
// example prompts and code out of lesson Markdown, and shorten text so a
// module fits on one or two printed pages. No database, no model calls.

export interface Snippet {
  kind: "prompt" | "code";
  /** The fence language as written (try, prompt, text, ts, bash...). */
  lang: string;
  text: string;
}

const PROMPT_LANGS = new Set(["try", "prompt", "text"]);
// Fences that are widgets, not something to copy (Markdown.tsx renders them).
const SKIP_LANGS = new Set(["playground", "studio"]);

/** Every fenced block of a Markdown body, in order. */
export function fencedBlocks(md: string): Array<{ lang: string; text: string }> {
  const out: Array<{ lang: string; text: string }> = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let open: { lang: string; lines: string[]; fence: string } | null = null;
  for (const line of lines) {
    const m = /^\s*(```+|~~~+)\s*([A-Za-z0-9_+-]*)\s*$/.exec(line);
    if (!open) {
      if (m) open = { lang: m[2].toLowerCase(), lines: [], fence: m[1][0] };
      continue;
    }
    if (m && m[1][0] === open.fence && !m[2]) {
      out.push({ lang: open.lang, text: open.lines.join("\n").trim() });
      open = null;
    } else open.lines.push(line);
  }
  return out.filter((b) => b.text.length > 0);
}

/** Shortens a snippet to a few lines and a few hundred characters. */
export function shortenSnippet(text: string, maxLines = 5, maxChars = 300): string {
  const lines = text.split("\n").map((l) => l.replace(/\s+$/, ""));
  // Drop blank runs so short prompts stay compact.
  const compact: string[] = [];
  for (const l of lines) if (l.trim() || (compact.length && compact[compact.length - 1].trim())) compact.push(l);
  let cut = compact.length > maxLines;
  let out = compact.slice(0, maxLines).join("\n").trim();
  if (out.length > maxChars) {
    out = out.slice(0, maxChars);
    const sp = out.lastIndexOf(" ");
    if (sp > maxChars * 0.6) out = out.slice(0, sp);
    cut = true;
  }
  return cut ? `${out.trimEnd()} ...` : out;
}

/**
 * Up to `max` snippets across the module's lessons: prompts first (```try,
 * ```prompt, ```text), then code, taking them in turn from each lesson so
 * one long lesson does not fill the sheet. Duplicates are skipped.
 */
export function moduleSnippets(bodies: string[], max = 5): Snippet[] {
  // Tiers: ```try / ```prompt first, then real code, then ```text (often a
  // diagram or sample output rather than something to reuse).
  const tier = (lang: string) => (lang === "try" || lang === "prompt" ? 0 : PROMPT_LANGS.has(lang) || !lang ? 2 : 1);
  const perLesson = bodies.map((md) =>
    fencedBlocks(md)
      .filter((b) => !SKIP_LANGS.has(b.lang))
      .map((b) => ({
        tier: tier(b.lang),
        snippet: { kind: PROMPT_LANGS.has(b.lang) || !b.lang ? "prompt" : "code", lang: b.lang || "text", text: shortenSnippet(b.text) } as Snippet,
      })),
  );
  const out: Snippet[] = [];
  const seen = new Set<string>();
  for (const level of [0, 1, 2]) {
    const queues = perLesson.map((list) => list.filter((s) => s.tier === level).map((s) => s.snippet));
    for (let round = 0; out.length < max; round++) {
      let any = false;
      for (const q of queues) {
        const s = q[round];
        if (!s) continue;
        any = true;
        const key = s.text.toLowerCase().replace(/\s+/g, " ");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(s);
        if (out.length >= max) break;
      }
      if (!any) break;
    }
  }
  return out;
}

/** The first sentence of a definition, at most `max` characters. */
export function oneLine(text: string, max = 150): string {
  const t = text.replace(/\s+/g, " ").trim();
  const m = /^(.+?[.!?])(\s|$)/.exec(t);
  let s = m && m[1].length >= 25 ? m[1] : t;
  if (s.length > max) {
    s = s.slice(0, max);
    const sp = s.lastIndexOf(" ");
    s = `${(sp > max * 0.6 ? s.slice(0, sp) : s).replace(/[,;:]$/, "")}...`;
  }
  return s;
}

/** Markdown and em dashes removed, for a plain-text line. */
export function plain(text: string): string {
  return text
    .replace(/\*\*|__|`/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}
