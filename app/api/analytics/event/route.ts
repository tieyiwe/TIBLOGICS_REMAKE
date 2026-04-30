import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { event, page, sessionId, meta } = await req.json();
    if (!event || typeof event !== "string") return NextResponse.json({ ok: true });

    await prisma.toolUsage.create({
      data: {
        tool: event.slice(0, 100),
        sessionId: sessionId ? String(sessionId).slice(0, 64) : null,
        metadata: { page: page ?? null, ...((meta && typeof meta === "object") ? meta : {}) },
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
