import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const assignedTo = searchParams.get("assignedTo");
  const fromAgent = searchParams.get("fromAgent");
  const status = searchParams.get("status");

  const leads = await prisma.agentLead.findMany({
    where: {
      ...(assignedTo ? { assignedTo } : {}),
      ...(fromAgent ? { fromAgent } : {}),
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const body = await req.json();
  const lead = await prisma.agentLead.create({ data: body });
  return NextResponse.json(lead, { status: 201 });
}
