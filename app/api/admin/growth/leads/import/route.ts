import { NextRequest, NextResponse } from "next/server";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { IMPORT_FIELDS, importLeads, type ImportField } from "@/lib/growth/outreach/leads";

export const maxDuration = 60;

/**
 * CSV import. The browser parses the file and applies the column mapping;
 * this receives rows keyed by our field names and dedupes them by email,
 * domain and phone against the workspace and within the batch.
 */
export async function POST(req: NextRequest) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const body = (await req.json().catch(() => null)) as { rows?: unknown; consentBasis?: unknown; tags?: unknown } | null;
  if (!body || !Array.isArray(body.rows)) return NextResponse.json({ error: "rows[] required" }, { status: 400 });
  if (body.rows.length > 2000) return NextResponse.json({ error: "At most 2,000 rows per import" }, { status: 413 });
  const rows = body.rows.map((r) => {
    const o: Partial<Record<ImportField, unknown>> = {};
    if (r && typeof r === "object") for (const f of IMPORT_FIELDS) if (f in r) o[f] = (r as Record<string, unknown>)[f];
    return o;
  });
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string").map((t) => t.slice(0, 40)).slice(0, 5) : [];
  const result = await importLeads(rows, { consentBasis: typeof body.consentBasis === "string" ? body.consentBasis : undefined, source: "csv", tags });
  return NextResponse.json(result);
}
