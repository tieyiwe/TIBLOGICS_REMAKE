import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const history = await prisma.commandCenterSync.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(history);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
