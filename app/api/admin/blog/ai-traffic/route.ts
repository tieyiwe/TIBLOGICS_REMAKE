import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { requirePermission } from "@/lib/require-admin";
import { auditFromRequest } from "@/lib/admin/audit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { DEFAULT_ENTRIES, Entry, saveTrafficEntries, savedTrafficEntries, trafficEntries } from "@/lib/ai-traffic";

// AI vs Humans figures (lib/ai-traffic.ts). AI Times manage access: proxy.ts
// checks the area (lib/admin/access-map.ts), this checks again.
//   GET                     every reading, newest first
//   POST { entry }          add a reading (or replace one with the same id)
//   DELETE { id }           remove a reading

export const dynamic = "force-dynamic";
const PERMISSION = "blog:manage";

export async function GET() {
  const denied = await requirePermission(PERMISSION);
  if (denied) return denied;
  return NextResponse.json({ entries: await trafficEntries(), saved: (await savedTrafficEntries()) !== null });
}

const NewEntry = Entry.innerType().extend({ id: z.string().regex(/^[a-z0-9]{6,32}$/).optional() });

export async function POST(req: NextRequest) {
  const bad = csrfGuard(req);
  if (bad) return bad;
  const denied = await requirePermission(PERMISSION);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { entry?: unknown } | null;
  const parsed = NewEntry.safeParse(body?.entry);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid figures" }, { status: 400 });
  const entry = { ...parsed.data, id: parsed.data.id ?? randomBytes(6).toString("hex") };
  const check = Entry.safeParse(entry);
  if (!check.success) return NextResponse.json({ error: check.error.issues[0]?.message ?? "Invalid figures" }, { status: 400 });
  const current = (await savedTrafficEntries()) ?? DEFAULT_ENTRIES;
  await saveTrafficEntries([...current.filter((e) => e.id !== entry.id), check.data]);
  await auditFromRequest("ai_traffic.save", { type: "setting", id: entry.id }, { date: entry.date, botsPct: entry.botsPct, source: entry.source }).catch(() => {});
  return NextResponse.json({ entries: await savedTrafficEntries() });
}

export async function DELETE(req: NextRequest) {
  const bad = csrfGuard(req);
  if (bad) return bad;
  const denied = await requirePermission(PERMISSION);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const current = (await savedTrafficEntries()) ?? DEFAULT_ENTRIES;
  const next = current.filter((e) => e.id !== id);
  if (next.length === current.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!next.length) return NextResponse.json({ error: "Keep at least one reading" }, { status: 400 });
  await saveTrafficEntries(next);
  await auditFromRequest("ai_traffic.delete", { type: "setting", id }).catch(() => {});
  return NextResponse.json({ entries: await savedTrafficEntries() });
}
