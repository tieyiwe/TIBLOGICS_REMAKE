import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import resend from "@/lib/resend";
import { escapeHtml } from "@/lib/require-admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { suggestedDate, suggestedTimeSlot, message } = await req.json();

  if (!suggestedDate || !suggestedTimeSlot) {
    return NextResponse.json({ error: "suggestedDate and suggestedTimeSlot are required" }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const note = `[Reschedule suggested] New time: ${suggestedDate} at ${suggestedTimeSlot}${message ? ` — "${message}"` : ""}`;

  await prisma.appointment.update({
    where: { id },
    data: { notes: note },
  });

  await sendRescheduleEmail({
    firstName: appt.firstName,
    lastName: appt.lastName,
    email: appt.email,
    serviceType: appt.serviceType,
    serviceDuration: appt.serviceDuration,
    originalDate: appt.date.toISOString(),
    originalTimeSlot: appt.timeSlot,
    timezone: appt.timezone,
    suggestedDate,
    suggestedTimeSlot,
    message: message ?? null,
  });

  return NextResponse.json({ success: true });
}

async function sendRescheduleEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  serviceType: string;
  serviceDuration: string;
  originalDate: string;
  originalTimeSlot: string;
  timezone: string;
  suggestedDate: string;
  suggestedTimeSlot: string;
  message: string | null;
}) {
  const serviceLabel = data.serviceType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const origDateLabel = new Date(data.originalDate).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const newDateLabel = new Date(data.suggestedDate).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const safeFirst = escapeHtml(data.firstName);
  const safeMsg = data.message ? escapeHtml(data.message) : null;

  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "hello@tiblogics.com",
    to: data.email,
    subject: `📅 New Time Suggested for Your TIBLOGICS Session — ${newDateLabel}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(27,58,107,0.10);">

    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:40px 32px;text-align:center;">
      <h1 style="color:white;margin:0 0 6px;font-size:28px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
      <p style="color:rgba(255,255,255,0.65);margin:0;font-size:13px;">Meeting Time Update</p>
    </div>

    <div style="padding:36px 32px;">
      <h2 style="color:#0D1B2A;font-size:22px;margin:0 0 10px;font-weight:700;">Hi ${safeFirst} — we'd like to suggest a new time</h2>
      <p style="color:#3A4A5C;font-size:15px;line-height:1.7;margin:0 0 24px;">
        We appreciate your patience. Due to a scheduling conflict, we'd like to propose an alternative time for your session. Please review the details below and reply to confirm or suggest another time that works for you.
      </p>

      <!-- Original time -->
      <div style="background:#FEF0E3;border-radius:14px;padding:20px 24px;margin-bottom:16px;border-left:4px solid #F47C20;">
        <p style="margin:0 0 10px;font-size:11px;color:#F47C20;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Original Time</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#7A8FA6;font-size:13px;width:90px;">Service</td><td style="padding:4px 0;color:#0D1B2A;font-size:13px;font-weight:600;">${serviceLabel} (${data.serviceDuration})</td></tr>
          <tr><td style="padding:4px 0;color:#7A8FA6;font-size:13px;">Date</td><td style="padding:4px 0;color:#9B7451;font-size:13px;font-weight:600;text-decoration:line-through;">${origDateLabel}</td></tr>
          <tr><td style="padding:4px 0;color:#7A8FA6;font-size:13px;">Time</td><td style="padding:4px 0;color:#9B7451;font-size:13px;font-weight:600;text-decoration:line-through;">${data.originalTimeSlot} (${data.timezone})</td></tr>
        </table>
      </div>

      <!-- Suggested new time -->
      <div style="background:#EBF5FF;border-radius:14px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #2251A3;">
        <p style="margin:0 0 10px;font-size:11px;color:#2251A3;text-transform:uppercase;letter-spacing:1px;font-weight:700;">✅ Suggested New Time</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#7A8FA6;font-size:13px;width:90px;">Service</td><td style="padding:4px 0;color:#0D1B2A;font-size:13px;font-weight:600;">${serviceLabel} (${data.serviceDuration})</td></tr>
          <tr><td style="padding:4px 0;color:#7A8FA6;font-size:13px;">Date</td><td style="padding:4px 0;color:#0D1B2A;font-size:13px;font-weight:700;">${newDateLabel}</td></tr>
          <tr><td style="padding:4px 0;color:#7A8FA6;font-size:13px;">Time</td><td style="padding:4px 0;color:#0D1B2A;font-size:13px;font-weight:700;">${data.suggestedTimeSlot} (${data.timezone})</td></tr>
        </table>
      </div>

      ${safeMsg ? `
      <div style="background:#F4F7FB;border-radius:12px;padding:16px 20px;margin-bottom:24px;border-left:3px solid #D2DCE8;">
        <p style="margin:0 0 6px;font-size:11px;color:#7A8FA6;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Note from the TIBLOGICS team</p>
        <p style="margin:0;color:#3A4A5C;font-size:14px;line-height:1.6;font-style:italic;">"${safeMsg}"</p>
      </div>` : ""}

      <div style="background:#EBF5FF;border-radius:12px;padding:16px 20px;">
        <p style="margin:0;color:#2251A3;font-size:13px;line-height:1.65;">
          💬 <strong>To confirm or suggest a different time,</strong> simply reply to this email. We'll update your booking right away.
        </p>
      </div>
    </div>

    <div style="background:#F4F7FB;padding:20px 32px;text-align:center;border-top:1px solid #E8EFF8;">
      <p style="color:#7A8FA6;font-size:12px;margin:0;line-height:2;">
        Questions? Reply or email <a href="mailto:info@tiblogics.com" style="color:#2251A3;text-decoration:none;">info@tiblogics.com</a><br>
        TIBLOGICS · <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com"}" style="color:#2251A3;text-decoration:none;">tiblogics.com</a>
      </p>
    </div>
  </div>
</body></html>`,
  }).catch((e: unknown) => console.error("[reschedule email]", e));
}
