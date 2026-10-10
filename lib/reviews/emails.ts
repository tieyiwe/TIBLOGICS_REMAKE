// Review emails: the invitation (in the invitee's language) and the alert to
// the owner when a review arrives. ARFA learners hear from the ARFA mailbox
// in the academy's layout; clients from info@ in the TIBLOGICS layout.
// Every typed value is escaped. Nothing here logs an email address.
import { arfaMailer, mailTransport, MAIL_FROM } from "@/lib/resend";
import { learnEmailShell } from "@/lib/learn/emails";
import { translator } from "@/lib/learn/i18n";
import { adminNotifyEmail } from "@/lib/learn/admin/signup-notify";
import { escapeHtml as esc } from "@/lib/require-admin";
import type { Locale } from "@/lib/i18n/config";
import { signReviewToken } from "./token";
import { firstNameOf, SOURCE_LABELS, type ReviewSource } from "./types";

export const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

/** The personal /review link for an invitee (60 days). */
export function reviewLink(i: { email: string; name: string; source: ReviewSource; locale: Locale }): string {
  return `${SITE}/review?t=${signReviewToken(i)}`;
}

const p = (html: string) => `<p style="font-size:15px;color:#3A4A5C;line-height:1.7;margin:0 0 14px;">${html}</p>`;

function tiblogicsShell(title: string, body: string, cta: { href: string; label: string }, foot: string) {
  return `<div style="background:#F4F7FB;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:24px 32px;">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:.04em;">TIB<span style="color:#F47C20;">LOGICS</span></div>
    </div>
    <div style="padding:32px;">
      <h1 style="font-size:21px;color:#0D1B2A;margin:0 0 14px;line-height:1.3;">${title}</h1>
      ${body}
      <div style="text-align:center;margin:26px 0 8px;">
        <a href="${cta.href}" style="display:inline-block;background:#F47C20;color:#fff;font-weight:800;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:50px;">${cta.label}</a>
      </div>
      <p style="font-size:12px;color:#7A8FA6;line-height:1.6;margin:18px 0 0;text-align:center;">${foot}</p>
    </div>
    <div style="background:#F4F7FB;padding:16px 32px;text-align:center;color:#8A9BA0;font-size:12px;">
      © ${new Date().getFullYear()} TIBLOGICS · <a href="${SITE}" style="color:#8A9BA0;">tiblogics.com</a>
    </div>
  </div>
</div>`;
}

/** The invitation. Callers claim the invite first (lib/reviews/db.ts claimInvite). */
export async function sendReviewInviteEmail(i: { email: string; name: string; source: ReviewSource; locale: Locale }): Promise<void> {
  const t = translator(i.locale);
  const first = esc(firstNameOf(i.name) || i.name);
  const href = reviewLink(i);
  const title = t("reviews.email.title", { name: first });
  const body =
    p(t(`reviews.email.p1.${i.source}`)) +
    p(t("reviews.email.p2")) +
    p(t("reviews.email.p3")) +
    p(t("reviews.email.sign"));
  const subjectName = firstNameOf(i.name) || i.name;
  const subject = t(i.source === "arfa" ? "reviews.email.subjectArfa" : "reviews.email.subject", { name: subjectName });
  const cta = { href, label: `${t("reviews.email.cta")} →` };
  if (i.source === "arfa") {
    await arfaMailer.emails.send({
      to: i.email,
      subject,
      html: learnEmailShell(t, title, body, cta, `<p style="font-size:12px;color:#8A9BA0;text-align:center;margin:0;">${t("reviews.email.expiry")}</p>`),
    });
    return;
  }
  await mailTransport().sendMail({ from: MAIL_FROM, to: i.email, subject, html: tiblogicsShell(title, body, cta, t("reviews.email.expiry")) });
}

/** "New review" to the owner (ADMIN_NOTIFY_EMAIL). English (staff email). Fire and forget. */
export async function sendNewReviewAlert(r: { name: string; role: string; company: string | null; rating: number; quote: string; source: ReviewSource; consentPublish: boolean; addedByStaff: boolean }): Promise<void> {
  const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0D1B2A;">
    <h2 style="font-size:18px;margin:0 0 6px;">New review waiting for approval</h2>
    <p style="margin:0 0 16px;color:#5A6E84;font-size:13px;">${esc(SOURCE_LABELS[r.source])}${r.addedByStaff ? " · added by staff" : ""} · ${r.consentPublish ? "agreed to publication" : "<strong>private feedback (no consent to publish)</strong>"}</p>
    <p style="font-size:20px;color:#F47C20;margin:0 0 8px;letter-spacing:2px;">${stars}</p>
    <blockquote style="margin:0 0 14px;padding:14px 18px;background:#F4F7FB;border-left:4px solid #F47C20;border-radius:8px;font-size:15px;line-height:1.6;">${esc(r.quote)}</blockquote>
    <p style="margin:0 0 20px;font-size:14px;"><strong>${esc(r.name)}</strong>, ${esc(r.role)}${r.company ? `, ${esc(r.company)}` : ""}</p>
    <a href="${SITE}/admin_pro/reviews" style="display:inline-block;background:#1B3A6B;color:#fff;text-decoration:none;padding:11px 22px;border-radius:10px;font-weight:700;font-size:14px;">Review it in the admin →</a>
    <p style="margin:18px 0 0;color:#7A8FA6;font-size:12px;">Nothing is published until someone approves it. Sent to ${esc(adminNotifyEmail())} (ADMIN_NOTIFY_EMAIL).</p>
  </div>`;
  await mailTransport().sendMail({ from: MAIL_FROM, to: adminNotifyEmail(), subject: `New ${r.rating}★ review from ${firstNameOf(r.name)} (${SOURCE_LABELS[r.source]})`, html });
}
