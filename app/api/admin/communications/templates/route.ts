import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { ensureCommsTables } from "@/lib/learn/inbox/db";
import { audit } from "@/lib/admin/audit";
import { TemplateSchema } from "./schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await learnerStaff("manage");
  if (error) return error;
  await ensureCommsTables();
  const templates = await prisma.commsTemplate.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage");
  if (error) return error;
  const parsed = TemplateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid template" }, { status: 400 });
  await ensureCommsTables();
  const t = await prisma.commsTemplate.create({
    data: { id: randomUUID(), ...parsed.data, subjectFr: parsed.data.subjectFr || null, bodyFr: parsed.data.bodyFr || null, createdBy: session.user.email },
  });
  await audit(session, "comms.template.create", { type: "template", id: t.id, label: t.name }, null);
  return NextResponse.json({ ok: true, template: t });
}
