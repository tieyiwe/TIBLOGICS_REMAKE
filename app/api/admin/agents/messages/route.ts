import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const toAgent = searchParams.get("toAgent");
  const unreadOnly = searchParams.get("unread") === "true";

  const messages = await prisma.agentMessage.findMany({
    where: {
      ...(toAgent ? { toAgent } : {}),
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const msg = await prisma.agentMessage.create({ data: body });
  return NextResponse.json(msg, { status: 201 });
}
