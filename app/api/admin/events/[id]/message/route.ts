import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { default as mailer } from "@/lib/resend";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { subject, body, recipients } = await req.json();

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "subject and body required" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id }, select: { slug: true, title: true } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let where: Record<string, unknown> = { eventSlug: event.slug };
  if (recipients === "confirmed") where = { ...where, status: "confirmed" };
  if (recipients === "pending") where = { ...where, status: "pending" };

  const regs = await prisma.eventRegistration.findMany({ where, select: { email: true, firstName: true } });
  if (regs.length === 0) return NextResponse.json({ sent: 0, error: "No matching participants" });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:24px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:22px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
        <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;">${event.title}</p>
      </div>
      <div style="padding:32px;background:white;">
        ${body.replace(/\n/g, "<br/>")}
        <p style="color:#7A8FA6;font-size:13px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">
          This message was sent to ${event.title} participants by TIBLOGICS.<br/>
          Questions? Reply to this email or write to design@tiblogics.com
        </p>
      </div>
    </div>`;

  let sent = 0;
  const errors: string[] = [];

  for (const reg of regs) {
    try {
      await mailer.emails.send({
        to: reg.email,
        subject,
        html: html.replace("{{firstName}}", reg.firstName),
      });
      sent++;
    } catch (e) {
      errors.push(reg.email);
      console.error("[event/message]", reg.email, e);
    }
  }

  return NextResponse.json({ sent, total: regs.length, errors });
}
