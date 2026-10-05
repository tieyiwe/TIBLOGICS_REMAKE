import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ScannerLead } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import { translatorFor } from "@/lib/i18n/server";
import { findingText } from "./i18n";
import { allFindings, readExtra, AREAS, type Area, type CompareRow } from "./view";
import { readReport } from "./report-shape";

// The full report as a branded A4 PDF: scores, the written summary and fix
// steps, build ideas, every check by area, detected tools, PageSpeed and the
// competitor comparison. Standard Helvetica (no font files), so text is
// reduced to the characters it can draw (French and Swahili are fine).

const NAVY = rgb(0.051, 0.106, 0.165);
const BLUE = rgb(0.106, 0.227, 0.42);
const ORANGE = rgb(0.957, 0.486, 0.125);
const INK = rgb(0.227, 0.29, 0.361);
const MUTED = rgb(0.478, 0.561, 0.651);
const GREEN = rgb(0.086, 0.639, 0.29);
const RED = rgb(0.863, 0.149, 0.149);
const W = 595.28;
const H = 841.89;
const M = 48;

/** Characters Helvetica (WinAnsi) can draw; anything else becomes a close ASCII or is dropped. */
function safe(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[  ]/g, " ")
    .replace(/→/g, "->")
    .replace(/[^\x20-\x7E¡-ÿŒœŠšŸŽž€]/g, "");
}

const scoreColor = (n: number) => (n >= 70 ? GREEN : n >= 50 ? ORANGE : RED);

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(private doc: PDFDocument, private font: PDFFont, private bold: PDFFont, private footer: string) {
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage([W, H]);
    this.page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: ORANGE });
    this.page.drawText(safe(this.footer), { x: M, y: 24, size: 8, font: this.font, color: MUTED });
    this.y = H - 50;
  }
  need(h: number) {
    if (this.y - h < 50) this.newPage();
  }
  lines(text: string, size: number, width: number, font = this.font): string[] {
    const out: string[] = [];
    for (const para of safe(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) > width && line) {
          out.push(line);
          line = word;
        } else line = next;
      }
      out.push(line);
    }
    return out;
  }
  text(text: string, o: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const size = o.size ?? 10;
    const font = o.bold ? this.bold : this.font;
    const x = M + (o.indent ?? 0);
    for (const l of this.lines(text, size, W - x - M, font)) {
      this.need(size + 4);
      this.page.drawText(l, { x, y: this.y - size, size, font, color: o.color ?? INK });
      this.y -= size * 1.45;
    }
    this.y -= o.gap ?? 4;
  }
  heading(text: string) {
    this.need(40);
    this.y -= 8;
    this.page.drawText(safe(text), { x: M, y: this.y - 15, size: 15, font: this.bold, color: NAVY });
    this.y -= 22;
    this.page.drawRectangle({ x: M, y: this.y, width: 36, height: 2.5, color: ORANGE });
    this.y -= 12;
  }
  bar(label: string, score: number) {
    this.need(22);
    this.page.drawText(safe(label), { x: M, y: this.y - 10, size: 10, font: this.font, color: INK });
    const bx = M + 190;
    const bw = W - M - bx - 50;
    this.page.drawRectangle({ x: bx, y: this.y - 10, width: bw, height: 7, color: rgb(0.91, 0.937, 0.973) });
    this.page.drawRectangle({ x: bx, y: this.y - 10, width: Math.max(2, (bw * score) / 100), height: 7, color: scoreColor(score) });
    this.page.drawText(`${score}`, { x: W - M - 30, y: this.y - 11, size: 11, font: this.bold, color: scoreColor(score) });
    this.y -= 20;
  }
}

export function reportFileName(l: Pick<ScannerLead, "domain" | "createdAt">): string {
  const d = (l.domain ?? "site").replace(/[^a-z0-9.-]/gi, "-");
  return `TIBLOGICS-website-report-${d}-${l.createdAt.toISOString().slice(0, 10)}.pdf`;
}

