import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { T } from "@/lib/i18n/server";
import type { CheatSheet } from "./index";

// The module cheat sheet as an A4 PDF in the TIBLOGICS style (navy band,
// orange accents), like the scanner report (lib/scanner/pdf.ts). Standard
// fonts only, so text is reduced to what WinAnsi can draw (French accents
// are fine). One page when it fits, two at most: when the content overflows,
// it is rendered again with fewer points per lesson, then fewer snippets.

const NAVY = rgb(0.106, 0.227, 0.42); // #1B3A6B
const ORANGE = rgb(0.957, 0.486, 0.125); // #F47C20
const INK = rgb(0.2, 0.25, 0.32);
const MUTED = rgb(0.45, 0.52, 0.6);
const BOX = rgb(0.953, 0.961, 0.976);
const BOX_EDGE = rgb(0.86, 0.89, 0.93);
const WHITE = rgb(1, 1, 1);
const W = 595.28;
const H = 841.89;
const M = 40;
const BOTTOM = 46;

/** Characters the standard fonts (WinAnsi) can draw; anything else becomes a close ASCII or is dropped. */
export function safe(s: string): string {
  return s
    .replace(/\t/g, "  ")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[   ]/g, " ")
    .replace(/→/g, "->")
    .replace(/•/g, "-")
    .replace(/[^\x20-\x7E\n¡-ÿŒœŠšŸŽž€]/g, "");
}

class Overflow extends Error {}

class Sheet {
  page!: PDFPage;
  y = 0;
  pages = 0;
  constructor(
    private doc: PDFDocument,
    readonly f: { regular: PDFFont; bold: PDFFont; mono: PDFFont },
    private footer: string,
    private maxPages: number,
  ) {
    this.newPage();
  }
  newPage() {
    if (this.pages >= this.maxPages) throw new Overflow();
    this.page = this.doc.addPage([W, H]);
    this.pages++;
    this.page.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: ORANGE });
    this.page.drawText(safe(this.footer), { x: M, y: 22, size: 7.5, font: this.f.regular, color: MUTED });
    this.y = H - 36;
  }
  need(h: number) {
    if (this.y - h < BOTTOM) this.newPage();
  }
  wrap(text: string, size: number, width: number, font: PDFFont, firstWidth = width): string[] {
    const out: string[] = [];
    let line = "";
    let max = firstWidth;
    for (const word of safe(text).split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > max && line) {
        out.push(line);
        line = word;
        max = width;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  }
  heading(text: string) {
    this.need(40);
    this.y -= 6;
    this.page.drawText(safe(text).toUpperCase(), { x: M, y: this.y - 11, size: 10.5, font: this.f.bold, color: NAVY });
    this.y -= 16;
    this.page.drawRectangle({ x: M, y: this.y, width: 30, height: 2, color: ORANGE });
    this.y -= 9;
  }
  /** Bold label, then wrapped text on the same line. */
  labelled(label: string, text: string, o: { size?: number; indent?: number; gap?: number } = {}) {
    const size = o.size ?? 9;
    const x = M + (o.indent ?? 0);
    const width = W - M - x;
    const head = safe(label);
    const headW = head ? this.f.bold.widthOfTextAtSize(`${head} `, size) : 0;
    const lines = this.wrap(text, size, width, this.f.regular, width - headW);
    const lh = size * 1.38;
    this.need(lh * Math.min(lines.length, 2));
    lines.forEach((l, i) => {
      if (i > 0) this.need(lh);
      if (i === 0 && head) this.page.drawText(head, { x, y: this.y - size, size, font: this.f.bold, color: NAVY });
      this.page.drawText(l, { x: i === 0 ? x + headW : x, y: this.y - size, size, font: this.f.regular, color: INK });
      this.y -= lh;
    });
    if (!lines.length && head) {
      this.page.drawText(head, { x, y: this.y - size, size, font: this.f.bold, color: NAVY });
      this.y -= lh;
    }
    this.y -= o.gap ?? 2;
  }
  /** A short bold navy line (a lesson title). */
  strong(text: string, size: number) {
    const lh = size * 1.35;
    for (const l of this.wrap(text, size, W - 2 * M, this.f.bold)) {
      this.need(lh);
      this.page.drawText(l, { x: M, y: this.y - size, size, font: this.f.bold, color: NAVY });
      this.y -= lh;
    }
    this.y -= 1;
  }
  bullet(text: string, size = 9) {
    const x = M + 12;
    const lines = this.wrap(text, size, W - M - x, this.f.regular);
    const lh = size * 1.38;
    lines.forEach((l, i) => {
      this.need(lh);
      if (i === 0) this.page.drawRectangle({ x: M + 3, y: this.y - size + 2.2, width: 3.2, height: 3.2, color: ORANGE });
      this.page.drawText(l, { x, y: this.y - size, size, font: this.f.regular, color: INK });
      this.y -= lh;
    });
    this.y -= 1;
  }
  /** A grey box with a small label and monospace text. */
  snippet(label: string, text: string) {
    const size = 8;
    const lh = size * 1.32;
    const pad = 6;
    const chars = Math.floor((W - 2 * M - 2 * pad) / (size * 0.6));
    const lines: string[] = [];
    for (const raw of safe(text).split("\n")) {
      // Break long lines at a space when there is one, keeping indentation.
      let rest = raw;
      while (rest.length > chars) {
        const sp = rest.lastIndexOf(" ", chars);
        const cut = sp > chars * 0.5 ? sp : chars;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut).replace(/^ /, "");
      }
      lines.push(rest);
    }
    const h = pad * 2 + 10 + lines.length * lh;
    this.need(h + 6);
    const top = this.y;
    this.page.drawRectangle({ x: M, y: top - h, width: W - 2 * M, height: h, color: BOX, borderColor: BOX_EDGE, borderWidth: 0.6 });
    this.page.drawRectangle({ x: M, y: top - h, width: 2.5, height: h, color: ORANGE });
    this.page.drawText(safe(label), { x: M + pad + 2, y: top - pad - 7, size: 7, font: this.f.bold, color: MUTED });
    let y = top - pad - 10 - size;
    for (const l of lines) {
      this.page.drawText(l, { x: M + pad + 2, y, size, font: this.f.mono, color: INK });
      y -= lh;
    }
    this.y = top - h - 6;
  }
}

