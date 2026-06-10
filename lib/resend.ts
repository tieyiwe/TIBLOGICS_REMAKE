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
  return nodemailer.createTransport({
    host: process.env.TITAN_SMTP_HOST ?? "smtp.titan.email",
    port: Number(process.env.TITAN_SMTP_PORT ?? 465),
    secure: Number(process.env.TITAN_SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.ARFA_SMTP_USER ?? process.env.TITAN_SMTP_USER ?? "arfa_edu@tiblogics.com",
      pass: process.env.ARFA_SMTP_PASS ?? process.env.TITAN_SMTP_PASS,
    },
  });
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
            &nbsp;&middot;&nbsp;
            <a href="https://tiblogics.com" style="color:#2251A3;">tiblogics.com</a>
          </p>
        </div>
      </div>`,
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
