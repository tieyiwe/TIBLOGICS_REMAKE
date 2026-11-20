import type { ScannerLead } from "@prisma/client";
import prisma from "@/lib/prisma";
import { mailTransport, MAIL_FROM } from "@/lib/resend";
import type { Locale } from "@/lib/i18n/config";
import { translatorFor } from "@/lib/i18n/server";
import { isSuppressed, unsubscribeUrl } from "@/lib/growth/outreach/suppression";
import { normEmail } from "@/lib/growth/outreach/normalize";
import { findingText } from "./i18n";
import { allFindings, readExtra } from "./view";
import { fixUrl } from "./fix-link";
import { SEVERITIES, securityGrade, severityOf, type Severity } from "./severity";
import { button, esc, frame, p, scoreTable } from "./email";

// The admin scanner: a report the team sends to a site's owner or a company
// (from /admin_pro/scanner-leads), as an offer to fix what it found.
//
// The scan is unlocked by staff, so the link opens the full report, and the
// email carries every problem (critical and high security issues included)
// with signed "Fix this for me" links, a free call and, optionally, the PDF.
// It is a one-to-one message from a named person on the team, with their
// address as Reply-To, and it says why the recipient got it. Never sent to a
// suppressed (unsubscribed) address, and it carries an unsubscribe link.
// Each send is recorded on the scan (extra.sent).

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export interface SentRecord {
  to: string;
  name: string | null;
  company: string | null;
  locale: Locale;
  by: string;
  at: string;
  pdf: boolean;
}

export function sentRecords(extra: unknown): SentRecord[] {
  const list = (extra as { sent?: unknown } | null)?.sent;
  return Array.isArray(list) ? (list.filter((r) => r && typeof r === "object" && typeof (r as SentRecord).to === "string") as SentRecord[]) : [];
}

/** The note the form starts with, in the recipient's language. */
export function defaultNote(lead: Pick<ScannerLead, "domain" | "url">, locale: Locale, sender: string): string {
  const t = translatorFor(locale);
  return t("tools.sr.out.defaultNote", { domain: lead.domain ?? lead.url, sender });
}

export type SendResult = { ok: true } | { ok: false; error: "suppressed" | "invalid" | "notFound" | "failed" };

