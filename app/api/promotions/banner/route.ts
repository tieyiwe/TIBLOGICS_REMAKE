import { NextResponse } from "next/server";
import { getLocale } from "@/lib/i18n/server";
import { liveBanner } from "@/lib/promotions/service";

// The site-wide promotion banner (components/promo/PromoBanner.tsx). Read per
// request so a publish or pause shows at once; static pages stay static.
export const dynamic = "force-dynamic";

export async function GET() {
  const banner = await liveBanner(await getLocale());
  return NextResponse.json({ banner }, { headers: { "Cache-Control": "no-store" } });
}
