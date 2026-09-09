import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 900000 }); // 15-min window
    return true;
  }
  if (entry.count >= 5) return false; // max 5 attempts per 15 min
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { token, password } = await req.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const collab = await prisma.collaborator.findUnique({ where: { inviteToken: token } });

  if (!collab) {
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
  }
  if (collab.inviteExpires && collab.inviteExpires < new Date()) {
    return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.collaborator.update({
    where: { id: collab.id },
    data: {
      passwordHash,
      inviteToken: null,
      inviteExpires: null,
      active: true,
    },
  });

  return NextResponse.json({ success: true });
}
