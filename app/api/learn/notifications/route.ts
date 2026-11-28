import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { markNotificationsRead } from "@/lib/learn/inbox/notifications";

export const dynamic = "force-dynamic";

// Learner notifications: mark one read (only the learner's own), or all.
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read"), id: z.string().regex(/^[\w-]{1,64}$/) }),
  z.object({ action: z.literal("readAll") }),
]);

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("inbox.error") }, { status: 400 });
  const changed = await markNotificationsRead(student.id, parsed.data.action === "read" ? parsed.data.id : null);
  return NextResponse.json({ ok: true, changed });
}
