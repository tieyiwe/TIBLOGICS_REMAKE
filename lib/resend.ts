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
            <p><strong>Zoom Link:</strong> ${appointment.zoomLink ?? "Will be sent 24hrs before your session"}</p>
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
}) {
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(appointment.date));

  const addOns =
    [
      appointment.addOnRecording && "Recording + Transcript (+$49)",
      appointment.addOnActionPlan && "Written Action Plan (+$79)",
      appointment.addOnSlackAccess && "30-day Slack Access (+$149)",
    ]
      .filter(Boolean)
      .join(", ") || "None";

  await getResend().emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.TIWE_EMAIL!,
    subject: `🗓️ New ${appointment.serviceType} Booking — ${appointment.firstName} ${appointment.lastName} on ${dateStr}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1B3A6B;">New Booking Alert</h2>
        <div style="background: #F4F7FB; border-radius: 12px; padding: 20px;">
          <p><strong>Client:</strong> ${appointment.firstName} ${appointment.lastName} | ${appointment.email}${appointment.company ? ` | ${appointment.company}` : ""}</p>
          <p><strong>Service:</strong> ${appointment.serviceType}</p>
          <p><strong>Date:</strong> ${dateStr} at ${appointment.timeSlot} ET</p>
          <p><strong>Total:</strong> $${(appointment.totalAmount / 100).toFixed(0)} | Add-ons: ${addOns}</p>
          <p><strong>Payment:</strong> ${appointment.paymentStatus ?? "pending"}</p>
          ${appointment.goalNotes ? `<p><strong>Their goals:</strong> ${appointment.goalNotes}</p>` : ""}
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/appointments" style="color: #F47C20;">View in Admin Dashboard →</a></p>
      </div>
    `,
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
