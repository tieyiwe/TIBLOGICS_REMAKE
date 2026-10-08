// AI-Empowered Youth: sends a learner who cannot open a youth lane yet to
// /learn/youth (birth year and parent email, or "waiting for your parent").
// Pages only; APIs refuse through canAccessTrack (lib/learn/session.ts).
import { redirect } from "next/navigation";
import type { LearnAccess } from "./session";
import { isYouthSlug } from "./youth";
import { getYouthProfile, youthGate } from "./youth-account";
import { isOwnerStudent } from "./owner";

export async function enforceYouthGate(studentId: string, access: LearnAccess, trackSlug: string, opts: { lesson?: boolean } = {}): Promise<void> {
  if (!isYouthSlug(trackSlug)) return;
  let gate = access.youthGate;
  // Not holding a lane yet (free preview): a child already waiting for a
  // parent, or whose parent revoked access, still cannot open lessons.
  if (!gate && opts.lesson) {
    const g = youthGate(await getYouthProfile(studentId));
    if ((g === "pending" || g === "revoked") && !(await isOwnerStudent(studentId))) gate = g;
  }
  if (gate) redirect(`/learn/youth?lane=${encodeURIComponent(trackSlug)}`);
}
