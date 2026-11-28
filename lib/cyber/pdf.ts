import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { CATEGORY_LABEL, type CyberResult, type Finding, type Severity } from "./types";

// The security report as a PDF a business owner can read and forward: grade,
// what to fix first, every finding with why it matters and how to fix it.

const NAVY = rgb(0.051, 0.106, 0.165);
const ORANGE = rgb(0.957, 0.486, 0.125);
const INK = rgb(0.227, 0.29, 0.361);
const MUTED = rgb(0.478, 0.561, 0.651);
const SEV: Record<Severity, ReturnType<typeof rgb>> = { critical: rgb(0.706, 0.137, 0.094), high: rgb(0.863, 0.408, 0.012), medium: rgb(0.71, 0.278, 0.031), low: rgb(0.278, 0.329, 0.404), info: rgb(0.478, 0.561, 0.651) };
const W = 595.28, H = 841.89, M = 48;

// The standard PDF fonts only cover Latin-1.
const safe = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[→]/g, "->").replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");

class Doc {
  page!: PDFPage;
  y = 0;
  constructor(private doc: PDFDocument, private font: PDFFont, private bold: PDFFont, private mono: PDFFont, private footer: string) { this.add(); }
  add() {
    this.page = this.doc.addPage([W, H]);
    this.y = H - M;
    this.page.drawText(safe(this.footer), { x: M, y: 24, size: 8, font: this.font, color: MUTED });
  }
  need(h: number) { if (this.y - h < 50) this.add(); }
  wrap(text: string, size: number, width: number, font: PDFFont): string[] {
    const out: string[] = [];
    for (const para of safe(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const t = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = word; } else line = t;
      }
      out.push(line);
    }
    return out;
  }
  text(t: string, o: { size?: number; bold?: boolean; mono?: boolean; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const size = o.size ?? 10, font = o.mono ? this.mono : o.bold ? this.bold : this.font, x = M + (o.indent ?? 0);
    for (const line of this.wrap(t, size, W - x - M, font)) {
      this.need(size + 4);
      this.page.drawText(line, { x, y: this.y - size, size, font, color: o.color ?? INK });
      this.y -= size + 4;
    }
    this.y -= o.gap ?? 4;
  }
  heading(t: string) { this.need(40); this.y -= 8; this.text(t, { size: 15, bold: true, color: NAVY, gap: 6 }); }
  chip(sev: Severity, t: string) {
    this.need(22);
    const label = sev.toUpperCase();
    const w = this.bold.widthOfTextAtSize(label, 8) + 10;
    this.page.drawRectangle({ x: M, y: this.y - 14, width: w, height: 14, color: SEV[sev] });
    this.page.drawText(label, { x: M + 5, y: this.y - 10.5, size: 8, font: this.bold, color: rgb(1, 1, 1) });
    const lines = this.wrap(t, 11, W - 2 * M - w - 8, this.bold);
    lines.forEach((l, i) => this.page.drawText(l, { x: M + w + 8, y: this.y - 11 - i * 14, size: 11, font: this.bold, color: NAVY }));
    this.y -= Math.max(18, lines.length * 14 + 4);
  }
}

