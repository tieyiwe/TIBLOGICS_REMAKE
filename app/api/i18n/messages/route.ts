import { NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n/config";
import { areaMessages, isMessageArea } from "@/lib/i18n/client-messages";

// Messages of one area that a page did not embed (useLazyMessages in
// lib/i18n/client.tsx), e.g. the Studio tool texts for a tool shown inside a
// lesson. Public interface texts only: the same strings ship in the pages.
export function GET(req: NextRequest) {
  const area = req.nextUrl.searchParams.get("area");
  const locale = req.nextUrl.searchParams.get("locale");
  if (!isMessageArea(area) || !isLocale(locale)) {
    return NextResponse.json({ error: "Unknown area or language" }, { status: 400 });
  }
  return NextResponse.json(areaMessages(locale, area));
}
