import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { staffAiLimit } from "@/lib/rate-limit";
import { unlockByAdmin } from "@/lib/scanner/unlock";

// Staff: unlock a scan's full report (e.g. after a call booked outside the
// report link), which finishes it (PageSpeed, ready email) and shows it at its link.

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("scanner_leads:manage");
  if (denied) return denied;
  const limited = await staffAiLimit("scanner-unlock", 30);
  if (limited) return limited;
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ok = await unlockByAdmin(id);
  return NextResponse.json({ ok, already: !ok });
}
