// Game Forge API guard: a signed-in learner with an open plan; same-origin
// JSON for changes (CSRF); and, for a minor, the youth gate passed (birth
// year and parent email given, and under 13 the parent's consent granted,
// not revoked). The id used everywhere after this is the session's, never
// one from the request.
import { NextResponse } from "next/server";
import { requireEntitledStudent, requireStudent } from "@/lib/learn/session";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { getYouthProfile, isMinor, youthGate } from "@/lib/learn/youth-account";
import { isOwnerStudent } from "@/lib/learn/owner";
import { getT, type T } from "@/lib/i18n/server";

export const PROJECT_ID_RE = /^gf_[A-Za-z0-9_-]{16}$/;
const MAX_BODY_BYTES = 64_000;

export async function forgeGuard(
  req: Request,
  opts: { write: boolean },
): Promise<{ error: NextResponse; studentId: null; t: null; minor: false } | { error: null; studentId: string; t: T; minor: boolean }> {
  if (opts.write) {
    const blocked = csrfGuard(req);
    if (blocked) return { error: blocked, studentId: null, t: null, minor: false };
    // A game is at most 24 KB; refuse oversized bodies before parsing them.
    if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
      return { error: NextResponse.json({ error: "Too large" }, { status: 413 }), studentId: null, t: null, minor: false };
    }
  }
  const signedIn = await requireStudent();
  if (signedIn.error) return { error: signedIn.error, studentId: null, t: null, minor: false };
  const t = await getT();
  // The youth gate first, so a child waiting for a parent is told why.
  const profile = await getYouthProfile(signedIn.student.id);
  const minor = isMinor(profile);
  if (minor && youthGate(profile) && !(await isOwnerStudent(signedIn.student.id))) {
    return { error: NextResponse.json({ error: t("studio.game-forge.api.parent"), code: "youth_gate" }, { status: 403 }), studentId: null, t: null, minor: false };
  }
  const { error, student } = await requireEntitledStudent();
  if (error) return { error, studentId: null, t: null, minor: false };
  return { error: null, studentId: student.id, t, minor };
}

/** 503 when the tables cannot be reached (the tool keeps working in the tab). */
export function storeDown(t: T, err: unknown, where: string) {
  console.error(`[game-forge] ${where}`, err instanceof Error ? err.message : err);
  return NextResponse.json({ error: t("studio.game-forge.api.store"), code: "store" }, { status: 503 });
}
