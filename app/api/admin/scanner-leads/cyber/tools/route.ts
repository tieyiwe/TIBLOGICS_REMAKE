import { NextResponse } from "next/server";
import { z } from "zod";
import { staffAiLimit } from "@/lib/rate-limit";
import { auditFromRequest } from "@/lib/admin/audit";
import { cyberGuard } from "@/lib/cyber/access";
import { ACTIVE_TOOLS, runTool, type ToolName } from "@/lib/cyber/tools";

// The manual tools. POST { tool, url|domain, ... }. Active tools need an
// engagement covering the host; every use is audited.

export const maxDuration = 60;

const Body = z.object({ tool: z.enum(["request", "cors", "paths", "reflect", "dns", "tls"]) }).passthrough();

export async function POST(req: Request) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const limited = await staffAiLimit("cyber-tools", 120);
  if (limited) return limited;
  const raw = await req.json().catch(() => null);
  const b = Body.safeParse(raw);
  if (!b.success) return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
  const tool = b.data.tool as ToolName;
  try {
    const r = await runTool(tool, raw as Record<string, unknown>);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    if (ACTIVE_TOOLS.includes(tool)) {
      const target = String((raw as { url?: string }).url ?? "").slice(0, 300);
      await auditFromRequest(`cyber.tool.${tool}`, { type: "cyber_engagement", id: r.engagementId ?? null, label: target }, { tool });
    }
    return NextResponse.json(r.data);
  } catch (err) {
    return NextResponse.json({ error: `The request failed: ${(err instanceof Error ? err.message : String(err)).slice(0, 200)}` }, { status: 502 });
  }
}
