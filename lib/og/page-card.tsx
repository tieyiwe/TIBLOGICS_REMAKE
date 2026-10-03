import { readFile } from "fs/promises";
import path from "path";
import { OG_SIZE } from "./brand-card";
import type { CardBrand } from "@/lib/seo/og-card";

// One page's share preview (app/og/card): its section, title and short
// description on the brand background. TIBLOGICS pages: navy with the
// TIBLOGICS logo; ARFA (academy) pages: the ARFA wordmark. Satori: every
// element with more than one child needs display:flex; inline styles only.

const NAVY = "#0D1B2A";
const ORANGE = "#F47C20";

let logoP: Promise<string | null> | null = null;
function logo(): Promise<string | null> {
  logoP ??= readFile(path.join(process.cwd(), "public", "footer-logo-light.png"))
    .then((b) => `data:image/png;base64,${b.toString("base64")}`)
    .catch(() => null);
  return logoP;
}

const sizeFor = (s: string) => (s.length <= 34 ? 74 : s.length <= 60 ? 62 : s.length <= 90 ? 52 : 44);

export async function pageCard(c: { title: string; description?: string; kicker?: string; brand: CardBrand }) {
  const l = c.brand === "tib" ? await logo() : null;
  const arfa = c.brand === "arfa";
  return (
    <div
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        background: arfa ? `linear-gradient(135deg, #0B1F3F 0%, #13306A 60%, #1B3A6B 100%)` : `linear-gradient(135deg, ${NAVY} 0%, #132C52 55%, #1B3A6B 100%)`,
        fontFamily: "Instrument Sans, sans-serif",
        color: "white",
      }}
    >
      <div style={{ position: "absolute", right: -140, top: -160, width: 560, height: 560, borderRadius: 9999, background: arfa ? ORANGE : "#2251A3", opacity: arfa ? 0.16 : 0.28, display: "flex" }} />
      <div style={{ position: "absolute", left: -100, bottom: -170, width: 380, height: 380, borderRadius: 9999, background: arfa ? "#60A5FA" : ORANGE, opacity: 0.12, display: "flex" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 12, height: OG_SIZE.height, background: `linear-gradient(180deg, ${ORANGE}, #B8500A)`, display: "flex" }} />

      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", padding: "48px 72px 0 76px", height: 120 }}>
        {arfa ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>
              <span>AR</span>
              <span style={{ color: ORANGE }}>FA</span>
            </div>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>AI Readiness For All</div>
          </div>
        ) : l ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l} width={250} height={72} alt="" style={{ objectFit: "contain", objectPosition: "left" }} />
        ) : (
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>TIBLOGICS</div>
        )}
      </div>

      {/* Page */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 90px 0 76px" }}>
        {c.kicker ? (
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: ORANGE, textTransform: "uppercase" }}>{c.kicker}</div>
        ) : null}
        <div style={{ display: "flex", marginTop: 16, fontSize: sizeFor(c.title), fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 1040 }}>{c.title}</div>
        {c.description ? (
          <div style={{ display: "flex", marginTop: 22, fontSize: 27, lineHeight: 1.4, color: "rgba(255,255,255,0.74)", maxWidth: 1000 }}>
            {c.description.length > 150 ? `${c.description.slice(0, 147).replace(/\s+\S*$/, "")}…` : c.description}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 76, padding: "0 72px 0 76px", borderTop: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700 }}>{arfa ? "tiblogics.com/learning-box" : "tiblogics.com"}</div>
        <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: arfa ? "white" : NAVY, background: ORANGE, borderRadius: 9999, padding: "9px 22px" }}>
          {arfa ? "ARFA · a TIBLOGICS academy" : "AI-first. Tech-complete."}
        </div>
      </div>
    </div>
  );
}
