import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { secretEquals } from "@/lib/require-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { anonymiseIp } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";

// No session required — this is the locked-out recovery path.
// Caller must supply the ADMIN_PASSWORD env var value as proof of ownership.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`admin-recover:${ip}`, 5, 3_600_000))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const { masterPassword, newPassword } = await req.json();

    if (!masterPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 200) {
      return NextResponse.json({ error: "New password must be between 8 and 200 characters" }, { status: 400 });
    }

    // ADMIN_PASSWORD env var is required — without it this endpoint is disabled
    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Recovery is disabled: ADMIN_PASSWORD environment variable is not set." },
        { status: 503 }
      );
    }

    // Constant-time: this is a sessionless endpoint that hands out the admin
    // password on a correct guess, so it must not leak a prefix-match signal.
    if (!secretEquals(masterPassword, process.env.ADMIN_PASSWORD)) {
      return NextResponse.json({ error: "Incorrect recovery password" }, { status: 403 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.adminSettings.upsert({
      where: { key: "admin_password_hash" },
      update: { value: hash },
      create: { key: "admin_password_hash", value: hash },
    });
    await audit({ email: "anonymous", name: "Password recovery", role: "anonymous" }, "owner.password.recover", { type: "owner" }, { ip: anonymiseIp(ip) });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/recover-password]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
