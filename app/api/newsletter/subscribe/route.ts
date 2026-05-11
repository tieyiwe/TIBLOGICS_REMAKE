import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidEmail } from "@/lib/require-admin";
import resend from "@/lib/resend";

const ADMIN_EMAIL = process.env.TIWE_EMAIL || process.env.TITAN_SMTP_USER || "info@tiblogics.com";
const SITE_URL = (process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");

async function notifyAdmin(email: string, firstName: string | null, source: string) {
  try {
    await resend.emails.send({
      to: ADMIN_EMAIL,
      subject: `📬 New AI Times Subscriber — ${email}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:20px 24px;border-radius:12px 12px 0 0;">
            <h2 style="margin:0;color:white;font-size:18px;">📬 New Newsletter Subscriber</h2>
          </div>
          <div style="background:white;padding:24px;border:1px solid #EBF0FA;border-top:none;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 12px;font-size:15px;color:#0D1B2A;">
              <strong>${firstName ? firstName + " — " : ""}${email}</strong> just subscribed to AI Times.
            </p>
            <p style="margin:0 0 16px;font-size:13px;color:#7A8FA6;">Source: ${source}</p>
            <a href="${SITE_URL}/admin_pro/newsletter"
               style="display:inline-block;background:#F47C20;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">
              View Subscribers →
            </a>
          </div>
        </div>`,
    });
  } catch { /* non-blocking */ }
}

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, source } = await req.json();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanFirst = typeof firstName === "string" ? firstName.slice(0, 100).trim() : null;

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      if (!existing.active) {
        await prisma.newsletterSubscriber.update({
          where: { email: cleanEmail },
          data: { active: true, unsubscribedAt: null, firstName: cleanFirst ?? existing.firstName },
        });
        notifyAdmin(cleanEmail, cleanFirst, typeof source === "string" ? source : "blog");
        return NextResponse.json({ message: "Welcome back! You're re-subscribed." });
      }
      return NextResponse.json({ message: "You're already subscribed!" });
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email: cleanEmail,
        firstName: cleanFirst,
        source: typeof source === "string" ? source.slice(0, 50) : "blog",
        active: true,
      },
    });

    notifyAdmin(cleanEmail, cleanFirst, typeof source === "string" ? source : "blog");
    return NextResponse.json({ message: "Subscribed! Welcome to the TIBLOGICS AI newsletter." });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    await prisma.newsletterSubscriber.update({
      where: { email: email.trim().toLowerCase() },
      data: { active: false, unsubscribedAt: new Date() },
    });
    return NextResponse.json({ message: "Unsubscribed successfully." });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

