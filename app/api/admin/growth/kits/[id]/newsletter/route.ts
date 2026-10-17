import { NextRequest, NextResponse } from "next/server";
import { requireGrowthAdmin } from "@/lib/growth/content-auth";
import { KitError, kitToNewsletter } from "@/lib/growth/content/kit";
import { LinkError } from "@/lib/growth/links";

/** Creates the kit's launch emails as DRAFT newsletter campaigns (sent from /admin_pro/newsletter). */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    return NextResponse.json(await kitToNewsletter(id));
  } catch (err) {
    if (err instanceof KitError || err instanceof LinkError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[growth/kits/newsletter]", err);
    return NextResponse.json({ error: "Could not create the campaigns." }, { status: 500 });
  }
}
