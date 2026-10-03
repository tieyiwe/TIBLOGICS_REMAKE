// "New TIBLOGICS Learn sign-up" email to the owner, sent on every learner
// sign-up from app/api/learn/auth/signup/route.ts. English only (staff email).
// Sent through the main Titan mailer (info@), like the other admin alerts.
import resend from "@/lib/resend";
import { escapeHtml } from "@/lib/require-admin";

const SITE = (
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com"
).replace(/\/$/, "");

const LANG: Record<string, string> = { en: "English", fr: "French", sw: "Swahili" };

/** Where the owner is told about sign-ups. */
export function adminNotifyEmail(): string {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || "info@tiblogics.com";
}

/**
 * Callers fire and forget (`.catch(log)`): this must never block or fail a
 * sign-up. Every user-typed value is escaped.
 */
export async function sendSignupNotification(s: {
  studentId: string;
  name: string;
  email: string;
  locale: string;
  createdAt: Date;
  /** Track slug carried from a track page (?track=). */
  track?: string | null;
  /** Same-site path the learner was sent on to (?next=), e.g. a team invitation. */
  next?: string | null;
  /** Referring page, when no track or next was given. */
  referer?: string | null;
}) {
  const esc = (v: string) => escapeHtml(v);
  const when = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full", timeStyle: "short", timeZone: "UTC",
  }).format(s.createdAt) + " UTC";
  const source = [
    s.track ? `Track page: ${s.track}` : null,
    s.next ? (s.next.startsWith("/join-team/") ? "Team invitation" : `Continuing to ${s.next}`) : null,
    !s.track && !s.next && s.referer ? `Referred from ${s.referer}` : null,
  ].filter((x): x is string => !!x);
  const adminUrl = `${SITE}/admin_pro/learn/learners/${encodeURIComponent(s.studentId)}`;

  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#7A8FA6;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>` +
    `<td style="padding:6px 0;color:#0D1B2A;font-size:14px;">${v}</td></tr>`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#131A1B;padding:20px 24px;">
      <div style="font-size:18px;font-weight:800;color:#fff;">TIB<span style="color:#F47C20;">LOGICS</span> <span style="color:#F9A738;font-weight:400;">Learn</span></div>
    </div>
    <div style="padding:24px;background:#fff;border:1px solid #e6ebf1;">
      <h2 style="margin:0 0 12px;font-size:20px;color:#0D1B2A;">New learner sign-up</h2>
      <table style="border-collapse:collapse;">
        ${row("Name", esc(s.name))}
        ${row("Email", `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`)}
        ${row("Language", esc(LANG[s.locale] ?? s.locale))}
        ${row("Signed up", esc(when))}
        ${row("Came from", source.length ? source.map(esc).join("<br>") : "Direct (no track or referring page)")}
      </table>
      <p style="margin:22px 0 4px;">
        <a href="${esc(adminUrl)}" style="display:inline-block;background:#131A1B;color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:10px 20px;border-radius:8px;">Open in admin</a>
      </p>
      <p style="margin:16px 0 0;color:#7A8FA6;font-size:12px;">Sent to ${esc(adminNotifyEmail())} (ADMIN_NOTIFY_EMAIL).</p>
    </div>
  </div>`;

  // Header injection: nodemailer encodes subjects, but keep it to one line.
  const subject = `New ARFA (AI Academy) sign-up: ${s.name.replace(/[\r\n]+/g, " ").slice(0, 80)}`;
  await resend.emails.send({ to: adminNotifyEmail(), subject, html });
}
