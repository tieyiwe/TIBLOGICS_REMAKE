import type { AgentReadyScan } from "@prisma/client";
import { mailTransport, MAIL_FROM } from "@/lib/resend";
import { escapeHtml } from "@/lib/require-admin";
import type { Locale } from "@/lib/i18n/config";
import { translatorFor } from "@/lib/i18n/server";
import { AGENT_PATH, type Buy } from "./service";

// The buyer's receipt (the report link: it is their access). Each payment is
// counted once by markPaid, so it is sent once. The owner's sale email is the
// platform's own (lib/payments/sale-alert.ts).

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function sendAgentReceipt(row: AgentReadyScan, buy: Buy): Promise<void> {
  if (!row.email) return;
  const locale = (["en", "fr", "sw"].includes(row.locale) ? row.locale : "en") as Locale;
  const t = translatorFor(locale);
  const link = `${SITE}${AGENT_PATH}/r/${row.token}`;
  const esc = escapeHtml;
  const title = t(buy === "kit" ? "tools.agent.email.kitTitle" : "tools.agent.email.reportTitle", { host: row.host });
  const body = t(buy === "kit" ? "tools.agent.email.kitBody" : "tools.agent.email.reportBody", { host: row.host });
  const help = t("tools.agent.email.help");
  const html = `
  <div style="background:#F4F7FB;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;">
      <div style="background:linear-gradient(135deg,#0D1B2A,#1B3A6B);padding:22px 30px;font-size:18px;font-weight:800;color:#fff;">TIB<span style="color:#F47C20;">LOGICS</span> · ${esc(t("tools.agent.name"))}</div>
      <div style="padding:28px 30px;font-size:14px;color:#3A4A5C;line-height:1.7;">
        <h1 style="font-size:20px;color:#0D1B2A;margin:0 0 12px;">${esc(title)}</h1>
        <p style="margin:0 0 18px;">${esc(body)}</p>
        <a href="${esc(link)}" style="display:inline-block;background:#F47C20;color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;">${esc(t("tools.agent.email.button"))}</a>
        <p style="margin:18px 0 0;">${esc(help)} <a href="${esc(`${SITE}/book`)}" style="color:#2251A3;">${esc(t("tools.agent.email.book"))}</a></p>
        <p style="margin:12px 0 0;font-size:12px;color:#7A8FA6;">${esc(t("tools.agent.email.keep"))}</p>
      </div>
    </div>
  </div>`;
  const text = [title, "", body, "", link, "", `${help} ${SITE}/book`, "", t("tools.agent.email.keep")].join("\n");
  await mailTransport().sendMail({ from: MAIL_FROM, to: row.email, subject: title, html, text, replyTo: process.env.SCANNER_REPLY_TO || process.env.ADMIN_NOTIFY_EMAIL || undefined });
}
