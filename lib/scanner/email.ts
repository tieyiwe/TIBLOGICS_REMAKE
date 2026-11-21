import type { ScannerLead } from "@prisma/client";
import prisma from "@/lib/prisma";
import { mailTransport, MAIL_FROM } from "@/lib/resend";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { translatorFor } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/blueprint/config";
import { escapeHtml } from "@/lib/require-admin";
import { adminNotifyEmail } from "@/lib/learn/admin/signup-notify";
import { isSuppressed, unsubscribeUrl } from "@/lib/growth/outreach/suppression";
import { findingText } from "./i18n";
import { reportPrice } from "./config";
import { allFindings, readExtra, type Area } from "./view";
import { servicesNeeded } from "./growth";
import { fixUrl } from "./fix-link";
import { SEVERITIES, isLockedSeverity, securityGrade, severityOf, type Severity } from "./severity";

// Scanner emails, in the visitor's language:
//   results     right after they leave their email (scores and every problem)
//   follow-up 1 day 3: the biggest problem and why it matters
//   follow-up 2 day 7: the build ideas, a free call or the full report
//   ready       the full report is written (PDF attached)
// plus the owner's alert (English) for a new email, a purchase or a booked call.
// The visitor emails carry an unsubscribe link and are never sent to a
// suppressed address. Every value from the scanned site is escaped.

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
export const esc = (s: string) => escapeHtml(s);

const reportUrl = (l: ScannerLead) => `${SITE}/tools/scanner/report/${l.token}`;
const bookUrl = (l: ScannerLead) => `${SITE}/book?scan=${l.token}`;
const isHeld = (l: ScannerLead) => !!readExtra(l.extra)?.held && !l.unlockedAt;
const localeOf = (l: ScannerLead): Locale => (isLocale(l.locale) ? l.locale : "en");

export function frame(title: string, body: string, footer: string): string {
  return `
  <div style="background:#F4F7FB;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;">
      <div style="background:linear-gradient(135deg,#0D1B2A,#1B3A6B);padding:24px 32px;">
        <div style="font-size:19px;font-weight:800;color:#fff;letter-spacing:.04em;">TIB<span style="color:#F47C20;">LOGICS</span> · Website Scanner</div>
      </div>
      <div style="padding:30px 32px;">
        <h1 style="font-size:21px;color:#0D1B2A;margin:0 0 14px;line-height:1.3;">${title}</h1>
        ${body}
      </div>
      <div style="background:#F4F7FB;padding:18px 32px;text-align:center;color:#7A8FA6;font-size:12px;line-height:1.6;">${footer}</div>
    </div>
  </div>`;
}
export const p = (html: string) => `<p style="font-size:14px;color:#3A4A5C;line-height:1.7;margin:0 0 12px;">${html}</p>`;
export const button = (href: string, label: string, secondary = false) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:6px 8px 6px 0;background:${secondary ? "#fff" : "#F47C20"};color:${secondary ? "#1B3A6B" : "#fff"};border:2px solid ${secondary ? "#1B3A6B" : "#F47C20"};font-weight:700;font-size:14px;text-decoration:none;padding:11px 22px;border-radius:10px;">${esc(label)}</a>`;
const color = (n: number) => (n >= 70 ? "#16a34a" : n >= 50 ? "#F47C20" : "#dc2626");