export async function cyberPdf(r: CyberResult, opts: { company?: string | null } = {}): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Security report: ${r.domain}`);
  doc.setAuthor("TIBLOGICS");
  const [font, bold, mono] = await Promise.all([doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold), doc.embedFont(StandardFonts.Courier)]);
  const date = new Date(r.finishedAt).toLocaleDateString("en-US", { dateStyle: "long" });
  const d = new Doc(doc, font, bold, mono, `TIBLOGICS · Security report · ${r.domain} · ${date} · tiblogics.com · Confidential`);

  d.page.drawRectangle({ x: 0, y: H - 200, width: W, height: 200, color: NAVY });
  d.page.drawText("TIB", { x: M, y: H - 60, size: 20, font: bold, color: rgb(1, 1, 1) });
  d.page.drawText("LOGICS", { x: M + bold.widthOfTextAtSize("TIB", 20), y: H - 60, size: 20, font: bold, color: ORANGE });
  d.page.drawText("Website security report", { x: M, y: H - 100, size: 24, font: bold, color: rgb(1, 1, 1) });
  d.page.drawText(safe(`${opts.company ? `${opts.company} · ` : ""}${r.finalUrl}`).slice(0, 90), { x: M, y: H - 126, size: 11, font, color: rgb(0.8, 0.85, 0.92) });
  d.page.drawText(safe(`${date} · ${r.deep ? "Authorised assessment (passive and active checks)" : "Passive assessment (no intrusive tests)"}`), { x: M, y: H - 146, size: 10, font, color: rgb(0.8, 0.85, 0.92) });
  d.page.drawText(r.grade, { x: W - M - 70, y: H - 150, size: 72, font: bold, color: r.grade <= "B" ? rgb(0.3, 0.85, 0.45) : r.grade === "C" ? ORANGE : rgb(1, 0.4, 0.35) });
  d.page.drawText(`${r.score}/100`, { x: W - M - 70, y: H - 172, size: 12, font: bold, color: rgb(1, 1, 1) });
  d.y = H - 230;

  d.heading("Summary");
  d.text(`We found ${r.findings.length} issue${r.findings.length === 1 ? "" : "s"}: ${r.counts.critical} critical, ${r.counts.high} high, ${r.counts.medium} medium, ${r.counts.low} low and ${r.counts.info} for information.`, { size: 11 });
  const p = r.platform;
  d.text(`Platform: ${[p.cms && `${p.cms}${p.cmsVersion ? ` ${p.cmsVersion}` : ""}`, p.server, p.cdn && `behind ${p.cdn}`].filter(Boolean).join(" · ") || "not identified"}.`, { color: MUTED });
  for (const [cat, score] of Object.entries(r.categoryScores)) d.text(`${CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL]}: ${score}/100`, { indent: 8, size: 9.5 });

  const byId = new Map(r.findings.map((f) => [f.id, f]));
  const planList = (title: string, ids: string[]) => {
    if (!ids.length) return;
    d.text(title, { bold: true, size: 11, color: NAVY, gap: 2 });
    ids.forEach((id, i) => { const f = byId.get(id); if (f) d.text(`${i + 1}. ${f.title}${f.effort === "minutes" ? " (quick fix)" : ""}`, { indent: 10 }); });
  };
  d.heading("Fix plan");
  planList("Fix this week (critical and high)", r.plan.now);
  planList("Fix this month (medium)", r.plan.next);
  planList("Hardening (low and advice)", r.plan.later);

  d.heading("Findings and how to fix them");
  for (const f of r.findings) writeFinding(d, f);

  if (r.subdomains.length) {
    d.heading("Attack surface: subdomains found in public certificate logs");
    for (const s of r.subdomains.slice(0, 60)) d.text(`${s.name}  ${s.status}${s.cname ? ` -> ${s.cname}` : ""}${s.sensitive ? "  (non-production or admin)" : ""}`, { size: 9, mono: true });
  }
  if (r.notes.length) { d.heading("Notes and limits"); for (const n of r.notes) d.text(`- ${n}`, { size: 9.5 }); }
  d.heading("About this report");
  d.text("This report describes what TIBLOGICS observed from the public internet on the date above. It is not a guarantee that no other weaknesses exist. Active tests were run only with the written authorisation of the site owner. To have these issues fixed, reply to the email this report came with or book a call at tiblogics.com/book.", { size: 9.5, color: MUTED });
  return Buffer.from(await doc.save());
}

function writeFinding(d: Doc, f: Finding) {
  d.need(80);
  d.y -= 6;
  d.chip(f.severity, f.title);
  d.text(`${CATEGORY_LABEL[f.category]} · effort: ${f.effort}${f.standard ? ` · ${f.standard}` : ""}`, { size: 8.5, color: MUTED });
  if (f.tip) d.text(`Quick tip: ${f.tip}`, { size: 10, bold: true, color: rgb(0.6, 0.29, 0) });
  d.text(`What we saw: ${f.evidence}`, { size: 9.5 });
  d.text(`Why it matters: ${f.impact}`, { size: 9.5 });
  d.text("How to fix it:", { size: 9.5, bold: true, gap: 0 });
  f.fix.forEach((s, i) => d.text(`${i + 1}. ${s}`, { size: 9.5, indent: 10, gap: 0 }));
  d.y -= 4;
  const sn = f.snippets?.[0];
  if (sn) { d.text(sn.label, { size: 8.5, bold: true, color: MUTED, gap: 0 }); d.text(sn.code, { size: 8.5, mono: true, indent: 10 }); }
  if (f.refs?.length) d.text(`More: ${f.refs.map((r) => r.url).join("  ")}`, { size: 8, color: MUTED });
}