async function render(s: CheatSheet, t: T, pointsPerLesson: number, maxSnippets: number, maxPages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(safe(`${t("learn.cheat.pdfTitle")}: ${s.moduleTitle}`));
  doc.setAuthor("TIBLOGICS");
  doc.setSubject(safe(s.trackTitle));
  const f = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    mono: await doc.embedFont(StandardFonts.Courier),
  };
  const moduleLabel = t("learn.cheat.module", { n: s.moduleNumber });
  const w = new Sheet(doc, f, `${t("learn.cheat.footer")} · ${s.trackTitle} · ${moduleLabel} · tiblogics.com/learn`, maxPages);

  // Title band.
  const bandH = 92;
  w.page.drawRectangle({ x: 0, y: H - 5 - bandH, width: W, height: bandH, color: NAVY });
  w.page.drawText("TIB", { x: M, y: H - 30, size: 12, font: f.bold, color: WHITE });
  w.page.drawText("LOGICS", { x: M + f.bold.widthOfTextAtSize("TIB", 12), y: H - 30, size: 12, font: f.bold, color: ORANGE });
  const tag = safe(t("learn.cheat.pdfTitle")).toUpperCase();
  w.page.drawText(tag, { x: W - M - f.bold.widthOfTextAtSize(tag, 8.5), y: H - 29, size: 8.5, font: f.bold, color: ORANGE });
  const trackLine = safe(`${s.trackTitle} · ${moduleLabel}`);
  w.page.drawText(w.wrap(trackLine, 9, W - 2 * M, f.regular)[0] ?? "", { x: M, y: H - 50, size: 9, font: f.regular, color: rgb(0.8, 0.85, 0.92) });
  const titleSize = w.wrap(s.moduleTitle, 16, W - 2 * M, f.bold).length > 1 ? 13 : 16;
  w.wrap(s.moduleTitle, titleSize, W - 2 * M, f.bold)
    .slice(0, 2)
    .forEach((l, i) => w.page.drawText(l, { x: M, y: H - 72 - i * (titleSize + 2), size: titleSize, font: f.bold, color: WHITE }));
  w.y = H - 5 - bandH - 10;

  if (s.ideas.length) {
    w.heading(t("learn.cheat.keyIdeas"));
    for (const idea of s.ideas) {
      w.need(26);
      w.strong(idea.lesson, 9.5);
      for (const p of idea.points.slice(0, pointsPerLesson)) w.bullet(p);
      w.y -= 2;
    }
  }

  const snippets = s.snippets.slice(0, maxSnippets);
  if (snippets.length) {
    w.heading(t("learn.cheat.tryThese"));
    for (const sn of snippets) w.snippet(sn.kind === "prompt" ? t("learn.cheat.prompt") : t("learn.cheat.code", { lang: sn.lang }), sn.text);
  }

  if (s.terms.length) {
    w.heading(t("learn.cheat.words"));
    for (const term of s.terms) w.labelled(`${term.term}:`, term.def, { size: 8.8, gap: 1.5 });
  }

  w.need(18);
  w.y -= 6;
  w.page.drawText(safe(t("learn.cheat.closing")), { x: M, y: w.y - 9, size: 8.5, font: f.bold, color: ORANGE });

  // Page numbers once the page count is known.
  const pages = doc.getPages();
  if (pages.length > 1) {
    pages.forEach((p, i) => {
      const n = `${i + 1}/${pages.length}`;
      p.drawText(n, { x: W - M - f.regular.widthOfTextAtSize(n, 7.5), y: 22, size: 7.5, font: f.regular, color: MUTED });
    });
  }
  return doc.save();
}

/**
 * The sheet on one page when a lightly trimmed version fits, else on two
 * pages with as much as fits: [pages, points per lesson, snippets].
 */
const PLANS: Array<[number, number, number]> = [
  [1, 3, 5],
  [1, 2, 5],
  [1, 2, 4],
  [2, 3, 5],
  [2, 2, 5],
  [2, 2, 4],
  [2, 1, 4],
  [2, 1, 3],
  [2, 1, 2],
];

export async function cheatSheetPdf(s: CheatSheet, t: T): Promise<Uint8Array> {
  for (const [pages, points, snippets] of PLANS) {
    try {
      return await render(s, t, points, snippets, pages);
    } catch (err) {
      if (!(err instanceof Overflow)) throw err;
    }
  }
  // Last resort (a module with very many lessons): fewer lessons, no snippets.
  for (let keep = s.ideas.length; keep > 0; keep = Math.floor(keep / 2)) {
    try {
      return await render({ ...s, ideas: s.ideas.slice(0, keep), snippets: [], terms: s.terms.slice(0, 4) }, t, 1, 0, 2);
    } catch (err) {
      if (!(err instanceof Overflow)) throw err;
    }
  }
  return render({ ...s, ideas: [], snippets: [], terms: [] }, t, 0, 0, 2);
}
