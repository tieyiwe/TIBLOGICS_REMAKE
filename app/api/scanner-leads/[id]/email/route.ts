import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidEmail } from "@/lib/require-admin";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    if (!isValidEmail(body.email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (body.name && (typeof body.name !== "string" || body.name.length > 100)) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const lead = await prisma.scannerLead.update({
      where: { id },
      data: {
        email: body.email.toLowerCase().trim(),
        name: body.name ? body.name.trim().slice(0, 100) : undefined,
      },
    });
    return NextResponse.json(lead);
  } catch (error) {
    console.error("[PATCH /api/scanner-leads/[id]/email]", error);
    return NextResponse.json({ error: "Failed to update scanner lead email" }, { status: 500 });
  }
}
