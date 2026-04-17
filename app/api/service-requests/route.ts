import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import resend from "@/lib/resend";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  try {
    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    const requests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ requests: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, company, service, description, budget, timeline, tiboAssisted, aiSummary } = body;

    if (!firstName || !lastName || !email || !service || !description) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const request = await prisma.serviceRequest.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        company: company || null,
        service,
        description,
        budget: budget || null,
        timeline: timeline || null,
        tiboAssisted: tiboAssisted ?? false,
        aiSummary: aiSummary || null,
        status: "NEW",
      },
    });

    // Send confirmation email to client
    await sendClientConfirmation({ firstName, lastName, email, service, description });

    // Notify team
    await sendTeamNotification({ firstName, lastName, email, phone, company, service, description, budget, timeline, tiboAssisted });

    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    console.error("Service request error:", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}

async function sendClientConfirmation(data: {
  firstName: string;
  lastName: string;
  email: string;
  service: string;
  description: string;
}) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: data.email,
    subject: `We received your project details — TIBLOGICS`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(27,58,107,0.08);">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:36px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:28px;letter-spacing:-0.5px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">AI Implementation & Digital Solutions</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#0D1B2A;font-size:22px;margin:0 0 8px;">Hey ${data.firstName}! We got it 👋</h2>
      <p style="color:#3A4A5C;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Thank you for reaching out. Your project details have been received and our team is already reviewing them.
        We'll be in touch within <strong>1–2 business days</strong> with next steps.
      </p>
      <div style="background:#F4F7FB;border-radius:12px;padding:20px 24px;margin-bottom:28px;border-left:4px solid #F47C20;">
        <p style="margin:0 0 8px;font-size:13px;color:#7A8FA6;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Your Request Summary</p>
        <p style="margin:0 0 6px;font-size:15px;color:#0D1B2A;"><strong>Service:</strong> ${data.service}</p>
        <p style="margin:0;font-size:14px;color:#3A4A5C;line-height:1.6;">${data.description}</p>
      </div>
      <p style="color:#3A4A5C;font-size:15px;line-height:1.7;margin:0 0 28px;">
        While you wait, feel free to explore our free tools or chat with <strong>Tibo</strong>, our AI assistant who can answer any questions about our services.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}/tools/advisor"
           style="display:inline-block;background:#F47C20;color:white;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px;font-weight:600;margin-right:12px;">
          Talk to Tibo ↗
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}/blog"
           style="display:inline-block;background:#EBF0FA;color:#1B3A6B;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px;font-weight:600;">
          Read Our Blog
        </a>
      </div>
    </div>
    <div style="background:#F4F7FB;padding:20px 32px;text-align:center;">
      <p style="color:#7A8FA6;font-size:12px;margin:0;">
        Questions? Reply to this email or reach us at <a href="mailto:ai@tiblogics.com" style="color:#2251A3;">ai@tiblogics.com</a><br>
        TIBLOGICS · Wheaton, Maryland · <a href="https://tiblogics.com" style="color:#2251A3;">tiblogics.com</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  }).catch(() => {});
}

async function sendTeamNotification(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  description: string;
  budget?: string;
  timeline?: string;
  tiboAssisted?: boolean;
}) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: process.env.TIWE_EMAIL ?? "ai@tiblogics.com",
    subject: `🚀 New Service Request — ${data.service} from ${data.firstName} ${data.lastName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1B3A6B;">New Service Request</h2>
        <div style="background:#F4F7FB;border-radius:12px;padding:20px;margin:16px 0;">
          <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
          ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ""}
          <p><strong>Service:</strong> ${data.service}</p>
          ${data.budget ? `<p><strong>Budget:</strong> ${data.budget}</p>` : ""}
          ${data.timeline ? `<p><strong>Timeline:</strong> ${data.timeline}</p>` : ""}
          ${data.tiboAssisted ? `<p><strong>Tibo Assisted:</strong> Yes ✨</p>` : ""}
          <p><strong>Description:</strong></p>
          <p style="color:#3A4A5C;">${data.description}</p>
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}/admin/service-requests" style="color:#F47C20;">View in Admin →</a></p>
      </div>
    `,
  }).catch(() => {});
}
