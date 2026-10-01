import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureOutreachTables } from "./db";

// Growth leads/outreach is admin-only. Collaborators can be let in to the
// lead workspace with the "growth" permission; approving and sending email is
// reserved to admins (or a collaborator holding "*"), because it speaks for
// the business to strangers.

export const GROWTH_PERMISSION = "growth";

async function tablesOr500(): Promise<NextResponse | null> {
  try {
    await ensureOutreachTables();
    return null;
  } catch (err) {
    console.error("[growth/outreach] tables", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

/** Lead workspace access (view, edit, enrich, enrol, draft). */
export async function requireGrowth(): Promise<NextResponse | null> {
  return (await requirePermission(GROWTH_PERMISSION)) ?? (await tablesOr500());
}

/** Approving and sending: admin or "*" only. */
export async function requireSender(): Promise<NextResponse | null> {
  return (await requirePermission("*")) ?? (await tablesOr500());
}

/**
 * Per-user hourly cap on the AI calls the "growth" permission can trigger
 * (drafts, personalisation, enrichment). Without it a collaborator could loop
 * these endpoints and run up model spend; the admin-only routes have their own.
 */
export async function limitGrowthAi(bucket: string, max: number): Promise<NextResponse | null> {
  let who = "anon";
  try {
    const s = await getServerSession(authOptions);
    who = s?.user?.id ?? s?.user?.email ?? "anon";
  } catch { /* keyed as anon */ }
  if (await checkRateLimit(`growth-ai:${bucket}:${who}`, max, 3_600_000)) return null;
  return NextResponse.json({ error: "Too many AI requests this hour. Try again later." }, { status: 429 });
}

export async function actorName(): Promise<string> {
  try {
    const s = await getServerSession(authOptions);
    return s?.user?.email ?? s?.user?.name ?? "admin";
  } catch {
    return "admin";
  }
}

/** Page twin: staff with "growth" or admin; redirects otherwise. */
export async function requireGrowthPage(): Promise<{ session: Session; canSend: boolean }> {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    redirect("/admin_pro/login");
  }
  if (!session) redirect("/admin_pro/login");
  const u = session.user;
  if (u?.studentId) redirect("/admin_pro/login");
  if (!(u?.isOwner || u?.isAdmin || u?.collaboratorId)) redirect("/admin_pro/login");
  const perms: string[] = u?.permissions ?? [];
  const canSend = !!(u.isAdmin || perms.includes("*"));
  if (!canSend && !perms.includes(GROWTH_PERMISSION)) redirect("/admin_pro");
  await ensureOutreachTables();
  return { session, canSend };
}