export async function sendOwnerReport(opts: {
  id: string;
  to: string;
  name?: string | null;
  company?: string | null;
  note: string;
  locale: Locale;
  attachPdf: boolean;
  sender: { name: string; email: string };
}): Promise<SendResult> {
  const to = normEmail(opts.to);
  if (!to) return { ok: false, error: "invalid" };
  if (await isSuppressed(to)) return { ok: false, error: "suppressed" };
  const l = await prisma.scannerLead.findUnique({ where: { id: opts.id } });
  if (!l?.token) return { ok: false, error: "notFound" };

  const t = translatorFor(opts.locale);
  const locale = opts.locale;
  const token = l.token;
  const domain = l.domain ?? l.url;
  const extra = readExtra(l.extra, l.url);
  const problems = allFindings(l).filter((f) => f.type !== "good");
  const bySev = (f: (typeof problems)[number]) => SEVERITIES.indexOf(severityOf(f) ?? "low");
  const security = problems.filter((f) => f.area === "security").sort((a, b) => bySev(a) - bySev(b));
  const site = problems.filter((f) => f.area !== "security" && f.type === "bad").concat(problems.filter((f) => f.area !== "security" && f.type !== "bad"));
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const f of security) counts[severityOf(f) ?? "low"]++;
  const grade = extra ? securityGrade(extra.securityScore, counts) : null;
  const SEV_COLOR: Record<Severity, string> = { critical: "#B42318", high: "#DC6803", medium: "#B54708", low: "#475467" };
  const chip = (s: Severity) =>
    `<span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#fff;background:${SEV_COLOR[s]};border-radius:6px;padding:2px 7px;margin-right:6px;">${esc(t(`tools.sr.sev.${s}`))}</span>`;
  const fixLink = (check: string) => `<a href="${esc(fixUrl(token, check))}" style="color:#E06D12;font-weight:700;text-decoration:none;white-space:nowrap;">${esc(t("tools.sr.mail.r.fixThis"))}</a>`;
  const item = (inner: string) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;color:#3A4A5C;line-height:1.5;">${inner}</td></tr>`;
  const heading = (txt: string) => `<h2 style="font-size:17px;color:#0D1B2A;margin:22px 0 6px;">${esc(txt)}</h2>`;
  const table = (rows: string[]) => `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 10px;">${rows.join("")}</table>`;
  const reportUrl = `${SITE}/tools/scanner/report/${token}`;
  const bookUrl = `${SITE}/book?scan=${token}`;
  const hello = opts.name?.trim() ? t("tools.sr.out.hello", { name: opts.name.trim() }) : t("tools.sr.out.helloNoName");
  const noteHtml = opts.note
    .trim()
    .split(/\n{2,}/)
    .map((para) => p(esc(para).replace(/\n/g, "<br>")))
    .join("");

  const html = frame(
    esc(t("tools.sr.out.title", { domain })),
    p(esc(hello)) +
      noteHtml +
      scoreTable(l, t) +
      (extra
        ? heading(t("tools.sr.out.security", { grade: grade ?? "" })) +
          p(esc(t("tools.sr.mail.r.secCounts", { critical: counts.critical, high: counts.high, medium: counts.medium, low: counts.low }))) +
          (security.length
            ? table(security.map((f) => item(`${chip(severityOf(f) ?? "low")}${esc(findingText(t, locale, f))}<br>${fixLink(f.check)}`)))
            : p(esc(t("tools.sr.sec.none"))))
        : "") +
      (site.length ? heading(t("tools.sr.out.site", { n: site.length })) + table(site.slice(0, 12).map((f) => item(`${esc(findingText(t, locale, f))}<br>${fixLink(f.check)}`))) : "") +
      heading(t("tools.sr.out.nextTitle")) +
      p(esc(t("tools.sr.out.next"))) +
      button(fixUrl(token, "all"), t("tools.sr.mail.r.fixAll")) +
      button(bookUrl, t("tools.sr.mail.book"), true) +
      button(reportUrl, t("tools.sr.out.open"), true) +
      p(`${esc(t("tools.sr.out.signoff"))}<br><strong>${esc(opts.sender.name)}</strong><br>TIBLOGICS · <a href="${esc(SITE)}" style="color:#1B3A6B;">tiblogics.com</a>`),
    `${esc(t("tools.sr.out.why", { domain }))}<br><a href="${esc(unsubscribeUrl(to))}" style="color:#7A8FA6;">${esc(t("tools.sr.mail.unsubscribe"))}</a>`,
  );

  const text = [
    hello,
    "",
    opts.note.trim(),
    "",
    t("tools.sr.out.title", { domain }),
    `${l.overallScore}/100`,
    ...(extra ? ["", t("tools.sr.out.security", { grade: grade ?? "" }), t("tools.sr.mail.r.secCounts", { critical: counts.critical, high: counts.high, medium: counts.medium, low: counts.low })] : []),
    ...security.map((f) => `- [${t(`tools.sr.sev.${severityOf(f) ?? "low"}`)}] ${findingText(t, locale, f)}\n  ${t("tools.sr.mail.r.fixThis")} ${fixUrl(token, f.check)}`),
    ...(site.length ? ["", t("tools.sr.out.site", { n: site.length })] : []),
    ...site.slice(0, 12).map((f) => `- ${findingText(t, locale, f)}\n  ${t("tools.sr.mail.r.fixThis")} ${fixUrl(token, f.check)}`),
    "",
    `${t("tools.sr.mail.r.fixAll")}: ${fixUrl(token, "all")}`,
    `${t("tools.sr.mail.book")}: ${bookUrl}`,
    `${t("tools.sr.out.open")}: ${reportUrl}`,
    "",
    t("tools.sr.out.signoff"),
    opts.sender.name,
    "",
    t("tools.sr.out.why", { domain }),
    `${t("tools.sr.mail.unsubscribe")}: ${unsubscribeUrl(to)}`,
  ].join("\n");

  let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined;
  if (opts.attachPdf) {
    const { reportPdf, reportFileName } = await import("./pdf");
    const pdf = await reportPdf(l, locale).catch(() => null);
    if (pdf) attachments = [{ filename: reportFileName(l), content: pdf, contentType: "application/pdf" }];
  }

  const serious = counts.critical + counts.high;
  const subject = serious
    ? t("tools.sr.out.subjectSec", { domain, n: serious })
    : t("tools.sr.out.subject", { domain, score: l.overallScore });
  try {
    await mailTransport().sendMail({
      from: MAIL_FROM,
      to,
      replyTo: opts.sender.email,
      subject,
      html,
      text,
      ...(attachments ? { attachments } : {}),
    });
  } catch (err) {
    console.error("[scanner/outreach]", err instanceof Error ? err.message : err);
    return { ok: false, error: "failed" };
  }

  // Record the send on the scan, appended in one statement.
  const record: SentRecord = {
    to,
    name: opts.name?.trim() || null,
    company: opts.company?.trim() || null,
    locale,
    by: opts.sender.email,
    at: new Date().toISOString(),
    pdf: !!attachments,
  };
  await prisma.$executeRawUnsafe(
    `UPDATE "ScannerLead" SET "extra" = jsonb_set(COALESCE("extra", '{}'::jsonb), '{sent}', COALESCE("extra"->'sent', '[]'::jsonb) || $2::jsonb)${opts.name?.trim() ? `, "name" = COALESCE("name", $3)` : ""} WHERE "id" = $1`,
    l.id,
    JSON.stringify([record]),
    ...(opts.name?.trim() ? [opts.name.trim().slice(0, 120)] : []),
  );
  return { ok: true };
}

/** Marks an admin scan on the lead (who ran it, and for whom). */
export async function markAdminScan(id: string, by: string, forWho: { name?: string | null; company?: string | null }): Promise<void> {
  const tag = { by, at: new Date().toISOString(), name: forWho.name?.trim() || null, company: forWho.company?.trim() || null };
  await prisma.$executeRawUnsafe(
    `UPDATE "ScannerLead" SET "extra" = jsonb_set(COALESCE("extra", '{}'::jsonb), '{adminScan}', $2::jsonb) WHERE "id" = $1`,
    id,
    JSON.stringify(tag),
  );
}
