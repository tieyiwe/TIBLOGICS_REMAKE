import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Verify current password
  const stored = await prisma.adminSettings.findUnique({
    where: { key: "admin_password_hash" },
  });

  let currentValid = false;
  // Accept env ADMIN_PASSWORD as master override for current-password verification
  if (process.env.ADMIN_PASSWORD && currentPassword === process.env.ADMIN_PASSWORD) {
    currentValid = true;
  } else if (stored?.value) {
    currentValid = await bcrypt.compare(currentPassword, stored.value);
  }

  if (!currentValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.adminSettings.upsert({
    where: { key: "admin_password_hash" },
    update: { value: hash },
    create: { key: "admin_password_hash", value: hash },
  });

  return NextResponse.json({ success: true });
}
