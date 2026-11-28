import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { ogFonts } from "@/lib/og/brand-card";
import { CARD_FORMATS, slideCount, type CardSpec } from "./spec";

// Renders a CardSpec to PNG with next/og (Satori + Resvg), like the site's
// share card in lib/og/brand-card.tsx. Satori rules: every element with more
// than one child needs display:flex; inline styles only; no grid.

const NAVY = "#0D1B2A";
const NAVY_2 = "#1B3A6B";
const ORANGE = "#F47C20";
const ORANGE_DEEP = "#B8500A";

let logoCache: Promise<string | null> | null = null;
function logo(): Promise<string | null> {
  logoCache ??= readFile(path.join(process.cwd(), "public", "footer-logo-light.png"))
    .then((b) => `data:image/png;base64,${b.toString("base64")}`)
    .catch(() => null);
  return logoCache;
}

interface Palette {
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  chipBg: string;
  dark: boolean;
}

function palette(theme: CardSpec["theme"]): Palette {
  if (theme === "light") return { bg: "linear-gradient(160deg, #FFFFFF 0%, #F1F4F9 100%)", ink: NAVY, muted: "#3A4A5C", accent: ORANGE_DEEP, chipBg: "#FEF0E3", dark: false };
  if (theme === "orange") return { bg: `linear-gradient(150deg, ${ORANGE} 0%, ${ORANGE_DEEP} 100%)`, ink: "#FFFFFF", muted: "rgba(255,255,255,0.86)", accent: NAVY, chipBg: "rgba(13,27,42,0.18)", dark: true };
  return { bg: `linear-gradient(150deg, ${NAVY} 0%, #132C52 55%, ${NAVY_2} 100%)`, ink: "#FFFFFF", muted: "rgba(255,255,255,0.74)", accent: ORANGE, chipBg: "rgba(244,124,32,0.16)", dark: true };
}

/** Font size that shrinks as the text grows, within [min, max]. */
function fit(text: string, max: number, min: number, perChar: number): number {
  return Math.round(Math.max(min, Math.min(max, max - Math.max(0, text.length - 40) * perChar)));
}

function Brand({ p, scale, logoUrl }: { p: Palette; scale: number; logoUrl: string | null }) {
  if (p.dark && logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} width={Math.round(180 * scale)} height={Math.round(52 * scale)} alt="" style={{ objectFit: "contain", objectPosition: "left" }} />;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: 30 * scale, fontWeight: 700, color: p.ink, letterSpacing: 1 }}>
      TIBLOGICS
      <div style={{ display: "flex", width: 10 * scale, height: 10 * scale, borderRadius: 999, background: ORANGE, marginLeft: 6 * scale }} />
    </div>
  );
}

function Frame({ spec, p, children, footer, logoUrl }: { spec: CardSpec; p: Palette; children: ReactElement | ReactElement[]; footer?: ReactElement; logoUrl: string | null }) {
  const { width, height } = CARD_FORMATS[spec.format];
  const scale = Math.min(width, height) / 1080;
  const pad = Math.round((spec.format === "landscape" ? 64 : 84) * (width / 1080));
  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: p.bg, position: "relative", overflow: "hidden", fontFamily: "Instrument Sans, sans-serif", padding: pad }}>
      {p.dark ? (
        <div style={{ position: "absolute", right: -160 * scale, top: -180 * scale, width: 620 * scale, height: 620 * scale, borderRadius: 9999, background: spec.theme === "orange" ? "#FFFFFF" : "#2251A3", opacity: spec.theme === "orange" ? 0.1 : 0.3, display: "flex" }} />
      ) : (
        <div style={{ position: "absolute", right: -140 * scale, bottom: -160 * scale, width: 520 * scale, height: 520 * scale, borderRadius: 9999, background: ORANGE, opacity: 0.1, display: "flex" }} />
      )}
      <div style={{ position: "absolute", left: 0, top: 0, width: 14 * scale, height, background: spec.theme === "orange" ? NAVY : `linear-gradient(180deg, ${ORANGE}, ${ORANGE_DEEP})`, display: "flex" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Brand p={p} scale={scale} logoUrl={logoUrl} />
        {spec.kicker ? (
          <div style={{ display: "flex", fontSize: 22 * scale, fontWeight: 700, letterSpacing: 3, color: p.accent, background: p.chipBg, padding: `${8 * scale}px ${18 * scale}px`, borderRadius: 999, textTransform: "uppercase" }}>
            {spec.kicker}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>{children}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24 * scale, color: p.muted }}>
        {footer ?? <div style={{ display: "flex" }}>tiblogics.com</div>}
      </div>
    </div>
  );
}

