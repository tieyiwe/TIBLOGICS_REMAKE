import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwnerStudent } from "@/lib/learn/owner";
import { requirePermission } from "@/lib/require-admin";
import { staffAiLimit } from "@/lib/rate-limit";
import { ensureScannerColumns } from "@/lib/scanner/db";
import { unlockByAdmin } from "@/lib/scanner/unlock";

// Staff viewing a locked report: write its fix plan now (unlocks it, one
// model call), same as Unlock in Admin > Scanner leads.

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  // Staff who manage scanner leads, or the owner signed in on their learner account.
  const denied = await requirePermission("scanner_leads:manage");
  if (denied) {
    const sid = (await getServerSession(authOptions).catch(() => null))?.user?.studentId;
    if (!sid || !(await isOwnerStudent(sid))) return denied;
  }
  const limited = await staffAiLimit("scanner-unlock", 30);
  if (limited) return limited;
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureScannerColumns();
  const lead = await prisma.scannerLead.findUnique({ where: { token }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ok = await unlockByAdmin(lead.id);
  return NextResponse.json({ ok, already: !ok });
}
