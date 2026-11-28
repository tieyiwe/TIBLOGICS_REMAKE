// Support emails.
//
//   Owner alert   every new learner/visitor request and every learner
//                 follow-up (batched: at most one per ticket per 10 minutes,
//                 see tickets.ts). To ADMIN_NOTIFY_EMAIL (default
//                 info@tiblogics.com), from the main Titan mailer, with
//                 Reply-To set to the learner so the owner can answer from
//                 the mail client (that reply does not reach the admin thread,
//                 the footer says so).
//   Learner ack   "We got your message", in the learner's language, through
//                 arfaMailer (arfa_edu@tiblogics.com).
//   Visitor reply a staff answer to a signed-out visitor (they have no Inbox).
//
// Everything typed by a user is escaped (renderMarkdownLite escapes first);
// subjects are kept on one line (no header injection).
import { mailTransport, MAIL_FROM, arfaMailer } from "@/lib/resend";
import { translator } from "@/lib/learn/i18n";
import { learnEmailShell, learnEmailEsc, learnEmailP, LEARN_SITE } from "@/lib/learn/emails";
import { adminNotifyEmail } from "@/lib/learn/admin/signup-notify";
import { bodyHtml } from "@/lib/learn/inbox/email";
import { CONTEXT_LABEL, TOPIC_LABEL, isTopic, type SupportContext } from "./shared";

const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();

/** First words of a message for a subject line. */
export function firstWords(text: string, max = 60): string {
  const flat = oneLine(text);
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 20 ? cut.lastIndexOf(" ") : max)}…`;
}

/** A plain address safe to put in a Reply-To header, or null. */
export function headerSafeEmail(e: string | null | undefined): string | null {
  const v = (e ?? "").trim();
  return /^[^\s@<>",;:()\\[\]]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/.test(v) ? v : null;
}

export function adminTicketUrl(ticketId: string): string {
  return `${LEARN_SITE}/admin_pro/communications/support/${encodeURIComponent(ticketId)}`;
}

const row = (k: string, v: string) =>
  `<tr><td style="padding:5px 12px 5px 0;color:#7A8FA6;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>` +
  `<td style="padding:5px 0;color:#0D1B2A;font-size:14px;">${v}</td></tr>`;

export async function sendOwnerSupportAlert(opts: {
  ticketId: string;
  kind: "learner" | "visitor";
  followUp: boolean;
  topic: string;
  name: string;
  email: string;
  plan: string | null;
  locale: string;
  messages: Array<{ body: string; at: Date }>;
  context: SupportContext | null;
  studentId: string | null;
}) {
  const t = translator("en");
  const topic = isTopic(opts.topic) ? TOPIC_LABEL[opts.topic] : "Other";
  const latest = opts.messages[opts.messages.length - 1]?.body ?? "";
  const subject = oneLine(`[ARFA support] ${opts.followUp ? "Follow-up, " : ""}${topic}: ${firstWords(latest)}`).slice(0, 180);
  const link = adminTicketUrl(opts.ticketId);
  const who = [
    row("Name", learnEmailEsc(opts.name)),
    row("Email", `<a href="mailto:${learnEmailEsc(opts.email)}">${learnEmailEsc(opts.email)}</a>`),
    row("Type", opts.kind === "visitor" ? "Visitor (not signed in)" : "Learner"),
    row("Plan", learnEmailEsc(opts.plan ?? "Unknown")),
    row("Language", learnEmailEsc(opts.locale.toUpperCase())),
    opts.studentId ? row("Profile", `<a href="${LEARN_SITE}/admin_pro/learn/learners/${encodeURIComponent(opts.studentId)}">Open learner profile</a>`) : "",
  ].join("");
  const ctx = opts.context
    ? (Object.keys(CONTEXT_LABEL) as Array<keyof SupportContext>)
        .filter((k) => opts.context?.[k])
        .map((k) => row(CONTEXT_LABEL[k], learnEmailEsc(String(opts.context![k]))))
        .join("")
    : "";
  const msgs = opts.messages
    .map(
      (m) =>
        `<div style="border-left:3px solid #F47C20;padding:4px 0 4px 14px;margin:0 0 14px;">` +
        (opts.messages.length > 1 ? `<p style="font-size:12px;color:#8A9BA0;margin:0 0 6px;">${learnEmailEsc(m.at.toISOString().replace("T", " ").slice(0, 16))} UTC</p>` : "") +
        bodyHtml(m.body) +
        `</div>`,
    )
    .join("");
  const html = learnEmailShell(
    t,
    learnEmailEsc(opts.followUp ? `${opts.name} followed up (${opts.messages.length} new)` : `New support request: ${topic}`),
    `<table style="border-collapse:collapse;margin:0 0 16px;">${who}</table>` +
      msgs +
      (ctx ? `<p style="font-size:12px;font-weight:700;color:#5b6b72;margin:18px 0 4px;text-transform:uppercase;letter-spacing:.06em;">Context</p><table style="border-collapse:collapse;">${ctx}</table>` : ctx === "" && opts.context === null ? learnEmailP("The learner chose not to include page context.") : ""),
    { href: link, label: "Reply in admin →" },
    `<p style="font-size:12.5px;color:#8A9BA0;line-height:1.6;margin:18px 0 0;">You can reply to this email: it goes to ${learnEmailEsc(opts.email)}. Replies by email are not saved in the admin thread, so the learner will not see them in their ARFA Inbox and the ticket stays open. Replying in admin is recommended.</p>` +
      `<p style="font-size:12px;color:#8A9BA0;margin:10px 0 0;">Sent to ${learnEmailEsc(adminNotifyEmail())} (ADMIN_NOTIFY_EMAIL). Rapid follow-ups are batched, at most one email per conversation every 10 minutes.</p>`,
  );
  const replyTo = headerSafeEmail(opts.email);
  await mailTransport().sendMail({ from: MAIL_FROM, to: adminNotifyEmail(), subject, html, ...(replyTo ? { replyTo } : {}) });
}

