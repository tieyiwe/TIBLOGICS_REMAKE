import { clientIp } from "@/lib/client-ip";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { isScannerStaff } from "@/lib/scanner/staff";
import { freePerDay, freeScansToday, hostOf, runScan } from "@/lib/agent-ready/service";

// AI Agent Readiness: POST { url } scans a site and answers the report token.
// About a dozen requests to the site per scan, so: 8 scans an hour per
// visitor address, and a few free scans of one site a day. Staff: no limits
// beyond the per-address one.

export const maxDuration = 60;

const Body = z.object({ url: z.string().trim().min(3).max(500) });

export async function POST(req: NextRequest) {
  const bad = csrfGuard(req);
  if (bad) return bad;
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = clientIp(req.headers);
  const staff = await isScannerStaff();
  if (!(await checkRateLimit(`agent-ready:${ip}`, staff ? 60 : 8, 3_600_000))) {
    return NextResponse.json({ error: t("tools.agent.err.rate") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("tools.agent.err.invalid") }, { status: 400 });
  const host = hostOf(parsed.data.url);
  if (!host) return NextResponse.json({ error: t("tools.agent.err.invalid") }, { status: 400 });
  if (!staff && (await freeScansToday(host)) >= freePerDay()) {
    return NextResponse.json({ error: t("tools.agent.err.siteLimit") }, { status: 429 });
  }
  // Scans in flight across the site: each holds a dozen connections.
  if (!(await checkRateLimit("agent-ready:global", 120, 600_000))) {
    return NextResponse.json({ error: t("tools.agent.err.busy") }, { status: 503 });
  }
  const out = await runScan(parsed.data.url, { locale, ip, staff });
  if (!out.ok) {
    const key = ["invalid", "private", "unreachable", "refused", "timeout"].includes(out.error) ? out.error : "unreachable";
    return NextResponse.json({ error: t(`tools.agent.err.${key}`), code: key }, { status: key === "invalid" || key === "private" ? 400 : 502 });
  }
  return NextResponse.json({ token: out.token });
}
