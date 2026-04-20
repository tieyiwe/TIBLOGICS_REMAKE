import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { status } = await req.json();
    const validStatuses = ["NEW", "CONTACTED", "IN_PROGRESS", "COMPLETED", "CLOSED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const updated = await prisma.serviceRequest.update({ where: { id: params.id }, data: { status } });
    return NextResponse.json({ request: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
