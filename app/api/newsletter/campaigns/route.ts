import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import resend from "@/lib/resend";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const [campaigns, subscriberCount] = await Promise.all([
      prisma.newsletterCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.newsletterSubscriber.count({ where: { active: true } }),
    ]);
    return NextResponse.json({ campaigns, subscriberCount });
  } catch {
    return NextResponse.json({ campaigns: [], subscriberCount: 0 });
  }
}

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const body = await req.json();

    if (!body.title || typeof body.title !== "string" || body.title.length > 300) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    if (!body.subject || typeof body.subject !== "string" || body.subject.length > 300) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }
    if (!body.contentHtml || typeof body.contentHtml !== "string") {
      return NextResponse.json({ error: "contentHtml required" }, { status: 400 });
    }

    const campaign = await prisma.newsletterCampaign.create({
      data: {
        title: body.title,
        subject: body.subject,
        previewText: typeof body.previewText === "string" ? body.previewText.slice(0, 200) : null,
        contentHtml: body.contentHtml,
        category: typeof body.category === "string" ? body.category.slice(0, 50) : "general",
        status: "DRAFT",
        sentBy: typeof body.sentBy === "string" ? body.sentBy.slice(0, 100) : "Admin",
      },
    });

    if (body.send === true) {
      return sendCampaign(campaign.id);
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    console.error("Campaign create error:", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

async function sendCampaign(campaignId: string): Promise<NextResponse> {
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subscribers = await prisma.newsletterSubscriber.findMany({ where: { active: true }, select: { email: true, firstName: true } });

  let sent = 0;
  const batchSize = 10;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((sub) =>
        resend.emails.send({
          from: process.env.FROM_EMAIL ?? "newsletter@tiblogics.com",
          to: sub.email,
          subject: campaign.subject,
          html: buildEmailHtml(campaign.contentHtml, sub.firstName, sub.email),
        })
      )
    );
    sent += batch.length;
  }

  await prisma.newsletterCampaign.update({ where: { id: campaignId }, data: { status: "SENT", sentAt: new Date(), recipientCount: sent } });
  return NextResponse.json({ message: `Sent to ${sent} subscribers`, sent });
}

function buildEmailHtml(content: string, firstName: string | null, email: string): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const unsubUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}/unsubscribe?email=${encodeURIComponent(email)}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:white;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:28px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:22px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#3A4A5C;font-size:15px;margin-bottom:24px;">${greeting}</p>
      <div style="color:#0D1B2A;font-size:15px;line-height:1.7;">${content}</div>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #E8EFF8;text-align:center;">
        <p style="color:#7A8FA6;font-size:12px;">You're receiving this because you subscribed to TIBLOGICS AI Insights.<br>
          <a href="${unsubUrl}" style="color:#7A8FA6;">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body></html>`;
}

export { sendCampaign };
