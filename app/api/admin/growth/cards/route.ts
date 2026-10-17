import { NextRequest, NextResponse } from "next/server";
import { requireGrowthAdmin } from "@/lib/growth/content-auth";
import { normalizeCard, slideCount } from "@/lib/growth/cards/spec";
import { renderCard } from "@/lib/growth/cards/render";

// Live preview of an image card from a spec in the query string (the kit
// editor and the post drawer). Admin only. ?download=1 saves it as a file.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const q = req.nextUrl.searchParams;
  const raw = q.get("spec") ?? "";
  if (raw.length > 8000) return NextResponse.json({ error: "Spec too large" }, { status: 400 });
  let spec = null;
  try {
    spec = normalizeCard(JSON.parse(raw));
  } catch { /* invalid */ }
  if (!spec) return NextResponse.json({ error: "Invalid card spec" }, { status: 400 });
  const slide = Math.max(0, Math.min(slideCount(spec) - 1, Number(q.get("slide")) || 0));
  try {
    return await renderCard(spec, slide, {
      "Cache-Control": "private, max-age=300",
      ...(q.get("download") ? { "Content-Disposition": `attachment; filename="tiblogics-${spec.template}-${slide + 1}.png"` } : {}),
    });
  } catch (err) {
    console.error("[growth/cards] render", err);
    return NextResponse.json({ error: "Could not render the card" }, { status: 500 });
  }
}
