import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, checkRateLimit, secretEquals } from "@/lib/require-admin";

export async function POST(req: Request) {
  // Staff only. A bare session check passed here for TIBLOGICS Learn students
  // too, since learners share this NextAuth instance — requireAdmin rejects them.
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  // This endpoint verifies the owner password, so it is a guessing oracle for
  // any account that reaches it. Bound the attempts.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`change-password:${ip}`, 10, 900_000))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { currentPassword, newPassword } = await req.json();

  // Capped as well as floored: bcrypt only reads the first 72 bytes, so a
  // multi-megabyte string is pure work for the server and no extra strength.
  if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 200) {
    return NextResponse.json({ error: "Password must be between 8 and 200 characters" }, { status: 400 });
  }
  if (typeof currentPassword !== "string") {
    return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  }

  // Verify current password
  const stored = await prisma.adminSettings.findUnique({
    where: { key: "admin_password_hash" },
  });

  let currentValid = false;
  // Accept env ADMIN_PASSWORD as master override for current-password verification
  if (secretEquals(currentPassword, process.env.ADMIN_PASSWORD)) {
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
