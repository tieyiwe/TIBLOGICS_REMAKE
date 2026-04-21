import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requireAdmin, escapeHtml } from "@/lib/require-admin";
import resend from "@/lib/resend";
import crypto from "crypto";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const session = await getServerSession(authOptions);
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const collab = await prisma.collaborator.findUnique({ where: { id } });
  if (!collab) return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });

  // Only Owner can reset password for admin collaborators
  if (collab.isAdmin && !session.user.isOwner) {
    return NextResponse.json({ error: "Only the Owner can reset an admin collaborator's password" }, { status: 403 });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.collaborator.update({
    where: { id },
    data: { inviteToken: resetToken, inviteExpires: resetExpires },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/accept-invite?token=${resetToken}`;
  const safeName = escapeHtml(collab.name);

  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: collab.email,
    subject: "Reset your TIBLOGICS admin password",
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(27,58,107,0.10);">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0D1B2A;margin:0 0 12px;">Hi ${safeName},</h2>
      <p style="color:#3A4A5C;line-height:1.7;">Your TIBLOGICS admin password has been reset. Click the button below to set a new password.</p>
      <div style="margin:24px 0;text-align:center;">
        <a href="${resetUrl}" style="display:inline-block;background:#F47C20;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">Set New Password →</a>
      </div>
      <p style="color:#7A8FA6;font-size:13px;">This link expires in 24 hours. If you didn't request this, contact your admin immediately.</p>
    </div>
  </div>
</body></html>`,
  }).catch(() => {});

  return NextResponse.json({ success: true, resetUrl });
}