/** "We got your message" to the learner or visitor (their language). */
export async function sendSupportAck(opts: { to: string; name: string; locale: string; message: string; threadId: string | null }) {
  const t = translator(opts.locale);
  // A visitor's address is unverified (anyone can type anyone's email), so
  // their own text is never echoed back: otherwise the form would mail
  // arbitrary content and links, under the ARFA name, to any inbox. The
  // first word of the name is cut short for the same reason.
  const visitor = !opts.threadId;
  const firstRaw = oneLine(opts.name).split(" ")[0] || opts.name;
  const first = learnEmailEsc(visitor ? firstRaw.replace(/[^\p{L}\p{M}'-]/gu, "").slice(0, 30) : firstRaw);
  await arfaMailer.emails.send({
    to: opts.to,
    subject: oneLine(t("comms.support.ackSubject")),
    html: learnEmailShell(
      t,
      t("comms.support.ackTitle", { name: first }),
      learnEmailP(learnEmailEsc(t("comms.support.ackBody"))) +
        (visitor
          ? ""
          : `<p style="font-size:12px;font-weight:700;color:#5b6b72;margin:18px 0 6px;">${learnEmailEsc(t("comms.support.ackYours"))}</p>` +
            `<div style="border-left:3px solid #e6ebf1;padding:4px 0 4px 14px;margin:0 0 14px;">${bodyHtml(opts.message)}</div>`),
      opts.threadId ? { href: `${LEARN_SITE}/learn/inbox/${encodeURIComponent(opts.threadId)}`, label: `${t("comms.email.inboxCta")} →` } : undefined,
      `<p style="font-size:12.5px;color:#8A9BA0;line-height:1.6;margin:18px 0 0;">${learnEmailEsc(opts.threadId ? t("comms.support.ackNoteLearner") : t("comms.support.ackNoteVisitor"))}</p>`,
    ),
  });
}

/** A staff answer to a signed-out visitor, by email only. */
export async function sendVisitorReply(opts: { to: string; name: string; locale: string; body: string }) {
  const t = translator(opts.locale);
  const first = learnEmailEsc(oneLine(opts.name).split(" ")[0] || opts.name);
  await arfaMailer.emails.send({
    to: opts.to,
    subject: oneLine(t("comms.support.visitorReplySubject")),
    html: learnEmailShell(
      t,
      t("comms.email.replyTitle", { name: first }),
      bodyHtml(opts.body),
      undefined,
      `<p style="font-size:12.5px;color:#8A9BA0;line-height:1.6;margin:18px 0 0;">${learnEmailEsc(t("comms.support.visitorReplyNote"))}</p>`,
    ),
  });
}
