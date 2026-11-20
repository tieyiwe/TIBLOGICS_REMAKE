import { NextRequest, NextResponse } from "next/server";
import { requireStudent, type StudentSession } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { getMembership, type TeamMembership } from "./access";
import { isManagerRole } from "./config";

// Server-side authorisation for the team APIs. A manager is resolved from the
// signed-in learner's OWN active seat, never from an id in the request, so a
// manager can only ever act on their own team's rows.

type Guarded =
  | { error: NextResponse; student: null; m: null }
  | { error: null; student: StudentSession; m: TeamMembership };

const fail = (error: NextResponse): Guarded => ({ error, student: null, m: null });

export async function teamRateLimit(req: NextRequest, bucket: string, max = 30): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (await checkRateLimit(`learn-team:${bucket}:${ip}`, max, 60_000)) return null;
  const t = await getT();
  return NextResponse.json({ error: t("team.api.tooMany") }, { status: 429 });
}

/** Any member of a team (any status of the team). */
export async function requireTeamMember(): Promise<Guarded> {
  const { error, student } = await requireStudent();
  if (error) return fail(error);
  const m = await getMembership(student.id);
  if (!m) {
    const t = await getT();
    return fail(NextResponse.json({ error: t("team.api.noTeam") }, { status: 404 }));
  }
  return { error: null, student, m };
}

/** Owner or manager. */
export async function requireTeamManager(): Promise<Guarded> {
  const g = await requireTeamMember();
  if (g.error) return g;
  if (!isManagerRole(g.m.role)) {
    const t = await getT();
    return fail(NextResponse.json({ error: t("team.api.managersOnly") }, { status: 403 }));
  }
  return g;
}

/** The team's owner only (billing, seats, roles). */
export async function requireTeamOwner(): Promise<Guarded> {
  const g = await requireTeamMember();
  if (g.error) return g;
  if (g.m.role !== "owner") {
    const t = await getT();
    return fail(NextResponse.json({ error: t("team.api.ownerOnly") }, { status: 403 }));
  }
  return g;
}
