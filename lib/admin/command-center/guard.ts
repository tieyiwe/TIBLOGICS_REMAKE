import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sameOrigin } from "@/lib/learn/account-status/admin-auth";
import { hasPermission } from "./permissions";

// Shared request helpers for the Command Center and Finance routes.
//
// Every route calls requirePermission("command_center" | "finance") itself
// (so the route audit sees the guard); these helpers then add the identity,
// the same-origin + JSON check on writes, and a per-person rate limit.

export interface Staff {
  /** "owner" for the owner account, otherwise the Collaborator id. */
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  isAdmin: boolean;
  permissions: string[];
  session: Session;
}

export function staffFromSession(session: Session | null): Staff | null {
  const u = session?.user;
  if (!u || u.studentId) return null;
  if (!(u.isOwner || u.isAdmin || u.collaboratorId)) return null;
  return {
    id: u.collaboratorId ?? "owner",
    name: u.name || u.email || "Owner",
    email: u.email,
    isOwner: !!u.isOwner,
    isAdmin: !!u.isAdmin,
    permissions: u.permissions ?? [],
    session: session!,
  };
}

/** The signed-in staff member, or null. Call after requirePermission. */
export async function currentStaff(): Promise<Staff | null> {
  try {
    return staffFromSession(await getServerSession(authOptions));
  } catch {
    return null;
  }
}

/**
 * Write guard: JSON body (unless `multipart`), same origin, and at most
 * `max` writes per minute per person for this bucket. Null to proceed.
 */
export async function writeGuard(
  req: Request,
  staff: Staff,
  bucket: string,
  opts: { max?: number; multipart?: boolean } = {},
): Promise<NextResponse | null> {
  const type = (req.headers.get("content-type") ?? "").toLowerCase();
  if (opts.multipart ? !type.includes("multipart/form-data") : !type.includes("application/json")) {
    return NextResponse.json({ error: opts.multipart ? "Expected a file upload" : "Expected JSON" }, { status: 415 });
  }
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  if (!(await checkRateLimit(`cc:${bucket}:${staff.id}`, opts.max ?? 120, 60_000))) {
    return NextResponse.json({ error: "Too many changes in a short time. Wait a moment and try again." }, { status: 429 });
  }
  return null;
}

/** Read limit for heavier GETs (exports, search). */
export async function readLimit(staff: Staff, bucket: string, max = 60): Promise<NextResponse | null> {
  if (!(await checkRateLimit(`cc:${bucket}:${staff.id}`, max, 60_000))) {
    return NextResponse.json({ error: "Too many requests. Wait a moment and try again." }, { status: 429 });
  }
  return null;
}

/** Parses a JSON body, null on malformed input. */
export async function jsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function badRequest(error: string, details?: unknown) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status: 400 });
}

export function zodMessage(err: { issues: Array<{ path: (string | number)[]; message: string }> }): string {
  const i = err.issues[0];
  if (!i) return "Invalid input";
  return i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message;
}

/**
 * Page guard: staff with the permission, otherwise the admin home (or the
 * login page when not signed in as staff).
 */
export async function requireCcPage(permission: string): Promise<Staff> {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    redirect("/admin_pro/login");
  }
  const staff = staffFromSession(session);
  if (!staff) redirect("/admin_pro/login");
  if (!hasPermission(session!.user, permission)) redirect("/admin_pro");
  return staff;
}
