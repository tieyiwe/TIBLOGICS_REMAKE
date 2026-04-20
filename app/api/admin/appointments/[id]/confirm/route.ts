import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import resend from "@/lib/resend";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingLink, resendOnly } = await req.json();

  const appt = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update status + meeting link (unless resendOnly)
  if (!resendOnly) {
    await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        ...(meetingLink !== undefined ? { zoomLink: meetingLink } : {}),
      },
    });
  } else if (meetingLink !== undefined) {
    await prisma.appointment.update({
      where: { id: params.id },
      data: { zoomLink: meetingLink },
    });
  }

  const link = meetingLink ?? appt.zoomLink;

  // Send confirmation email to client
  await sendConfirmationWithLink({
    firstName: appt.firstName,
    lastName: appt.lastName,
    email: appt.email,
    serviceType: appt.serviceType,
    date: appt.date.toISOString(),
    timeSlot: appt.timeSlot,
    timezone: appt.timezone,
    meetingLink: link ?? null,
  });

  return NextResponse.json({ success: true, status: "CONFIRMED" });
}

async function sendConfirmationWithLink(data: {
  firstName: string;
  lastName: string;
  email: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  timezone: string;
  meetingLink: string | null;
}) {
  const serviceLabel = data.serviceType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const dateLabel = new Date(data.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const meetingSection = data.meetingLink
    ? `
      <div style="margin:24px 0;text-align:center;">
        <a href="${data.meetingLink}"
           style="display:inline-block;background:#1B3A6B;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
          🎥 Join Meeting
        </a>
        <p style="color:#7A8FA6;font-size:12px;margin:10px 0 0;">
          ${data.meetingLink}
        </p>
      </div>`
    : `
      <div style="background:#FEF0E3;border-radius:12px;padding:16px 20px;margin:24px 0;border-left:4px solid #F47C20;">
        <p style="margin:0;color:#F47C20;font-size:14px;">
          📅 Your meeting link will be sent to you at least 24 hours before the session.
        </p>
      </div>`;

  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: data.email,
    subject: `✅ Your TIBLOGICS meeting is confirmed — ${dateLabel}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(27,58,107,0.10);">

    <div style="background:linear-gradient(135deg,#1B3A6B 0%,#2251A3 100%);padding:40px 32px;text-align:center;">
      <h1 style="color:white;margin:0 0 4px;font-size:28px;letter-spacing:-0.5px;">
        TIB<span style="color:#F47C20;">LOGICS</span>
      </h1>
      <p style="color:rgba(255,255,255,0.65);margin:0;font-size:13px;">Meeting Confirmed ✓</p>
    </div>

    <div style="padding:36px 32px;">
      <h2 style="color:#0D1B2A;font-size:22px;margin:0 0 10px;font-weight:700;">
        You're confirmed, ${data.firstName}! 🎉
      </h2>
      <p style="color:#3A4A5C;font-size:15px;line-height:1.7;margin:0 0 24px;">
        We're looking forward to speaking with you. Everything you need is below.
      </p>

      <div style="background:#F4F7FB;border-radius:14px;padding:20px 24px;margin-bottom:8px;">
        <p style="margin:0 0 8px;font-size:11px;color:#7A8FA6;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Meeting Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:5px 0;color:#7A8FA6;font-size:14px;width:90px;">Service</td>
            <td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${serviceLabel}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#7A8FA6;font-size:14px;">Date</td>
            <td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${dateLabel}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#7A8FA6;font-size:14px;">Time</td>
            <td style="padding:5px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${data.timeSlot} (${data.timezone})</td>
          </tr>
        </table>
      </div>

      ${meetingSection}

      <div style="background:#EBF5FF;border-radius:12px;padding:16px 20px;margin-top:8px;">
        <p style="margin:0;color:#2251A3;font-size:13px;line-height:1.6;">
          💡 <strong>Before your session:</strong> Jot down 2–3 specific challenges you want to tackle so we can make every minute count.
        </p>
      </div>
    </div>

    <div style="background:#F4F7FB;padding:20px 32px;text-align:center;">
      <p style="color:#7A8FA6;font-size:12px;margin:0;line-height:1.8;">
        Questions? Reply to this email or reach us at <a href="mailto:info@tiblogics.com" style="color:#2251A3;text-decoration:none;">info@tiblogics.com</a><br>
        TIBLOGICS · Wheaton, Maryland · <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}" style="color:#2251A3;text-decoration:none;">tiblogics.com</a>
      </p>
    </div>

  </div>
</body></html>`,
  }).catch((e: unknown) => console.error("[confirm email]", e));
}
