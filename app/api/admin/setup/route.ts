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

// DELETE — clears the stored password hash so the one-time setup flow is
// triggered again on the next visit to /admin_pro/login.
// Requires either the current password or the RESET_TOKEN env var.
export async function DELETE(req: NextRequest) {
  try {
    const { password, resetToken } = await req.json().catch(() => ({}));

    // Check reset token first (for production recovery)
    if (process.env.RESET_TOKEN && resetToken === process.env.RESET_TOKEN) {
      await prisma.adminSettings.deleteMany({ where: { key: "admin_password_hash" } });
      return NextResponse.json({ success: true, message: "Password reset. Visit /admin_pro/login to set a new one." });
    }

    // Otherwise require the current password
    if (!password) {
      return NextResponse.json({ error: "Provide current password or RESET_TOKEN" }, { status: 400 });
    }

    const stored = await prisma.adminSettings.findUnique({ where: { key: "admin_password_hash" } });
    if (!stored) {
      return NextResponse.json({ error: "No password configured" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, stored.value);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
    }

    await prisma.adminSettings.delete({ where: { key: "admin_password_hash" } });
    return NextResponse.json({ success: true, message: "Password reset. Visit /admin_pro/login to set a new one." });
  } catch (err) {
    console.error("[admin/setup DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
