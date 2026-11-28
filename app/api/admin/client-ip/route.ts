import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { clientIpDebug } from "@/lib/client-ip";

// Staff: how the server sees your address. After deploying, open this and
// check that "chosen" is your real public IP (compare with any "what is my
// IP" site). If it is not, set TRUSTED_PROXY_HOPS (lib/client-ip.ts).
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(clientIpDebug(req.headers), { headers: { "Cache-Control": "no-store" } });
}
