import { NextResponse } from "next/server";
import { auditFromRequest } from "@/lib/admin/audit";
import { cyberGuard } from "@/lib/cyber/access";
import { revokeEngagement } from "@/lib/cyber/engagement";

// DELETE: revoke (active testing stops at once; the record is kept).
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ok = await revokeEngagement(id);
  if (ok) await auditFromRequest("cyber.engagement.revoke", { type: "cyber_engagement", id });
  return NextResponse.json({ ok });
}
