import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { csrfGuard, learnerStaff, sameOrigin } from "@/lib/learn/account-status/admin-auth";
import { ensureCommsTables } from "@/lib/learn/inbox/db";
import { audit } from "@/lib/admin/audit";
import { TemplateSchema } from "../schema";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage", "communications");
  if (error) return error;
  const { id } = await params;
  const parsed = TemplateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid template" }, { status: 400 });
  await ensureCommsTables();
  const r = await prisma.commsTemplate.updateMany({
    where: { id },
    data: { ...parsed.data, subjectFr: parsed.data.subjectFr || null, bodyFr: parsed.data.bodyFr || null, updatedAt: new Date() },
  });
  if (!r.count) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  await audit(session, "comms.template.update", { type: "template", id, label: parsed.data.name }, null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  const { session, error } = await learnerStaff("manage", "communications");
  if (error) return error;
  const { id } = await params;
  await ensureCommsTables();
  const r = await prisma.commsTemplate.deleteMany({ where: { id } });
  if (!r.count) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  await audit(session, "comms.template.delete", { type: "template", id }, null);
  return NextResponse.json({ ok: true });
}
