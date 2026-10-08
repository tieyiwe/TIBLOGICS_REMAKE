import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { normEmail } from "@/lib/growth/outreach/normalize";
import { callUnlocksPerDay, RESCAN_DAYS } from "./config";
import { ensureScannerColumns } from "./db";
import { finishReport } from "./report";
import { sendOwnerScanAlert } from "./email";
import { upsertScannerGrowthLead } from "./growth";

// Unlocking the full report: paid ($29 checkout), a booked call, or staff.
// Each moves a locked scan to unlocked in one conditional update, so a
// retried webhook or a double-submitted booking unlocks (and finishes) once.
// Follow-up emails stop: the visitor has acted.

type Source = "paid" | "call" | "admin";

async function unlock(id: string, source: Source, data: { email?: string | null; amountPaid?: number; stripeSessionId?: string | null } = {}): Promise<boolean> {
  await ensureScannerColumns();
  const now = new Date();
  const paid = source === "paid";
  const n = await prisma.scannerLead.updateMany({
    where: { id, unlockedAt: null },
    data: {
      unlockedAt: now,
      unlockSource: source,
      followupAt: null,
      ...(paid
        ? { amountPaid: data.amountPaid ?? 0, rescanCredits: 1, rescanUntil: new Date(now.getTime() + RESCAN_DAYS * 86_400_000) }
        : {}),
      ...(data.stripeSessionId ? { stripeSessionId: data.stripeSessionId } : {}),
    },
  });
  if (n.count !== 1) return false;
  // A buyer or caller who never gave the scanner an email: use theirs.
  if (data.email) await prisma.scannerLead.updateMany({ where: { id, email: null }, data: { email: data.email } });

  const lead = await prisma.scannerLead.findUnique({ where: { id } });
  if (lead?.email && source !== "admin") {
    await upsertScannerGrowthLead(lead, source === "paid" ? "scanner_paid" : "scanner_call").catch((err) => console.error("[scanner] growth lead", err));
    sendOwnerScanAlert(id, source).catch((err) => console.error("[scanner] owner alert", err instanceof Error ? err.message : err));
  }
  // Not awaited: Stripe and the booking form need a prompt answer. The
  // scanner cron job retries anything that does not finish.
  finishReport(id).catch((err) => console.error("[scanner] report", id, err));
  return true;
}

/** Checkout paid (webhook, or the buyer's return to the report page). */
export async function markReportPaid(leadId: string, session: Stripe.Checkout.Session): Promise<boolean> {
  // A 100% promotion code completes with "no_payment_required"; that buyer
  // must get the report too. Only a completed session counts, since an open
  // one can already show "no_payment_required".
  const paid = session.payment_status === "paid" || (session.status === "complete" && session.payment_status === "no_payment_required");
  if (!paid) return false;
  if (session.metadata?.leadId !== leadId) return false;
  return unlock(leadId, "paid", {
    amountPaid: session.amount_total ?? 0,
    stripeSessionId: session.id,
    email: normEmail(session.customer_details?.email ?? session.customer_email ?? null),
  });
}

/**
 * A free call booked from a report (/book?scan=<token>). Capped per day
 * across the site, since booking needs no
 * payment; past the cap the booking still goes through and staff can unlock
 * the report from the admin.
 */
export async function unlockByCall(token: unknown, email: string, appointmentId?: string): Promise<boolean> {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return false;
  await ensureScannerColumns();
  const lead = await prisma.scannerLead.findUnique({ where: { token }, select: { id: true, unlockedAt: true, bookedCallAt: true } });
  if (!lead) return false;
  await prisma.scannerLead.update({
    where: { id: lead.id },
    data: { bookedCallAt: lead.bookedCallAt ?? new Date(), followupAt: null, ...(appointmentId ? { appointmentId } : {}) },
  });
  if (lead.unlockedAt) return true;
  const today = await prisma.scannerLead.count({ where: { unlockSource: "call", unlockedAt: { gte: new Date(Date.now() - 86_400_000) } } });
  if (today >= callUnlocksPerDay()) return false;
  // One free report per booking email a month: repeated bookings with the
  // same address do not keep unlocking reports (staff can still unlock).
  const who = normEmail(email);
  if (!who) return false;
  const already = await prisma.scannerLead.count({ where: { unlockSource: "call", email: who, unlockedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } });
  if (already > 0) return false;
  return unlock(lead.id, "call", { email: who });
}

/** A paid booking made from a report: remember it on the scan (no unlock). */
export async function linkScanToAppointment(token: unknown, appointmentId: string): Promise<void> {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return;
  await ensureScannerColumns();
  await prisma.scannerLead.updateMany({ where: { token }, data: { appointmentId, followupAt: null } });
}

export async function unlockByAdmin(id: string): Promise<boolean> {
  return unlock(id, "admin");
}
