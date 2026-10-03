import { NextResponse } from "next/server";
import { learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { exportLearnerData } from "@/lib/learn/account-status/privacy";
import { audit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

// Data export for one learner (GDPR / PIPEDA access request): a JSON file.
// Owner or admin only; audited. Never includes password hashes or tokens.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await learnerStaff("manage");
  if (error) return error;
  const { id } = await params;
  if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  const data = await exportLearnerData(id);
  if (!data) return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  await audit(session, "learner.export", { type: "learner", id, label: data.profile.email }, null);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="arfa-learner-${id}-${date}.json"`,
      "Cache-Control": "no-store, private",
    },
  });
}
