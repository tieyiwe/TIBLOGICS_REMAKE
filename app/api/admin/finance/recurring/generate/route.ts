import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { currentStaff, jsonBody, writeGuard } from "@/lib/admin/command-center/guard";
import { generateRecurringExpenses } from "@/lib/admin/command-center/finance";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** Generate due recurring expenses now. Idempotent: periods already in the books are skipped. */
export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "finance-generate", { max: 10 });
  if (blocked) return blocked;
  await jsonBody(req);
  return NextResponse.json({ generated: await generateRecurringExpenses() });
}
