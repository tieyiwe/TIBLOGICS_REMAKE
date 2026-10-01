// The badge image: an ARFA-branded SVG (the TIBLOGICS AI Academy) (navy #1B3A6B, orange #F47C20).
// Pure string building, safe on server and client. Served by
// /badges/[id]/image and drawn inline on the learner's badge shelf.
import { BADGE_NAVY, BADGE_ORANGE, type BadgeGlyph } from "./catalog";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** White line-art glyphs drawn in a 100x100 box centred at (0,0). */
const GLYPHS: Record<BadgeGlyph, string> = {
  prompt:
    '<rect x="-40" y="-30" width="80" height="60" rx="8"/><path d="M-26 -10 L-12 0 L-26 10"/><path d="M-4 12 H22"/>',
  rag:
    '<path d="M-34 -36 H6 L20 -22 V36 H-34 Z"/><path d="M-24 -18 H4 M-24 -6 H8 M-24 6 H-4"/><circle cx="18" cy="18" r="13"/><path d="M27 27 L40 40"/>',
  governance:
    '<path d="M0 -38 V34 M-26 34 H26 M-36 -26 H36"/><path d="M-36 -26 L-46 4 H-26 Z M36 -26 L26 4 H46 Z"/><circle cx="0" cy="-38" r="4"/>',
  systems:
    '<circle cx="0" cy="-28" r="10"/><circle cx="-28" cy="20" r="10"/><circle cx="28" cy="20" r="10"/><path d="M-6 -19 L-22 11 M6 -19 L22 11 M-18 20 H18"/>',
  evaluation:
    '<rect x="-32" y="-38" width="64" height="76" rx="6"/><path d="M-20 -16 L-14 -10 L-4 -22 M4 -16 H22"/><path d="M-20 10 L-14 16 L-4 4 M4 10 H22"/>',
  security:
    '<path d="M0 -40 L32 -28 V0 C32 22 16 34 0 42 C-16 34 -32 22 -32 0 V-28 Z"/><rect x="-12" y="-4" width="24" height="20" rx="3"/><path d="M-7 -4 V-12 A7 7 0 0 1 7 -12 V-4"/>',
  automation:
    '<circle cx="0" cy="0" r="14"/><path d="M0 -38 V-26 M0 26 V38 M-38 0 H-26 M26 0 H38 M-27 -27 L-18 -18 M18 18 L27 27 M27 -27 L18 -18 M-18 18 L-27 27"/><circle cx="0" cy="0" r="26"/>',
  module:
    '<path d="M0 -40 L11 -14 L40 -12 L18 6 L25 34 L0 19 L-25 34 L-18 6 L-40 -12 L-11 -14 Z"/>',
  studio:
    '<path d="M-12 -38 H12 M-8 -38 V-10 L-32 30 C-34 36 -30 40 -24 40 H24 C30 40 34 36 32 30 L8 -10 V-38"/><path d="M-22 16 H22"/>',
  capstone:
    '<circle cx="0" cy="-8" r="22"/><path d="M-14 10 L-22 40 L0 30 L22 40 L14 10"/><path d="M0 -20 L4 -11 L13 -10 L6 -4 L8 5 L0 0 L-8 5 L-6 -4 L-13 -10 L-4 -11 Z"/>',
};

function wrap(text: string, max: number, lines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      out.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) out.push(cur);
  if (out.length > lines) {
    const kept = out.slice(0, lines);
    kept[lines - 1] = kept[lines - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  }
  return out;
}

export interface BadgeSvgInput {
  glyph: BadgeGlyph;
  /** Family label, e.g. "MODULE MASTERY". */
  kicker: string;
  name: string;
  /** Small line at the bottom, e.g. the year. */
  footer?: string;
  /** Unique per image when several are inlined on one page. */
  idSuffix?: string;
}

export function badgeSvg({ glyph, kicker, name, footer, idSuffix = "b" }: BadgeSvgInput): string {
  const g = `g${idSuffix.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const lines = wrap(name, 20, 3);
  const nameY = 300 - (lines.length - 1) * 13;
  // Pointy-top hexagon, radius 180, centred at (200, 200).
  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(200 + r * Math.cos(a)).toFixed(1)},${(200 + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${esc(name)}">
<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#244B87"/><stop offset="1" stop-color="${BADGE_NAVY}"/></linearGradient></defs>
<polygon points="${hex(190)}" fill="${BADGE_ORANGE}"/>
<polygon points="${hex(176)}" fill="url(#${g})"/>
<polygon points="${hex(164)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="2"/>
<text x="200" y="86" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#FFFFFF" letter-spacing="1">AR<tspan fill="${BADGE_ORANGE}">FA</tspan><tspan font-size="11" fill-opacity="0.85" letter-spacing="1.5"> · AI ACADEMY</tspan></text>
<g transform="translate(200 168) scale(1.05)" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[glyph]}</g>
<rect x="70" y="${nameY - 52}" width="260" height="24" rx="12" fill="${BADGE_ORANGE}"/>
<text x="200" y="${nameY - 35}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF" letter-spacing="1.5">${esc(kicker.toUpperCase())}</text>
${lines
  .map(
    (l, i) =>
      `<text x="200" y="${nameY + i * 26}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">${esc(l)}</text>`,
  )
  .join("\n")}
${footer ? `<text x="200" y="${Math.min(352, nameY + lines.length * 26 + 14)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#FFFFFF" fill-opacity="0.7">${esc(footer)}</text>` : ""}
</svg>`;
}
