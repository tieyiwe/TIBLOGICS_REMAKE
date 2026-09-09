import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const recoverRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRecoverRate(ip: string): boolean {
  const now = Date.now();
  const entry = recoverRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    recoverRateLimit.set(ip, { count: 1, resetAt: now + 3600000 }); // 1-hr window
    return true;
  }
  if (entry.count >= 5) return false; // max 5 attempts/hr
  entry.count++;
  return true;
}

// No session required — this is the locked-out recovery path.
// Caller must supply the ADMIN_PASSWORD env var value as proof of ownership.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRecoverRate(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const { masterPassword, newPassword } = await req.json();

    if (!masterPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    // ADMIN_PASSWORD env var is required — without it this endpoint is disabled
    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Recovery is disabled: ADMIN_PASSWORD environment variable is not set." },
        { status: 503 }
      );
    }

    if (masterPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Incorrect recovery password" }, { status: 403 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.adminSettings.upsert({
      where: { key: "admin_password_hash" },
      update: { value: hash },
      create: { key: "admin_password_hash", value: hash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/recover-password]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
