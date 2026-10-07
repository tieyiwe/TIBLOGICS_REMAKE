import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import { translatorFor } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { fonts, logo } from "@/lib/learn/cert/render";
import { SEAL_SVG } from "@/components/learn/scholarship/ScholarSeal";

// The Tilo Vision Scholarship award letter: an A4 portrait page in the
// certificate's style (TIBLOGICS logo, ARFA wordmark, the scholar seal), with
// the award, its terms and how to accept. Issued by the organisation, with no
// personal signature. Attached to the congratulations email, downloadable by
// the scholar, and previewed by staff (watermarked DRAFT before approval).

const SIZE = { width: 1414, height: 2000 };
const NAVY = "#0D1B2A";
const NAVY2 = "#1B2A5E";
const ORANGE = "#F47C20";
const AMBER = "#F9A738";
const INK2 = "#3A4A5C";

export interface LetterData {
  name: string;
  code: string;
  coveragePct: number;
  trackCount: number;
  /** Titles of the tracks it may be used on; empty = any live track. */
  tracks: string[];
  issuedAt: Date;
  acceptBy: Date | null;
  pickDays: number | null;
  completeDays: number | null;
  sponsorName: string | null;
  /** The partner organisation it is given through. */
  partner?: { name: string; role: string } | null;
  locale: string;
  draft?: boolean;
}

// The scholar seal (a sunrise), the same mark as on the site.
const SEAL_SRC = `data:image/svg+xml;base64,${Buffer.from(SEAL_SVG("letter")).toString("base64")}`;

function Seal() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={SEAL_SRC} width={210} height={210} alt="" style={{ flexShrink: 0 }} />;
}

