import { NextResponse } from "next/server";
import { isScannerStaff } from "@/lib/scanner/staff";
import { scanByToken, viewOf } from "@/lib/agent-ready/service";

// The report as this visitor may see it (lib/agent-ready/service.ts viewOf).

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const row = await scanByToken((await params).token);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(viewOf(row, await isScannerStaff()), { headers: { "Cache-Control": "private, no-store" } });
}
