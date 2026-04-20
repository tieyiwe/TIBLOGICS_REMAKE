import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import resend from "@/lib/resend";
import { requireAdmin, isValidEmail, escapeHtml } from "@/lib/require-admin";

// GET is admin-only — POST is public (client submits request)
export async function GET(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  try {
    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    const requests = await prisma.serviceRequest.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ requests: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, company, service, description, budget, timeline, tiboAssisted, aiSummary } = body;

    // Validate required fields
    if (!firstName || typeof firstName !== "string" || firstName.length > 100) {
      return NextResponse.json({ error: "Invalid first name" }, { status: 400 });
    }
    if (!lastName || typeof lastName !== "string" || lastName.length > 100) {
      return NextResponse.json({ error: "Invalid last name" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!service || typeof service !== "string" || service.length > 200) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.length > 5000) {
      return NextResponse.json({ error: "Description required (max 5000 chars)" }, { status: 400 });
    }

    const request = await prisma.serviceRequest.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: typeof phone === "string" ? phone.slice(0, 30) : null,
        company: typeof company === "string" ? company.slice(0, 200) : null,
        service,
        description,
        budget: typeof budget === "string" ? budget.slice(0, 100) : null,
        timeline: typeof timeline === "string" ? timeline.slice(0, 100) : null,
        tiboAssisted: tiboAssisted === true,
        aiSummary: typeof aiSummary === "string" ? aiSummary.slice(0, 2000) : null,
        status: "NEW",
      },
    });

    await sendClientConfirmation({ firstName: request.firstName, lastName: request.lastName, email: request.email, service: request.service, description: request.description });
    await sendTeamNotification({ firstName: request.firstName, lastName: request.lastName, email: request.email, phone: request.phone ?? undefined, company: request.company ?? undefined, service: request.service, description: request.description, budget: request.budget ?? undefined, timeline: request.timeline ?? undefined, tiboAssisted: request.tiboAssisted });

    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    console.error("Service request error:", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}

async function sendClientConfirmation(data: { firstName: string; lastName: string; email: string; service: string; description: string }) {
  const safeFirst = escapeHtml(data.firstName);
  const safeService = escapeHtml(data.service);
  const safeDesc = escapeHtml(data.description.slice(0, 500));
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: data.email,
    subject: `We received your project details — TIBLOGICS`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(27,58,107,0.08);">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:36px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:28px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">AI Implementation &amp; Digital Solutions</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#0D1B2A;font-size:22px;margin:0 0 8px;">Hey ${safeFirst}! We got it 👋</h2>
      <p style="color:#3A4A5C;font-size:15px;line-height:1.7;margin:0 0 24px;">Your project details have been received. We'll be in touch within <strong>1–2 business days</strong> with next steps.</p>
      <div style="background:#F4F7FB;border-radius:12px;padding:20px 24px;margin-bottom:28px;border-left:4px solid #F47C20;">
        <p style="margin:0 0 8px;font-size:13px;color:#7A8FA6;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Your Request Summary</p>
        <p style="margin:0 0 6px;font-size:15px;color:#0D1B2A;"><strong>Service:</strong> ${safeService}</p>
        <p style="margin:0;font-size:14px;color:#3A4A5C;line-height:1.6;">${safeDesc}</p>
      </div>
    </div>
    <div style="background:#F4F7FB;padding:20px 32px;text-align:center;">
      <p style="color:#7A8FA6;font-size:12px;margin:0;">Questions? Reply or email <a href="mailto:info@tiblogics.com" style="color:#2251A3;">info@tiblogics.com</a><br>TIBLOGICS</p>
    </div>
  </div>
</body></html>`,
  }).catch(() => {});
}

async function sendTeamNotification(data: { firstName: string; lastName: string; email: string; phone?: string; company?: string; service: string; description: string; budget?: string; timeline?: string; tiboAssisted?: boolean }) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: process.env.DESIGN_EMAIL ?? "design@tiblogics.com",
    subject: `🚀 New Service Request — ${data.service} from ${data.firstName} ${data.lastName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1B3A6B;">New Service Request</h2>
      <div style="background:#F4F7FB;border-radius:12px;padding:20px;margin:16px 0;">
        <p><strong>Name:</strong> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>` : ""}
        ${data.company ? `<p><strong>Company:</strong> ${escapeHtml(data.company)}</p>` : ""}
        <p><strong>Service:</strong> ${escapeHtml(data.service)}</p>
        ${data.budget ? `<p><strong>Budget:</strong> ${escapeHtml(data.budget)}</p>` : ""}
        ${data.timeline ? `<p><strong>Timeline:</strong> ${escapeHtml(data.timeline)}</p>` : ""}
        ${data.tiboAssisted ? `<p><strong>Tibo Assisted:</strong> Yes ✨</p>` : ""}
        <p><strong>Description:</strong></p><p style="color:#3A4A5C;">${escapeHtml(data.description)}</p>
      </div>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}/admin/service-requests" style="color:#F47C20;">View in Admin →</a></p>
    </div>`,
  }).catch(() => {});
}
