// Store copy is plain text: the product page turns blank lines into
// paragraphs and short lines into headings and lists. Text pasted from an AI
// chat or a word processor brings along characters that would show as-is:
// markdown (**bold**, # headings, - bullets, [links](url), `code`), HTML
// tags and entities, invisible characters, and "mojibake" (â€™ for ’, Ã©
// for é) from text saved in the wrong encoding. These helpers strip them.

const MOJIBAKE: Array<[RegExp, string]> = [
  // UTF-8 read as Windows-1252: "—" is bytes E2 80 94, shown as â € ” (or
  // \u0094 when read as Latin-1), and so on for the other punctuation.
  [/â€[\u201d\u0094\u2014]/g, "—"], [/â€[\u201c\u0093\u2013]/g, "–"], [/â€[\u2122\u0099]/g, "’"], [/â€[\u02dc\u0098]/g, "‘"],
  [/â€[\u0153\u009c]/g, "“"], [/â€\u009d/g, "”"], [/â€[\u00a6\u0085]/g, "…"], [/â€[\u00a2\u0095]/g, "•"],
  [/â„¢/g, "™"], [/Â©/g, "©"], [/Â®/g, "®"], [/Â°/g, "°"], [/Â·/g, "·"],
  [/Ã©/g, "é"], [/Ã¨/g, "è"], [/Ãª/g, "ê"], [/Ã«/g, "ë"], [/Ã‰/g, "É"], [/Ã§/g, "ç"], [/Ã´/g, "ô"],
  [/Ã¢/g, "â"], [/Ã®/g, "î"], [/Ã¯/g, "ï"], [/Ã»/g, "û"], [/Ã¹/g, "ù"], [/Ã¼/g, "ü"], [/Ã¶/g, "ö"],
  [/Ã±/g, "ñ"], [/Ã¡/g, "á"], [/Ã³/g, "ó"], [/Ãº/g, "ú"], [/Ã­/g, "í"], [/Ã\u00a0/g, "à"], [/Â(?=\s)/g, ""],
];

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…", bull: "•" };

/** Multi-line copy (descriptions): keeps paragraphs and line breaks. */
export function cleanCopy(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input).replace(/\r\n?/g, "\n");
  // The Latin-1 reading of the same bytes keeps € as \u0080: normalise first.
  s = s.replace(/â\u0080/g, "â€").replace(/â\u0084/g, "â„");
  for (const [re, to] of MOJIBAKE) s = s.replace(re, to);
  s = s
    // Invisible and replacement characters.
    .replace(/[​-‍⁠﻿�]/g, "")
    // HTML: line breaks and paragraphs become new lines, other tags go.
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]{1,200}>/g, "")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) && n > 31 ? String.fromCodePoint(n) : "";
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    // Markdown, line by line: headings, quotes, bullets, rules.
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*#{1,6}\s+/, "")
        .replace(/^\s*>\s?/, "")
        .replace(/^\s*(?:[-*+•▪◦]|\d{1,2}[.)])\s+/, "")
        .replace(/^\s*(?:[-*_]\s*){3,}$/, "")
        .replace(/[ \t]+$/, ""),
    )
    .join("\n")
    // Markdown inline: images, links, emphasis, code, escapes.
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\((?:https?:|mailto:|\/)[^)]*\)/g, "$1")
    .replace(/\\([*_#`~[\]>])/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[\s(])[*_]([^*_\n]+?)[*_](?=[\s).,;:!?]|$)/gm, "$1$2")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1")
    // Leftover markers with nothing to pair with.
    .replace(/\*{2,}|_{2,}|`+/g, "")
    // Spaces left behind by what was removed.
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

/** One-line copy (names, taglines): same cleanup, on one line. */
export function cleanLine(input: string | null | undefined): string {
  return cleanCopy(input).replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}
