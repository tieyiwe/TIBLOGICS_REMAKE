import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Public and keyed on a confirmation number alone, so capped against guessing.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!(await checkRateLimit(`event-cancel:${ip}`, ip === "unknown" ? 200 : 20, 60 * 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { confirmationNumber } = await req.json();
    if (!confirmationNumber || typeof confirmationNumber !== "string") {
      return NextResponse.json({ error: "Missing confirmationNumber" }, { status: 400 });
    }

    const reg = await prisma.eventRegistration.findUnique({
      where: { confirmationNumber },
      select: { id: true, status: true },
    });

    if (!reg) return NextResponse.json({ ok: true }); // silently ignore unknown

    // Only cancel if still pending — don't downgrade a paid registration
    if (reg.status === "pending") {
      await prisma.eventRegistration.update({
        where: { id: reg.id },
        data: { status: "cancelled" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cancel-registration]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: true }); // non-fatal — don't break the page
  }
}
