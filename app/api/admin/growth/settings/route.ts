import { NextRequest, NextResponse } from "next/server";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { getGrowthSettings, saveGrowthSettings } from "@/lib/growth/settings";

export async function GET() {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  return NextResponse.json({ settings: await getGrowthSettings() });
}

export async function PUT(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const body = await jsonBody(req);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  if (JSON.stringify(body).length > 60_000) return NextResponse.json({ error: "Settings too large" }, { status: 413 });
  return NextResponse.json({ settings: await saveGrowthSettings(body) });
}
