import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og/brand-card";
import { H, ORANGE, W, accent, byline, words } from "./october-feature";

// Covers for the founder's own articles (lib/blog/content/founder-articles.ts):
// the AI Times drawn style with his portrait, cut from his cover photo
// (public/tb_cover.png: the middle panel, without the side texts). Rendered
// once to public/covers/*.png; kept here to redraw.

/** tb_cover.png is 1200x500; the portrait panel is roughly x 453-797. */
async function founderPhoto(): Promise<string | null> {
  try {
    const img = await readFile(path.join(process.cwd(), "public", "tb_cover.png"));
    return `data:image/png;base64,${img.toString("base64")}`;
  } catch {
    return null;
  }
}

// ── Data center cleaning: the founder beside a server rack being cleaned ────
export async function datacenterCleaningCover() {
  const [fonts, photo] = await Promise.all([ogFonts(), founderPhoto()]);
  // Photo panel on the right: the photo scaled to the panel's height (900 / 500
  // = 1.8), shifted so the portrait (centre x 625 in the original) sits in the
  // middle of the 620-pixel panel.
  const panelX = 960;
  const panelW = 640;
  const scale = H / 500;
  const imgLeft = -(625 * scale - panelW / 2);
  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #052E26 0%, #085041 55%, #0F6E56 100%)", fontFamily: "Instrument Sans" }}>
        {/* faint server rows behind the words */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 6 }, (_, c) => (
            <g key={c} opacity="0.07">
              <rect x={60 + c * 150} y="80" width="120" height="740" rx="10" fill="#FFFFFF" />
            </g>
          ))}
        </svg>
        {photo && (
          <div style={{ position: "absolute", left: panelX, top: 0, width: panelW, height: H, display: "flex", overflow: "hidden" }}>
            <img src={photo} width={1200 * scale} height={H} alt="" style={{ position: "absolute", left: imgLeft, top: 0 }} />
          </div>
        )}
        {/* a server rack with a cleaning sparkle, overlapping the photo's edge */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform="translate(905 470)">
            <rect x="-70" y="0" width="140" height="330" rx="14" fill="#0D1B2A" stroke="#7FDDBB" strokeWidth="4" />
            {Array.from({ length: 7 }, (_, i) => (
              <g key={i}>
                <rect x="-52" y={18 + i * 44} width="104" height="30" rx="5" fill="#16263A" />
                <circle cx="-36" cy={33 + i * 44} r="4" fill={i % 3 === 0 ? ORANGE : "#4ADE80"} />
                <rect x="-20" y={30 + i * 44} width="58" height="6" rx="3" fill="#2B3F57" />
              </g>
            ))}
          </g>
          {[[870, 430, 30], [960, 470, 18], [845, 500, 14]].map(([x, y, s], i) => (
            <path key={i} d={`M${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`} fill="#FFFFFF" opacity={0.95 - i * 0.2} />
          ))}
        </svg>
        {words("AI TIMES · FOUNDER'S TAKE", "The people cleaning the AI machines", accent("A quiet |gold rush| in the physical side of AI"), ["Data centers", "DMV", "Opportunity"], { width: 760, size: 78 })}
        {byline("Tieyiwe Bass", "Founder, TIBLOGICS")}
      </div>
    ),
    { width: W, height: H, fonts, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}

export const FOUNDER_COVERS = {
  "datacenter-cleaning": datacenterCleaningCover,
};
