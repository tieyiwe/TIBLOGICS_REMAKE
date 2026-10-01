// Branded ARFA emails for the communications center: a campaign message,
// an admin reply in an Inbox thread, and the "learner replied" alert to the
// ARFA team. Always through arfaMailer (from and reply-to
// arfa_edu@tiblogics.com), so learner replies to an email reach the team.
import { arfaMailer } from "@/lib/resend";
import { translator } from "@/lib/learn/i18n";
import { learnEmailShell, learnEmailEsc, learnEmailP, LEARN_SITE, ARFA_EMAIL } from "@/lib/learn/emails";
import { renderMarkdownLite } from "./markdown";
import { unsubscribeToken } from "./unsubscribe";

const P_STYLE = "font-size:14px;color:#3b4a52;line-height:1.7;margin:0 0 14px;";
const A_STYLE = "color:#C2560E;font-weight:600;";
const UL_STYLE = "font-size:14px;color:#3b4a52;line-height:1.7;margin:0 0 14px;padding-left:20px;";

export function bodyHtml(text: string): string {
  return renderMarkdownLite(text, { p: P_STYLE, a: A_STYLE, ul: UL_STYLE });
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

/** A campaign message for one learner (merge fields already applied). */
export function renderCampaignEmail(opts: {
  locale: string;
  subject: string;
  body: string;
  marketing: boolean;
  studentId: string;
  withInboxLink: boolean;
}): RenderedEmail {
  const t = translator(opts.locale);
  const subject = opts.subject.replace(/[\r\n]+/g, " ").slice(0, 200);
  const unsub = opts.marketing
    ? `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:22px 0 0;border-top:1px solid #eef1f4;padding-top:14px;">${t("comms.email.unsubscribe")} <a href="${LEARN_SITE}/learn/unsubscribe?t=${encodeURIComponent(unsubscribeToken(opts.studentId))}" style="color:#8A9BA0;">${t("comms.email.unsubscribeLink")}</a></p>`
    : "";
  const after =
    `<p style="font-size:12.5px;color:#8A9BA0;line-height:1.6;margin:18px 0 0;">${t("comms.email.replyNote")}</p>` + unsub;
  return {
    subject,
    html: learnEmailShell(
      t,
      learnEmailEsc(subject),
      bodyHtml(opts.body),
      opts.withInboxLink ? { href: `${LEARN_SITE}/learn/inbox`, label: `${t("comms.email.inboxCta")} →` } : undefined,
      after,
    ),
  };
}

export async function sendCampaignEmail(to: string, email: RenderedEmail) {
  await arfaMailer.emails.send({ to, subject: email.subject, html: email.html });
}

/** The ARFA team answered in a thread: the learner gets the reply by email too. */
export async function sendAdminReplyEmail(opts: { to: string; name: string; locale: string; subject: string; body: string; threadId: string }) {
  const t = translator(opts.locale);
  const first = learnEmailEsc(opts.name.split(" ")[0] || opts.name);
  await arfaMailer.emails.send({
    to: opts.to,
    subject: t("comms.email.replySubject", { subject: opts.subject.replace(/[\r\n]+/g, " ").slice(0, 150) }),
    html: learnEmailShell(
      t,
      t("comms.email.replyTitle", { name: first }),
      bodyHtml(opts.body),
      { href: `${LEARN_SITE}/learn/inbox/${encodeURIComponent(opts.threadId)}`, label: `${t("comms.email.inboxCta")} →` },
      `<p style="font-size:12.5px;color:#8A9BA0;line-height:1.6;margin:18px 0 0;">${t("comms.email.replyNote")}</p>`,
    ),
  });
}

/** A learner replied from the Inbox: alert the ARFA mailbox (English, internal). */
export async function sendLearnerReplyAlert(opts: { name: string; email: string; subject: string; body: string; threadId: string }) {
  const t = translator("en");
  const link = `${LEARN_SITE}/admin_pro/communications/inbox/${encodeURIComponent(opts.threadId)}`;
  await arfaMailer.emails.send({
    to: ARFA_EMAIL,
    subject: `Learner reply: ${opts.subject.replace(/[\r\n]+/g, " ").slice(0, 120)} (${opts.email})`,
    html: learnEmailShell(
      t,
      `${learnEmailEsc(opts.name)} replied`,
      learnEmailP(`<strong>${learnEmailEsc(opts.name)}</strong> (${learnEmailEsc(opts.email)}) replied in the Inbox thread “${learnEmailEsc(opts.subject)}”:`) +
        `<div style="border-left:3px solid #F47C20;padding:4px 0 4px 14px;margin:0 0 14px;">${bodyHtml(opts.body)}</div>`,
      { href: link, label: "Open in admin →" },
    ),
  });
}
