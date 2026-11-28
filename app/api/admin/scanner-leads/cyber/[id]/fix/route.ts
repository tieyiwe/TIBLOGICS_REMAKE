import { NextResponse } from "next/server";
import { z } from "zod";
import { staffAiLimit } from "@/lib/rate-limit";
import { isAiBudgetError } from "@/lib/claude";
import { cyberGuard } from "@/lib/cyber/access";
import { ensureCyberTables } from "@/lib/cyber/db";
import { generateFix } from "@/lib/cyber/ai-fix";

// "Generate a tailored fix" for one finding (Claude, staff AI limits, saved on the scan).

export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const limited = await staffAiLimit("cyber-fix", 30);
  if (limited) return limited;
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = z.object({ findingId: z.string().regex(/^[a-z0-9-]{2,80}$/) }).safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "AI is not configured (ANTHROPIC_API_KEY)." }, { status: 503 });
  await ensureCyberTables();
  try {
    return NextResponse.json({ fix: await generateFix(id, b.data.findingId, g.email) });
  } catch (err) {
    if (isAiBudgetError(err)) return NextResponse.json({ error: "The monthly AI budget is used up." }, { status: 503 });
    const msg = err instanceof Error ? err.message : "Could not generate";
    return NextResponse.json({ error: /not found/i.test(msg) ? msg : "Could not generate the fix. Try again." }, { status: /not found/i.test(msg) ? 404 : 502 });
  }
}
