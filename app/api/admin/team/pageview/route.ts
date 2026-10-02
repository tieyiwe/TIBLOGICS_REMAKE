import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sameOrigin } from "@/lib/learn/account-status/admin-auth";
import { areaOf } from "@/lib/admin/access-map";
import { recordPageView } from "@/lib/admin/team/footprint";

export const dynamic = "force-dynamic";

// Staff footprint: the admin shell reports each page a staff member actually
// opens (link prefetches never reach here, unlike the proxy, which cannot
// tell a prefetch from a visit). One entry per path per person per 10
// minutes (lib/admin/team/footprint.ts). Staff only, same origin.
const Body = z.object({ path: z.string().max(300).regex(/^\/admin_pro(\/[\w\-./%~]*)?$/) });

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  const session = await getServerSession(authOptions).catch(() => null);
  const u = session?.user;
  if (!u || u.studentId || !(u.isOwner || u.isAdmin || u.collaboratorId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await checkRateLimit(`team-pv:${u.email}`, 120, 60_000))) return NextResponse.json({ ok: false }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  const path = parsed.data.path.replace(/\/+$/, "") || "/admin_pro";
  recordPageView({ staffId: u.collaboratorId ?? (u.isOwner ? "owner" : null), email: u.email, path, area: areaOf(path), headers: req.headers });
  return NextResponse.json({ ok: true });
}