async function letter(d: LetterData) {
  const loc: Locale = isLocale(d.locale) ? (d.locale as Locale) : "en";
  const t = translatorFor(loc);
  const logoUrl = await logo();
  const fmt = new Intl.DateTimeFormat(loc === "sw" ? "sw-KE" : loc, { day: "numeric", month: "long", year: "numeric" });
  const coverage = d.coveragePct >= 100 ? t("learn.scholar.coverage.full") : t("learn.scholar.coverage.part", { pct: String(d.coveragePct) });
  const tracks = t(d.trackCount === 1 ? "learn.scholar.tracks.one" : "learn.scholar.tracks.other", { n: String(d.trackCount) });
  const rows: Array<[string, string]> = [
    [t("learn.scholar.award.coverage"), coverage],
    [t("learn.scholar.award.tracks"), tracks],
    [t("learn.scholar.award.code"), d.code],
    ...(d.acceptBy ? ([[t("learn.scholar.award.claimBy"), fmt.format(d.acceptBy)]] as Array<[string, string]>) : []),
    ...(d.pickDays ? ([[t("learn.scholar.terms.pickLabel"), t("learn.scholar.terms.days", { n: String(d.pickDays) })]] as Array<[string, string]>) : []),
    ...(d.completeDays ? ([[t("learn.scholar.terms.completeLabel"), t("learn.scholar.terms.days", { n: String(d.completeDays) })]] as Array<[string, string]>) : []),
    ...(d.partner ? ([[t("learn.scholar.partner.label"), d.partner.name]] as Array<[string, string]>) : []),
    ...(d.sponsorName ? ([[t("learn.scholar.letter.sponsor"), d.sponsorName]] as Array<[string, string]>) : []),
  ];
  const first = d.name.trim().split(/\s+/)[0];

  return (
    <div style={{ width: SIZE.width, height: SIZE.height, display: "flex", position: "relative", background: "#FFFDF8", fontFamily: "Instrument Sans", color: NAVY }}>
      <div style={{ position: "absolute", left: 26, top: 26, width: SIZE.width - 52, height: SIZE.height - 52, display: "flex", border: `5px solid ${NAVY2}` }} />
      <div style={{ position: "absolute", left: 50, top: 50, width: SIZE.width - 100, height: SIZE.height - 100, display: "flex", border: `2px solid ${ORANGE}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", right: -240, top: -240, width: 700, height: 700, borderRadius: 9999, background: ORANGE, opacity: 0.06, display: "flex" }} />
      {d.draft ? (
        <div style={{ position: "absolute", left: 0, top: 900, width: SIZE.width, display: "flex", justifyContent: "center", fontSize: 220, fontWeight: 700, letterSpacing: 40, color: NAVY, opacity: 0.06 }}>DRAFT</div>
      ) : null}

      <div style={{ display: "flex", flexShrink: 0, flexDirection: "column", width: "100%", padding: "90px 110px 80px" }}>
        <div style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={320} height={92} alt="" style={{ objectFit: "contain", objectPosition: "left" }} />
          <div style={{ display: "flex", flexShrink: 0, flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexShrink: 0, fontSize: 54, fontWeight: 700 }}>
              <span style={{ color: NAVY2 }}>AR</span>
              <span style={{ color: ORANGE }}>FA</span>
            </div>
            <div style={{ display: "flex", flexShrink: 0, fontSize: 20, fontWeight: 700, letterSpacing: 3, color: INK2, textTransform: "uppercase" }}>{t("learn.certdoc.academy")}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between", marginTop: 50 }}>
          <div style={{ display: "flex", flexShrink: 0, flexDirection: "column" }}>
            <div style={{ display: "flex", flexShrink: 0, fontSize: 24, fontWeight: 700, letterSpacing: 8, color: ORANGE, textTransform: "uppercase" }}>{t("learn.scholar.letter.kicker")}</div>
            <div style={{ display: "flex", flexShrink: 0, marginTop: 10, fontFamily: "Lora", fontWeight: 700, fontSize: 58, lineHeight: 1.1, color: NAVY2 }}>The Tilo Vision Scholarship</div>
            <div style={{ display: "flex", flexShrink: 0, marginTop: 14, fontSize: 26, color: INK2 }}>{fmt.format(d.issuedAt)} · {d.code}</div>
            {d.partner ? (
              <div style={{ display: "flex", flexShrink: 0, marginTop: 8, fontSize: 24, fontWeight: 700, color: ORANGE }}>{t(`learn.scholar.partner.${d.partner.role}`, { partner: d.partner.name })}</div>
            ) : null}
          </div>
          <Seal />
        </div>

        <div style={{ display: "flex", flexShrink: 0, width: "100%", height: 3, marginTop: 40, background: `linear-gradient(90deg, ${ORANGE}, rgba(0,0,0,0))` }} />

        <div style={{ display: "flex", flexShrink: 0, marginTop: 34, fontFamily: "Lora", fontSize: 34, color: NAVY }}>{t("learn.scholar.letter.dear", { name: d.name })}</div>
        <div style={{ display: "flex", flexShrink: 0, marginTop: 16, fontSize: 23, lineHeight: 1.5, color: INK2 }}>{t("learn.scholar.letter.p1")}</div>
        {d.sponsorName ? (
          <div style={{ display: "flex", flexShrink: 0, marginTop: 10, fontSize: 23, lineHeight: 1.5, color: INK2 }}>{t("learn.scholar.letter.sponsorLine", { sponsor: d.sponsorName })}</div>
        ) : null}

        {/* On learning, knowledge and putting it into practice */}
        <div style={{ display: "flex", flexShrink: 0, flexDirection: "column", marginTop: 24, padding: "22px 32px", borderRadius: 20, background: NAVY2 }}>
          <div style={{ display: "flex", flexShrink: 0, fontFamily: "Lora", fontStyle: "italic", fontSize: 25, lineHeight: 1.45, color: "white" }}>“{t("learn.scholar.encourage.quote")}”</div>
          <div style={{ display: "flex", flexShrink: 0, marginTop: 12, fontSize: 20, lineHeight: 1.5, color: "#DDE5F4" }}>{t("learn.scholar.encourage.practice")}</div>
          <div style={{ display: "flex", flexShrink: 0, marginTop: 12, fontSize: 18, fontWeight: 700, letterSpacing: 4, color: AMBER, textTransform: "uppercase" }}>{t("learn.scholar.encourage.motto")}</div>
        </div>

        <div style={{ display: "flex", flexShrink: 0, flexDirection: "column", marginTop: 24, borderRadius: 20, border: "2px solid #F4C9A0", background: "#FFF8EF", padding: "12px 32px" }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexShrink: 0, justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F4DCC2" }}>
              <div style={{ display: "flex", flexShrink: 0, fontSize: 23, color: INK2 }}>{k}</div>
              <div style={{ display: "flex", flexShrink: 0, fontSize: 24, fontWeight: 700, color: NAVY, maxWidth: 760, textAlign: "right" }}>{v}</div>
            </div>
          ))}
          {d.tracks.length ? (
            <div style={{ display: "flex", flexShrink: 0, flexDirection: "column", paddingTop: 10 }}>
              <div style={{ display: "flex", flexShrink: 0, fontSize: 21, color: INK2 }}>{t("learn.scholar.email.tracksList")}</div>
              {d.tracks.slice(0, 8).map((x) => (
                <div key={x} style={{ display: "flex", flexShrink: 0, marginTop: 4, fontSize: 22, fontWeight: 700, color: NAVY }}>• {x}</div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexShrink: 0, marginTop: 22, fontSize: 22, lineHeight: 1.45, color: NAVY }}>{t("learn.scholar.letter.accept")}</div>
        <div style={{ display: "flex", flexShrink: 0, marginTop: 10, fontSize: 18, lineHeight: 1.45, color: INK2 }}>{t("learn.scholar.email.scope")}</div>

        <div style={{ display: "flex", flexShrink: 0, alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" }}>
          <div style={{ display: "flex", flexShrink: 0, flexDirection: "column", fontSize: 24, color: INK2, maxWidth: 560 }}>
            <div style={{ display: "flex" }}>{t("learn.scholar.letter.closing", { name: first })}</div>
            <div style={{ display: "flex", flexShrink: 0, marginTop: 6, fontWeight: 700, color: NAVY }}>{t("learn.scholar.encourage.believe")}</div>
          </div>
          <div style={{ display: "flex", flexShrink: 0, flexDirection: "column", alignItems: "center", width: 420 }}>
            <div style={{ display: "flex", flexShrink: 0, fontSize: 18, fontWeight: 700, letterSpacing: 3, color: INK2, textTransform: "uppercase" }}>{t("learn.certdoc.issuedBy")}</div>
            <div style={{ display: "flex", flexShrink: 0, width: 380, height: 3, background: NAVY, marginTop: 10, marginBottom: 12 }} />
            <div style={{ display: "flex", flexShrink: 0, fontSize: 38, fontWeight: 700, color: NAVY2 }}>
              <span>TIB</span>
              <span style={{ color: ORANGE }}>LOGICS</span>
            </div>
            <div style={{ display: "flex", flexShrink: 0, marginTop: 4, fontSize: 20, color: INK2 }}>{t("learn.certdoc.issuer")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The award letter as an A4 portrait PDF. */
export async function awardLetterPdf(d: LetterData): Promise<Buffer> {
  const res = new ImageResponse(await letter(d), { ...SIZE, fonts: await fonts() });
  const png = Buffer.from(await res.arrayBuffer());
  const pdf = await PDFDocument.create();
  pdf.setTitle(`The Tilo Vision Scholarship: ${d.name}`);
  pdf.setAuthor("TIBLOGICS · ARFA AI Academy");
  pdf.setSubject(`Award letter ${d.code}`);
  pdf.setCreator("tiblogics.com");
  const img = await pdf.embedPng(png);
  const W = 595.28, H = 841.89; // A4 portrait, points
  pdf.addPage([W, H]).drawImage(img, { x: 0, y: 0, width: W, height: H });
  return Buffer.from(await pdf.save());
}

export const letterFileName = (code: string) => `${code}-Tilo-Vision-Scholarship-award-letter.pdf`;
