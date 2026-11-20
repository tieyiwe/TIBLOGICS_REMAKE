import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { calculatorAccess, PLAN_COOKIE, crossSite } from "@/lib/calculator/plan";
import { sanitizeInputs } from "@/lib/calculator/schema";
import { computeFull } from "@/lib/calculator/engine";

// POST { inputs } -> the Full Plan numbers (build budget, unit economics and
// pricing, scenarios, warnings, savings) for a paid plan or staff. The page
// calls it as the visitor edits, a moment after they stop typing. The inputs
// are sanitized like every other source, so this is pure arithmetic.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (crossSite(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const access = await calculatorAccess(req.cookies.get(PLAN_COOKIE)?.value);
  if (!access.full) return NextResponse.json({ error: "plan_required" }, { status: 402 });
  const who = access.passId ?? `staff:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"}`;
  if (!(await checkRateLimit(`calc-full:${who}`, 1200, 3_600_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const raw = await req.text();
  if (raw.length > 20_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    /* invalid */
  }
  const inputs = sanitizeInputs((body as { inputs?: unknown } | null)?.inputs);
  return NextResponse.json(computeFull(inputs), { headers: { "Cache-Control": "no-store" } });
}
