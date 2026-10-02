import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import * as A from "@/lib/learn/account-status/actions";
import { deleteLearner } from "@/lib/learn/account-status/privacy";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Bulk actions from the Learners list selection (owner or admin only). Each
// learner is handled and audited on its own; one failure does not stop the
// others, and the answer lists what happened.
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("suspend"), ids: z.array(z.string().max(64)).min(1).max(200), reason: z.string().trim().min(1, "Give a reason").max(1000), until: z.string().datetime({ offset: true }).nullable().optional() }),
  z.object({ action: z.literal("unsuspend"), ids: z.array(z.string().max(64)).min(1).max(200) }),
  z.object({ action: z.literal("signOutEverywhere"), ids: z.array(z.string().max(64)).min(1).max(200) }),
  z.object({ action: z.literal("addTag"), ids: z.array(z.string().max(64)).min(1).max(200), tag: z.string().trim().min(1).max(32) }),
  z.object({ action: z.literal("removeTag"), ids: z.array(z.string().max(64)).min(1).max(200), tag: z.string().trim().min(1).max(32) }),
  // Delete = anonymise (see deleteLearner). The typed "DELETE" stands in for
  // typing each learner's email; the email is NOT blocked, so the person can
  // sign up again as a new learner.
  z.object({ action: z.literal("delete"), ids: z.array(z.string().max(64)).min(1).max(50), confirm: z.literal("DELETE"), reason: z.string().trim().max(1000).optional().default("") }),
]);

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage");
  if (error) return error;
  if (!(await checkRateLimit(`admin-learner-bulk:${session.user.email}`, 20, 60_000))) {
    return NextResponse.json({ error: "Too many bulk actions in a minute." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const b = parsed.data;
  let done = 0;
  const failed: Array<{ id: string; error: string }> = [];
  for (const id of [...new Set(b.ids)]) {
    try {
      if (b.action === "suspend") await A.suspend(session, id, b.reason, b.until ? new Date(b.until) : null);
      else if (b.action === "unsuspend") await A.unsuspend(session, id, "");
      else if (b.action === "signOutEverywhere") await A.signOutEverywhere(session, id);
      else if (b.action === "addTag") await A.addTag(session, id, b.tag);
      else if (b.action === "delete") {
        const s = await prisma.student.findUnique({ where: { id }, select: { email: true } });
        if (!s) throw new A.ActionError(404, "Learner not found");
        await deleteLearner(session, id, { confirmEmail: s.email, reason: b.reason, blockEmail: false });
      }
      else await A.addTag(session, id, b.tag, true);
      done++;
    } catch (err) {
      failed.push({ id, error: err instanceof A.ActionError ? err.message : "Failed" });
    }
  }
  return NextResponse.json({ ok: true, done, failed });
}
