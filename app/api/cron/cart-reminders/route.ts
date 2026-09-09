import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendCartReminderEmail } from "@/lib/resend";

// Sends abandoned-cart reminder emails.
// Scheduled via vercel.json cron (Authorization: Bearer CRON_SECRET) or an
// external scheduler (?secret=CRON_SECRET). Sends up to 2 reminders per cart:
//   - 1st: cart idle > 1 hour
//   - 2nd: cart idle > 1 hour AND last reminder > 22 hours ago
const MAX_REMINDERS = 2;
const IDLE_MS = 60 * 60 * 1000;          // 1 hour since last cart activity
const REMINDER_GAP_MS = 22 * 60 * 60 * 1000; // 22 hours between reminders

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret) {
    const ok = authHeader === `Bearer ${cronSecret}` || searchParams.get("secret") === cronSecret;
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  let candidates: Array<{
    id: string; email: string; items: unknown; subtotal: number; currency: string;
    reminderCount: number; lastReminderAt: Date | null; updatedAt: Date;
  }> = [];

  try {
    candidates = await prisma.abandonedCart.findMany({
      where: {
        recoveredAt: null,
        reminderCount: { lt: MAX_REMINDERS },
        updatedAt: { lt: new Date(now - IDLE_MS) },
      },
      orderBy: { updatedAt: "asc" },
      take: 100,
    });
  } catch (err) {
    console.error("[cron/cart-reminders] query", err);
    return NextResponse.json({ error: "Database error — run Sync Database" }, { status: 500 });
  }

  let sent = 0;
  const results: string[] = [];

  for (const c of candidates) {
    // Space out repeat reminders
    if (c.lastReminderAt && now - new Date(c.lastReminderAt).getTime() < REMINDER_GAP_MS) continue;

    const items = Array.isArray(c.items)
      ? (c.items as unknown as Array<{ name?: string; price?: number; quantity?: number; image?: string | null }>)
      : [];
    if (items.length === 0) continue;

    try {
      await sendCartReminderEmail({
        email: c.email,
        items,
        subtotal: c.subtotal,
        currency: c.currency,
        reminderNumber: c.reminderCount + 1,
      });
      await prisma.abandonedCart.update({
        where: { id: c.id },
        data: { reminderCount: { increment: 1 }, lastReminderAt: new Date() },
      });
      sent++;
      results.push(`✅ ${c.email} (reminder ${c.reminderCount + 1})`);
    } catch (err) {
      results.push(`⚠️ ${c.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── Analytics retention ───────────────────────────────────────────────
  // PageView and ActiveSession had no expiry, so both grew without limit and
  // were only ever emptied by the manual "clear dev data" wipe. Storage is
  // billed, and nothing in the product reads page views older than the
  // dashboard's reporting window. Piggy-backing on this hourly job avoids
  // adding another scheduled invocation.
  const pruned = await pruneAnalytics();

  return NextResponse.json({ ok: true, checked: candidates.length, sent, results, pruned });
}

const PAGEVIEW_RETENTION_DAYS = 90;
const ACTIVE_SESSION_STALE_MINUTES = 30;

async function pruneAnalytics() {
  const now = Date.now();
  try {
    const [pageViews, sessions] = await Promise.all([
      prisma.pageView.deleteMany({
        where: { createdAt: { lt: new Date(now - PAGEVIEW_RETENTION_DAYS * 86_400_000) } },
      }),
      // "Active" means seen recently; anything older is a dead row that also
      // makes the live-visitor count wrong.
      prisma.activeSession.deleteMany({
        where: { lastSeen: { lt: new Date(now - ACTIVE_SESSION_STALE_MINUTES * 60_000) } },
      }),
    ]);
    return { pageViews: pageViews.count, activeSessions: sessions.count };
  } catch (err) {
    console.error("[cron/cart-reminders] analytics prune failed", err);
    return { pageViews: 0, activeSessions: 0, error: true };
  }
}
