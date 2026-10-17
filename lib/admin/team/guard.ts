// Request guard for /api/admin/team/*: a staff session (never a learner),
// the Team & Roles permission at the right level, same-origin JSON for
// writes, and a per-person rate limit. The finer rules (owner, admins,
// escalation) are in service.ts.
import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard, sameOrigin } from "@/lib/learn/account-status/admin-auth";
import { can } from "@/lib/admin/permissions";
import { TeamError } from "./service";

type Ok = { session: Session; error: null };
type Err = { session: null; error: NextResponse };

const deny = (status: number, error: string): Err => ({ session: null, error: NextResponse.json({ error }, { status }) });

export async function teamApi(req: Request, need: "view" | "manage" | "admin"): Promise<Ok | Err> {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return deny(401, "Unauthorized");
  }
  const u = session?.user;
  if (!u) return deny(401, "Unauthorized");
  if (u.studentId || !(u.isOwner || u.isAdmin || u.collaboratorId)) return deny(403, "Forbidden");
  const ok = need === "admin" ? can(u, "__admin__") : can(u, need === "manage" ? "team:manage" : "team");
  if (!ok) return deny(403, need === "admin" ? "Only the owner or an admin can do this." : "You do not have access to Team & Roles.");
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.method === "DELETE") {
      if (!sameOrigin(req)) return deny(403, "Cross-site request refused");
    } else {
      const bad = csrfGuard(req);
      if (bad) return { session: null, error: bad };
    }
    if (!(await checkRateLimit(`team-write:${u.email}`, 60, 60_000))) return deny(429, "Too many changes in a minute. Wait a moment.");
  } else if (!(await checkRateLimit(`team-read:${u.email}`, 240, 60_000))) {
    return deny(429, "Too many requests. Wait a moment.");
  }
  return { session: session!, error: null };
}

export function teamError(err: unknown, where: string): NextResponse {
  if (err instanceof TeamError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof ZodError) {
    const i = err.issues[0];
    return NextResponse.json({ error: i ? (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message) : "Invalid input" }, { status: 400 });
  }
  console.error(`[team] ${where}`, err);
  return NextResponse.json({ error: "Something went wrong. Nothing was changed." }, { status: 500 });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new TeamError("Invalid request body.");
  }
}