function body(spec: CardSpec, slide: number, p: Palette, logoUrl: string | null): ReactElement {
  const { width, height } = CARD_FORMATS[spec.format];
  const scale = Math.min(width, height) / 1080;
  const wide = spec.format === "landscape";

  if (spec.template === "quote") {
    const size = fit(spec.headline, wide ? 58 : 76, wide ? 34 : 42, wide ? 0.32 : 0.36) * (wide ? 1 : scale);
    return (
      <Frame spec={spec} p={p} logoUrl={logoUrl}>
        <div style={{ display: "flex", fontSize: 180 * scale, lineHeight: 0.8, color: p.accent, fontWeight: 700, height: 110 * scale }}>“</div>
        <div style={{ display: "flex", fontSize: size, lineHeight: 1.18, fontWeight: 700, color: p.ink, letterSpacing: -0.5 }}>{spec.headline}</div>
        {spec.sub ? <div style={{ display: "flex", marginTop: 32 * scale, fontSize: 30 * scale, color: p.muted }}>{spec.sub}</div> : <div style={{ display: "flex" }} />}
      </Frame>
    );
  }

  if (spec.template === "stat") {
    return (
      <Frame spec={spec} p={p} logoUrl={logoUrl}>
        {spec.stat ? (
          <div style={{ display: "flex", fontSize: (wide ? 170 : 260) * scale, lineHeight: 1, fontWeight: 700, color: p.ink, letterSpacing: -6 }}>{spec.stat}</div>
        ) : (
          <div style={{ display: "flex" }} />
        )}
        <div style={{ display: "flex", width: 120 * scale, height: 10 * scale, background: spec.theme === "orange" ? NAVY : ORANGE, borderRadius: 99, margin: `${28 * scale}px 0` }} />
        <div style={{ display: "flex", fontSize: fit(spec.headline, 54, 34, 0.25) * scale, lineHeight: 1.2, fontWeight: 700, color: p.ink }}>{spec.headline}</div>
        {spec.sub ? <div style={{ display: "flex", marginTop: 20 * scale, fontSize: 28 * scale, color: p.muted }}>{spec.sub}</div> : <div style={{ display: "flex" }} />}
      </Frame>
    );
  }

  if (spec.template === "spotlight") {
    return (
      <Frame
        spec={spec}
        p={p}
        logoUrl={logoUrl}
        footer={
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex" }}>tiblogics.com</div>
            {spec.cta ? (
              <div style={{ display: "flex", background: ORANGE_DEEP, color: "white", fontWeight: 700, fontSize: 26 * scale, padding: `${14 * scale}px ${28 * scale}px`, borderRadius: 999 }}>{spec.cta}</div>
            ) : (
              <div style={{ display: "flex" }} />
            )}
          </div>
        }
      >
        <div style={{ display: "flex", fontSize: fit(spec.headline, wide ? 60 : 78, 40, 0.4) * (wide ? 1 : scale), lineHeight: 1.08, fontWeight: 700, color: p.ink, letterSpacing: -1 }}>{spec.headline}</div>
        {spec.sub ? <div style={{ display: "flex", marginTop: 22 * scale, fontSize: 32 * scale, lineHeight: 1.3, color: p.muted }}>{spec.sub}</div> : <div style={{ display: "flex" }} />}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34 * scale }}>
          {spec.bullets.slice(0, wide ? 2 : 4).map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginTop: 14 * scale, fontSize: 30 * scale, color: p.ink }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40 * scale, height: 40 * scale, borderRadius: 999, background: ORANGE, color: "white", marginRight: 18 * scale }}>
                <svg width={22 * scale} height={22 * scale} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ display: "flex", flex: 1 }}>{b}</div>
            </div>
          ))}
        </div>
      </Frame>
    );
  }

  // Carousel
  const total = slideCount(spec);
  const i = Math.max(0, Math.min(total - 1, slide));
  const sl = spec.slides[i] ?? { title: spec.headline, body: "" };
  const first = i === 0;
  const last = i === total - 1 && total > 1;
  return (
    <Frame
      spec={spec}
      p={p}
      logoUrl={logoUrl}
      footer={
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex" }}>{`${i + 1} / ${total}`}</div>
          <div style={{ display: "flex" }}>
            {Array.from({ length: total }).map((_, k) => (
              <div key={k} style={{ display: "flex", width: (k === i ? 34 : 12) * scale, height: 12 * scale, borderRadius: 99, marginLeft: 8 * scale, background: k === i ? ORANGE : p.dark ? "rgba(255,255,255,0.3)" : "#CBD5E3" }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", fontWeight: 700, color: p.accent }}>{last ? "tiblogics.com" : "Swipe"}
            {!last ? <svg width={30 * scale} height={30 * scale} viewBox="0 0 24 24" style={{ marginLeft: 8 * scale }}><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke={p.accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
          </div>
        </div>
      }
    >
      {!first ? <div style={{ display: "flex", fontSize: 120 * scale, fontWeight: 700, color: p.accent, opacity: 0.9, lineHeight: 1 }}>{String(i).padStart(2, "0")}</div> : <div style={{ display: "flex" }} />}
      <div style={{ display: "flex", marginTop: first ? 0 : 18 * scale, fontSize: fit(sl.title, first ? 86 : 64, 40, 0.5) * (wide ? 0.8 : scale), lineHeight: 1.1, fontWeight: 700, color: p.ink, letterSpacing: -1 }}>{sl.title}</div>
      {sl.body ? <div style={{ display: "flex", marginTop: 26 * scale, fontSize: fit(sl.body, 36, 26, 0.06) * scale, lineHeight: 1.4, color: p.muted }}>{sl.body}</div> : <div style={{ display: "flex" }} />}
      {last && spec.cta ? (
        <div style={{ display: "flex", marginTop: 36 * scale }}>
          <div style={{ display: "flex", background: ORANGE_DEEP, color: "white", fontWeight: 700, fontSize: 30 * scale, padding: `${16 * scale}px ${32 * scale}px`, borderRadius: 999 }}>{spec.cta}</div>
        </div>
      ) : (
        <div style={{ display: "flex" }} />
      )}
    </Frame>
  );
}

/** The PNG response for one slide of a card. */
export async function renderCard(spec: CardSpec, slide = 0, headers?: Record<string, string>): Promise<ImageResponse> {
  const { width, height } = CARD_FORMATS[spec.format];
  const [fonts, logoUrl] = await Promise.all([ogFonts(), logo()]);
  return new ImageResponse(body(spec, slide, palette(spec.theme), logoUrl), { width, height, fonts, headers });
}

/** The PNG bytes (for uploading to a platform). */
export async function renderCardPng(spec: CardSpec, slide = 0): Promise<ArrayBuffer> {
  return (await renderCard(spec, slide)).arrayBuffer();
}
