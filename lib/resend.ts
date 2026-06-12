import nodemailer from "nodemailer";

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.TITAN_SMTP_HOST ?? "smtp.titan.email",
    port: Number(process.env.TITAN_SMTP_PORT ?? 465),
    secure: Number(process.env.TITAN_SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.TITAN_SMTP_USER ?? "info@tiblogics.com",
      pass: process.env.TITAN_SMTP_PASS,
    },
  });
}

const FROM = `TIBLOGICS <${process.env.TITAN_SMTP_USER ?? "info@tiblogics.com"}>`;

export async function sendConfirmationEmail(appointment: {
  firstName: string;
  lastName: string;
  email: string;
  serviceType: string;
  date: Date;
  timeSlot: string;
  serviceDuration: string;
  zoomLink?: string | null;
  totalAmount: number;
}) {
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(appointment.date));

  await getTransport().sendMail({
    from: FROM,
    to: appointment.email,
    subject: `Your TIBLOGICS session is confirmed — ${appointment.serviceType} on ${dateStr}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B3A6B; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TIB<span style="color: #F47C20;">LOGICS</span></h1>
        </div>
        <div style="padding: 32px; background: white;">
          <h2 style="color: #0D1B2A; font-size: 22px;">You're booked! ✅</h2>
          <div style="background: #F4F7FB; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p><strong>Service:</strong> ${appointment.serviceType}</p>
            <p><strong>Date:</strong> ${dateStr} at ${appointment.timeSlot} ET</p>
            <p><strong>Duration:</strong> ${appointment.serviceDuration}</p>
            <p><strong>With:</strong> Tieyiwe Bassole, TIBLOGICS</p>
            <p><strong>Meeting Link (Jitsi):</strong> ${appointment.zoomLink ? `<a href="${appointment.zoomLink}">${appointment.zoomLink}</a>` : "Will be sent 24hrs before your session"}</p>
          </div>
          <p style="color: #3A4A5C;">Looking forward to our session! Feel free to reply to this email with any questions.</p>
          <p style="color: #7A8FA6; font-size: 14px; margin-top: 32px;">info@tiblogics.com | tiblogics.com</p>
        </div>
      </div>
    `,
  });
}

