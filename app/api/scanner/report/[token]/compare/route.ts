import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { scanSite } from "@/lib/scanner/scan";
import { scanErrorText } from "@/lib/scanner/i18n";
import { leadByToken } from "@/lib/scanner/lead";
import { isScannerStaff } from "@/lib/scanner/staff";
import { buildView, type CompareRow } from "@/lib/scanner/view";
import { MAX_COMPETITORS, siteKey } from "@/lib/scanner/config";

// Full report only: scans up to three competitor sites with the same checks
// and stores their scores beside this one. A report has three competitor
// scans in all (replacing one uses one), so it cannot be used as a free,
// unlimited scanner.

export const maxDuration = 90;

const Body = z.object({ urls: z.array(z.string().trim().min(3).max(300)).min(1).max(MAX_COMPETITORS) });
const MAX_COMPARE_SCANS = 6;

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`scanner-compare:${ip}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("tools.sr.err.compareInput") }, { status: 400 });
  const lead = await leadByToken((await params).token);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const staff = await isScannerStaff();
  if (!lead.unlockedAt && !staff) return NextResponse.json({ error: t("tools.sr.err.locked") }, { status: 403 });

  const existing = Array.isArray(lead.compare) ? (lead.compare as unknown as CompareRow[]) : [];
  const used = Number((lead.extra as { compareScans?: number } | null)?.compareScans ?? existing.length);
  const wanted = [...new Set(parsed.data.urls.map((u) => siteKey(u)).filter((k): k is string => !!k && k !== lead.domain))]
    .filter((k) => !existing.some((r) => r.host === k))
    .slice(0, MAX_COMPETITORS);
  if (!wanted.length) return NextResponse.json({ error: t("tools.sr.err.compareInput") }, { status: 400 });
  if (!staff && used + wanted.length > MAX_COMPARE_SCANS) {
    return NextResponse.json({ error: t("tools.sr.err.compareUsed") }, { status: 429 });
  }

  const rows: CompareRow[] = await Promise.all(
    wanted.map(async (host): Promise<CompareRow> => {
      const r = await scanSite(`https://${host}`, 20_000, { extra: true }).catch(() => null);
      if (!r || !r.ok) return { url: `https://${host}`, host, ok: false, error: scanErrorText(t, r && !r.ok ? r.error : null) };
      return {
        url: r.url,
        host,
        ok: true,
        scores: {
          overall: r.overallScore, seo: r.seoScore, perf: r.perfScore, ux: r.uxScore, ai: r.aiScore,
          growth: r.extra?.growthScore ?? 0, security: r.extra?.securityScore ?? 0,
        },
      };
    }),
  );
  // Newest first, at most three kept.
  const compare = [...rows, ...existing].slice(0, MAX_COMPETITORS);
  const extra = { ...((lead.extra as object | null) ?? {}), compareScans: used + wanted.length };
  const fresh = await prisma.scannerLead.update({
    where: { id: lead.id },
    data: { compare: compare as unknown as Prisma.InputJsonValue, extra: extra as Prisma.InputJsonValue },
  });
  return NextResponse.json(await buildView(fresh, t, locale, { staff }));
}
