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
const esc = (s: string) => escapeHtml(s);

const reportUrl = (l: ScannerLead) => `${SITE}/tools/scanner/report/${l.token}`;
const bookUrl = (l: ScannerLead) => `${SITE}/book?scan=${l.token}`;
const isHeld = (l: ScannerLead) => !!readExtra(l.extra)?.held && !l.unlockedAt;
const localeOf = (l: ScannerLead): Locale => (isLocale(l.locale) ? l.locale : "en");

function frame(title: string, body: string, footer: string): string {
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
const p = (html: string) => `<p style="font-size:14px;color:#3A4A5C;line-height:1.7;margin:0 0 12px;">${html}</p>`;
const button = (href: string, label: string, secondary = false) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:6px 8px 6px 0;background:${secondary ? "#fff" : "#F47C20"};color:${secondary ? "#1B3A6B" : "#fff"};border:2px solid ${secondary ? "#1B3A6B" : "#F47C20"};font-weight:700;font-size:14px;text-decoration:none;padding:11px 22px;border-radius:10px;">${esc(label)}</a>`;
const color = (n: number) => (n >= 70 ? "#16a34a" : n >= 50 ? "#F47C20" : "#dc2626");

function scoreTable(l: ScannerLead, t: ReturnType<typeof translatorFor>): string {
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

async function send(to: string, subject: string, html: string, attachments?: Array<{ filename: string; content: Buffer; contentType: string }>) {
  await mailTransport().sendMail({ from: MAIL_FROM, to, subject, html, ...(attachments ? { attachments } : {}) });
}

function priceText(locale: Locale): string {
  const c = reportPrice();
  return c ? formatMoney(c, locale) : "";
}

/**
 * The results email, sent when the visitor leaves their email. This is where
 * the details live (the page only says they were emailed): the scores, the
 * security grade, every problem with a signed "Fix this for me" link back to
 * the service request form (lib/scanner/fix-link.ts), and the critical and
 * high security issues counted but kept for the full report.
 *
 * HTML, not a PDF: it reads on a phone, every problem is one tap from a
 * prefilled request, and the paid report already comes as a PDF. A plain-text
 * part goes with it for clients that block HTML.
 */
export async function sendScanReportEmail(id: string): Promise<void> {
  const l = await prisma.scannerLead.findUnique({ where: { id } });
  if (!l?.email || !l.token || l.emailedAt) return;
  // A held scan (bought over the free limit, not paid yet) shows nothing until
  // paid; emailing its scores and problems would hand out the scan for free.
  if (isHeld(l)) return;
  const locale = localeOf(l);
  const t = translatorFor(locale);
  const token = l.token;
  const problems = allFindings(l).filter((f) => f.type !== "good");
  const security = problems.filter((f) => f.area === "security");
  const site = problems.filter((f) => f.area !== "security");
  const extra = readExtra(l.extra, l.url);
  const domain = l.domain ?? l.url;
  const price = priceText(locale);

  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const f of security) counts[severityOf(f) ?? "low"]++;
  const grade = extra ? securityGrade(extra.securityScore, counts) : null;
  const bySev = (f: (typeof security)[number]) => SEVERITIES.indexOf(severityOf(f) ?? "low");
  const secSorted = [...security].sort((a, b) => bySev(a) - bySev(b));
  const locked = secSorted.filter((f) => isLockedSeverity(severityOf(f)));
  const open = secSorted.filter((f) => !isLockedSeverity(severityOf(f)));

  const SEV_COLOR: Record<Severity, string> = { critical: "#B42318", high: "#DC6803", medium: "#B54708", low: "#475467" };
  const chip = (s: Severity) =>
    `<span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#fff;background:${SEV_COLOR[s]};border-radius:6px;padding:2px 7px;margin-right:6px;">${esc(t(`tools.sr.sev.${s}`))}</span>`;
  const fixLink = (check: string) => `<a href="${esc(fixUrl(token, check))}" style="color:#E06D12;font-weight:700;text-decoration:none;white-space:nowrap;">${esc(t("tools.sr.mail.r.fixThis"))}</a>`;
  const item = (inner: string) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;color:#3A4A5C;line-height:1.5;">${inner}</td></tr>`;
  const heading = (txt: string) => `<h2 style="font-size:17px;color:#0D1B2A;margin:22px 0 6px;">${txt}</h2>`;
  const gradeColor = grade === "A" || grade === "B" ? "#16a34a" : grade === "C" ? "#F47C20" : "#dc2626";

  const securityBlock = extra
    ? heading(esc(t("tools.sr.mail.r.sec", { grade: "\u0000" })).replace("\u0000", `<span style="color:${gradeColor};">${esc(grade ?? "")}</span>`)) +
      p(esc(t("tools.sr.mail.r.secCounts", { critical: counts.critical, high: counts.high, medium: counts.medium, low: counts.low }))) +
      (security.length === 0
        ? p(esc(t("tools.sr.sec.none")))
        : `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 10px;">${[
            ...locked.map((f) => item(`${chip(severityOf(f)!)}🔒 ${esc(t(`tools.sr.sec.lockedItem.${severityOf(f)}`))}`)),
            ...open.map((f) => item(`${chip(severityOf(f)!)}${esc(findingText(t, locale, f))}<br>${fixLink(f.check)}`)),
          ].join("")}</table>`) +
      (locked.length ? p(esc(t("tools.sr.mail.r.secLocked", { price }))) + button(reportUrl(l), t("tools.sr.mail.r.unlockBtn", { price })) : "") +
      (security.length ? button(fixUrl(token, "security"), t("tools.sr.mail.r.fixSecurity"), !!locked.length) : "")
    : "";

  const siteBlock = site.length
    ? heading(esc(t("tools.sr.mail.r.site"))) +
      `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 10px;">${site
        .slice(0, 15)
        .map((f) => item(`${esc(findingText(t, locale, f))}<br>${fixLink(f.check)}`))
        .join("")}</table>`
    : "";

  const html = frame(
    esc(t("tools.sr.mail.r.title", { domain })),
    p(esc(t("tools.sr.mail.r.intro", { domain, score: l.overallScore, n: problems.length }))) +
      scoreTable(l, t) +
      securityBlock +
      siteBlock +
      heading(esc(t("tools.sr.mail.r.fixAll"))) +
      p(esc(t("tools.sr.mail.r.next"))) +
      button(fixUrl(token, "all"), t("tools.sr.mail.r.fixAll")) +
      button(bookUrl(l), t("tools.sr.mail.book"), true) +
      p(esc(t("tools.sr.mail.r.unlock", { n: extra?.opportunities.length ?? 0, price }))) +
      button(reportUrl(l), t("tools.sr.mail.open"), true),
    footerFor(l, t),
  );

  const text = [
    t("tools.sr.mail.r.title", { domain }),
    "",
    t("tools.sr.mail.r.intro", { domain, score: l.overallScore, n: problems.length }),
    ...(extra ? ["", t("tools.sr.mail.r.sec", { grade: grade ?? "" }), t("tools.sr.mail.r.secCounts", { critical: counts.critical, high: counts.high, medium: counts.medium, low: counts.low })] : []),
    ...locked.map((f) => `- [${t(`tools.sr.sev.${severityOf(f)}`)}] ${t(`tools.sr.sec.lockedItem.${severityOf(f)}`)}`),
    ...open.map((f) => `- [${t(`tools.sr.sev.${severityOf(f)}`)}] ${findingText(t, locale, f)}\n  ${t("tools.sr.mail.r.fixThis")} ${fixUrl(token, f.check)}`),
    ...(site.length ? ["", t("tools.sr.mail.r.site")] : []),
    ...site.slice(0, 15).map((f) => `- ${findingText(t, locale, f)}\n  ${t("tools.sr.mail.r.fixThis")} ${fixUrl(token, f.check)}`),
    "",
    `${t("tools.sr.mail.r.fixAll")}: ${fixUrl(token, "all")}`,
    `${t("tools.sr.mail.book")}: ${bookUrl(l)}`,
    `${t("tools.sr.mail.open")}: ${reportUrl(l)}`,
  ].join("\n");

  const subject = counts.critical + counts.high > 0
    ? t("tools.sr.mail.r.subjectSec", { domain, score: l.overallScore, n: counts.critical + counts.high })
    : t("tools.sr.mail.r.subject", { domain, score: l.overallScore });
  await mailTransport().sendMail({ from: MAIL_FROM, to: l.email, subject, html, text });
  await prisma.scannerLead.update({ where: { id }, data: { emailedAt: new Date() } });
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
    await send(l.email, t("tools.sr.mail.f1.subject", { domain }), html);
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
  await send(l.email, t("tools.sr.mail.f2.subject", { n: ideas.length, domain }), html);
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