export async function sendTiweNotification(appointment: {
  firstName: string;
  lastName: string;
  email: string;
  company?: string | null;
  serviceType: string;
  date: Date;
  timeSlot: string;
  totalAmount: number;
  goalNotes?: string | null;
  paymentStatus?: string | null;
  addOnRecording: boolean;
  addOnActionPlan: boolean;
  addOnSlackAccess: boolean;
  meetingLink?: string | null;
}) {
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date(appointment.date));

  const adminEmail = process.env.TIWE_EMAIL || process.env.DESIGN_EMAIL || process.env.TITAN_SMTP_USER || "info@tiblogics.com";


  const isPaid = appointment.totalAmount > 0;

  await getTransport().sendMail({
    from: FROM,
    to: adminEmail,
    subject: `🗓️ NEW BOOKING — ${appointment.serviceType} · ${appointment.firstName} ${appointment.lastName} · ${dateStr}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:28px 32px;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:11px;text-transform:uppercase;letter-spacing:1px;">TIBLOGICS</p>
      <h1 style="margin:0;color:white;font-size:22px;">📅 New Booking${isPaid ? " — <span style='color:#4ade80'>Paid ✓</span>" : " — Free Session"}</h1>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tr><td style="padding:8px 0;color:#7A8FA6;width:130px;">Client</td><td style="padding:8px 0;color:#0D1B2A;font-weight:700;">${appointment.firstName} ${appointment.lastName}</td></tr>
        <tr><td style="padding:8px 0;color:#7A8FA6;">Email</td><td style="padding:8px 0;"><a href="mailto:${appointment.email}" style="color:#2251A3;">${appointment.email}</a></td></tr>
        ${appointment.company ? `<tr><td style="padding:8px 0;color:#7A8FA6;">Company</td><td style="padding:8px 0;color:#0D1B2A;">${appointment.company}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#7A8FA6;">Service</td><td style="padding:8px 0;color:#0D1B2A;font-weight:600;">${appointment.serviceType}</td></tr>
        <tr><td style="padding:8px 0;color:#7A8FA6;">Date & Time</td><td style="padding:8px 0;color:#0D1B2A;font-weight:600;">${dateStr} at ${appointment.timeSlot} ET</td></tr>
        <tr><td style="padding:8px 0;color:#7A8FA6;">Amount</td><td style="padding:8px 0;color:#0D1B2A;">${isPaid ? `<strong style="color:#16a34a;">$${(appointment.totalAmount / 100).toFixed(0)} paid</strong>` : "Free"}</td></tr>
        ${appointment.goalNotes ? `<tr><td style="padding:8px 0;color:#7A8FA6;vertical-align:top;">Their Goals</td><td style="padding:8px 0;color:#3A4A5C;font-style:italic;">${appointment.goalNotes}</td></tr>` : ""}
      </table>
      ${appointment.meetingLink ? `
      <div style="margin:24px 0;padding:16px 20px;background:#EFF8FF;border-radius:12px;border-left:4px solid #1D76BA;">
        <p style="margin:0 0 8px;font-size:12px;color:#1D76BA;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Jitsi Meeting Link</p>
        <a href="${appointment.meetingLink}" style="color:#1D76BA;word-break:break-all;font-size:14px;">${appointment.meetingLink}</a>
      </div>` : ""}
      <div style="margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/appointments"
           style="display:inline-block;background:#F47C20;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">
          View in Admin →
        </a>
      </div>
    </div>
  </div>
</body></html>`,
  });
}

export async function sendProspectEmail(prospect: {
  name: string;
  business: string;
  industry: string;
  budget: string;
  mainChallenge: string;
  suggestedSolutions: string[];
}) {
  const adminEmail = process.env.TIWE_EMAIL || process.env.TITAN_SMTP_USER || "info@tiblogics.com";


  await getTransport().sendMail({
    from: FROM,
    to: adminEmail,
    subject: `🎯 New Prospect from TIBS — ${prospect.name} at ${prospect.business}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1B3A6B;">New Prospect from TIBS</h2>
        <div style="background: #F4F7FB; border-radius: 12px; padding: 20px;">
          <p><strong>Prospect:</strong> ${prospect.name} | ${prospect.business} | ${prospect.industry}</p>
          <p><strong>Budget:</strong> ${prospect.budget}</p>
          <p><strong>Challenge:</strong> ${prospect.mainChallenge}</p>
          <p><strong>Suggested Solutions:</strong> ${prospect.suggestedSolutions.join(", ")}</p>
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/prospects" style="color: #F47C20;">View in Admin Dashboard →</a></p>
      </div>
    `,
  });
}

export async function sendRescheduleEmail(data: {
  firstName: string;
  email: string;
  originalDate: string;
  originalTimeSlot: string;
  suggestedDate: string;
  suggestedTimeSlot: string;
  message?: string;
}) {
  await getTransport().sendMail({
    from: FROM,
    to: data.email,
    subject: `TIBLOGICS — A new time has been suggested for your session`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B3A6B; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TIB<span style="color: #F47C20;">LOGICS</span></h1>
        </div>
        <div style="padding: 32px; background: white;">
          <h2 style="color: #0D1B2A;">Hi ${data.firstName}, we'd like to reschedule</h2>
          <p style="color: #3A4A5C;">Your original time slot is no longer available. Here's what we're suggesting:</p>
          <div style="background: #F4F7FB; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong style="color: #7A8FA6;">Original:</strong> <span style="text-decoration: line-through; color: #7A8FA6;">${data.originalDate} at ${data.originalTimeSlot} ET</span></p>
            <p style="margin: 0;"><strong style="color: #2251A3;">New suggested time:</strong> <span style="color: #0D1B2A; font-weight: 700;">${data.suggestedDate} at ${data.suggestedTimeSlot} ET</span></p>
          </div>
          ${data.message ? `<p style="color: #3A4A5C; font-style: italic;">"${data.message}"</p>` : ""}
          <p style="color: #3A4A5C;">Please reply to this email to confirm or suggest an alternative time.</p>
          <p style="color: #7A8FA6; font-size: 14px; margin-top: 32px;">info@tiblogics.com | tiblogics.com</p>
        </div>
      </div>
    `,
  });
}

