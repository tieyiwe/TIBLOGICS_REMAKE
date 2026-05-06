import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const VALID_ROLES = ["FULL", "SUPPORT", "EDITOR", "ANALYST", "CUSTOM"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const session = await getServerSession(authOptions);
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, role, permissions, active, isAdmin } = body;
  const data: Record<string, unknown> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.length > 100) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    data.role = role;
  }
  if (permissions !== undefined) {
    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "Invalid permissions" }, { status: 400 });
    }
    data.permissions = permissions;
  }
  if (active !== undefined) {
    data.active = Boolean(active);
  }
  // Only the Owner can grant or revoke admin access
  if (isAdmin !== undefined) {
    if (!session.user.isOwner) {
      return NextResponse.json({ error: "Only the Owner can grant or revoke admin access" }, { status: 403 });
    }
    data.isAdmin = Boolean(isAdmin);
  }

  try {
    const updated = await prisma.collaborator.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true, role: true,
        permissions: true, isAdmin: true, active: true, lastLoginAt: true,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const session = await getServerSession(authOptions);
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.collaborator.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
  }
}
