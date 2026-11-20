import { NextResponse } from "next/server";
import { learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { waitingCount } from "@/lib/learn/support/tickets";

export const dynamic = "force-dynamic";

// Support requests waiting for the team, for the admin sidebar badge.
// Staff without access to learners get 0 (not an error) so the shell can poll it.
export async function GET() {
  const { error } = await learnerStaff("read");
  const waiting = error ? 0 : await waitingCount();
  return NextResponse.json({ waiting }, { headers: { "Cache-Control": "no-store, private" } });
}
