import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import * as A from "@/lib/learn/account-status/actions";
import { deleteLearner } from "@/lib/learn/account-status/privacy";

export const dynamic = "force-dynamic";

// Every admin action on one learner account (owner or admin only; a
// collaborator never, whatever their permissions). Each one is audited in
// lib/learn/account-status/actions.ts. JSON only, same origin.

const reason = z.string().trim().max(1000);
const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("suspend"), reason: reason.min(1, "Give a reason (the learner sees it)"), until: z.string().datetime({ offset: true }).nullable().optional() }),
  z.object({ action: z.literal("unsuspend"), reason: reason.optional().default("") }),
  z.object({ action: z.literal("block"), reason: reason.min(1, "Give a reason (the learner sees it)") }),
  z.object({ action: z.literal("unblock"), reason: reason.optional().default("") }),
  z.object({ action: z.literal("resetLink") }),
  z.object({ action: z.literal("tempPassword") }),
  z.object({ action: z.literal("markVerified") }),
  z.object({ action: z.literal("changeEmail"), email: z.string().trim().toLowerCase().email("Enter a valid email").max(320) }),
  z.object({ action: z.literal("signOutEverywhere") }),
  z.object({ action: z.literal("grantComp"), reason: reason.optional().default("") }),
  z.object({ action: z.literal("revokeComp"), reason: reason.optional().default("") }),
  z.object({ action: z.literal("extendAccess"), days: z.number().int().min(1).max(730), reason: reason.optional().default("") }),
  z.object({ action: z.literal("setTags"), tags: z.array(z.string().max(32)).max(12) }),
  z.object({ action: z.literal("addNote"), body: z.string().trim().min(1, "Write a note").max(5000) }),
  z.object({ action: z.literal("deleteNote"), noteId: z.string().min(1).max(64) }),
  z.object({
    action: z.literal("delete"),
    confirmEmail: z.string().max(320),
    reason: reason.optional().default(""),
    blockEmail: z.boolean().optional().default(false),
  }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage");
  if (error) return error;
  if (!(await checkRateLimit(`admin-learner-action:${session.user.email}`, 120, 60_000))) {
    return NextResponse.json({ error: "Too many actions in a minute. Wait a moment." }, { status: 429 });
  }
  const { id } = await params;
  if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  const parsed = Action.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const a = parsed.data;

  try {
    let r: A.ActionResult;
    switch (a.action) {
      case "suspend":
        r = await A.suspend(session, id, a.reason, a.until ? new Date(a.until) : null);
        break;
      case "unsuspend":
        r = await A.unsuspend(session, id, a.reason);
        break;
      case "block":
        r = await A.block(session, id, a.reason);
        break;
      case "unblock":
        r = await A.unblock(session, id, a.reason);
        break;
      case "resetLink":
        r = await A.sendResetLink(session, id);
        break;
      case "tempPassword":
        r = await A.setTempPassword(session, id);
        break;
      case "markVerified":
        r = await A.markVerified(session, id);
        break;
      case "changeEmail":
        r = await A.changeEmail(session, id, a.email);
        break;
      case "signOutEverywhere":
        r = await A.signOutEverywhere(session, id);
        break;
      case "grantComp":
        r = await A.grantComp(session, id, a.reason);
        break;
      case "revokeComp":
        r = await A.revokeComp(session, id, a.reason);
        break;
      case "extendAccess":
        r = await A.extendAccess(session, id, a.days, a.reason);
        break;
      case "setTags":
        r = await A.setTags(session, id, a.tags);
        break;
      case "addNote":
        r = await A.addNote(session, id, a.body);
        break;
      case "deleteNote":
        r = await A.deleteNote(session, id, a.noteId);
        break;
      case "delete":
        r = await deleteLearner(session, id, { confirmEmail: a.confirmEmail, reason: a.reason, blockEmail: a.blockEmail });
        break;
    }
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof A.ActionError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(`[admin/learners/${a.action}]`, err);
    return NextResponse.json({ error: "Something went wrong. Nothing else was changed." }, { status: 500 });
  }
}
