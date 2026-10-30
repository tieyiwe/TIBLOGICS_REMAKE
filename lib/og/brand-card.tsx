import { readFile } from "fs/promises";
import path from "path";

// The social share preview for tiblogics.com (link cards on LinkedIn,
// WhatsApp, X, Slack, iMessage...). One design, formerly the site card (app/opengraph-image, now replaced by the owner's design in public/main-domain-preview-og.png); kept for
// and app/twitter-image. Rendered by next/og (Satori): every element with
// more than one child needs display:flex, and only inline styles work.

export const OG_SIZE = { width: 1200, height: 630 };

const NAVY = "#0D1B2A";
const ORANGE = "#F47C20";
const MUTED = "rgba(255,255,255,0.72)";

async function logoDataUrl(): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "footer-logo-light.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const PILLARS: Array<{ title: string; body: string; color: string }> = [
  { title: "AI Implementation", body: "Agents, automation and integrations built for your business", color: "#F47C20" },
  { title: "AI Academy", body: "Certificate tracks with hands-on labs, powered by ARFA: AI Readiness For All", color: "#60A5FA" },
  { title: "Free AI tools", body: "Website readiness scan and AI product cost calculator", color: "#34D399" },
  { title: "Toolkit Live", body: "1,100+ expert prompts for 12 industries, with Compliance Guard", color: "#F472B6" },
];

/** Instrument Sans (SIL Open Font License, see fonts/InstrumentSans-OFL.txt). */
export async function ogFonts() {
  const dir = path.join(process.cwd(), "lib", "og", "fonts");
  try {
    const [regular, bold] = await Promise.all([
      readFile(path.join(dir, "InstrumentSans-Regular.ttf")),
      readFile(path.join(dir, "InstrumentSans-Bold.ttf")),
    ]);
    return [
      { name: "Instrument Sans", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Instrument Sans", data: bold, weight: 700 as const, style: "normal" as const },
    ];
  } catch {
    return undefined; // falls back to the built-in font
  }
}

export async function brandCard() {
  const logo = await logoDataUrl();
  return (
    <div
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${NAVY} 0%, #132C52 55%, #1B3A6B 100%)`,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Instrument Sans, sans-serif",
      }}
    >
      {/* Decoration */}
      <div style={{ position: "absolute", right: -120, top: -140, width: 520, height: 520, borderRadius: 9999, background: "#2251A3", opacity: 0.28, display: "flex" }} />
      <div style={{ position: "absolute", left: -90, bottom: -150, width: 360, height: 360, borderRadius: 9999, background: ORANGE, opacity: 0.12, display: "flex" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 10, height: OG_SIZE.height, background: `linear-gradient(180deg, ${ORANGE}, #B8500A)`, display: "flex" }} />

      <div style={{ display: "flex", flex: 1, padding: "52px 64px 0 72px" }}>
        {/* Left: brand and promise */}
        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={260} height={75} alt="" style={{ objectFit: "contain", objectPosition: "left" }} />
          ) : (
            <div style={{ fontSize: 48, fontWeight: 700, color: "white", display: "flex" }}>TIBLOGICS</div>
          )}
          <div style={{ marginTop: 30, fontSize: 18, fontWeight: 700, letterSpacing: 4, color: ORANGE, display: "flex" }}>
            AI-FIRST. TECH-COMPLETE.
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", fontSize: 62, fontWeight: 700, lineHeight: 1.05, color: "white", letterSpacing: -1.5 }}>
            <span>AI solutions.</span>
            <span style={{ color: ORANGE }}>Real business impact.</span>
          </div>
          <div style={{ marginTop: 22, fontSize: 24, lineHeight: 1.45, color: MUTED, display: "flex" }}>
            We build AI agents, automation and digital products, and train people to use AI well.
          </div>
          <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
            {["English · Français · Kiswahili", "North America & Africa"].map((c) => (
              <div key={c} style={{ display: "flex", fontSize: 18, fontWeight: 600, color: "white", border: "1.5px solid rgba(255,255,255,0.28)", borderRadius: 9999, padding: "8px 18px", background: "rgba(255,255,255,0.06)" }}>
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Right: what's on the platform */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginLeft: 44, width: 420, marginTop: 6 }}>
          {PILLARS.map((p) => (
            <div
              key={p.title}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "16px 20px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderLeft: `6px solid ${p.color}`,
              }}
            >
              <div style={{ display: "flex", fontSize: 23, fontWeight: 700, color: "white" }}>{p.title}</div>
              <div style={{ display: "flex", marginTop: 4, fontSize: 17, lineHeight: 1.35, color: MUTED }}>{p.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 64px 0 72px", height: 78, borderTop: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, background: "#22C55E", border: `3px solid ${ORANGE}`, display: "flex" }} />
          <span style={{ fontSize: 24, fontWeight: 700, color: "white" }}>tiblogics.com</span>
        </div>
        <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: NAVY, background: ORANGE, borderRadius: 9999, padding: "10px 24px" }}>
          Book a free consultation
        </div>
      </div>
    </div>
  );
}
