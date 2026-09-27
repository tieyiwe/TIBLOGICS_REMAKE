import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/require-admin";

// Unauthenticated analytics write. Same shape as /api/analytics/event, which
// already caps its fields — this one passed the request through untouched, so
// any caller could fill the table with rows of arbitrary size.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`tool-usage:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { tool, sessionId, metadata } = body;

    if (!tool || typeof tool !== "string") {
      return NextResponse.json({ error: "tool required" }, { status: 400 });
    }

    await prisma.toolUsage.create({
      data: {
        tool: tool.slice(0, 100),
        sessionId: typeof sessionId === "string" ? sessionId.slice(0, 64) : null,
        metadata: metadata && typeof metadata === "object" ? metadata : undefined,
      },
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
