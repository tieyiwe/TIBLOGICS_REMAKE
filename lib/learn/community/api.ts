import { NextResponse } from "next/server";
import { requireEntitledStudent, type LearnAccess, type StudentSession } from "@/lib/learn/session";
import { getT, type T } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { communityTablesReady } from "./db";
import type { TrackScope } from "./discussion";

// Shared plumbing for the community API routes: the signed-in learner with
// an open track, the tracks they can open, translated errors, rate limits.

export type Guarded =
  | { error: NextResponse; student: null; access: null; tracks: null; t: T }
  | { error: null; student: StudentSession; access: LearnAccess; tracks: TrackScope; t: T };

export async function communityGuard(): Promise<Guarded> {
  const t = await getT();
  const g = await requireEntitledStudent();
  if (g.error) return { error: g.error, student: null, access: null, tracks: null, t };
  if (!(await communityTablesReady())) {
    return { error: NextResponse.json({ error: t("community.err.unavailable") }, { status: 503 }), student: null, access: null, tracks: null, t };
  }
  return { error: null, student: g.student, access: g.access, tracks: g.access.all ? "all" : g.access.purchased, t };
}

export const fail = (t: T, key: string, status = 400, vars?: Record<string, string | number>) =>
  NextResponse.json({ error: t(key, vars) }, { status });

/** False when the learner has hit this limit. */
export function limited(kind: string, studentId: string, max: number, windowMs: number): Promise<boolean> {
  return checkRateLimit(`community:${kind}:${studentId}`, max, windowMs).then((ok) => !ok);
}

/** Trimmed string or "" from an unknown JSON field. */
export const str = (v: unknown, max = 20000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