export async function reportPdf(l: ScannerLead, locale: Locale): Promise<Buffer> {
  const t = translatorFor(locale);
  const doc = await PDFDocument.create();
  doc.setTitle(safe(`${t("tools.sr.pdf.title")}: ${l.domain ?? l.url}`));
  doc.setAuthor("TIBLOGICS");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(l.createdAt);
  const w = new Writer(doc, font, bold, `TIBLOGICS · ${t("tools.sr.pdf.title")} · ${l.domain ?? ""} · ${date} · tiblogics.com`);
  const extra = readExtra(l.extra);
  const report = readReport(l.report);

  // Cover band
  w.page.drawRectangle({ x: 0, y: H - 190, width: W, height: 184, color: NAVY });
  w.page.drawText("TIB", { x: M, y: H - 60, size: 20, font: bold, color: rgb(1, 1, 1) });
  w.page.drawText("LOGICS", { x: M + bold.widthOfTextAtSize("TIB", 20), y: H - 60, size: 20, font: bold, color: ORANGE });
  w.page.drawText(safe(t("tools.sr.pdf.title")), { x: M, y: H - 100, size: 24, font: bold, color: rgb(1, 1, 1) });
  w.page.drawText(safe(l.url).slice(0, 80), { x: M, y: H - 126, size: 12, font, color: rgb(0.8, 0.85, 0.92) });
  w.page.drawText(safe(date), { x: M, y: H - 146, size: 10, font, color: rgb(0.7, 0.76, 0.84) });
  w.page.drawCircle({ x: W - M - 44, y: H - 104, size: 40, color: rgb(1, 1, 1) });
  const ov = `${l.overallScore}`;
  w.page.drawText(ov, { x: W - M - 44 - bold.widthOfTextAtSize(ov, 26) / 2, y: H - 112, size: 26, font: bold, color: scoreColor(l.overallScore) });
  w.page.drawText("/100", { x: W - M - 54, y: H - 128, size: 8, font, color: MUTED });
  w.y = H - 214;

  const scores: Record<Area, number | null> = {
    seo: l.seoScore, perf: l.perfScore, ux: l.uxScore, ai: l.aiScore,
    growth: extra?.growthScore ?? null, security: extra?.securityScore ?? null,
  };
  w.heading(t("tools.sr.pdf.scores"));
  for (const a of AREAS) if (scores[a] !== null) w.bar(t(`tools.sr.area.${a}`), scores[a]!);

  if (report) {
    w.heading(t("tools.sr.summary"));
    w.text(report.summary, { size: 10.5, gap: 6 });
    if (report.quickWin) w.text(`${t("tools.sr.quickWin")} ${report.quickWin}`, { bold: true, color: GREEN, gap: 8 });
    w.heading(t("tools.sr.fixPlan"));
    report.priorities.forEach((p, i) => {
      w.need(60);
      w.text(`${i + 1}. ${p.title}`, { size: 11.5, bold: true, color: NAVY, gap: 2 });
      w.text(`${t(`tools.sr.effort.${p.effort}`)}${p.diy ? ` · ${t("tools.sr.diy")}` : ""}`, { size: 8.5, color: MUTED, gap: 2 });
      if (p.why) w.text(p.why, { size: 10, gap: 3 });
      p.steps.forEach((s, j) => w.text(`${j + 1}) ${s}`, { size: 9.5, indent: 12, gap: 1 }));
      w.y -= 6;
    });
    if (report.ideas.length) {
      w.heading(t("tools.sr.ideas"));
      for (const idea of report.ideas) {
        w.text(idea.title, { size: 11.5, bold: true, color: BLUE, gap: 2 });
        w.text(idea.what, { size: 10, gap: 2 });
        if (idea.outcome) w.text(`${t("tools.sr.outcome")} ${idea.outcome}`, { size: 9.5, color: GREEN, gap: 8 });
      }
    }
  } else if (extra?.opportunities.length) {
    w.heading(t("tools.sr.ideas"));
    for (const k of extra.opportunities) {
      w.text(t(`tools.opp.${k}.title`), { size: 11.5, bold: true, color: BLUE, gap: 2 });
      w.text(t(`tools.opp.${k}.body`), { size: 10, gap: 8 });
    }
  }

  w.heading(t("tools.sr.allChecks"));
  const findings = allFindings(l);
  for (const a of AREAS) {
    const list = findings.filter((f) => f.area === a);
    if (!list.length) continue;
    w.text(t(`tools.sr.area.${a}`), { size: 11, bold: true, color: NAVY, gap: 2 });
    for (const f of list) {
      const mark = f.type === "good" ? "OK" : f.type === "warning" ? "!" : "X";
      w.text(`[${mark}] ${findingText(t, locale, f)}`, { size: 9.5, indent: 8, color: f.type === "good" ? INK : f.type === "bad" ? RED : rgb(0.72, 0.31, 0.04), gap: 1 });
    }
    w.y -= 6;
  }

  const tech = extra?.tech;
  if (tech) {
    w.heading(t("tools.sr.tech"));
    const rows: Array<[string, string]> = [
      [t("tools.sr.tech.platform"), [tech.cms, tech.cmsVersion].filter(Boolean).join(" ")],
      [t("tools.sr.tech.shop"), tech.shop ?? ""],
      [t("tools.sr.tech.analytics"), [...tech.analytics, ...tech.pixels].join(", ")],
      [t("tools.sr.tech.booking"), tech.booking ?? ""],
      [t("tools.sr.tech.chat"), tech.chat.join(", ")],
      [t("tools.sr.tech.languages"), tech.languages.join(", ")],
      [t("tools.sr.tech.libraries"), tech.libraries.map((x) => `${x.name}${x.version ? ` ${x.version}` : ""}${x.outdated ? ` (${t("tools.sr.tech.outdated")})` : ""}`).join(", ")],
    ];
    for (const [k, v] of rows) w.text(`${k}: ${v || t("tools.sr.tech.none")}`, { size: 10, gap: 1 });
  }

  const ps = extra?.pageSpeed;
  if (ps) {
    w.heading(t("tools.sr.pagespeed"));
    w.bar(t("tools.sr.ps.performance"), ps.performance);
    const ms = (v: number | null) => (v == null ? "-" : `${(v / 1000).toFixed(1)} s`);
    w.text(`LCP ${ms(ps.lcpMs)} · FCP ${ms(ps.fcpMs)} · TBT ${ps.tbtMs ?? "-"} ms · CLS ${ps.cls ?? "-"} · Speed Index ${ms(ps.speedIndexMs)}`, { size: 10 });
  }

  const compare = Array.isArray(l.compare) ? (l.compare as unknown as CompareRow[]) : [];
  if (compare.length) {
    w.heading(t("tools.sr.compare"));
    w.text(`${l.domain}: ${l.overallScore}/100`, { bold: true, size: 10.5, gap: 2 });
    for (const c of compare) w.text(c.ok && c.scores ? `${c.host}: ${c.scores.overall}/100 (AI ${c.scores.ai}, SEO ${c.scores.seo})` : `${c.host}: ${c.error ?? "-"}`, { size: 10, gap: 2 });
  }

  w.heading(t("tools.sr.pdf.next"));
  w.text(t("tools.sr.pdf.nextBody"), { size: 10.5 });
  w.text("tiblogics.com/book", { bold: true, color: ORANGE, size: 11 });

  return Buffer.from(await doc.save());
}
