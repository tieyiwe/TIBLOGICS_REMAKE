import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, forgetCollaboratorSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { validPermissions } from "@/lib/admin/permissions-input";

const VALID_ROLES = ["FULL", "SUPPORT", "EDITOR", "ANALYST", "CUSTOM"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const session = await getServerSession(authOptions);
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
    // Plain permission names only. "*" means everything (as admin does), so
    // only the Owner may hand it out, like the admin flag below.
    const perms = validPermissions(permissions, !!session.user.isOwner);
    if (!perms) {
      return NextResponse.json({ error: "Invalid permissions" }, { status: 400 });
    }
    data.permissions = perms;
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
    // Deactivation and permission changes reach the collaborator's open
    // session on their next request (lib/auth.ts jwt callback).
    forgetCollaboratorSession(id);
    await audit(session, "collaborator.update", { type: "collaborator", id, label: updated.email }, {
      changed: Object.keys(data),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.isAdmin !== undefined ? { isAdmin: data.isAdmin } : {}),
      ...(data.permissions !== undefined ? { permissions: data.permissions } : {}),
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
    const gone = await prisma.collaborator.delete({ where: { id }, select: { email: true } });
    forgetCollaboratorSession(id);
    await audit(session, "collaborator.delete", { type: "collaborator", id, label: gone.email });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
  }
}
