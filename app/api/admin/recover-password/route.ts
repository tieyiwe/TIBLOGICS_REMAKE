import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// No session required — this is the locked-out recovery path.
// Caller must supply the ADMIN_PASSWORD env var value as proof of ownership.
export async function POST(req: NextRequest) {
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
        { error: "Recovery is disabled: ADMIN_PASSWORD env var is not set. Set it in Replit Secrets to enable this." },
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
