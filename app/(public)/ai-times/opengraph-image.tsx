import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AI TIMES by TIBLOGICS — Real Insights. Less Than 5 Min Reads.";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          background: "#ffffff",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Orange glow background */}
        <div style={{ position: "absolute", right: -40, top: -40, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,124,32,0.18) 0%, transparent 70%)", display: "flex" }} />

        {/* Left content area */}
        <div style={{ display: "flex", flexDirection: "column", padding: "60px 80px", position: "relative", zIndex: 1, flex: 1 }}>

          {/* TIBLOGICS badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <div style={{ width: 32, height: 32, background: "#F47C20", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: 18, fontWeight: 800 }}>T</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#1B3A6B", letterSpacing: 2 }}>TIBLOGICS</span>
          </div>

          {/* AI TIMES heading */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 0, marginBottom: 12 }}>
            <span style={{ fontSize: 110, fontWeight: 900, color: "#1B3A6B", lineHeight: 1 }}>AI </span>
            <span style={{ fontSize: 110, fontWeight: 900, color: "#F47C20", lineHeight: 1 }}>TIMES</span>
          </div>

          {/* Orange underline */}
          <div style={{ width: 110, height: 5, background: "#F47C20", borderRadius: 3, marginBottom: 28, display: "flex" }} />

          {/* Tagline */}
          <div style={{ fontSize: 30, fontWeight: 700, color: "#1B3A6B", marginBottom: 14, display: "flex" }}>
            Real insights. Less than 5 min reads.
          </div>
          <div style={{ fontSize: 20, color: "#64748B", lineHeight: 1.5, maxWidth: 500, display: "flex", flexDirection: "column" }}>
            <span>Stay up to date with the most relevant AI tech</span>
            <span>info without wasting time or getting lost.</span>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
            {["⏱ Less than 5 min reads", "✦ Real & relevant", "✔ No fluff"].map((label) => (
              <div key={label} style={{ fontSize: 15, color: "#1B3A6B", background: "#F1F5F9", padding: "8px 16px", borderRadius: 100, display: "flex", fontWeight: 500 }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right clock graphic */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 320, paddingRight: 60 }}>
          <div style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "12px solid #1B3A6B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: "white",
          }}>
            {/* Clock face orange arc */}
            <div style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              border: "12px solid #F47C20",
              borderTopColor: "transparent",
              borderRightColor: "transparent",
              display: "flex",
              transform: "rotate(-45deg)",
            }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: "#F47C20", lineHeight: 1 }}>&lt;5</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1B3A6B", letterSpacing: 2 }}>MIN READS</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
