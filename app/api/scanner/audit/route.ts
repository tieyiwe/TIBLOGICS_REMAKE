import { NextRequest, NextResponse } from "next/server";
import { scanSite } from "@/lib/scanner/scan";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizeFindings, scanErrorText } from "@/lib/scanner/i18n";

// Real measurement for the AI Scanner.
//
// Fetches the page, robots.txt, sitemap.xml and llms.txt, then scores what it
// finds. Nothing is fabricated and no host is special-cased — see
// lib/scanner/audit.ts for the checks and lib/scanner/scan.ts for the fetch.

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Findings and errors come back in the visitor's language; `msg` and `vars`
  // stay on each finding for anything that wants to re-render it.
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`scanner-audit:${ip}`, 20, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }

  let raw: string;
  try {
    ({ url: raw } = await req.json());
  } catch {
    return NextResponse.json({ error: t("tools.api.invalidRequest") }, { status: 400 });
  }
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: t("tools.api.urlRequired") }, { status: 400 });
  }

  const result = await scanSite(raw);
  if (!result.ok) return NextResponse.json({ error: scanErrorText(t, result.error) }, { status: result.status });
  const { ok: _ok, ...body } = result;
  return NextResponse.json({ ...body, findings: localizeFindings(t, locale, body.findings) });
}
