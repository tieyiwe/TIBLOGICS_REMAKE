// Article comment emails: the guest's confirmation link, "someone replied to
// your comment", and the owner's alert. Every typed value is escaped. Nothing
// here logs an email address.
import { mailTransport, MAIL_FROM } from "@/lib/resend";
import { translatorFor } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { adminNotifyEmail } from "@/lib/learn/admin/signup-notify";
import { escapeHtml as esc } from "@/lib/require-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE, tiblogicsShell } from "@/lib/reviews/emails";
import { confirmToken, unsubscribeToken } from "./identity";

const p = (html: string) => `<p style="font-size:15px;color:#3A4A5C;line-height:1.7;margin:0 0 14px;">${html}</p>`;
const quote = (text: string) =>
  `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:4px solid #F47C20;background:#F4F7FB;border-radius:8px;font-size:14px;color:#0D1B2A;line-height:1.6;white-space:pre-line;">${esc(text.length > 600 ? `${text.slice(0, 600)}…` : text)}</blockquote>`;

const loc = (l: string): Locale => (isLocale(l) ? l : "en");
export const articleUrl = (slug: string, commentId?: string) => `${SITE}/ai-times/${slug}${commentId ? `#comment-${commentId}` : "#discussion"}`;

/**
 * The guest's link opens the article with ?confirm=: the page asks them to
 * press "Publish" (a POST), so a mail scanner that opens links cannot publish
 * a comment on its own.
 */
export async function sendConfirmEmail(c: { to: string; name: string; locale: string; commentId: string; body: string; postTitle: string; slug: string; newsletter: boolean }): Promise<void> {
  const t = translatorFor(loc(c.locale));
  const href = `${SITE}/ai-times/${c.slug}?confirm=${encodeURIComponent(confirmToken(c.commentId, c.to, c.newsletter))}#discussion`;
  const html = tiblogicsShell(
    t("engageMail.confirm.title", { name: esc(c.name) }),
    p(t("engageMail.confirm.p1", { title: `<strong>${esc(c.postTitle)}</strong>` })) + quote(c.body) + p(t("engageMail.confirm.p2")),
    { href, label: `${t("engageMail.confirm.cta")} →` },
    t("engageMail.confirm.foot"),
  );
  await mailTransport().sendMail({ from: MAIL_FROM, to: c.to, subject: t("engageMail.confirm.subject"), html });
}

export async function sendReplyEmail(r: {
  to: string;
  name: string;
  locale: string;
  replier: string;
  body: string;
  postTitle: string;
  slug: string;
  replyId: string;
}): Promise<void> {
  // At most a few reply emails an hour to one person, however busy the thread.
  if (!(await checkRateLimit(`comment-reply-mail:${r.to}`, 4, 3_600_000))) return;
  const t = translatorFor(loc(r.locale));
  const unsub = `${SITE}/api/blog/engage/unsubscribe?t=${encodeURIComponent(unsubscribeToken(r.to, loc(r.locale)))}`;
  const html = tiblogicsShell(
    t("engageMail.reply.title", { name: esc(r.replier) }),
    p(t("engageMail.reply.p1", { name: esc(r.name), title: `<strong>${esc(r.postTitle)}</strong>` })) + quote(r.body),
    { href: articleUrl(r.slug, r.replyId), label: `${t("engageMail.reply.cta")} →` },
    `${t("engageMail.reply.foot")} <a href="${unsub}" style="color:#7A8FA6;">${t("engageMail.reply.unsub")}</a>`,
  );
  await mailTransport().sendMail({
    from: MAIL_FROM,
    to: r.to,
    subject: t("engageMail.reply.subject", { name: r.replier.slice(0, 60) }),
    html,
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
}

/** "New comment" to the owner (English, staff email). Capped so a flood cannot fill the inbox. */
export async function sendCommentAlert(c: { name: string; kind: string; body: string; postTitle: string; slug: string; id: string; status: string; heldReason: string | null }): Promise<void> {
  if (!(await checkRateLimit("comment-alert:owner", 30, 3_600_000))) return;
  const held = c.status === "pending";
  const why = c.heldReason === "links" ? "it has a link" : c.heldReason === "phone" ? "it has a phone number" : c.heldReason === "words" ? "it uses a word on the filter list" : c.heldReason === "reports" ? "readers reported it" : "";
  const html = tiblogicsShell(
    held ? `A comment is waiting for you (${esc(why)})` : `New comment from ${esc(c.name)}`,
    p(`<strong>${esc(c.name)}</strong> (${esc(c.kind)}) on <strong>${esc(c.postTitle)}</strong>:`) + quote(c.body),
    held ? { href: `${SITE}/admin_pro/blog/comments?tab=review`, label: "Review it →" } : { href: articleUrl(c.slug, c.id), label: "See it on the article →" },
    "Comments are moderated at Admin → AI Times → Comments.",
  );
  await mailTransport().sendMail({
    from: MAIL_FROM,
    to: adminNotifyEmail(),
    subject: held ? `💬 Comment to review: ${c.postTitle.slice(0, 70)}` : `💬 New comment: ${c.postTitle.slice(0, 70)}`,
    html,
  });
}
