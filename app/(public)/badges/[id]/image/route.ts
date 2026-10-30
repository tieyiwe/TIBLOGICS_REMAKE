import { NextRequest } from "next/server";
import { loadVerifiedBadge } from "@/lib/learn/skill-badges/engine";
import { FAMILY_LABEL_EN, glyphFor } from "@/lib/learn/skill-badges/catalog";
import { badgeSvg } from "@/lib/learn/skill-badges/svg";

// The badge image (SVG), referenced from the credential's achievement.image.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await loadVerifiedBadge(id);
  if (!b || !b.award.isPublic) return new Response("Not found", { status: 404 });
  const svg = badgeSvg({
    glyph: glyphFor(b.award.badgeKey),
    kicker: FAMILY_LABEL_EN[b.award.family],
    name: b.award.name,
    footer: String(b.award.issuedAt.getUTCFullYear()),
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
