import { NextRequest, NextResponse } from "next/server";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { draftTrendPost, TrendError } from "@/lib/growth/trends";
import { isPlatform } from "@/lib/growth/content/platforms";
import { LinkError } from "@/lib/growth/links";

/** "Draft it": the idea becomes a draft post (approval still required). */
export async function POST(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const b = await jsonBody(req);
  const blogId = typeof b?.blogId === "string" ? b.blogId.slice(0, 60) : "";
  if (!blogId || !isPlatform(b?.platform)) return NextResponse.json({ error: "Choose an idea and a platform." }, { status: 400 });
  try {
    const r = await draftTrendPost(blogId, b.platform);
    return NextResponse.json(r, { status: r.created ? 201 : 200 });
  } catch (err) {
    if (err instanceof TrendError || err instanceof LinkError) return NextResponse.json({ error: err.message }, { status: 422 });
    throw err;
  }
}
