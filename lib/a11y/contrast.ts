// WCAG contrast helpers. Track accent colours are chosen for their look
// (#22A387, #F9A738, ...) and many are too light for text on white or for
// white text on top of them. readableOn() keeps the hue and darkens it just
// enough to reach the AA ratio, so a track keeps its colour identity.

function channels(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: string, b: string): number {
  const x = channels(a);
  const y = channels(b);
  if (!x || !y) return 21;
  const [l1, l2] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
}

const hex = (c: [number, number, number]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/**
 * The colour, darkened toward black in small steps until it reaches `min`
 * contrast against `bg` (default: white, 4.5:1 for normal text). Use it for
 * accent-coloured text on white and for accent backgrounds under white text.
 * Unparseable values are returned unchanged.
 */
export function readableOn(color: string, bg = "#FFFFFF", min = 4.5): string {
  const c = channels(color);
  if (!c) return color;
  if (contrastRatio(color, bg) >= min) return color;
  for (let k = 0.95; k > 0.2; k -= 0.05) {
    const d = hex([c[0] * k, c[1] * k, c[2] * k]);
    if (contrastRatio(d, bg) >= min) return d;
  }
  return "#0D1B2A";
}
