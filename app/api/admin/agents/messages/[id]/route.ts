import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requirePermission("agents");
  if (unauth) return unauth;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  // Only the read flag is editable; never pass the raw body to Prisma.
  if (typeof body?.read !== "boolean") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const msg = await prisma.agentMessage.update({ where: { id }, data: { read: body.read } });
  return NextResponse.json(msg);
}
