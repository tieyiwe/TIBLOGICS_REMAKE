import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import resend from "@/lib/resend";
import { createMeeting } from "@/lib/meeting-providers";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingLink: manualLink, resendOnly } = await req.json();

  const appt = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let resolvedLink: string | null = manualLink ?? appt.zoomLink ?? null;

  if (!resendOnly) {
    // Try to auto-create a meeting if no manual link was provided
    if (!resolvedLink) {
      resolvedLink = await createMeeting({
        serviceType: appt.serviceType,
        date: appt.date,
        timeSlot: appt.timeSlot,
        timezone: appt.timezone,
        serviceDuration: appt.serviceDuration,
        firstName: appt.firstName,
        lastName: appt.lastName,
      });
    }

    await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        zoomLink: resolvedLink,
      },
    });
  } else {
    // resendOnly — just update the link if provided
    if (manualLink !== undefined) {
      resolvedLink = manualLink;
      await prisma.appointment.update({
        where: { id: params.id },
        data: { zoomLink: resolvedLink },
      });
    }
  }

  await sendConfirmationEmail({
    firstName: appt.firstName,
    lastName: appt.lastName,
    email: appt.email,
    serviceType: appt.serviceType,
    date: appt.date.toISOString(),
    timeSlot: appt.timeSlot,
    timezone: appt.timezone,
    meetingLink: resolvedLink,
  });

  return NextResponse.json({ success: true, status: "CONFIRMED", meetingLink: resolvedLink });
}

async function sendConfirmationEmail(data: {
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

  const providerName = data.meetingLink?.includes("zoom.us") ? "Zoom" : "Google Meet";
  const providerColor = data.meetingLink?.includes("zoom.us") ? "#2D8CFF" : "#1A73E8";

  const meetingSection = data.meetingLink
    ? `
    <div style="margin:28px 0;text-align:center;">
      <p style="margin:0 0 14px;font-size:13px;color:#7A8FA6;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Your Meeting Link</p>
      <a href="${data.meetingLink}"
         style="display:inline-block;background:${providerColor};color:white;text-decoration:none;padding:15px 36px;border-radius:12px;font-size:16px;font-weight:700;">
        🎥 Join on ${providerName}
      </a>
      <p style="color:#7A8FA6;font-size:12px;margin:12px 0 0;word-break:break-all;">
        ${data.meetingLink}
      </p>
    </div>`
    : `
    <div style="background:#FEF0E3;border-radius:12px;padding:18px 22px;margin:28px 0;border-left:4px solid #F47C20;">
      <p style="margin:0;color:#F47C20;font-size:14px;line-height:1.6;">
        📅 Your meeting link will be sent at least <strong>24 hours before</strong> your session.
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
      <h1 style="color:white;margin:0 0 6px;font-size:28px;letter-spacing:-0.5px;">
        TIB<span style="color:#F47C20;">LOGICS</span>
      </h1>
      <p style="color:rgba(255,255,255,0.65);margin:0;font-size:13px;">Meeting Confirmed ✓</p>
    </div>

    <div style="padding:36px 32px;">
      <h2 style="color:#0D1B2A;font-size:22px;margin:0 0 10px;font-weight:700;">
        You're confirmed, ${data.firstName}! 🎉
      </h2>
      <p style="color:#3A4A5C;font-size:15px;line-height:1.7;margin:0 0 24px;">
        We're looking forward to speaking with you. Here are all the details for your upcoming session.
      </p>

      <div style="background:#F4F7FB;border-radius:14px;padding:22px 24px;">
        <p style="margin:0 0 12px;font-size:11px;color:#7A8FA6;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Session Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#7A8FA6;font-size:14px;width:90px;vertical-align:top;">Service</td>
            <td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${serviceLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7A8FA6;font-size:14px;vertical-align:top;">Date</td>
            <td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${dateLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7A8FA6;font-size:14px;vertical-align:top;">Time</td>
            <td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;">${data.timeSlot} <span style="color:#7A8FA6;font-weight:400;">(${data.timezone})</span></td>
          </tr>
        </table>
      </div>

      ${meetingSection}

      <div style="background:#EBF5FF;border-radius:12px;padding:18px 22px;margin-top:4px;">
        <p style="margin:0;color:#2251A3;font-size:13px;line-height:1.65;">
          💡 <strong>To make the most of your session:</strong> Come prepared with 2–3 specific challenges or goals you'd like to tackle. The more context you bring, the more value we'll deliver.
        </p>
      </div>
    </div>

    <div style="background:#F4F7FB;padding:22px 32px;text-align:center;border-top:1px solid #E8EFF8;">
      <p style="color:#7A8FA6;font-size:12px;margin:0;line-height:2;">
        Questions? Reply to this email or write to us at
        <a href="mailto:info@tiblogics.com" style="color:#2251A3;text-decoration:none;">info@tiblogics.com</a><br>
        TIBLOGICS · Wheaton, Maryland ·
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}" style="color:#2251A3;text-decoration:none;">tiblogics.com</a>
      </p>
    </div>

  </div>
</body></html>`,
  }).catch((e: unknown) => console.error("[confirm email]", e));
}
