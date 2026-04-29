import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          background: "linear-gradient(135deg, #0D1B2A 0%, #1B3A6B 100%)",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: 630, background: "linear-gradient(180deg, #F47C20, #e05500)", display: "flex" }} />
        <div style={{ position: "absolute", right: -60, top: -80, width: 440, height: 440, borderRadius: "50%", background: "#2251A3", opacity: 0.25, display: "flex" }} />
        <div style={{ position: "absolute", right: 80, bottom: -80, width: 300, height: 300, borderRadius: "50%", background: "#F47C20", opacity: 0.1, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", padding: "60px 80px", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#F47C20", letterSpacing: 5, textTransform: "uppercase", marginBottom: 28, display: "flex" }}>
            AI Implementation &amp; Digital Solutions
          </div>
          <div style={{ fontSize: 108, fontWeight: 800, color: "white", letterSpacing: -2, lineHeight: 1, display: "flex" }}>
            TIBLOGICS
          </div>
          <div style={{ width: 120, height: 5, background: "linear-gradient(90deg, #F47C20, #e05500)", borderRadius: 3, marginTop: 24, marginBottom: 32, display: "flex" }} />
          <div style={{ fontSize: 26, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, maxWidth: 720, display: "flex", flexDirection: "column" }}>
            <span>We build AI agents, automation, and digital products</span>
            <span>for businesses that are ready to lead.</span>
          </div>
          <div style={{ marginTop: 52, display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #F47C20", borderRadius: 24, padding: "10px 24px", width: "fit-content" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F47C20", display: "flex" }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: "#F47C20" }}>tiblogics.com</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
