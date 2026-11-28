import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og/brand-card";

// Custom cover for the AI Times article "SpaceX, Starlink and the first
// global carrier" (lib/blog/content/curated-october.ts). Drawn here: deep
// space, Earth's limb, the constellation's orbits and satellites beaming down
// to phones, the headline and the SpaceX · Starlink · Elon Musk tags.
//
// Elon Musk's portrait is added by the owner as a licensed photo:
//   public/ai-times/elon-musk.jpg          the photo (square crop works best)
//   public/ai-times/elon-musk.credit.txt   one line, e.g. "Photo: Name, CC BY-SA 4.0"
// Without the photo, a rocket illustration takes its place.

const W = 1600;
const H = 900;
const ORANGE = "#F47C20";

async function portrait(): Promise<{ src: string; credit: string } | null> {
  const dir = path.join(process.cwd(), "public", "ai-times");
  try {
    const [img, credit] = await Promise.all([
      readFile(path.join(dir, "elon-musk.jpg")),
      readFile(path.join(dir, "elon-musk.credit.txt"), "utf8").catch(() => ""),
    ]);
    return { src: `data:image/jpeg;base64,${img.toString("base64")}`, credit: credit.trim().slice(0, 120) };
  } catch {
    return null;
  }
}

/** Stars at fixed spots (the same picture every time). */
function stars(): Array<{ x: number; y: number; r: number; o: number }> {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 140 }, () => ({ x: rnd() * W, y: rnd() * H * 0.8, r: rnd() < 0.85 ? 1.2 : 2.2, o: 0.25 + rnd() * 0.6 }));
}

/** A satellite: body plus two solar panels. */
const sat = (x: number, y: number, k: string) => (
  <g key={k} transform={`translate(${x} ${y}) rotate(-20)`}>
    <rect x="-26" y="-6" width="18" height="12" rx="2" fill="#60A5FA" />
    <rect x="8" y="-6" width="18" height="12" rx="2" fill="#60A5FA" />
    <rect x="-7" y="-8" width="14" height="16" rx="3" fill="#E2E8F0" />
  </g>
);

/** A phone on the Earth's surface, with a signal glow. */
const phone = (x: number, y: number, k: string) => (
  <g key={k} transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" r="26" fill={ORANGE} opacity="0.22" />
    <rect x="-9" y="-15" width="18" height="30" rx="4" fill="#0B1B3A" stroke="#FFFFFF" strokeWidth="2.5" />
    <rect x="-4" y="-11" width="8" height="2" rx="1" fill="#FFFFFF" />
  </g>
);

/** The cover as an image response (1600x900 PNG). */
export async function starlinkGlobalCarrierCover(): Promise<ImageResponse> {
  const [fonts, face] = await Promise.all([ogFonts(), portrait()]);
  const st = stars();
  // Earth: a big circle low on the right; satellites ride two orbits above it.
  const sats: Array<[number, number]> = [[880, 300], [1060, 230], [1250, 205], [1440, 240], [960, 470], [1160, 410], [1370, 400]];
  const phones: Array<[number, number]> = [[1010, 735], [1225, 690], [1420, 715]];
  const beams: Array<[number, number, number, number]> = [[1060, 230, 1010, 735], [1250, 205, 1225, 690], [1440, 240, 1420, 715], [1160, 410, 1225, 690]];

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #03060F 0%, #071433 55%, #0B1B3A 100%)", fontFamily: "Instrument Sans" }}>
        {/* Sky, orbits, Earth, satellites, beams */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <radialGradient id="earth" cx="0.45" cy="0.3" r="0.75">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="45%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#0B1B3A" />
            </radialGradient>
            <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ORANGE} stopOpacity="0.9" />
              <stop offset="100%" stopColor={ORANGE} stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {st.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#FFFFFF" opacity={p.o} />
          ))}
          <circle cx="1200" cy="1480" r="900" fill="url(#glow)" />
          <circle cx="1200" cy="1480" r="820" fill="url(#earth)" />
          <ellipse cx="1180" cy="760" rx="560" ry="560" fill="none" stroke="#93C5FD" strokeOpacity="0.28" strokeWidth="2" strokeDasharray="6 10" />
          <ellipse cx="1180" cy="900" rx="520" ry="520" fill="none" stroke="#93C5FD" strokeOpacity="0.22" strokeWidth="2" strokeDasharray="4 12" />
          {beams.map(([x1, y1, x2, y2], i) => (
            <polygon key={i} points={`${x1 - 6},${y1} ${x1 + 6},${y1} ${x2 + 34},${y2} ${x2 - 34},${y2}`} fill="url(#beam)" opacity="0.55" />
          ))}
          {sats.map(([x, y], i) => sat(x, y, `s${i}`))}
          {phones.map(([x, y], i) => phone(x, y, `p${i}`))}
          {!face && (
            // Rocket climbing past the constellation (when no portrait is added)
            <g transform="translate(1370 70) rotate(28)">
              <path d="M0 -70 C 18 -40 20 10 16 60 L -16 60 C -20 10 -18 -40 0 -70 Z" fill="#F1F5F9" />
              <path d="M-16 40 L -34 72 L -16 66 Z" fill="#94A3B8" />
              <path d="M16 40 L 34 72 L 16 66 Z" fill="#94A3B8" />
              <circle cx="0" cy="-18" r="7" fill="#1D4ED8" />
              <path d="M-11 62 Q 0 120 11 62 Z" fill={ORANGE} />
            </g>
          )}
        </svg>

        {/* Elon Musk, when a licensed portrait has been added */}
        {face && (
          <div style={{ position: "absolute", right: 70, top: 56, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", width: 260, height: 260, borderRadius: 260, padding: 6, background: `linear-gradient(135deg, ${ORANGE}, #60A5FA)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={face.src} width={248} height={248} alt="" style={{ borderRadius: 248, objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", marginTop: 14, fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>Elon Musk</div>
            {face.credit ? <div style={{ display: "flex", marginTop: 4, fontSize: 15, color: "rgba(255,255,255,0.55)" }}>{face.credit}</div> : null}
          </div>
        )}

        {/* Words */}
        <div style={{ position: "absolute", left: 90, top: 215, display: "flex", flexDirection: "column", width: 800 }}>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: ORANGE }}>AI TIMES · TELECOM</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2, color: "#FFFFFF" }}>
            Your phone carrier should be worried
          </div>
          {/* Words as separate spans so the name can be in orange (Satori lays out flex rows). */}
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 22, fontSize: 32, lineHeight: 1.3, color: "rgba(255,255,255,0.85)" }}>
            {"Why |Tieyiwe Bassole| believes Starlink will become the world's first global carrier".split("|").map((part, i) =>
              part.split(" ").filter(Boolean).map((w, j) => (
                <span key={`${i}-${j}`} style={{ marginRight: 9, fontWeight: i === 1 ? 700 : 400, color: i === 1 ? ORANGE : "rgba(255,255,255,0.85)" }}>
                  {w}
                </span>
              )),
            )}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
            {["SpaceX", "Starlink", "Elon Musk"].map((t) => (
              <div key={t} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Byline */}
        <div style={{ position: "absolute", left: 90, bottom: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", width: 10, height: 44, borderRadius: 10, background: ORANGE }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>AI Times</div>
            <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.6)" }}>by TIBLOGICS</div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
