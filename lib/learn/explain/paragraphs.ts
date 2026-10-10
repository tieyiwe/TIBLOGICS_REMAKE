// "Explain it simpler" (components/learn/ExplainParagraph.tsx). Client-safe.
//
// The browser sends a paragraph's INDEX, never its text: the server re-reads
// the lesson in the learner's language and picks the paragraph with this
// splitter. It mirrors the block rules of components/learn/Markdown.tsx
// (only <p> blocks count, in order); the hash sent alongside lets the server
// refuse a mismatch instead of explaining the wrong paragraph if the two ever
// drift apart. Keep them in step.

/** Shorter paragraphs (a one-line transition, a label) get no button. */
export const MIN_EXPLAIN_CHARS = 80;

const isSeparator = (row: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(row.trim());

/** The text of every <p> that Markdown renders for this source, in order. */
export function lessonParagraphs(source: string): string[] {
  const out: string[] = [];
  let paragraph: string[] = [];
  let table: string[] = [];
  let code = false;

  const flushParagraph = () => {
    if (paragraph.length) out.push(paragraph.join(" "));
    paragraph = [];
  };
  // A "table" without its separator row is rendered as a paragraph.
  const flushTable = () => {
    if (!table.length) return;
    const rows = table;
    table = [];
    if (rows.length < 2 || !isSeparator(rows[1])) {
      paragraph.push(...rows.map((r) => r.trim()));
      flushParagraph();
    }
  };
  const flushAll = () => {
    flushTable();
    flushParagraph();
  };

  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (code) {
      if (line.trim().startsWith("```")) code = false;
      continue;
    }
    if (line.trim().startsWith("```")) {
      flushAll();
      code = true;
      continue;
    }
    if (line.trim() === "") {
      flushAll();
      continue;
    }
    if (line.trim().startsWith("|")) {
      flushParagraph();
      table.push(line);
      continue;
    }
    if (table.length) flushTable();
    if (/^(#{1,4})\s+(.*)$/.test(line) || /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushAll();
      continue;
    }
    if (/^>\s?(.*)$/.test(line) || /^[-*+]\s+(.*)$/.test(line.trim()) || /^\d+[.)]\s+(.*)$/.test(line.trim())) {
      flushParagraph();
      continue;
    }
    paragraph.push(line.trim());
  }
  flushAll();
  return out;
}

/** A short, stable fingerprint of a paragraph (cyrb53): the cache key and the drift check. */
export function paraHash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
