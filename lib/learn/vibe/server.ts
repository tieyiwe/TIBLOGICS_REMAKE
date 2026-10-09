// Vibe Code Studio: who may use its AI, and how many AI helps are left today.
// Server only. The routes (app/api/learn/studio/vibe/*) authenticate first
// (requireEntitledStudent) and call these after.
import { NextResponse } from "next/server";
import { canAccessTrack, type LearnAccess } from "@/lib/learn/session";
import { youthTrackIds } from "@/lib/learn/track-subscriptions";
import { isOwnerStudent } from "@/lib/learn/owner";
import { dailyAiLimitMinor } from "@/lib/learn/ai-budget";
import { isMinorStudent } from "@/lib/learn/youth-account";
import { rateLimitStatus } from "@/lib/rate-limit";
import type { T as Translator } from "@/lib/i18n/server";

/**
 * The AI part of the tool is for the AI-Empowered Youth program: a learner
 * who holds a youth lane that is open (birth year and parent email given,
 * parent consent under 13, not revoked: getAccess already closes the lane
 * otherwise). The owner is exempt. Editing by hand and the preview work for
 * every member; only the model calls are gated, because they cost money.
 */
export async function denyVibeAi(studentId: string, access: LearnAccess, t: Translator): Promise<NextResponse | null> {
  if (await isOwnerStudent(studentId)) return null;
  const youth = await youthTrackIds();
  if (youth.some((id) => canAccessTrack(access, id))) return null;
  return NextResponse.json(
    { error: t(access.youthGate ? "studio.vibe-code-studio.api.waitParent" : "studio.vibe-code-studio.api.youthOnly"), code: "youth_only" },
    { status: 403 },
  );
}

/** AI helps left today for a minor (the shared minors' daily cap), or null for adults. */
export async function aiLeftToday(studentId: string): Promise<number | null> {
  if (!(await isMinorStudent(studentId))) return null;
  const s = await rateLimitStatus(`learn-ai-minor:${studentId}`);
  return Math.max(0, dailyAiLimitMinor() - (s?.count ?? 0));
}
