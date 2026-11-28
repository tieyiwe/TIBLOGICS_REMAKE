import { NextResponse } from "next/server";
import { requireEntitledStudent, type LearnAccess, type StudentSession } from "@/lib/learn/session";
import { getT, type T } from "@/lib/i18n/server";
import { liveTablesReady } from "./db";

// Shared plumbing for the live session API routes: a signed-in learner with
// at least one open track (subscription, comp, team seat or a purchase;
// otherwise 401 / 402 from requireEntitledStudent) and translated errors.
// Rate limits reuse the community helper (lib/learn/community/api.ts).

export type LiveGuarded =
  | { error: NextResponse; student: null; access: null; t: T }
  | { error: null; student: StudentSession; access: LearnAccess; t: T };

export async function liveGuard(): Promise<LiveGuarded> {
  const t = await getT();
  const g = await requireEntitledStudent();
  if (g.error) return { error: g.error, student: null, access: null, t };
  if (!(await liveTablesReady())) {
    return { error: NextResponse.json({ error: t("live.err.unavailable") }, { status: 503 }), student: null, access: null, t };
  }
  return { error: null, student: g.student, access: g.access, t };
}

export const liveFail = (t: T, key: string, status = 400, vars?: Record<string, string | number>) =>
  NextResponse.json({ error: t(key, vars) }, { status });
