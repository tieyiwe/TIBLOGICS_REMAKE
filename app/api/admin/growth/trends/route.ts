import { NextRequest, NextResponse } from "next/server";
import { requireGrowthAdmin } from "@/lib/growth/content-auth";
import { getTrendIdeas } from "@/lib/growth/trends";

// Up to two missing ideas are written per request (Haiku), the rest next time.
export const maxDuration = 90;

export async function GET(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const gen = req.nextUrl.searchParams.get("generate");
  try {
    return NextResponse.json(await getTrendIdeas({ generate: gen === "0" ? 0 : 2 }));
  } catch (err) {
    console.error("[growth/trends]", err);
    return NextResponse.json({ error: "Could not load trend ideas" }, { status: 500 });
  }
}
