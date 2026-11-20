import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireGrowthAdmin } from "../content-auth";
import { acquireTablesReady } from "./db";
import { isSameSiteJson, isSameSiteRequest } from "./security";

// Acquisition admin APIs: Growth admins only (admin, owner or "*"), JSON
// from this site only for anything that changes data.

export async function requireAcquireAdmin(req?: Request): Promise<NextResponse | null> {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  if (req && req.method !== "GET" && req.method !== "DELETE" && !isSameSiteJson(req)) {
    return NextResponse.json({ error: "Send JSON from the admin." }, { status: 403 });
  }
  if (req && req.method === "DELETE" && !isSameSiteRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await acquireTablesReady())) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  return null;
}

export async function actor(): Promise<string> {
  try {
    const s = await getServerSession(authOptions);
    return s?.user?.email ?? s?.user?.name ?? "admin";
  } catch {
    return "admin";
  }
}
