import { clientIp } from "@/lib/client-ip";
import { NextRequest, NextResponse } from "next/server";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { isScannerStaff } from "@/lib/scanner/staff";
import { rescan, scanByToken, viewOf } from "@/lib/agent-ready/service";

// The kit's re-scans: measure the same site again to check the fixes.

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const bad = csrfGuard(req);
  if (bad) return bad;
  const t = translatorFor(await getLocale());
  if (!(await checkRateLimit(`agent-ready-rescan:${clientIp(req.headers)}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("tools.agent.err.rate") }, { status: 429 });
  }
  const row = await scanByToken((await params).token);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const staff = await isScannerStaff();
  const out = await rescan(row, staff);
  if (!out.ok) {
    const key = ["noRescans", "busy", "unreachable", "refused", "timeout", "private", "invalid"].includes(out.error) ? out.error : "unreachable";
    return NextResponse.json({ error: t(`tools.agent.err.${key}`) }, { status: key === "noRescans" ? 403 : key === "busy" ? 429 : 502 });
  }
  const fresh = await scanByToken(row.token);
  return NextResponse.json(viewOf(fresh!, staff));
}
