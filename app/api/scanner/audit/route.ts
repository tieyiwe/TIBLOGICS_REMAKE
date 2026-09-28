import { NextRequest, NextResponse } from "next/server";
import { scanSite } from "@/lib/scanner/scan";
import { checkRateLimit } from "@/lib/rate-limit";

// Real measurement for the AI Scanner.
//
// Fetches the page, robots.txt, sitemap.xml and llms.txt, then scores what it
// finds. Nothing is fabricated and no host is special-cased — see
// lib/scanner/audit.ts for the checks and lib/scanner/scan.ts for the fetch.

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`scanner-audit:${ip}`, 20, 3_600_000))) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  let raw: string;
  try {
    ({ url: raw } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const result = await scanSite(raw);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  const { ok: _ok, ...body } = result;
  return NextResponse.json(body);
}
