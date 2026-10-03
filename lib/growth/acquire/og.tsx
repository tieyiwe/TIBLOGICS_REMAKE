import { ImageResponse } from "next/og";
import { ogFonts, OG_SIZE } from "@/lib/og/brand-card";

// Share card for a lead magnet or landing page (next/og, Satori: inline
// styles only, display:flex on every element with more than one child).

const NAVY = "#0D1B2A";
const ORANGE = "#F47C20";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export async function acquireOgImage(opts: { kicker: string; title: string; subtitle?: string; badge?: string }) {
  const title = clip(opts.title || "TIBLOGICS", 90);
  const size = title.length > 60 ? 54 : title.length > 36 ? 64 : 76;
  return new ImageResponse(
    (
      <div
        style={{
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${NAVY} 0%, #132C52 55%, #1B3A6B 100%)`,
          padding: "64px 72px 56px 84px",
          position: "relative",
          fontFamily: "Instrument Sans, sans-serif",
        }}
      >
        <div style={{ position: "absolute", right: -140, top: -160, width: 560, height: 560, borderRadius: 9999, background: "#2251A3", opacity: 0.3, display: "flex" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 12, height: OG_SIZE.height, background: ORANGE, display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "white" }}>
            TIB<span style={{ color: ORANGE }}>LOGICS</span>
          </div>
          {opts.badge ? (
            <div style={{ display: "flex", padding: "10px 22px", borderRadius: 9999, background: ORANGE, color: "white", fontSize: 24, fontWeight: 700 }}>{clip(opts.badge, 24)}</div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 4, color: ORANGE }}>{clip(opts.kicker.toUpperCase(), 40)}</div>
          <div style={{ display: "flex", marginTop: 16, fontSize: size, fontWeight: 700, lineHeight: 1.06, color: "white", letterSpacing: -1 }}>{title}</div>
          {opts.subtitle ? (
            <div style={{ display: "flex", marginTop: 22, fontSize: 28, lineHeight: 1.35, color: "rgba(255,255,255,0.78)" }}>{clip(opts.subtitle, 140)}</div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.6)" }}>tiblogics.com</div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
