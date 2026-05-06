import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
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
