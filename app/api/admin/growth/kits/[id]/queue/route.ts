import { NextRequest, NextResponse } from "next/server";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { KitError, queueKitPosts } from "@/lib/growth/content/kit";
import { LinkError } from "@/lib/growth/links";

/** Adds the kit's posts to the queue as drafts on its 2-week calendar. Idempotent. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  const b = await jsonBody(req);
  try {
    const r = await queueKitPosts(id, typeof b?.start === "string" ? b.start : undefined);
    return NextResponse.json(r);
  } catch (err) {
    if (err instanceof KitError || err instanceof LinkError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[growth/kits/queue]", err);
    return NextResponse.json({ error: "Could not queue the posts." }, { status: 500 });
  }
}
