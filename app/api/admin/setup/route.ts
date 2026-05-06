import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const existing = await prisma.adminSettings.findUnique({
      where: { key: "admin_password_hash" },
    });

    // Auto-seed from ADMIN_PASSWORD env var if hash not yet in DB
    if (!existing && process.env.ADMIN_PASSWORD) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await prisma.adminSettings.create({
        data: { key: "admin_password_hash", value: hash },
      }).catch(() => {});
      return NextResponse.json({ needsSetup: false, autoSeeded: true });
    }

    return NextResponse.json({ needsSetup: !existing });
  } catch {
    return NextResponse.json({ needsSetup: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.adminSettings.findUnique({
      where: { key: "admin_password_hash" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Admin password already configured" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    await prisma.adminSettings.create({
      data: { key: "admin_password_hash", value: hash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/setup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
