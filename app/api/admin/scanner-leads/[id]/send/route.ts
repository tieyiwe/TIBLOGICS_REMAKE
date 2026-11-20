import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";
import { staffAiLimit } from "@/lib/rate-limit";
import { isLocale } from "@/lib/i18n/config";
import prisma from "@/lib/prisma";
import { unlockByAdmin } from "@/lib/scanner/unlock";
import { sendOwnerReport } from "@/lib/scanner/outreach";

// Staff: send a scan's report to the site's owner or a company, as an offer
// to fix what it found. Unlocks the scan first if it was still locked, so the
// link opens the full report. POST { to, name?, company?, note, locale, pdf }.

const Body = z.object({
  to: z.string().trim().email().max(254),
  name: z.string().trim().max(120).optional(),
  company: z.string().trim().max(160).optional(),
  note: z.string().trim().min(1).max(4000),
  locale: z.string(),
  pdf: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("scanner_leads:manage");
  if (denied) return denied;
  const limited = await staffAiLimit("scanner-send", 40);
  if (limited) return limited;
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Check the email address and the note." }, { status: 400 });
  const lead = await prisma.scannerLead.findUnique({ where: { id }, select: { id: true, unlockedAt: true, extra: true } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((lead.extra as { held?: boolean } | null)?.held && !lead.unlockedAt) {
    // A scan bought over the free limit and not paid: unlocking it here would hand it out.
    return NextResponse.json({ error: "This scan is waiting for the visitor's payment. Run a new scan from the admin instead." }, { status: 409 });
  }
  if (!lead.unlockedAt) await unlockByAdmin(id);

  const user = (await getServerSession(authOptions))?.user;
  const senderEmail = user?.email ?? process.env.ADMIN_NOTIFY_EMAIL ?? "hello@tiblogics.com";
  const r = await sendOwnerReport({
    id,
    to: body.data.to,
    name: body.data.name,
    company: body.data.company,
    note: body.data.note,
    locale: isLocale(body.data.locale) ? body.data.locale : "en",
    attachPdf: body.data.pdf !== false,
    sender: { name: user?.name?.trim() || "The TIBLOGICS team", email: senderEmail },
  });
  if (!r.ok) {
    const msg = { suppressed: "This address has unsubscribed from TIBLOGICS emails. It was not sent.", invalid: "That email address is not valid.", notFound: "Not found", failed: "The email could not be sent. Try again." }[r.error];
    return NextResponse.json({ error: msg }, { status: r.error === "failed" ? 502 : r.error === "notFound" ? 404 : 400 });
  }
  return NextResponse.json({ ok: true });
}
