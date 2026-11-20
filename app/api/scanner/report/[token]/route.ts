import { NextRequest, NextResponse } from "next/server";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { leadByToken } from "@/lib/scanner/lead";
import { isScannerStaff } from "@/lib/scanner/staff";
import { buildView } from "@/lib/scanner/view";

// A scan's report, by its secret token, at the level the visitor has
// unlocked (lib/scanner/view.ts). The report page polls this while a paid
// report is being written.

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`scanner-report:${ip}`, 240, 3_600_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const lead = await leadByToken((await params).token);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const locale = await getLocale();
  const view = await buildView(lead, translatorFor(locale), locale, { staff: await isScannerStaff() });
  return NextResponse.json(view);
}