const ARFA_FROM = `ARFA by TIBLOGICS <${process.env.ARFA_SMTP_USER ?? "arfa_edu@tiblogics.com"}>`;

function getArfaTransport() {
  // NEVER fall back to TITAN_SMTP_USER — that's info@tiblogics.com with a different password
  const user = process.env.ARFA_SMTP_USER ?? "arfa_edu@tiblogics.com";
  const pass = process.env.ARFA_SMTP_PASS;
  const host = process.env.TITAN_SMTP_HOST ?? "smtp.titan.email";
  const port = Number(process.env.TITAN_SMTP_PORT ?? 465);
  console.log(`[ARFA-SMTP] host=${host} port=${port} user=${user} pass=${pass ? "SET(" + pass.length + "chars)" : "MISSING — set ARFA_SMTP_PASS"}`);
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export async function sendEventRegistrationConfirmation(reg: {
  firstName: string;
  lastName: string;
  email: string;
  eventName: string;
  eventSlug: string;
  confirmationNumber: string;
  paymentMethod: string;
  price: number;
  currency: string;
  location?: string | null;
}) {
  const priceStr = reg.price > 0
    ? `$${(reg.price / 100).toFixed(0)} ${reg.currency}`
    : "Free";

  await getArfaTransport().sendMail({
    from: ARFA_FROM,
    to: reg.email,
    subject: `You're registered! Confirmation #${reg.confirmationNumber} — ${reg.eventName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;">
        <div style="background:linear-gradient(135deg,#1B3A6B 0%,#2251A3 100%);padding:32px 24px;text-align:center;">
          <h1 style="color:white;margin:0 0 6px;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
            TIB<span style="color:#F47C20;">LOGICS</span> &middot; ARFA
          </h1>
          <p style="color:rgba(255,255,255,0.75);margin:0;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">AI Readiness For All</p>
        </div>

        <div style="background:white;padding:36px 32px;">
          <h2 style="color:#0D1B2A;font-size:22px;margin:0 0 8px;">You&rsquo;re registered! 🎉</h2>
          <p style="color:#3A4A5C;font-size:15px;margin:0 0 24px;">
            Hi ${reg.firstName}, your spot is reserved. Here are your registration details:
          </p>

          <div style="background:#F4F7FB;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:7px 0;color:#7A8FA6;width:45%;">Confirmation #</td>
                <td style="padding:7px 0;color:#0D1B2A;font-weight:700;font-size:15px;">${reg.confirmationNumber}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#7A8FA6;">Event</td>
                <td style="padding:7px 0;color:#0D1B2A;font-weight:600;">${reg.eventName}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#7A8FA6;">Name</td>
                <td style="padding:7px 0;color:#0D1B2A;">${reg.firstName} ${reg.lastName}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#7A8FA6;">Email</td>
                <td style="padding:7px 0;color:#0D1B2A;">${reg.email}</td>
              </tr>
              ${reg.location ? `<tr>
                <td style="padding:7px 0;color:#7A8FA6;">Location</td>
                <td style="padding:7px 0;color:#0D1B2A;">${reg.location}</td>
              </tr>` : ""}
              <tr>
                <td style="padding:7px 0;color:#7A8FA6;">Payment</td>
                <td style="padding:7px 0;color:#0D1B2A;">${priceStr} via ${reg.paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#7A8FA6;">Status</td>
                <td style="padding:7px 0;"><span style="background:#FEF9C3;color:#854D0E;font-size:12px;font-weight:700;padding:2px 8px;border-radius:20px;">PENDING CONFIRMATION</span></td>
              </tr>
            </table>
          </div>

          <p style="color:#3A4A5C;font-size:14px;line-height:1.7;margin:0 0 24px;">
            Keep your confirmation number safe — you&rsquo;ll need it for check-in.
            A follow-up email with session details, payment instructions, and Zoom link will be sent shortly.
          </p>

          <p style="color:#7A8FA6;font-size:12px;margin:0;border-top:1px solid #E2E8F0;padding-top:20px;">
            Questions? Reply to this email or write to
            <a href="mailto:arfa_edu@tiblogics.com" style="color:#2251A3;">arfa_edu@tiblogics.com</a>
            <br style="line-height:1.8">
            <a href="https://tiblogics.com" style="color:#2251A3;">www.tiblogics.com</a>
          </p>
        </div>
      </div>`,
  });
}

// "You're in — let's build" welcome email, sent AFTER payment is successful.
// firstName is captured from the registration and injected into the greeting.
// Sent from the Titan-hosted arfa_edu@tiblogics.com mailbox.
export async function sendEventWelcomeEmail(reg: {
  firstName: string;
  email: string;
  eventName?: string;
  confirmationNumber?: string | null;
}) {
  const firstName = (reg.firstName || "there").trim();

  await getArfaTransport().sendMail({
    from: ARFA_FROM,
    to: reg.email,
    subject: `You're in! 🎉 Welcome to the TIBLOGICS AI Practical Training — June Cohort`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>You're In! — TIBLOGICS AI Practical Training</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0F1617;
    color: #E8EDEE;
    padding: 40px 16px 60px;
    line-height: 1.6;
  }
  .email-wrap { max-width: 620px; margin: 0 auto; }
  .header {
    background: linear-gradient(135deg, #1C2526 0%, #2D3E40 100%);
    border-radius: 20px 20px 0 0;
    padding: 40px 40px 32px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(244,124,76,0.2);
    border-bottom: none;
  }
  .logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; position: relative; z-index: 1; }
  .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #F47C4C, #F9A738); border-radius: 9px; display: flex; align-items: center; justify-content: center; }
  .logo-icon svg { width: 20px; height: 20px; }
  .logo-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #fff; letter-spacing: 0.04em; }
  .logo-sub  { font-size: 10px; color: rgba(255,255,255,0.45); letter-spacing: 0.08em; }
  .confetti-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(244,124,76,0.12); border: 1px solid rgba(244,124,76,0.35); color: #F47C4C; font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 14px; border-radius: 50px; margin-bottom: 16px; position: relative; z-index: 1; }
  .confetti-dot { width: 6px; height: 6px; background: #F47C4C; border-radius: 50%; display:inline-block; }
  .header-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; line-height: 1.15; color: #fff; margin-bottom: 10px; position: relative; z-index: 1; }
  .header-title .accent { background: linear-gradient(135deg, #F47C4C, #F9A738); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color:#F47C4C; }
  .header-sub { font-size: 14px; color: rgba(255,255,255,0.55); position: relative; z-index: 1; line-height: 1.65; }
  .body { background: #1A2324; border: 1px solid rgba(255,255,255,0.06); border-top: none; border-bottom: none; padding: 36px 40px; }
  .greeting { font-size: 16px; color: #E8EDEE; margin-bottom: 14px; font-weight: 500; }
  .para { font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.75; margin-bottom: 14px; }
  .para strong { color: #E8EDEE; }
  .details-card { background: rgba(244,124,76,0.06); border: 1px solid rgba(244,124,76,0.2); border-radius: 14px; padding: 22px 24px; margin: 24px 0; }
  .details-title { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #F47C4C; margin-bottom: 16px; }
  .detail-row { display: flex; gap: 14px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .detail-row:last-child { border-bottom: none; }
  .detail-icon { font-size: 16px; flex-shrink: 0; width: 22px; text-align: center; margin-top: 1px; margin-right: 14px; }
  .detail-label { font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 2px; }
  .detail-value { font-size: 14px; color: #E8EDEE; font-weight: 500; }
  .divider { display: flex; align-items: center; gap: 12px; margin: 28px 0 20px; }
  .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
  .divider-text { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3); white-space: nowrap; }
  .checklist-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; }
  .checklist-sub { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 18px; line-height: 1.6; }
  .check-group { margin-bottom: 20px; }
  .check-group-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; display: inline-block; margin-bottom: 10px; }
  .label-accounts  { background: rgba(29,78,216,0.15); color: #93C5FD; }
  .label-tech      { background: rgba(6,95,70,0.15); color: #6EE7B7; }
  .label-mindset   { background: rgba(244,124,76,0.12); color: #F47C4C; }
  .check-item { display: flex; gap: 12px; align-items: flex-start; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 7px; }
  .check-box { width: 18px; height: 18px; border: 1.5px solid rgba(244,124,76,0.4); border-radius: 5px; flex-shrink: 0; margin-top: 1px; margin-right: 12px; }
  .check-main { font-size: 13.5px; color: #E8EDEE; font-weight: 500; margin-bottom: 2px; }
  .check-note { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.5; }
  .check-link { color: #F47C4C; text-decoration: none; }
  .rule-box { background: linear-gradient(135deg, rgba(244,124,76,0.08), rgba(249,167,56,0.05)); border: 1px solid rgba(244,124,76,0.25); border-radius: 14px; padding: 20px 22px; margin: 24px 0; display: flex; gap: 14px; align-items: flex-start; }
  .rule-icon { font-size: 22px; flex-shrink: 0; }
  .rule-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; }
  .rule-text  { font-size: 12.5px; color: rgba(255,255,255,0.55); line-height: 1.65; }
  .timeline { margin: 20px 0; }
  .tl-row { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 6px; }
  .tl-left { display: flex; flex-direction: column; align-items: center; }
  .tl-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; font-family: 'Syne', sans-serif; margin-right: 14px; }
  .tl-line { width: 1px; background: rgba(255,255,255,0.08); flex: 1; min-height: 8px; margin: 2px 0; }
  .tl-content { flex: 1; padding-bottom: 6px; }
  .tl-date { font-size: 11px; color: rgba(255,255,255,0.35); letter-spacing: 0.06em; margin-bottom: 2px; }
  .tl-title { font-size: 13.5px; color: #E8EDEE; font-weight: 500; }
  .tl-badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 20px; margin-left: 7px; font-weight: 500; vertical-align: middle; }
  .cta-wrap { text-align: center; margin: 28px 0 8px; }
  .cta-btn { display: inline-block; background: linear-gradient(135deg, #F47C4C, #F9A738); color: #fff; text-decoration: none; padding: 15px 38px; border-radius: 50px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; }
  .cta-sub { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 10px; }
  .closing-quote { background: rgba(255,255,255,0.03); border-left: 3px solid #F47C4C; border-radius: 0 10px 10px 0; padding: 14px 18px; margin: 24px 0 8px; font-size: 14px; font-style: italic; color: rgba(255,255,255,0.5); line-height: 1.7; }
  .closing-sign { font-size: 14px; color: rgba(255,255,255,0.55); margin-top: 18px; }
  .closing-sign strong { color: #E8EDEE; display: block; margin-top: 4px; font-size: 15px; }
  .footer { background: #131A1B; border-radius: 0 0 20px 20px; padding: 24px 40px; border: 1px solid rgba(255,255,255,0.06); border-top: 1px solid rgba(244,124,76,0.15); text-align: center; }
  .footer-logo { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 0.08em; margin-bottom: 6px; }
  .footer-links { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
  .footer-links a { font-size: 12px; color: rgba(255,255,255,0.3); text-decoration: none; }
  .footer-copy { font-size: 11px; color: rgba(255,255,255,0.2); }
  @media (max-width: 520px) {
    .header, .body, .footer { padding-left: 22px; padding-right: 22px; }
    .header-title { font-size: 24px; }
    .footer-links { gap: 10px; }
  }
</style>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
</head>
<body>
<div class="email-wrap">
  <div class="header">
    <div class="logo-row">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
          <circle cx="12" cy="8" r="2"/><circle cx="12" cy="17" r="2"/>
          <line x1="7" y1="12" x2="10" y2="9"/><line x1="14" y1="8" x2="17" y2="6"/>
          <line x1="14" y1="16" x2="17" y2="18"/><line x1="12" y1="10" x2="12" y2="15"/>
          <line x1="7" y1="12" x2="10" y2="16"/>
        </svg>
      </div>
      <div>
        <div class="logo-name">TIBLOGICS</div>
        <div class="logo-sub">AI Implementation &amp; Digital Solutions</div>
      </div>
    </div>
    <div class="confetti-badge"><span class="confetti-dot"></span> Registration Confirmed</div>
    <div class="header-title">You're in. <span class="accent">Let's build.</span></div>
    <div class="header-sub">Welcome to the TIBLOGICS AI Practical Training — June Cohort.<br>Your spot is secured. We are excited to have you.</div>
  </div>

  <div class="body">
    <div class="greeting">Hi ${firstName}, 👋</div>
    <p class="para">
      Your registration for the <strong>TIBLOGICS AI Practical Training</strong> is confirmed and your payment has been received.
      You are part of the June Cohort — the founding group. That means founding cohort pricing, direct access to our team,
      and being among the first to go through this training before anyone else.
    </p>
    <p class="para">
      All session details — your Zoom link, password, and WhatsApp group invite — will be sent to you
      <strong>48 hours before Session 1 starts.</strong> For now, use this email to get ready.
    </p>

    <div class="details-card">
      <div class="details-title">Your Training Details</div>
      ${reg.confirmationNumber ? `<div class="detail-row"><div class="detail-icon">🎫</div><div><div class="detail-label">Confirmation #</div><div class="detail-value" style="font-weight:700;color:#F47C4C;letter-spacing:.04em">${reg.confirmationNumber}</div></div></div>` : ""}
      <div class="detail-row"><div class="detail-icon">📅</div><div><div class="detail-label">Start Date</div><div class="detail-value">Saturday, June 20, 2025</div></div></div>
      <div class="detail-row"><div class="detail-icon">⏰</div><div><div class="detail-label">Time (every Saturday)</div><div class="detail-value">9:30 AM – 1:00 PM · includes breaks</div></div></div>
      <div class="detail-row"><div class="detail-icon">💻</div><div><div class="detail-label">Format</div><div class="detail-value">Live on Zoom · Link sent 48hrs before Session 1</div></div></div>
      <div class="detail-row"><div class="detail-icon">💬</div><div><div class="detail-label">Community</div><div class="detail-value">WhatsApp cohort group · Invite sent separately</div></div></div>
      <div class="detail-row"><div class="detail-icon">💳</div><div><div class="detail-label">Investment</div><div class="detail-value">$649 · June Cohort founding price</div></div></div>
    </div>

    <div class="divider"><div class="divider-line"></div><div class="divider-text">Your 4-session journey</div><div class="divider-line"></div></div>
    <div class="timeline">
      <div class="tl-row"><div class="tl-left"><div class="tl-dot" style="background:rgba(30,64,175,0.2);color:#93C5FD">1</div><div class="tl-line"></div></div><div class="tl-content"><div class="tl-date">June 20, 2025</div><div class="tl-title">AI Foundations — See the World Differently <span class="tl-badge" style="background:rgba(30,64,175,0.15);color:#93C5FD">Beginner-friendly</span></div></div></div>
      <div class="tl-row"><div class="tl-left"><div class="tl-dot" style="background:rgba(146,64,14,0.2);color:#FCD34D">2</div><div class="tl-line"></div></div><div class="tl-content"><div class="tl-date">June 27, 2025</div><div class="tl-title">AI in Your Work — Save 10 Hours a Week <span class="tl-badge" style="background:rgba(146,64,14,0.15);color:#FCD34D">Hands-on lab</span></div></div></div>
      <div class="tl-row"><div class="tl-left"><div class="tl-dot" style="background:rgba(6,95,70,0.2);color:#6EE7B7">3</div><div class="tl-line"></div></div><div class="tl-content"><div class="tl-date">July 4, 2025</div><div class="tl-title">Build Income with AI — Design Your Offer <span class="tl-badge" style="background:rgba(6,95,70,0.15);color:#6EE7B7">Revenue focused</span></div></div></div>
      <div class="tl-row"><div class="tl-left"><div class="tl-dot" style="background:rgba(76,29,149,0.2);color:#C4B5FD">4</div><div class="tl-line"></div></div><div class="tl-content"><div class="tl-date">July 11, 2025</div><div class="tl-title">AI Agents, Automation &amp; Vibe Coding <span class="tl-badge" style="background:rgba(76,29,149,0.15);color:#C4B5FD">Advanced build</span></div></div></div>
      <div class="tl-row"><div class="tl-left"><div class="tl-dot" style="background:rgba(30,58,95,0.2);color:#BAE6FD">🎓</div></div><div class="tl-content"><div class="tl-date">Date — TBA</div><div class="tl-title">Certificate &amp; Graduation Ceremony <span class="tl-badge" style="background:rgba(30,58,95,0.15);color:#BAE6FD">Bonus session</span></div></div></div>
    </div>

    <div class="divider"><div class="divider-line"></div><div class="divider-text">Get ready before June 20</div><div class="divider-line"></div></div>
    <div class="checklist-title">Your Pre-Training Checklist</div>
    <p class="checklist-sub">Complete these before Session 1. Everything takes about 20 minutes total — arriving prepared means you get more out of every minute in the room.</p>

    <div class="check-group">
      <div class="check-group-label label-accounts">1 — Accounts to Set Up</div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Set up a Claude account (recommended)</div><div class="check-note">Go to <a href="https://claude.ai" class="check-link">claude.ai</a> — a free account works. A one-month Pro subscription (~$20) is preferable as it unlocks higher usage limits for the labs, but it is not mandatory.</div></div></div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Alternatively: set up a ChatGPT account</div><div class="check-note">Go to <a href="https://chatgpt.com" class="check-link">chatgpt.com</a> — a free account works. A one-month Plus subscription (~$20) is preferable for the hands-on labs, but not mandatory. One account is enough — Claude or ChatGPT, not both.</div></div></div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Create a Canva account</div><div class="check-note">Go to <a href="https://canva.com" class="check-link">canva.com</a> and sign up. Free tier is sufficient. Used in Session 3 for building your first marketing asset.</div></div></div>
      <div class="check-item" style="opacity:0.5;border-color:rgba(255,255,255,0.03)"><div class="check-box" style="border-color:rgba(255,255,255,0.15)"></div><div class="check-content"><div class="check-main" style="color:rgba(255,255,255,0.4)">Other accounts <span style="font-size:10px;background:rgba(249,167,56,0.12);color:#F9A738;border:1px solid rgba(249,167,56,0.25);padding:2px 8px;border-radius:20px;margin-left:6px;font-weight:600;letter-spacing:0.06em">Done in class</span></div><div class="check-note">Any additional accounts or tools needed for the labs will be created together during class — no setup required beforehand.</div></div></div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Create a Google account (if you don't have one)</div><div class="check-note">Needed for Google Forms, Google Sheets, and Google Drive — used throughout Sessions 2–4.</div></div></div>
    </div>

    <div class="check-group">
      <div class="check-group-label label-tech">2 — Technical Setup</div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Download the Zoom app</div><div class="check-note">Download at <a href="https://zoom.us/download" class="check-link">zoom.us/download</a>. The app is more stable than the browser version. Test your audio and video before June 20.</div></div></div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Prepare your workspace</div><div class="check-note">Find a quiet spot with good lighting and a stable internet connection (at least 5 Mbps). Have your laptop charged. A second screen is helpful but not required.</div></div></div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Use a laptop or tablet — not a phone</div><div class="check-note">Sessions are hands-on. You will have multiple tabs open, building and testing in real time. A phone will limit what you can do. Come with a laptop or tablet.</div></div></div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Keep your camera on</div><div class="check-note">This is a community experience, not a webinar. Camera on makes a real difference for the energy of the room — especially during the hands-on labs and live hot-seats.</div></div></div>
    </div>

    <div class="check-group">
      <div class="check-group-label label-mindset">3 — Mindset Prep</div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Write down your #1 goal for this training</div><div class="check-note">What do you want to be able to DO differently after 5 weeks? Be specific. Write it down and keep it visible. You will revisit it at the graduation session.</div></div></div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">List 3 tasks you do every week that take too long</div><div class="check-note">We revisit these in Session 2. The more specific, the better. Think: writing, research, emails, social media, admin, customer responses.</div></div></div>
      <div class="check-item"><div class="check-box"></div><div class="check-content"><div class="check-main">Tell one person you are doing this</div><div class="check-note">Accountability is powerful. Tell a friend, colleague, or family member. It makes you more likely to show up and do the homework — which is where the real transformation happens.</div></div></div>
    </div>

    <div class="rule-box"><div class="rule-icon">📌</div><div><div class="rule-title">The one rule for this training</div><div class="rule-text">No passive watching. Every session has hands-on labs — bring your laptop and be ready to participate. The participants who get the most out of this training are the ones who try things, share results, and ask questions. There are no wrong answers at this stage.</div></div></div>

    <div class="cta-wrap"><a href="https://www.tiblogics.com" class="cta-btn">Visit www.tiblogics.com</a><div class="cta-sub">Questions? Reply to this email or message us at arfa_edu@tiblogics.com</div></div>

    <div class="closing-quote">"Success only comes before work in the dictionary. You showed up. That is already more than most people do. Now let's build something real."</div>
    <div class="closing-sign">See you on June 20 at 9:30AM 🚀<strong>The TIBLOGICS Team</strong></div>
  </div>

  <div class="footer">
    <div class="footer-logo">TIBLOGICS</div>
    <div class="footer-links">
      <a href="mailto:arfa_edu@tiblogics.com">arfa_edu@tiblogics.com</a>
      <a href="https://www.tiblogics.com">www.tiblogics.com</a>
    </div>
    <div class="footer-copy">© 2025 TIBLOGICS</div>
  </div>
</div>
</body>
</html>`,
  });
}

// Drop-in replacement for `resend.emails.send({from, to, subject, html})`
const resendCompat = {
  emails: {
    send(msg: { from?: string; to: string | string[]; subject: string; html: string }) {
      return getTransport().sendMail({
        from: FROM, // always use configured Titan sender; ignore any passed from value
        to: Array.isArray(msg.to) ? msg.to.join(", ") : msg.to,
        subject: msg.subject,
        html: msg.html,
      });
    },
  },
};

// ARFA-branded mailer — sends from arfa_edu@tiblogics.com
export const arfaMailer = {
  emails: {
    send(msg: { to: string | string[]; subject: string; html: string }) {
      return getArfaTransport().sendMail({
        from: ARFA_FROM,
        to: Array.isArray(msg.to) ? msg.to.join(", ") : msg.to,
        subject: msg.subject,
        html: msg.html,
      });
    },
  },
};

export default resendCompat;
