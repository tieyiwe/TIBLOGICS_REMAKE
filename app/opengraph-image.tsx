import { ImageResponse } from "next/og";
import { brandCard, ogFonts, OG_SIZE } from "@/lib/og/brand-card";

// Share preview for tiblogics.com. The design lives in lib/og/brand-card.tsx.
// Node runtime so the card can read the logo from /public.
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "TIBLOGICS: AI solutions, real business impact. AI implementation, Learning Box certificate tracks, free AI tools and Toolkit Live.";

export default async function Image() {
  return new ImageResponse(await brandCard(), { ...size, fonts: await ogFonts() });
}
