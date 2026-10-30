import { NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { leadByToken } from "@/lib/scanner/lead";
import { isScannerStaff } from "@/lib/scanner/staff";
import { reportPdf, reportFileName } from "@/lib/scanner/pdf";

// The full report as a branded PDF (full report only).

export const maxDuration = 30;

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`scanner-pdf:${ip}`, 30, 3_600_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const lead = await leadByToken((await params).token);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!lead.unlockedAt && !(await isScannerStaff())) return NextResponse.json({ error: "Locked" }, { status: 403 });
  const q = req.nextUrl.searchParams.get("lang");
  const locale = isLocale(q) ? q : isLocale(lead.locale) ? lead.locale : await getLocale();
  const pdf = await reportPdf(lead, locale);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${reportFileName(lead)}"`,
      "cache-control": "private, no-store",
    },
  });
}
