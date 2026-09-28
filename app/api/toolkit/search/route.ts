import { NextRequest, NextResponse } from "next/server";
import { requireToolkit } from "@/lib/toolkit/guard-request";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchPrompts } from "@/lib/toolkit/search";
import { LIBRARY_VERTICALS } from "@/lib/toolkit/library";

// Keyword search across the prompt library, including the prompt text, which
// is why it runs on the server for subscribers rather than in the browser.
export async function GET(req: NextRequest) {
  const gate = await requireToolkit({ generate: true });
  if (gate.error) return gate.error;
  if (!(await checkRateLimit(`toolkit-search:${gate.access.student.id}`, 120, 60_000))) {
    return NextResponse.json({ error: "Too many searches. Slow down a little." }, { status: 429 });
  }
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").slice(0, 200);
  const vertical = sp.get("vertical");
  const scope = vertical && LIBRARY_VERTICALS.some((v) => v.id === vertical) ? vertical : undefined;
  return NextResponse.json(searchPrompts(q, { vertical: scope }));
}
