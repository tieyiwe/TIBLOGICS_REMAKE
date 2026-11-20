import { NextRequest, NextResponse } from "next/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { clearCommenterCookie } from "@/lib/blog/engage/identity";

export const dynamic = "force-dynamic";

// "Not you?": this browser forgets the guest commenter (the next comment asks
// for a name and an email again).
export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const res = NextResponse.json({ ok: true });
  clearCommenterCookie(res);
  return res;
}
