import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { ogFonts, OG_SIZE } from "@/lib/og/brand-card";
import { pageCard } from "@/lib/og/page-card";
import { cardImage, verifyCard, type CardBrand } from "@/lib/seo/og-card";

// GET /og/card?t=&d=&k=&b=&c=&n=&nl=&p=&v=&s= : one page's share preview (lib/seo/og-card.ts).
// Signed: an unsigned or altered card is refused, so the route only ever
// draws text this site put in its own pages' metadata. Cached for a day.

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const title = (q.get("t") ?? "").slice(0, 140);
  const description = (q.get("d") ?? "").slice(0, 220) || undefined;
  const kicker = (q.get("k") ?? "").slice(0, 40) || undefined;
  const brand: CardBrand = q.get("b") === "arfa" ? "arfa" : "tib";
  const cta = (q.get("c") ?? "").slice(0, 40) || undefined;
  const stat = (q.get("n") ?? "").slice(0, 12) || undefined;
  const statLabel = (q.get("nl") ?? "").slice(0, 30) || undefined;
  const chips = (q.get("p") ?? "").split("|").filter(Boolean).slice(0, 3);
  const image = cardImage(q.get("i") ?? undefined);
  const card = { title, description, kicker, brand, cta, stat, statLabel, chips, image };
  if (!title || !verifyCard(card, q.get("s"))) {
    return new Response("Not found", { status: 404 });
  }
  const res = new ImageResponse(await pageCard(card), { ...OG_SIZE, fonts: await ogFonts() });
  res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800");
  return res;
}
