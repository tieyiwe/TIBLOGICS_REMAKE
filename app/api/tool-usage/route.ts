import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, sessionId, metadata } = body;

    await prisma.toolUsage.create({
      data: { tool, sessionId, metadata },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/tool-usage]", error);
    return NextResponse.json(
      { error: "Failed to log tool usage" },
      { status: 500 }
    );
  }
}
