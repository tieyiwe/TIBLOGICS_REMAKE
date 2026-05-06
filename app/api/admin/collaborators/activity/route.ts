import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const session = await getServerSession(authOptions);
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const collaboratorId = searchParams.get("collaboratorId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  const logs = await prisma.collaboratorActivityLog.findMany({
    where: collaboratorId ? { collaboratorId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      collaborator: { select: { name: true, email: true, role: true } },
    },
  });

  return NextResponse.json(logs);
}
