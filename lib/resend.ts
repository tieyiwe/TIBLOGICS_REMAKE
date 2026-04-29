import { Resend } from "resend";

// Deferred so the module can be imported at build time without RESEND_API_KEY
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "no-key");
}

// Proxy preserves the Resend instance API for files that do:
//   import resend from "@/lib/resend"; resend.emails.send(...)
const resendProxy = new Proxy({} as Resend, {
  get(_: Resend, prop: string | symbol) {
    return (getResend() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

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

  await getResend().emails.send({
    from: process.env.FROM_EMAIL!,
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

  const addOns = [
    appointment.addOnActionPlan && "Written Action Plan (+$79)",
  ].filter(Boolean).join(", ") || "None";

  const isPaid = appointment.totalAmount > 0;
  const adminEmail = process.env.TIWE_EMAIL || process.env.DESIGN_EMAIL;
  if (!adminEmail) return;

  await getResend().emails.send({
    from: process.env.FROM_EMAIL!,
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
        ${addOns !== "None" ? `<tr><td style="padding:8px 0;color:#7A8FA6;">Add-ons</td><td style="padding:8px 0;color:#0D1B2A;">${addOns}</td></tr>` : ""}
        ${appointment.goalNotes ? `<tr><td style="padding:8px 0;color:#7A8FA6;vertical-align:top;">Their Goals</td><td style="padding:8px 0;color:#3A4A5C;font-style:italic;">${appointment.goalNotes}</td></tr>` : ""}
      </table>

      ${appointment.meetingLink ? `
      <div style="margin:24px 0;padding:16px 20px;background:#EFF8FF;border-radius:12px;border-left:4px solid #1D76BA;">
        <p style="margin:0 0 8px;font-size:12px;color:#1D76BA;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Jitsi Meeting Link</p>
        <a href="${appointment.meetingLink}" style="color:#1D76BA;word-break:break-all;font-size:14px;">${appointment.meetingLink}</a>
      </div>` : ""}

      <div style="margin-top:24px;display:flex;gap:12px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/appointments"
           style="display:inline-block;background:#F47C20;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">
          View in Admin →
        </a>
        ${appointment.meetingLink ? `<a href="${appointment.meetingLink}"
           style="display:inline-block;background:#1D76BA;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">
          Join on Jitsi →
        </a>` : ""}
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
  await getResend().emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.TIWE_EMAIL!,
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

export default resendProxy;
