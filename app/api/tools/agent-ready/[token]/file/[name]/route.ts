import { NextResponse } from "next/server";
import { isScannerStaff } from "@/lib/scanner/staff";
import { scanByToken } from "@/lib/agent-ready/service";
import { KIT_FILES, kitFile, type KitFileName } from "@/lib/agent-ready/kit";
import type { AgentScan } from "@/lib/agent-ready/scan";

// The kit's files (robots.txt, llms.txt, structured data): kit buyers and staff only.

export async function GET(req: Request, { params }: { params: Promise<{ token: string; name: string }> }) {
  const { token, name } = await params;
  if (!(KIT_FILES as readonly string[]).includes(name)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = await scanByToken(token);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.tier !== "kit" && !(await isScannerStaff())) return NextResponse.json({ error: "Not included" }, { status: 403 });
  const file = kitFile(row.result as unknown as AgentScan, name as KitFileName);
  const download = new URL(req.url).searchParams.get("download") === "1";
  const saveAs = name === "robots-no-training.txt" ? "robots.txt" : name === "schema.html" ? "structured-data.html" : name;
  return new NextResponse(file.body, {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      ...(download ? { "Content-Disposition": `attachment; filename="${saveAs}"` } : {}),
    },
  });
}
