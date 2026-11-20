import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";
import { staffAiLimit } from "@/lib/rate-limit";
import { isLocale } from "@/lib/i18n/config";
import { runPublicScan } from "@/lib/scanner/lead";
import { unlockByAdmin } from "@/lib/scanner/unlock";
import { markAdminScan } from "@/lib/scanner/outreach";
import { scanErrorText } from "@/lib/scanner/i18n";
import { translatorFor } from "@/lib/i18n/server";

// The admin scanner: the team scans any public website (no free-scan limit),
// and the scan is unlocked straight away so it can be sent to the owner with
// the full report (lib/scanner/outreach.ts). Same scanner as the public one:
// public pages only, through the SSRF guard (lib/ssrf.ts).
//
// POST { url, locale?, name?, company? } -> { id }

export const maxDuration = 60;

const Body = z.object({
  url: z.string().trim().min(3).max(500),
  locale: z.string().optional(),
  name: z.string().trim().max(120).optional(),
  company: z.string().trim().max(160).optional(),
});

export async function POST(req: Request) {
  const denied = await requirePermission("scanner_leads:manage");
  if (denied) return denied;
  const limited = await staffAiLimit("scanner-admin-scan", 40);
  if (limited) return limited;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Enter a website address." }, { status: 400 });
  const locale = isLocale(body.data.locale) ? body.data.locale : "en";
  const result = await runPublicScan({ url: body.data.url, locale, staff: true });
  if (result.kind !== "ok") {
    const error = result.kind === "error" ? (result.error === "invalid" ? "That is not a website address." : scanErrorText(translatorFor("en"), result.error)) : "Could not scan.";
    return NextResponse.json({ error }, { status: result.kind === "error" ? result.status : 502 });
  }
  const who = (await getServerSession(authOptions))?.user?.email ?? "staff";
  await markAdminScan(result.lead.id, who, { name: body.data.name, company: body.data.company });
  // Unlocked by staff: the link shows the full report. It finishes in the
  // background (PageSpeed); no email goes anywhere until someone sends it.
  await unlockByAdmin(result.lead.id);
  return NextResponse.json({ id: result.lead.id });
}
