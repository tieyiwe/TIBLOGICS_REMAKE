import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import { translatorFor } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";

// The ARFA certificate, one design for every track in the track's own colour
// (lib/learn/cert): TIBLOGICS logo and ARFA wordmark, the learner's name,
// the certificate, the level, the issue date, the reference number with a QR
// code to the public verification page, a seal and the signature. Rendered
// by next/og (Satori) as a 2000x1414 PNG (A4 landscape), and as an A4 PDF.

export const CERT_SIZE = { width: 2000, height: 1414 };

export interface CertificateData {
  name: string;
  certificateName: string;
  tagline: string | null;
  level: string;
  levelEnd: string | null;
  accentColor: string;
  hours: number;
  distinction: boolean;
  issuedAt: Date;
  reference: string;
  verifyUrl: string;
  locale: string;
  /** Watermarked "Sample" (admin previews and the learner's name preview). */
  sample?: boolean;
}

const NAVY = "#0D1B2A";
const NAVY2 = "#1B3A6B";
const ORANGE = "#F47C20";
const INK2 = "#3A4A5C";
const GOLD = "#B8860B";

type Font = { name: string; data: Buffer; weight: 400 | 700; style: "normal" | "italic" };
let fontsP: Promise<Font[]> | null = null;
let logoP: Promise<string> | null = null;

function fonts(): Promise<Font[]> {
  fontsP ??= (async () => {
    const dir = path.join(process.cwd(), "lib", "og", "fonts");
    const f = (n: string) => readFile(path.join(dir, n));
    const [sr, sb, lr, lb, li, lx, gv] = await Promise.all([
      f("InstrumentSans-Regular.ttf"),
      f("InstrumentSans-Bold.ttf"),
      f("lora-latin-400-normal.woff"),
      f("lora-latin-700-normal.woff"),
      f("lora-latin-400-italic.woff"),
      f("lora-latin-ext-700-normal.woff"),
      f("great-vibes-latin-400-normal.woff"),
    ]);
    return [
      { name: "Instrument Sans", data: sr, weight: 400, style: "normal" },
      { name: "Instrument Sans", data: sb, weight: 700, style: "normal" },
      { name: "Lora", data: lr, weight: 400, style: "normal" },
      { name: "Lora", data: lb, weight: 700, style: "normal" },
      { name: "Lora", data: li, weight: 400, style: "italic" },
      { name: "Lora", data: lx, weight: 700, style: "normal" },
      { name: "Great Vibes", data: gv, weight: 400, style: "normal" },
    ] as Font[];
  })().catch((e) => {
    fontsP = null;
    throw e;
  });
  return fontsP!;
}

