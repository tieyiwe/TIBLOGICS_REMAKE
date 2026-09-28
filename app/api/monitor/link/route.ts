import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, isValidEmail } from "@/lib/require-admin";
import { ensureMonitorTables } from "@/lib/monitor/db";
import { rotateMonitorLink } from "@/lib/monitor/token";
import { sendMonitorLinkEmail } from "@/lib/monitor/email";
import { getT } from "@/lib/i18n/server";

// "Email me my dashboard link."
//
// The answer is the same whether or not the address subscribes, so this
// cannot be used to find out who the customers are. Each request rotates the
// link, which is also how a subscriber revokes one they shared by mistake.

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`monitor-link:${ip}`, 5, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }

  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: t("tools.api.invalidRequest") }, { status: 400 });
  }
  if (!isValidEmail(email)) return NextResponse.json({ error: t("tools.api.invalidEmail") }, { status: 400 });
  const clean = email.trim().toLowerCase();

  // Per address too, so one inbox cannot be flooded from many IPs.
  if (await checkRateLimit(`monitor-link:email:${clean}`, 3, 3_600_000)) {
    await ensureMonitorTables();
    const subs = await prisma.monitorSubscription.findMany({
      where: { email: clean, status: { in: ["active", "past_due", "canceled"] } },
      select: { id: true, siteUrl: true },
      take: 10,
    });
    if (subs.length > 0) {
      const links = await Promise.all(subs.map(async (s) => ({ siteUrl: s.siteUrl, link: await rotateMonitorLink(s.id) })));
      await sendMonitorLinkEmail({ email: clean, links }).catch((err) =>
        console.error("[monitor/link] email failed", err instanceof Error ? err.message : err),
      );
    }
  }

  return NextResponse.json({ ok: true, message: t("tools.monitor.api.linkSent") });
}
