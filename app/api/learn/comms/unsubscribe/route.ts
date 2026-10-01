import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { readUnsubscribeToken, setMarketingOptOut } from "@/lib/learn/inbox/unsubscribe";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";

export const dynamic = "force-dynamic";

// Unsubscribe from (or back into) ARFA news and offers, from the signed link
// in marketing emails. No session needed; the token names the learner.
const Body = z.object({ t: z.string().max(300), optOut: z.boolean() });

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`comms-unsub:${ip}`, 30, 3_600_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const id = parsed.success ? readUnsubscribeToken(parsed.data.t) : null;
  if (!parsed.success || !id) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  const ok = await setMarketingOptOut(id, parsed.data.optOut);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Invalid link" }, { status: 404 });
}
