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

const sizeFor = (s: string, narrow: boolean) => {
  const n = s.length + (narrow ? 14 : 0);
  return n <= 34 ? 76 : n <= 56 ? 64 : n <= 84 ? 54 : 46;
};

export interface PageCardInput {
  title: string;
  description?: string;
  kicker?: string;
  brand: CardBrand;
  /** Ad-style extras (lib/seo/promo.ts). */
  cta?: string;
  stat?: string;
  statLabel?: string;
  chips?: string[];
  /** Site-relative PNG/JPEG under /public (checked by lib/seo/og-card.ts cardImage). */
  image?: string;
}

/** A picture from /public as a data URL, or null (missing, outside /public, too big). */
async function publicImage(src: string | undefined): Promise<string | null> {
  if (!src) return null;
  const root = path.join(process.cwd(), "public");
  const file = path.normalize(path.join(root, src));
  if (!file.startsWith(root + path.sep)) return null;
  try {
    const b = await readFile(file);
    if (b.length > 4_000_000) return null;
    return `data:image/${/\.png$/i.test(file) ? "png" : "jpeg"};base64,${b.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * The share preview, built to earn the click: a hook headline, one line of
 * benefit, up to three selling points, an optional big number (a score, a
 * price, a count) and the call to action as a button.
 */
export async function pageCard(c: PageCardInput) {
  const l = c.brand === "tib" ? await logo() : null;
  const arfa = c.brand === "arfa";
  const pic = await publicImage(c.image);
  const hasStat = !!c.stat || !!pic;
  const chips = (c.chips ?? []).slice(0, 3);
  const desc = c.description ? (c.description.length > 130 ? `${c.description.slice(0, 127).replace(/\s+\S*$/, "")}…` : c.description) : null;
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

      {/* Brand and section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 64px 0 76px", height: 104 }}>
        {arfa ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div style={{ display: "flex", fontSize: 50, fontWeight: 700, letterSpacing: -1 }}>
              <span>AR</span>
              <span style={{ color: ORANGE }}>FA</span>
            </div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>AI Academy</div>
          </div>
        ) : l ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l} width={220} height={64} alt="" style={{ objectFit: "contain", objectPosition: "left" }} />
        ) : (
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>TIBLOGICS</div>
        )}
        {c.kicker ? (
          <div style={{ display: "flex", fontSize: 20, fontWeight: 700, letterSpacing: 3, color: ORANGE, textTransform: "uppercase", border: `2px solid ${ORANGE}`, borderRadius: 9999, padding: "8px 18px" }}>
            {c.kicker}
          </div>
        ) : null}
      </div>

      {/* Hook, benefit, selling points | the big number */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "0 64px 0 76px", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: sizeFor(c.title, hasStat), fontWeight: 700, lineHeight: 1.06, letterSpacing: -1.5 }}>{c.title}</div>
          {desc ? <div style={{ display: "flex", marginTop: 18, fontSize: 27, lineHeight: 1.35, color: "rgba(255,255,255,0.78)" }}>{desc}</div> : null}
          {chips.length ? (
            <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
              {chips.map((x) => (
                <div key={x} style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", fontSize: 22, fontWeight: 700, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 9999, padding: "8px 18px" }}>
                  <div style={{ display: "flex", width: 10, height: 10, borderRadius: 9999, background: ORANGE }} />
                  {x}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {pic ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pic} width={236} height={305} alt="" style={{ objectFit: "cover", borderRadius: 14, boxShadow: "0 30px 60px rgba(0,0,0,0.45)", transform: "rotate(-3deg)" }} />
            {c.stat ? <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: NAVY, background: "white", borderRadius: 14, padding: "6px 22px" }}>{c.stat}</div> : null}
          </div>
        ) : hasStat ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 290, height: 290, borderRadius: 36, background: "white", color: NAVY, boxShadow: "0 30px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", fontSize: (c.stat ?? "").length > 5 ? 74 : 104, fontWeight: 700, color: ORANGE, letterSpacing: -3, lineHeight: 1 }}>{c.stat}</div>
            {c.statLabel ? <div style={{ display: "flex", marginTop: 12, fontSize: 24, fontWeight: 700, color: "#3A4A5C", textAlign: "center", padding: "0 18px" }}>{c.statLabel}</div> : null}
          </div>
        ) : null}
      </div>

      {/* The call to action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 104, padding: "0 64px 30px 76px" }}>
        {c.cta ? (
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: NAVY, background: ORANGE, borderRadius: 18, padding: "16px 34px", boxShadow: "0 12px 30px rgba(244,124,32,0.45)" }}>{c.cta}</div>
        ) : (
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: arfa ? "white" : NAVY, background: ORANGE, borderRadius: 9999, padding: "9px 22px" }}>
            {arfa ? "ARFA · a TIBLOGICS academy" : "AI-first. Tech-complete."}
          </div>
        )}
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{arfa ? "tiblogics.com/learning-box" : "tiblogics.com"}</div>
      </div>
    </div>
  );
}
