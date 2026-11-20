import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { currentStaff, readLimit } from "@/lib/admin/command-center/guard";
import { searchPm } from "@/lib/admin/command-center/pm";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** Search across projects, tasks and notes. */
export async function GET(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await readLimit(staff, "search", 120);
  if (limited) return limited;
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ q, results: [] });
  return NextResponse.json({ q, results: await searchPm(q, 8) });
}
