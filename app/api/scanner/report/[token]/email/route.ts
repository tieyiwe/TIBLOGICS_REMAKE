import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { normEmail } from "@/lib/growth/outreach/normalize";
import { isSuppressed } from "@/lib/growth/outreach/suppression";
import { leadByToken } from "@/lib/scanner/lead";
import { isScannerStaff } from "@/lib/scanner/staff";
import { buildView } from "@/lib/scanner/view";
import { upsertScannerGrowthLead } from "@/lib/scanner/growth";
import { sendOwnerScanAlert, sendScanReportEmail } from "@/lib/scanner/email";

// The email gate: an email (and the consent box) shows every problem's title,
// sends the results by email, and starts two follow-ups (day 3 and day 7).
// The lead joins the Growth pipeline and the owner is told.
//
// Only a scan without an email takes one: a shared report link cannot be used
// to change where another visitor's emails go.

const Body = z.object({
  email: z.string().max(254),
  name: z.string().trim().max(100).optional(),
  consent: z.literal(true),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`scanner-email:${ip}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  const email = parsed.success ? normEmail(parsed.data.email) : null;
  if (!parsed.success || !email) return NextResponse.json({ error: t("tools.sr.err.email") }, { status: 400 });

  const lead = await leadByToken((await params).token);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const taken = await prisma.scannerLead.updateMany({
    where: { id: lead.id, email: null },
    data: {
      email,
      name: parsed.data.name || null,
      consentAt: now,
      locale,
      // Follow-ups only for a scan that is still locked.
      ...(lead.unlockedAt ? {} : { followupStage: 0, followupAt: new Date(now.getTime() + 3 * 86_400_000) }),
    },
  });
  const fresh = await prisma.scannerLead.findUniqueOrThrow({ where: { id: lead.id } });
  if (taken.count === 1) {
    await upsertScannerGrowthLead(fresh, "scanner_email").catch((err) => console.error("[scanner] growth lead", err));
    sendOwnerScanAlert(fresh.id, "email").catch((err) => console.error("[scanner] owner alert", err instanceof Error ? err.message : err));
    if (!(await isSuppressed(email))) {
      sendScanReportEmail(fresh.id).catch((err) => console.error("[scanner] report email", err instanceof Error ? err.message : err));
    }
  }
  const view = await buildView(fresh, t, locale, { staff: await isScannerStaff() });
  return NextResponse.json(view);
}
