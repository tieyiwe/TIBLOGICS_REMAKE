import { escapeHtml } from "@/lib/require-admin";
import { mailTransport, MAIL_FROM } from "@/lib/resend";
import { translatorFor } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { siteUrl } from "../links";
import { unsubscribeToken } from "../outreach/suppression";
import type { MagnetContent, QuizResult } from "./types";

// The email that delivers a lead magnet: the asset link, the quiz result
// when there is one, the recommended product, and a one-click unsubscribe
// (signed, works without login; also sent as List-Unsubscribe headers).

export function acquireUnsubscribeUrl(email: string): string {
  return `${siteUrl()}/api/acquire/unsubscribe?t=${unsubscribeToken(email)}`;
}

/** Product link with the magnet's campaign, so a purchase is attributed to it. */
export function trackedProductUrl(path: string, campaign: string, medium: string): string | null {
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  const u = new URL(path, siteUrl());
  u.searchParams.set("utm_source", "acquire");
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

const para = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6;font-size:15px;color:#0D1B2A">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

const button = (href: string, label: string, color = "#B8500A") =>
  `<p style="margin:20px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:${color};color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">${escapeHtml(label)}</a></p>`;

export async function sendMagnetEmail(opts: {
  to: string;
  name: string | null;
  locale: Locale;
  title: string;
  content: MagnetContent;
  accessUrl: string;
  result: QuizResult | null;
  product: { title: string; url: string } | null;
}): Promise<void> {
  const t = translatorFor(opts.locale);
  const c = opts.content;
  const unsub = acquireUnsubscribeUrl(opts.to);
  const resultBlock = opts.result
    ? `<div style="margin:18px 0;padding:16px 18px;background:#F4F7FB;border-radius:12px;border-left:4px solid #F47C20">
<p style="margin:0 0 8px;font-weight:700;font-size:15px;color:#0D1B2A">${escapeHtml(t("acquire.email.result", { score: opts.result.score, band: opts.result.band?.title ?? "" }))}</p>
${opts.result.band?.body ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#3A4A5C">${escapeHtml(opts.result.band.body)}</p>` : ""}
${opts.result.tips.length ? `<p style="margin:8px 0 4px;font-size:14px;font-weight:700;color:#0D1B2A">${escapeHtml(t("acquire.email.tips"))}</p><ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#3A4A5C">${opts.result.tips.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : ""}
</div>`
    : "";
  const productBlock =
    opts.product && c.productPitch
      ? `<div style="margin:24px 0 0;padding:18px;border:1px solid #D2DCE8;border-radius:12px">
<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5A6E84">${escapeHtml(t("acquire.email.next"))}</p>
<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#0D1B2A">${escapeHtml(opts.product.title)}</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#3A4A5C">${escapeHtml(c.productPitch)}</p>
${button(opts.product.url, c.productCta || opts.product.title, "#1B3A6B")}</div>`
      : "";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden">
<div style="background:#1B3A6B;padding:20px 28px"><span style="color:#fff;font-size:20px;font-weight:700">TIB<span style="color:#F47C20">LOGICS</span></span></div>
<div style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0D1B2A">${escapeHtml(c.headline || opts.title)}</h1>
${para(c.emailBody || c.intro)}
${resultBlock}
${button(opts.accessUrl, t("acquire.email.open"))}
${productBlock}
</div>
<div style="padding:16px 28px 24px;font-size:12px;line-height:1.6;color:#5A6E84;border-top:1px solid #E8EFF8">
${escapeHtml(t("acquire.email.why"))} <a href="${escapeHtml(unsub)}" style="color:#2251A3">${escapeHtml(t("acquire.email.unsubscribe"))}</a><br>TIBLOGICS · tiblogics.com
</div></div></body></html>`;
  await mailTransport().sendMail({
    from: MAIL_FROM,
    to: opts.to,
    subject: (c.emailSubject || opts.title).slice(0, 200),
    html,
    headers: {
      "List-Unsubscribe": `<${unsub}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}
