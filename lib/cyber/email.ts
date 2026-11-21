import prisma from "@/lib/prisma";
import { mailTransport, MAIL_FROM } from "@/lib/resend";
import { isSuppressed, unsubscribeUrl } from "@/lib/growth/outreach/suppression";
import { normEmail } from "@/lib/growth/outreach/normalize";
import { button, esc, frame, p } from "@/lib/scanner/email";
import { cyberPdf } from "./pdf";
import type { CyberResult, Severity } from "./types";
import type { ScanRow } from "./db";

// Sending a security report to the site's owner: a one-to-one email from a
// named person on the team (Reply-To them), with the grade, the most serious
// issues and their quick tips, the PDF, and the private report link if it is
// shared. Never to an unsubscribed address; recorded on the scan.

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
const SEV_COLOR: Record<Severity, string> = { critical: "#B42318", high: "#DC6803", medium: "#B54708", low: "#475467", info: "#7A8FA6" };

export type SendResult = { ok: true } | { ok: false; error: string; status: number };

export function shareUrl(token: string): string {
  return `${SITE}/security-report/${token}`;
}

export async function sendCyberReport(scan: ScanRow, o: { to: string; name?: string | null; note: string; sender: { name: string; email: string } }): Promise<SendResult> {
  const to = normEmail(o.to);
  if (!to) return { ok: false, error: "That email address is not valid.", status: 400 };
  if (await isSuppressed(to)) return { ok: false, error: "This address has unsubscribed from TIBLOGICS emails. It was not sent.", status: 400 };
  const r = scan.result as CyberResult | null;
  if (scan.status !== "done" || !r) return { ok: false, error: "The scan has not finished.", status: 409 };

  const serious = r.findings.filter((f) => f.severity === "critical" || f.severity === "high");
  const chip = (s: Severity) => `<span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;color:#fff;background:${SEV_COLOR[s]};border-radius:6px;padding:2px 7px;margin-right:6px;">${s}</span>`;
  const list = (serious.length ? serious : r.findings.filter((f) => f.severity === "medium")).slice(0, 6);
  const gradeColor = r.grade <= "B" ? "#16a34a" : r.grade === "C" ? "#F47C20" : "#dc2626";
  const html = frame(
    esc(`Security report for ${r.domain}`),
    p(esc(o.name?.trim() ? `Hello ${o.name.trim()},` : "Hello,")) +
      o.note.trim().split(/\n{2,}/).map((x) => p(esc(x).replace(/\n/g, "<br>"))).join("") +
      `<p style="font-size:15px;color:#0D1B2A;margin:16px 0 4px;">Security grade: <strong style="font-size:22px;color:${gradeColor};">${esc(r.grade)}</strong> (${r.score}/100)</p>` +
      p(esc(`${r.counts.critical} critical · ${r.counts.high} high · ${r.counts.medium} medium · ${r.counts.low} low`)) +
      (list.length
        ? `<h2 style="font-size:17px;color:#0D1B2A;margin:20px 0 6px;">${serious.length ? "Fix these first" : "Worth fixing"}</h2><table role="presentation" style="width:100%;border-collapse:collapse;">${list
            .map((f) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;color:#3A4A5C;line-height:1.5;">${chip(f.severity)}<strong>${esc(f.title)}</strong><br>${esc(f.impact)}${f.tip ? `<br><span style="color:#9A4A00;">Quick tip: ${esc(f.tip)}</span>` : ""}</td></tr>`)
            .join("")}</table>`
        : p("No serious issues were found.")) +
      p(esc(`The attached PDF has every finding with step-by-step fixes${scan.sharedAt ? ", and the private link below opens the full report" : ""}.`)) +
      (scan.sharedAt ? button(shareUrl(scan.token), "Open the full report") : "") +
      button(`${SITE}/book?from=security-report`, "Book a call to get it fixed", !!scan.sharedAt) +
      p(`Best regards,<br><strong>${esc(o.sender.name)}</strong><br>TIBLOGICS · <a href="${SITE}" style="color:#1B3A6B;">tiblogics.com</a>`),
    `${esc(`TIBLOGICS reviewed the security of ${r.domain}${r.deep ? " with your organisation's authorisation" : " from the public internet"}, and a member of our team sent you the results. This email is confidential.`)}<br><a href="${esc(unsubscribeUrl(to))}" style="color:#7A8FA6;">Unsubscribe</a>`,
  );
  const pdf = await cyberPdf(r, { company: scan.company });
  try {
    await mailTransport().sendMail({
      from: MAIL_FROM,
      to,
      replyTo: o.sender.email,
      subject: serious.length ? `${r.domain}: ${serious.length} security issue${serious.length === 1 ? "" : "s"} to fix (grade ${r.grade})` : `Security report for ${r.domain}: grade ${r.grade}`,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl(to)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      attachments: [{ filename: `TIBLOGICS-security-report-${r.domain.replace(/[^a-z0-9.-]/gi, "-")}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
  } catch (err) {
    console.error("[cyber/email]", err instanceof Error ? err.message : err);
    return { ok: false, error: "The email could not be sent. Try again.", status: 502 };
  }
  await prisma.$executeRawUnsafe(
    `UPDATE "CyberScan" SET "sent" = COALESCE("sent", '[]'::jsonb) || $2::jsonb WHERE "id" = $1`,
    scan.id,
    JSON.stringify([{ to, at: new Date().toISOString(), by: o.sender.email }]),
  );
  return { ok: true };
}
