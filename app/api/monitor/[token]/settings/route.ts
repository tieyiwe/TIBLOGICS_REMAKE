import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { findMonitorByToken } from "@/lib/monitor/access";
import { validateSites } from "@/lib/monitor/sites";

// Change the watched site or competitors. The next cron pass rescans, so the
// dashboard catches up within the hour without the edit itself scanning.

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sub = await findMonitorByToken(token);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.status !== "active" && sub.status !== "past_due") {
    return NextResponse.json({ error: "This subscription is not active." }, { status: 409 });
  }

  // Each edit queues a four-site scan; this keeps a dashboard from becoming a
  // free way to scan arbitrary sites on demand.
  if (!(await checkRateLimit(`monitor-edit:${sub.id}`, 5, 86_400_000))) {
    return NextResponse.json({ error: "You can change your sites up to 5 times a day." }, { status: 429 });
  }

  let body: { siteUrl?: unknown; competitors?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const sites = await validateSites(body.siteUrl, body.competitors);
  if (!sites.ok) return NextResponse.json({ error: sites.error }, { status: 400 });

  const changed =
    sites.siteUrl !== sub.siteUrl || sites.competitors.join("\n") !== sub.competitors.join("\n");
  if (changed) {
    await prisma.monitorSubscription.update({
      where: { id: sub.id },
      data: { siteUrl: sites.siteUrl, competitors: sites.competitors, nextRunAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true, changed, siteUrl: sites.siteUrl, competitors: sites.competitors });
}