function logo(): Promise<string> {
  logoP ??= readFile(path.join(process.cwd(), "lib", "og", "cert-logo.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`);
  return logoP;
}

/** basic / intermediate / expert, from the track's level. */
function levelNumber(level: string, levelEnd: string | null): 1 | 2 | 3 {
  const l = (levelEnd || level).toLowerCase();
  if (l === "advanced" || l === "expert") return 3;
  if (l === "intermediate") return 2;
  return 1;
}

export const signatory = () => ({
  name: process.env.CERT_SIGNATORY_NAME || "Tieyiwe Bass",
  title: process.env.CERT_SIGNATORY_TITLE || "Founder, TIBLOGICS",
});

function Corner({ color, pos }: { color: string; pos: "tl" | "tr" | "bl" | "br" }) {
  const s = 120, w = 10;
  const top = pos[0] === "t", left = pos[1] === "l";
  // Only the two borders this corner draws (Satori rejects undefined style values).
  const line = `${w}px solid ${color}`;
  return (
    <div
      style={{
        position: "absolute",
        width: s,
        height: s,
        display: "flex",
        ...(top ? { top: 46, borderTop: line } : { bottom: 46, borderBottom: line }),
        ...(left ? { left: 46, borderLeft: line } : { right: 46, borderRight: line }),
      }}
    />
  );
}

async function certificate(d: CertificateData) {
  const loc: Locale = isLocale(d.locale) ? (d.locale as Locale) : "en";
  const t = translatorFor(loc);
  const [logoUrl, qr] = await Promise.all([logo(), QRCode.toDataURL(d.verifyUrl, { margin: 0, width: 300, color: { dark: NAVY, light: "#00000000" } })]);
  const lvl = levelNumber(d.level, d.levelEnd);
  const levelName = t(`learn.certLevel.${lvl}.name`);
  const date = new Intl.DateTimeFormat(loc === "sw" ? "sw-KE" : loc, { day: "numeric", month: "long", year: "numeric" }).format(d.issuedAt);
  const sig = signatory();
  const nameSize = d.name.length > 34 ? 84 : d.name.length > 24 ? 100 : 118;
  const certSize = d.certificateName.length > 48 ? 52 : d.certificateName.length > 34 ? 60 : 68;
  const accent = /^#[0-9a-f]{6}$/i.test(d.accentColor) ? d.accentColor : ORANGE;
  // House style: no em or en dashes in printed copy.
  const tagline = d.tagline ? d.tagline.replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim() : null;

  return (
    <div style={{ width: CERT_SIZE.width, height: CERT_SIZE.height, display: "flex", position: "relative", background: "#FFFDF8", fontFamily: "Instrument Sans", color: NAVY }}>
      {/* Frame */}
      <div style={{ position: "absolute", left: 28, top: 28, width: CERT_SIZE.width - 56, height: CERT_SIZE.height - 56, display: "flex", border: `6px solid ${NAVY2}` }} />
      <div style={{ position: "absolute", left: 62, top: 62, width: CERT_SIZE.width - 124, height: CERT_SIZE.height - 124, display: "flex", border: `2px solid ${accent}`, opacity: 0.55 }} />
      <Corner color={accent} pos="tl" />
      <Corner color={accent} pos="tr" />
      <Corner color={accent} pos="bl" />
      <Corner color={accent} pos="br" />
      {/* Soft background marks */}
      <div style={{ position: "absolute", right: -260, top: -260, width: 760, height: 760, borderRadius: 9999, background: accent, opacity: 0.06, display: "flex" }} />
      <div style={{ position: "absolute", left: -220, bottom: -300, width: 700, height: 700, borderRadius: 9999, background: NAVY2, opacity: 0.05, display: "flex" }} />
      {d.sample ? (
        <div style={{ position: "absolute", left: 0, top: 640, width: CERT_SIZE.width, display: "flex", justifyContent: "center", fontSize: 200, fontWeight: 700, letterSpacing: 40, color: NAVY, opacity: 0.05 }}>
          SAMPLE
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "110px 150px 100px" }}>
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={430} height={124} alt="" style={{ objectFit: "contain", objectPosition: "left" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>
              <span style={{ color: NAVY2 }}>AR</span>
              <span style={{ color: ORANGE }}>FA</span>
            </div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 3, color: INK2, textTransform: "uppercase" }}>{t("learn.certdoc.academy")}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ display: "flex", marginTop: 54, fontSize: 30, fontWeight: 700, letterSpacing: 12, color: accent, textTransform: "uppercase" }}>{t("learn.certdoc.kicker")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 18 }}>
          <div style={{ display: "flex", padding: "8px 26px", borderRadius: 999, border: `2px solid ${NAVY2}`, fontSize: 24, fontWeight: 700, letterSpacing: 4, color: NAVY2, textTransform: "uppercase" }}>
            {t("learn.certdoc.level", { level: levelName })}
          </div>
          {d.distinction ? (
            <div style={{ display: "flex", padding: "8px 26px", borderRadius: 999, background: GOLD, fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "white", textTransform: "uppercase" }}>
              {t("learn.certdoc.distinction")}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", marginTop: 44, fontFamily: "Lora", fontStyle: "italic", fontSize: 36, color: INK2 }}>{t("learn.certdoc.certifies")}</div>
        <div style={{ display: "flex", marginTop: 10, fontFamily: "Lora", fontWeight: 700, fontSize: nameSize, lineHeight: 1.1, color: NAVY, textAlign: "center" }}>{d.name}</div>
        <div style={{ display: "flex", width: 900, height: 4, marginTop: 18, background: `linear-gradient(90deg, rgba(0,0,0,0), ${accent}, rgba(0,0,0,0))` }} />
        <div style={{ display: "flex", marginTop: 30, fontSize: 30, lineHeight: 1.4, color: INK2, textAlign: "center", maxWidth: 1640, justifyContent: "center" }}>{t("learn.certdoc.completed")}</div>
        <div style={{ display: "flex", marginTop: 18, fontFamily: "Lora", fontWeight: 700, fontSize: certSize, lineHeight: 1.15, color: accent, textAlign: "center", maxWidth: 1500 }}>{d.certificateName}</div>
        {tagline ? (
          <div style={{ display: "flex", marginTop: 16, fontSize: 28, lineHeight: 1.4, color: INK2, textAlign: "center", maxWidth: 1350 }}>{tagline}</div>
        ) : null}

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", marginTop: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 520 }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 3, color: INK2, textTransform: "uppercase" }}>{t("learn.certdoc.issued")}</div>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>{date}</div>
            {d.hours > 0 ? <div style={{ display: "flex", fontSize: 24, color: INK2 }}>{t("learn.certdoc.hours", { n: Math.round(d.hours) })}</div> : null}
            <div style={{ display: "flex", marginTop: 10, fontSize: 22, fontWeight: 700, letterSpacing: 3, color: INK2, textTransform: "uppercase" }}>{t("learn.certdoc.reference")}</div>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>{d.reference}</div>
          </div>

          {/* Seal */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 230, height: 230, borderRadius: 999, border: `8px solid ${accent}`, background: "white" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 186, height: 186, borderRadius: 999, border: `2px dashed ${accent}` }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
                <span style={{ color: NAVY2 }}>AR</span>
                <span style={{ color: ORANGE }}>FA</span>
              </div>
              <div style={{ display: "flex", fontSize: 17, fontWeight: 700, letterSpacing: 3, color: accent, textTransform: "uppercase" }}>{t("learn.certdoc.certified")}</div>
              <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: INK2 }}>{String(d.issuedAt.getUTCFullYear())}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 30, width: 640, justifyContent: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 400 }}>
              <div style={{ display: "flex", fontFamily: "Great Vibes", fontSize: sig.name.length > 18 ? 52 : 66, color: NAVY2, lineHeight: 1.1, whiteSpace: "nowrap" }}>{sig.name}</div>
              <div style={{ display: "flex", width: 380, height: 3, background: NAVY, marginTop: 6 }} />
              <div style={{ display: "flex", marginTop: 10, fontSize: 24, fontWeight: 700 }}>{sig.name}</div>
              <div style={{ display: "flex", fontSize: 22, color: INK2 }}>{sig.title}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} width={170} height={170} alt="" />
              <div style={{ display: "flex", fontSize: 18, color: INK2 }}>{t("learn.certdoc.scan")}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 20, color: INK2 }}>{t("learn.certdoc.verify", { url: d.verifyUrl.replace(/^https?:\/\//, "") })}</div>
      </div>
    </div>
  );
}

/** The certificate as a PNG. */
export async function certificatePng(d: CertificateData): Promise<Buffer> {
  const res = new ImageResponse(await certificate(d), { ...CERT_SIZE, fonts: await fonts() });
  return Buffer.from(await res.arrayBuffer());
}

/** The certificate as an A4 landscape PDF (the PNG on one page). */
export async function certificatePdf(d: CertificateData): Promise<Buffer> {
  const png = await certificatePng(d);
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${d.certificateName}: ${d.name}`);
  pdf.setAuthor("TIBLOGICS · ARFA AI Academy");
  pdf.setSubject(`Certificate ${d.reference}`);
  pdf.setCreator("tiblogics.com");
  const img = await pdf.embedPng(png);
  const W = 841.89, H = 595.28; // A4 landscape, points
  const page = pdf.addPage([W, H]);
  page.drawImage(img, { x: 0, y: 0, width: W, height: H });
  return Buffer.from(await pdf.save());
}
