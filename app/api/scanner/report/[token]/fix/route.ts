import { NextRequest, NextResponse } from "next/server";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/geo";
import { leadByToken } from "@/lib/scanner/lead";
import { allFindings } from "@/lib/scanner/view";
import { findingText } from "@/lib/scanner/i18n";
import { isLockedSeverity, severityOf } from "@/lib/scanner/severity";
import { serviceFor, validFixLink } from "@/lib/scanner/fix-link";

// GET ?fix=<check|all|security>&k=<signature>: what a "Fix this for me" link
// from a scanner email prefills on /services/get-started (lib/scanner/fix-link.ts).
// Signed links only, for a scan whose owner left an email. A locked (critical
// or high) security finding is named by its severity only, never its details.

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!(await checkRateLimit(`scanner-fix:${clientIp(req.headers) ?? "unknown"}`, 60, 3_600_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { token } = await params;
  const fix = req.nextUrl.searchParams.get("fix") ?? "";
  if (!/^[a-z0-9-]{1,40}$/.test(fix) || !validFixLink(token, fix, req.nextUrl.searchParams.get("k"))) {
    return NextResponse.json({ error: "Invalid link" }, { status: 403 });
  }
  const lead = await leadByToken(token);
  if (!lead?.email) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const locale = await getLocale();
  const t = translatorFor(locale);
  const problems = allFindings(lead).filter((f) => f.type !== "good");
  const picked = fix === "all" ? problems : fix === "security" ? problems.filter((f) => f.area === "security") : problems.filter((f) => f.check === fix);
  if (picked.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const unlocked = !!lead.unlockedAt;
  const items = picked.slice(0, 15).map((f) => {
    const sev = severityOf(f);
    return !unlocked && isLockedSeverity(sev) ? t(`tools.sr.sec.lockedItem.${sev}`) : findingText(t, locale, f);
  });
  // The service that fixes most of them.
  const tally = new Map<string, number>();
  for (const f of picked) tally.set(serviceFor(f), (tally.get(serviceFor(f)) ?? 0) + 1);
  const service = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return NextResponse.json({ domain: lead.domain ?? lead.url, url: lead.url, service, items, more: Math.max(0, picked.length - items.length) });
}
