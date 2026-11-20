import { NextRequest, NextResponse } from "next/server";
import { boundedObject } from "@/lib/validate/json";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isTrackablePath, normalizePath } from "@/lib/analytics/paths";

export async function POST(req: NextRequest) {
  // Public beacon; a generous cap so it cannot be used to flood the table.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!(await checkRateLimit(`analytics-event:${ip}`, ip === "unknown" ? 3000 : 300, 10 * 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { event, page, sessionId, meta } = await req.json();
    if (!event || typeof event !== "string") return NextResponse.json({ ok: true });

    await prisma.toolUsage.create({
      data: {
        tool: event.slice(0, 100),
        sessionId: sessionId ? String(sessionId).slice(0, 64) : null,
        // Paths are grouped and never carry a query or a token (lib/analytics/paths.ts).
        metadata: { page: typeof page === "string" && isTrackablePath(page) ? normalizePath(page) : null, ...(boundedObject(meta) ?? {}) },
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
