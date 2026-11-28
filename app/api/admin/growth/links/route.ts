import { NextRequest, NextResponse } from "next/server";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { createLink, LinkError, shortUrl } from "@/lib/growth/links";
import { getLinkReport } from "@/lib/growth/reports";

const RANGES = [7, 30, 90, 365];

export async function GET(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const n = Number(req.nextUrl.searchParams.get("days"));
  const days = RANGES.includes(n) ? n : 30;
  return NextResponse.json({ report: await getLinkReport(days) });
}

export async function POST(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const b = await jsonBody(req);
  if (!b) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    const link = await createLink({
      targetUrl: String(b.targetUrl ?? ""),
      utmSource: String(b.utmSource ?? ""),
      utmMedium: String(b.utmMedium ?? ""),
      utmCampaign: String(b.utmCampaign ?? ""),
      utmContent: typeof b.utmContent === "string" ? b.utmContent : null,
      label: typeof b.label === "string" ? b.label : null,
    });
    return NextResponse.json({ link: { ...link, shortUrl: shortUrl(link.code) } }, { status: 201 });
  } catch (err) {
    if (err instanceof LinkError) return NextResponse.json({ error: err.message }, { status: 422 });
    throw err;
  }
}
