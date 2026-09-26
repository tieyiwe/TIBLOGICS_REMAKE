import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const Body = z.object({ revoked: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const cert = await prisma.learnCertificate.update({
      where: { id },
      data: { revoked: parsed.data.revoked },
      select: { id: true, verificationId: true, revoked: true, recipientName: true, certificateName: true },
    });
    return NextResponse.json({ ok: true, certificate: cert });
  } catch (err) {
    console.error("[PATCH /api/admin/learn/certificate/[id]]", err);
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
}
