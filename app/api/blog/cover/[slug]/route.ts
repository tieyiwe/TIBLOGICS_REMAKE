import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// A generated cover for articles past the end of the photo pool.
//
// The pool holds 87 images and the library passed 98 articles, so covers had
// started doubling up — and the pool cannot grow safely without checking that
// each new photo ID actually resolves. These are drawn instead: unique per
// article, always available, and on-brand rather than generic stock.
//
// SVG so it costs nothing to render and scales to any card size.

export const revalidate = 86400;

const BRAND = {
  ink: "#0D1B2A",
  navy: "#1B3A6B",
  orange: "#F47C20",
  amber: "#F9A738",
  teal: "#0F6E56",
};

/** Same hash as the photo picker, so a slug's look is stable forever. */
function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const PALETTES: Array<[string, string]> = [
  [BRAND.orange, BRAND.amber],
  [BRAND.navy, "#2251A3"],
  [BRAND.teal, "#22A387"],
  ["#7c3aed", "#a855f7"],
  ["#D85A30", BRAND.orange],
  ["#0E7490", "#22A387"],
];

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

/** Greedy wrap on word boundaries — SVG has no text flow of its own. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (!line.length) line = w;
    else if (line.length + 1 + w.length <= maxChars) line += ` ${w}`;
    else {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[,.;:]?$/, "…");
  }
  return lines;
}

/** Title Case from a slug, for the case where the post is not in the database. */
function titleFromSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 120);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let title = titleFromSlug(slug);
  let category = "TECHNOLOGY";
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { title: true, category: true },
    });
    if (post) {
      title = post.title;
      category = post.category.replace(/-/g, " ").toUpperCase();
    }
  } catch {
    // Database unreachable — the slug-derived title still produces a cover.
  }

  const h = hashSlug(slug);
  const [c1, c2] = PALETTES[h % PALETTES.length];
  const lines = wrap(title, 26, 4);
  const fontSize = lines.length > 3 ? 54 : 62;

  // Scattered nodes echoing the TIBLOGICS mark, placed from the hash so every
  // article's pattern differs but never moves between renders.
  const nodes = Array.from({ length: 7 }, (_, i) => {
    const a = hashSlug(`${slug}:${i}`);
    return {
      x: 760 + (a % 380),
      y: 90 + ((a >> 7) % 450),
      r: 4 + ((a >> 15) % 12),
      o: 0.25 + ((a >> 19) % 40) / 100,
    };
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND.ink}"/>
      <stop offset="100%" stop-color="#132538"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="30%" r="55%">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  ${nodes
    .map(
      (n) =>
        `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="url(#accent)" opacity="${n.o.toFixed(2)}"/>`,
    )
    .join("\n  ")}
  <path d="M${nodes[0].x} ${nodes[0].y} L${nodes[1].x} ${nodes[1].y} L${nodes[3].x} ${nodes[3].y} L${nodes[5].x} ${nodes[5].y}"
        stroke="url(#accent)" stroke-width="2" fill="none" opacity="0.3"/>

  <rect x="72" y="86" width="64" height="5" rx="2.5" fill="url(#accent)"/>
  <text x="72" y="128" font-family="'Helvetica Neue',Helvetica,Arial,sans-serif" font-size="21"
        font-weight="700" letter-spacing="3.4" fill="${c2}">${escapeXml(category)}</text>

  ${lines
    .map(
      (l, i) =>
        `<text x="72" y="${212 + i * (fontSize + 14)}" font-family="Georgia,'Times New Roman',serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">${escapeXml(l)}</text>`,
    )
    .join("\n  ")}

  <text x="72" y="566" font-family="'Helvetica Neue',Helvetica,Arial,sans-serif" font-size="23"
        letter-spacing="2" fill="#FFFFFF"><tspan font-weight="700" opacity="0.92">TIBLOGICS</tspan><tspan
        fill="${c2}" opacity="0.6">  ·  </tspan><tspan fill="${c2}" font-weight="400">AI TIMES</tspan></text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