export function scoreTable(l: ScannerLead, t: ReturnType<typeof translatorFor>): string {
  const extra = readExtra(l.extra, l.url);
  const rows: Array<[string, number | null]> = [
    [t("tools.sr.area.growth"), extra?.growthScore ?? null],
    [t("tools.sr.area.ai"), l.aiScore],
    [t("tools.sr.area.seo"), l.seoScore],
    [t("tools.sr.area.perf"), l.perfScore],
    [t("tools.sr.area.ux"), l.uxScore],
    [t("tools.sr.area.security"), extra?.securityScore ?? null],
  ];
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:6px 0 18px;">${rows
    .filter(([, v]) => v !== null)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 0;border-bottom:1px solid #eef2f7;font-size:14px;color:#3A4A5C;">${esc(k)}</td><td style="padding:7px 0;border-bottom:1px solid #eef2f7;text-align:right;font-size:15px;font-weight:700;color:${color(v as number)};">${v}/100</td></tr>`,
    )
    .join("")}</table>`;
}

function footerFor(l: ScannerLead, t: ReturnType<typeof translatorFor>): string {
  return `${esc(t("tools.sr.mail.why", { domain: l.domain ?? "" }))}<br><a href="${esc(unsubscribeUrl(l.email!))}" style="color:#7A8FA6;">${esc(t("tools.sr.mail.unsubscribe"))}</a>`;
}

type Attachment = { filename: string; content: Buffer; contentType: string };

/** Plain text from the HTML, for the text/plain part (clients that block HTML, and spam filters). */
function htmlToText(html: string): string {
  return html
    .replace(/<(br|\/p|\/h[1-6]|\/tr|\/li|\/div)[^>]*>/gi, "\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, label: string) => `${label.replace(/<[^>]+>/g, "").trim()}: ${href.replace(/&amp;/g, "&")}`)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Where visitors' replies go: a person reads it. */
const REPLY_TO = process.env.SCANNER_REPLY_TO || process.env.ADMIN_NOTIFY_EMAIL || undefined;

/**
 * Every scanner email goes through here. Visitor emails (`visitor` given)
 * carry what the big mailbox providers check before they deliver a message
 * to the inbox: a plain-text part, Reply-To a monitored address, and
 * List-Unsubscribe with one-click unsubscribe (RFC 8058; the endpoint takes
 * the POST, app/api/outreach/unsubscribe).
 */
async function send(to: string, subject: string, html: string, attachments?: Attachment[], opts: { visitor?: boolean; text?: string } = {}) {
  const unsub = opts.visitor ? unsubscribeUrl(to) : null;
  await mailTransport().sendMail({
    from: MAIL_FROM,
    to,
    subject,
    html,
    text: opts.text ?? htmlToText(html),
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    ...(unsub ? { headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
    ...(attachments ? { attachments } : {}),
  });
}

function priceText(locale: Locale): string {
  const c = reportPrice();
  return c ? formatMoney(c, locale) : "";
}

/**
 * The report email, sent when the visitor leaves their email: the same report
 * they saw on the page, built from the same view (lib/scanner/view.ts
 * buildView at the "email" level), so the two never disagree. Scores by area,
 * the security grade with the critical and high issues counted but kept for
 * the full report, the biggest problems with a "Fix this for me" link each,
 * and how many more there are. Then the ways to get help: have it fixed, a
 * free consultation, a question by reply, or the full report.
 *
 * Sent while the visitor waits (the email route awaits it), so the page only
 * says "emailed" once it has gone. A failure is recorded on the scan
 * (extra.mail) and the scanner cron job tries again (resendPendingReports).
 */
export async function sendScanReportEmail(id: string): Promise<"sent" | "skipped" | "failed"> {
  const l = await prisma.scannerLead.findUnique({ where: { id } });
  if (!l?.email || !l.token || l.emailedAt) return "skipped";
  // A held scan (bought over the free limit, not paid yet) shows nothing until
  // paid; emailing its scores and problems would hand out the scan for free.
  if (isHeld(l)) return "skipped";
  if (await isSuppressed(l.email)) {
    // The address unsubscribed from TIBLOGICS emails: never sent, and the
    // page says so (view.ts emailBlocked) rather than "on its way".
    await prisma.$executeRawUnsafe(
      `UPDATE "ScannerLead" SET "extra" = jsonb_set(COALESCE("extra", '{}'::jsonb), '{mail}', '{"suppressed":true}'::jsonb) WHERE "id" = $1`,
      id,
    ).catch(() => {});
    return "skipped";
  }
  const { subject, html } = await reportEmail(l);
  try {
    await send(l.email, subject, html, undefined, { visitor: true });
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 300);
    console.error("[scanner] report email", id, msg);
    await prisma.$executeRawUnsafe(
      `UPDATE "ScannerLead" SET "extra" = jsonb_set(COALESCE("extra", '{}'::jsonb), '{mail}',
         jsonb_build_object('attempts', COALESCE(("extra"->'mail'->>'attempts')::int, 0) + 1, 'error', $2::text, 'at', to_jsonb(NOW())))
       WHERE "id" = $1`,
      id,
      msg,
    ).catch(() => {});
    return "failed";
  }
  await prisma.$executeRawUnsafe(
    `UPDATE "ScannerLead" SET "emailedAt" = NOW(), "extra" = COALESCE("extra", '{}'::jsonb) - 'mail' WHERE "id" = $1`,
    id,
  );
  return "sent";
}

/**
 * Staff: what a visitor gets, sent to the staff member (the email delivery
 * check). Uses a real scan; marked as a sample in the subject.
 */
export async function sendSampleReport(id: string, to: string): Promise<void> {
  const l = await prisma.scannerLead.findUnique({ where: { id } });
  if (!l?.token) throw new Error("No scan to use as a sample");
  const { subject, html } = await reportEmail({ ...l, email: to, unlockedAt: null });
  await send(to, `[Sample] ${subject}`, html, undefined, { visitor: true });
}

/** The visitor's report email for a scan, as the page shows it at the email level. */
async function reportEmail(l: ScannerLead): Promise<{ subject: string; html: string }> {
  const locale = localeOf(l);
  const t = translatorFor(locale);
  const token = l.token!;
  const domain = l.domain ?? l.url;
  const price = priceText(locale);
  const { buildView } = await import("./view");
  const v = await buildView(l, t, locale);
  const nf = new Intl.NumberFormat(locale);

  const SEV_COLOR: Record<Severity, string> = { critical: "#B42318", high: "#DC6803", medium: "#B54708", low: "#475467" };
  const chip = (s: Severity) =>
    `<span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#fff;background:${SEV_COLOR[s]};border-radius:6px;padding:2px 7px;margin-right:6px;">${esc(t(`tools.sr.sev.${s}`))}</span>`;
  const fixLink = (check: string) => `<a href="${esc(fixUrl(token, check))}" style="color:#E06D12;font-weight:700;text-decoration:none;white-space:nowrap;">${esc(t("tools.sr.mail.r.fixThis"))}</a>`;
  const item = (inner: string) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;color:#3A4A5C;line-height:1.5;">${inner}</td></tr>`;
  const table = (rows: string[]) => `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 10px;">${rows.join("")}</table>`;
  const heading = (txt: string) => `<h2 style="font-size:17px;color:#0D1B2A;margin:22px 0 6px;">${esc(txt)}</h2>`;
  const sec = v.security;
  const gradeColor = sec ? (sec.grade === "A" || sec.grade === "B" ? "#16a34a" : sec.grade === "C" ? "#F47C20" : "#dc2626") : "#0D1B2A";
  const hidden = Math.max(0, v.problemsTotal - v.top.length);

  const securityBlock = sec
    ? heading(t("tools.sr.mail.r.sec", { grade: "\u0000" })).replace("\u0000", `<span style="color:${gradeColor};">${esc(sec.grade)}</span>`) +
      p(esc(t("tools.sr.mail.r.secCounts", { critical: sec.counts.critical, high: sec.counts.high, medium: sec.counts.medium, low: sec.counts.low }))) +
      (sec.locked.length + sec.shown.length === 0
        ? p(esc(t("tools.sr.sec.none")))
        : table([
            ...sec.locked.map((s) => item(`${chip(s)}🔒 ${esc(t(`tools.sr.sec.lockedItem.${s}`))}`)),
            ...sec.shown.map((f) => item(`${f.severity ? chip(f.severity) : ""}${esc(f.text)}<br>${fixLink(f.check)}`)),
          ]))
    : "";

  const topBlock =
    heading(t("tools.sr.top")) +
    (v.top.length === 0
      ? p(esc(t("tools.sr.noProblems")))
      : table(v.top.map((f) => item(`<span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#7A8FA6;">${esc(t(`tools.sr.area.${f.area}`))}</span><br>${esc(f.text)}<br>${fixLink(f.check)}`))) +
        (hidden > 0 ? p(`<em>${esc(t("tools.sr.mail.s.more", { n: nf.format(hidden) }))}</em>`) : ""));

  const option = (title: string, body: string, href: string | null, label: string | null, primary = false) =>
    `<tr><td style="padding:14px 16px;border:1px solid ${primary ? "#F47C20" : "#E4EAF2"};border-radius:12px;background:${primary ? "#FFF6EE" : "#fff"};">
      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0D1B2A;">${esc(title)}</p>
      <p style="margin:0 0 ${href ? "10px" : "0"};font-size:13px;color:#3A4A5C;line-height:1.55;">${esc(body)}</p>
      ${href && label ? `<a href="${esc(href)}" style="display:inline-block;background:${primary ? "#F47C20" : "#1B3A6B"};color:#fff;font-weight:700;font-size:13px;text-decoration:none;padding:9px 16px;border-radius:8px;">${esc(label)}</a>` : ""}
    </td></tr><tr><td style="height:10px;"></td></tr>`;
  const helpBlock =
    heading(t("tools.sr.mail.s.helpTitle")) +
    p(esc(t("tools.sr.mail.s.helpBody"))) +
    `<table role="presentation" style="width:100%;border-collapse:separate;margin:4px 0 6px;">` +
    option(t("tools.sr.mail.s.fixTitle"), t("tools.sr.mail.s.fixBody"), fixUrl(token, "all"), t("tools.sr.mail.s.fixBtn"), true) +
    option(t("tools.sr.mail.s.callTitle"), t("tools.sr.mail.s.callBody"), bookUrl(l), t("tools.sr.mail.s.callBtn")) +
    option(t("tools.sr.mail.s.replyTitle"), t("tools.sr.mail.s.replyBody"), null, null) +
    (price ? option(t("tools.sr.mail.s.reportTitle"), t("tools.sr.mail.s.reportBody", { price, n: nf.format(v.problemsTotal) }), reportUrl(l), t("tools.sr.mail.r.unlockBtn", { price })) : "") +
    `</table>`;

  const html = frame(
    esc(t("tools.sr.mail.s.title", { domain })),
    p(esc(t("tools.sr.mail.s.intro", { domain, score: v.scores.overall ?? l.overallScore }))) +
      scoreTable(l, t) +
      securityBlock +
      topBlock +
      helpBlock +
      p(`<a href="${esc(reportUrl(l))}" style="color:#1B3A6B;font-weight:700;">${esc(t("tools.sr.mail.s.view"))}</a>`),
    footerFor(l, t),
  );

  const serious = sec ? sec.counts.critical + sec.counts.high : 0;
  const subject = serious > 0
    ? t("tools.sr.mail.r.subjectSec", { domain, score: l.overallScore, n: serious })
    : t("tools.sr.mail.r.subject", { domain, score: l.overallScore });
  return { subject, html };
}

/** Report emails that did not go out (Titan refused or timed out): try again, up to 4 times in 2 days. */
export async function resendPendingReports(limit = 20): Promise<{ sent: number; failed: number; gaveUp: number }> {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; attempts: number }>>(
    `SELECT "id", COALESCE(("extra"->'mail'->>'attempts')::int, 0) AS attempts FROM "ScannerLead"
     WHERE "email" IS NOT NULL AND "consentAt" IS NOT NULL AND "emailedAt" IS NULL
       AND "createdAt" > NOW() - INTERVAL '2 days'
       AND COALESCE(("extra"->'mail'->>'attempts')::int, 0) <= 3
       AND COALESCE(("extra"->'mail'->>'suppressed')::boolean, false) = false
       -- Not one the email route is still sending (it waits up to 20 seconds).
       AND "consentAt" < NOW() - INTERVAL '5 minutes'
     ORDER BY "createdAt" ASC LIMIT ${Math.max(1, Math.min(100, limit))}`,
  );
  let sent = 0;
  let failed = 0;
  let gaveUp = 0;
  for (const r of rows) {
    const o = await sendScanReportEmail(r.id).catch(() => "failed" as const);
    if (o === "sent") sent++;
    else if (o === "failed") {
      failed++;
      if (r.attempts + 1 >= 4) {
        gaveUp++;
        await alertUndelivered(r.id).catch(() => {});
      }
    }
  }
  return { sent, failed, gaveUp };
}

/** The owner hears about a visitor whose report could not be emailed after 4 tries. */
async function alertUndelivered(id: string): Promise<void> {
  const l = await prisma.scannerLead.findUnique({ where: { id } });
  if (!l) return;
  const err = (l.extra as { mail?: { error?: string } } | null)?.mail?.error ?? "unknown error";
  await send(
    adminNotifyEmail(),
    `Scanner report NOT delivered to ${l.email ?? "?"} (${l.domain ?? l.url})`,
    frame(
      "A scanner report email could not be sent",
      p(`The report for <strong>${esc(l.domain ?? l.url)}</strong> could not be emailed to <strong>${esc(l.email ?? "")}</strong> after 4 tries.`) +
        p(`Last error: <code>${esc(err)}</code>`) +
        p("Check the mail settings (Admin → Scanner Leads → Check email delivery), then contact the visitor yourself.") +
        button(`${SITE}/admin_pro/scanner-leads/${l.id}`, "Open the scan"),
      "Sent to ADMIN_NOTIFY_EMAIL by the website scanner.",
    ),
  );
}

const WHY_AREA: Record<Area, string> = {
  growth: "tools.sr.why.growth", ai: "tools.sr.why.ai", seo: "tools.sr.why.seo",
  perf: "tools.sr.why.perf", ux: "tools.sr.why.ux", security: "tools.sr.why.security",
};

/** Follow-up 1 (day 3) or 2 (day 7). Returns false when it was not sent. */
export async function sendFollowup(l: ScannerLead, stage: 1 | 2): Promise<boolean> {
  if (!l.email || !l.token || l.unlockedAt || l.bookedCallAt) return false;
  if (isHeld(l)) return false; // nothing of a held scan is shown until it is paid

  if (await isSuppressed(l.email)) return false;
  const locale = localeOf(l);
  const t = translatorFor(locale);
  const domain = l.domain ?? l.url;
  const problems = allFindings(l).filter((f) => f.type !== "good");
  const extra = readExtra(l.extra, l.url);
  if (stage === 1) {
    // A critical or high security issue stays for the full report: the
    // follow-up quotes the biggest problem that may be shown, and only counts
    // the locked ones.
    const top = problems.find((f) => !isLockedSeverity(severityOf(f)));
    const lockedN = problems.filter((f) => isLockedSeverity(severityOf(f))).length;
    if (!top) return false;
    const html = frame(
      esc(t("tools.sr.mail.f1.title", { domain })),
      p(esc(t("tools.sr.mail.f1.intro", { domain }))) +
        `<blockquote style="margin:0 0 14px;padding:12px 16px;border-left:4px solid #F47C20;background:#FEF6EE;font-size:15px;color:#0D1B2A;">${esc(findingText(t, locale, top))}</blockquote>` +
        p(esc(t(WHY_AREA[top.area]))) +
        p(esc(t("tools.sr.mail.f1.more", { n: Math.max(0, problems.length - 1) }))) +
        (lockedN > 0 ? p(esc(t("tools.sr.mail.r.secLocked", { price: priceText(locale) }))) : "") +
        button(reportUrl(l), t("tools.sr.mail.f1.cta")) +
        button(bookUrl(l), t("tools.sr.mail.book"), true),
      footerFor(l, t),
    );
    await send(l.email, t("tools.sr.mail.f1.subject", { domain }), html, undefined, { visitor: true });
    return true;
  }
  const ideas = extra?.opportunities ?? [];
  const html = frame(
    esc(t("tools.sr.mail.f2.title", { n: ideas.length, domain })),
    p(esc(t("tools.sr.mail.f2.intro", { domain, n: ideas.length }))) +
      `<ul style="font-size:14px;color:#3A4A5C;line-height:1.6;padding-left:20px;margin:0 0 14px;">${ideas
        .slice(0, 2)
        .map((k) => `<li><strong>${esc(t(`tools.opp.${k}.title`))}</strong>: ${esc(t(`tools.opp.${k}.body`))}</li>`)
        .join("")}</ul>` +
      p(esc(t("tools.sr.mail.f2.call", { price: priceText(locale) }))) +
      button(bookUrl(l), t("tools.sr.mail.book")) +
      button(reportUrl(l), t("tools.sr.mail.f2.unlock", { price: priceText(locale) }), true),
    footerFor(l, t),
  );
  await send(l.email, t("tools.sr.mail.f2.subject", { n: ideas.length, domain }), html, undefined, { visitor: true });
  return true;
}

/** "Your full report is ready", with the PDF. Once per scan (only when an email is known). */
export async function sendReportReadyEmail(id: string): Promise<void> {
  const l = await prisma.scannerLead.findUnique({ where: { id } });
  if (!l?.email || !l.token) return;
  const locale = localeOf(l);
  const t = translatorFor(locale);
  const domain = l.domain ?? l.url;
  const { reportPdf, reportFileName } = await import("./pdf");
  const pdf = await reportPdf(l, locale).catch(() => null);
  const until = l.rescanUntil && l.rescanCredits > 0 ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(l.rescanUntil) : null;
  const html = frame(
    esc(t("tools.sr.mail.ready.title")),
    p(esc(t("tools.sr.mail.ready.intro", { domain }))) +
      button(reportUrl(l), t("tools.sr.mail.ready.open")) +
      (until ? p(esc(t("tools.sr.mail.ready.rescan", { domain, date: until }))) : "") +
      p(esc(t("tools.sr.mail.ready.help"))) +
      button(bookUrl(l), t("tools.sr.mail.book"), true),
    esc(t("tools.sr.mail.ready.private")),
  );
  await send(
    l.email,
    t("tools.sr.mail.ready.subject", { domain }),
    html,
    pdf ? [{ filename: reportFileName(l), content: pdf, contentType: "application/pdf" }] : undefined,
  );
}

/** The owner's alert: a new email, a purchase or a booked call. English. */
export async function sendOwnerScanAlert(id: string, kind: "email" | "paid" | "call"): Promise<void> {
  const l = await prisma.scannerLead.findUnique({ where: { id } });
  if (!l) return;
  const extra = readExtra(l.extra, l.url);
  const t = translatorFor("en");
  const services = servicesNeeded(l).map((s) => t(`tools.service.${s}`));
  const problems = allFindings(l).filter((f) => f.type === "bad").slice(0, 8).map((f) => `${severityOf(f) ? `[${severityOf(f)}] ` : ""}${findingText(t, "en", f)}`);
  const what = kind === "paid" ? `bought the full report (${formatMoney(l.amountPaid ?? 0)})` : kind === "call" ? "booked a call from their report" : "left their email";
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#7A8FA6;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td><td style="padding:6px 0;color:#0D1B2A;font-size:14px;">${v}</td></tr>`;
  const tech = extra?.tech;
  const secCounts = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const f of allFindings(l)) {
    const sev = severityOf(f);
    if (sev) secCounts[sev]++;
  }
  const serious = secCounts.critical + secCounts.high;
  const html = frame(
    `Scanner lead: ${esc(l.domain ?? l.url)}`,
    p(`Someone ${esc(what)} after scanning <strong>${esc(l.url)}</strong>.`) +
      `<table role="presentation" style="border-collapse:collapse;margin:0 0 14px;">${[
        row("Email", esc(l.email ?? "not given")),
        l.name ? row("Name", esc(l.name)) : "",
        row("Overall", `${l.overallScore}/100`),
        row("Scores", `AI ${l.aiScore} · SEO ${l.seoScore} · Speed ${l.perfScore} · UX ${l.uxScore}${extra ? ` · Lead capture ${extra.growthScore} · Security ${extra.securityScore}` : ""}`),
        extra ? row("Security", `Grade ${securityGrade(extra.securityScore, secCounts)} · ${secCounts.critical} critical · ${secCounts.high} high · ${secCounts.medium} medium · ${secCounts.low} low`) : "",
        tech?.cms || tech?.shop ? row("Platform", esc([tech?.cms, tech?.cmsVersion, tech?.shop].filter(Boolean).join(" · "))) : "",
        services.length ? row("Needs", esc(services.join(", "))) : "",
        row("Language", esc(l.locale ?? "en")),
      ].join("")}</table>` +
      (problems.length ? `<ul style="font-size:13px;color:#3A4A5C;line-height:1.55;padding-left:18px;">${problems.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "") +
      button(`${SITE}/admin_pro/scanner-leads`, "Open scanner leads") +
      (l.growthLeadId ? button(`${SITE}/admin_pro/growth/leads?open=${encodeURIComponent(l.growthLeadId)}`, "Open in Growth", true) : ""),
    "Sent to ADMIN_NOTIFY_EMAIL by the website scanner.",
  );
  await send(adminNotifyEmail(), `Scanner lead: ${l.domain ?? l.url} (${l.overallScore}/100)${serious ? `, ${serious} serious security issue${serious === 1 ? "" : "s"}` : ""}: ${kind === "paid" ? "PAID" : kind === "call" ? "call booked" : "email"}`, html);
}
