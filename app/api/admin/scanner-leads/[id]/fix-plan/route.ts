import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";
import { staffAiLimit } from "@/lib/rate-limit";
import { auditFromRequest } from "@/lib/admin/audit";
import { ensureScannerColumns } from "@/lib/scanner/db";
import { generateFixPlan } from "@/lib/scanner/fix-plan";

// Staff: write the internal fix plan for a scan (one model call). Never shown
// to the customer. See lib/scanner/fix-plan.ts.
export const maxDuration = 120;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("scanner_leads:manage");
  if (denied) return denied;
  const limited = await staffAiLimit("scanner-fix-plan", 30);
  if (limited) return limited;
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureScannerColumns();
  const actor = (await getServerSession(authOptions))?.user?.email ?? "staff";
  try {
    const plan = await generateFixPlan(id, actor);
    await auditFromRequest("scanner.fix_plan", { type: "scanner_lead", id });
    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("[POST fix-plan]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error && err.message.startsWith("The plan") ? err.message : "Could not write the plan. Try again." }, { status: 500 });
  }
}
