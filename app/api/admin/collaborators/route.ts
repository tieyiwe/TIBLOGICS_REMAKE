import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requireAdmin, isValidEmail, escapeHtml } from "@/lib/require-admin";
import resend from "@/lib/resend";
import crypto from "crypto";

export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const session = await getServerSession(authOptions);
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const collaborators = await prisma.collaborator.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true,
      permissions: true, isAdmin: true, active: true, inviteToken: true,
      inviteExpires: true, invitedBy: true, lastLoginAt: true, createdAt: true,
      passwordHash: false,
    },
  });

  return NextResponse.json(collaborators);
}

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const session = await getServerSession(authOptions);
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, role, permissions } = await req.json();

  if (!name || typeof name !== "string" || name.length > 100) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!Array.isArray(permissions)) {
    return NextResponse.json({ error: "Invalid permissions" }, { status: 400 });
  }

  const existing = await prisma.collaborator.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "A collaborator with this email already exists" }, { status: 409 });
  }

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const collaborator = await prisma.collaborator.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      role: role ?? "CUSTOM",
      permissions,
      inviteToken,
      inviteExpires,
      invitedBy: session.user.email,
    },
  });

  // Send invitation email
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/accept-invite?token=${inviteToken}`;
  const safeName = escapeHtml(name.trim());

  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: email,
    subject: `You've been invited to TIBLOGICS Admin`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(27,58,107,0.10);">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0D1B2A;margin:0 0 12px;">Hi ${safeName},</h2>
      <p style="color:#3A4A5C;line-height:1.7;">You've been invited to collaborate on the TIBLOGICS admin panel with the following access level: <strong>${escapeHtml(role ?? "CUSTOM")}</strong>.</p>
      <div style="margin:24px 0;text-align:center;">
        <a href="${inviteUrl}" style="display:inline-block;background:#F47C20;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">Accept Invitation →</a>
      </div>
      <p style="color:#7A8FA6;font-size:13px;">This link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body></html>`,
  }).catch(() => {});

  return NextResponse.json({
    id: collaborator.id,
    message: "Invitation sent",
    inviteUrl,
  }, { status: 201 });
}
