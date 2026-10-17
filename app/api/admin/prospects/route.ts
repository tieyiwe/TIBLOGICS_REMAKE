import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { listLimit } from "@/lib/admin/list-limit";

export async function GET(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const archived = searchParams.get("archived") === "true";

  const prospects = await prisma.prospect.findMany({
    where: { archived },
    orderBy: { createdAt: "desc" },
    take: listLimit(req.url),
  });

  return NextResponse.json(prospects);
}
