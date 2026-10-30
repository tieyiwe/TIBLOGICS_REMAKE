// AI-Empowered Youth: admin actions (Learners admin). Called after the
// learners:manage check in app/api/admin/learn/learners/[id]/actions.
import type { Session } from "next-auth";
import { audit } from "@/lib/admin/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { ActionError, type ActionResult } from "./account-status/actions";
import { readYouthProfile } from "./youth-account";
import { sendParentEmail } from "./youth-emails";

export async function resendParentEmailAdmin(session: Session, id: string): Promise<ActionResult> {
  const p = await readYouthProfile(id);
  if (!p) throw new ActionError(404, "Learner not found");
  if (!p.parentEmail || !p.parentToken) throw new ActionError(409, "This learner has no parent email yet.");
  if (p.parentDeleteRequestedAt) throw new ActionError(409, "The parent asked for this account to be deleted.");
  if (!(await checkRateLimit(`youth-parent-mail:${p.parentEmail}`, 10, 86_400_000))) {
    throw new ActionError(429, "This parent already got 10 emails today. Try tomorrow.");
  }
  try {
    await sendParentEmail(p);
  } catch (err) {
    console.error("[youth-admin] parent email", err instanceof Error ? err.message : err);
    throw new ActionError(502, "The email could not be sent. Check the mail settings and try again.");
  }
  await audit(session, "learner.youth.parent_email", { type: "learner", id, label: p.email }, { consent: p.parentConsent });
  return { ok: true, message: `Parent email sent to ${p.parentEmail}` };
}
