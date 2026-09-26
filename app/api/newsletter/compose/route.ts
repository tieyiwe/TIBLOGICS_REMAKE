import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import prisma from "@/lib/prisma";
import resend from "@/lib/resend";

const SITE_URL = (process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");

function buildEmailHtml(
  introText: string,
  articles: Array<{ title: string; slug: string; excerpt: string; category: string }>,
  subscriberName?: string
): string {
  const greeting = subscriberName ? `Hi ${subscriberName},` : "Hi there,";

  const articleRows = articles
    .map(
      (a) => `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #EBF0FA;">
          <a href="${SITE_URL}/ai-times/${a.slug}"
             style="font-family:Arial,sans-serif;font-size:17px;font-weight:700;color:#1B3A6B;text-decoration:none;display:block;margin-bottom:6px;line-height:1.3;">
            ${a.title}
          </a>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#3A4A5C;line-height:1.6;">${a.excerpt}</p>
          <a href="${SITE_URL}/ai-times/${a.slug}"
             style="display:inline-block;margin-top:10px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#F47C20;text-decoration:none;">
            Read article →
          </a>
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:32px;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">AI TIMES BY</p>
      <h1 style="margin:0;color:white;font-size:26px;font-weight:900;letter-spacing:-0.5px;">
        TIB<span style="color:#F47C20;">LOGICS</span>
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">The #1 AI Digestable Knowledge</p>
    </div>

    <!-- Intro -->
    <div style="padding:28px 32px 0;">
      <p style="margin:0 0 6px;font-size:16px;color:#0D1B2A;font-weight:700;">${greeting}</p>
      <p style="margin:0;font-size:15px;color:#3A4A5C;line-height:1.7;">${introText}</p>
    </div>

    <!-- Articles -->
    <div style="padding:8px 32px 24px;">
      <h2 style="font-size:13px;color:#7A8FA6;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin:24px 0 4px;">
        📰 This Edition
      </h2>
      <table style="width:100%;border-collapse:collapse;">
        ${articleRows}
      </table>
    </div>

    <!-- CTA -->
    <div style="margin:0 32px 28px;background:#F4F7FB;border-radius:12px;padding:20px 24px;text-align:center;">
      <p style="margin:0 0 12px;font-size:14px;color:#3A4A5C;">Ready to put AI to work in your business?</p>
      <a href="${SITE_URL}/book"
         style="display:inline-block;background:#F47C20;color:white;text-decoration:none;padding:11px 24px;border-radius:10px;font-weight:700;font-size:14px;">
        Book a Free Discovery Call →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#F4F7FB;padding:20px 32px;text-align:center;border-top:1px solid #EBF0FA;">
      <p style="margin:0 0 6px;font-size:12px;color:#7A8FA6;">
        You're receiving this because you subscribed at <a href="${SITE_URL}" style="color:#2251A3;text-decoration:none;">tiblogics.com</a>
      </p>
      <p style="margin:0;font-size:12px;color:#7A8FA6;">
        <a href="${SITE_URL}/unsubscribe?email={{email}}" style="color:#7A8FA6;">Unsubscribe</a>
        &nbsp;·&nbsp; TIBLOGICS · AI Agency
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { articleIds, subject, previewText, introText, sentBy, send: doSend } = await req.json();

  if (!subject || !introText || !Array.isArray(articleIds) || articleIds.length === 0) {
    return NextResponse.json({ error: "subject, introText, and at least one articleId are required" }, { status: 400 });
  }

  const articles = await prisma.blogPost.findMany({
    where: { id: { in: articleIds }, published: true },
    select: { id: true, title: true, slug: true, excerpt: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  if (articles.length === 0) {
    return NextResponse.json({ error: "No valid articles found" }, { status: 400 });
  }

  const contentHtml = buildEmailHtml(introText, articles);

  const campaign = await prisma.newsletterCampaign.create({
    data: {
      title: subject,
      subject,
      previewText: previewText ?? "",
      contentHtml,
      category: "general",
      status: "DRAFT",
      sentBy: sentBy ?? "Admin",
    },
  });

  if (!doSend) {
    return NextResponse.json({ campaign }, { status: 201 });
  }

  // Send immediately
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
    select: { email: true, firstName: true },
  });

  let sent = 0;
  for (const sub of subscribers) {
    try {
      const personalizedHtml = buildEmailHtml(introText, articles, sub.firstName ?? undefined).replace(
        "{{email}}",
        encodeURIComponent(sub.email)
      );
      await resend.emails.send({
        to: sub.email,
        subject,
        html: personalizedHtml,
      });
      sent++;
    } catch { /* continue */ }
  }

  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: { status: "SENT", sentAt: new Date(), recipientCount: sent },
  });

  return NextResponse.json({ campaign, sent }, { status: 201 });
}
