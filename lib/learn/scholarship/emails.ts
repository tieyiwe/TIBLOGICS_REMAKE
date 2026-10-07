import { arfaMailer } from "@/lib/resend";
import { ARFA_EMAIL, LEARN_SITE, learnEmailEsc as esc, learnEmailP as p, learnEmailShell as shell } from "@/lib/learn/emails";
import { translator, type T } from "@/lib/learn/i18n";
import { isLocale } from "@/lib/i18n/config";

// Every Tilo Vision Scholarship email: the congratulations (with the award
// letter attached), the welcome when accepted, the reminders and monthly
// progress (lib/learn/scholarship/notices.ts), the application emails, and
// the sponsor's impact report. Learner emails go out in their language.

const strong = (s: string) => `<strong style="color:#131A1B;">${s}</strong>`;
const small = (s: string) => `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:0 0 6px;">${s}</p>`;
const box = (inner: string) => `<div style="margin:6px 0 18px;padding:12px 16px;border:1px solid #F4C9A0;border-radius:12px;background:#FFFBF6;">${inner}</div>`;
const fmtDate = (d: Date, locale: string) => new Intl.DateTimeFormat(isLocale(locale) ? locale : "en", { dateStyle: "long" }).format(d);
const coverageText = (t: T, pct: number) => (pct >= 100 ? t("learn.scholar.coverage.full") : t("learn.scholar.coverage.part", { pct: String(pct) }));
const tracksText = (t: T, n: number) => t(n === 1 ? "learn.scholar.tracks.one" : "learn.scholar.tracks.other", { n: String(n) });
/** Words on learning, knowledge and putting it into practice. */
const encouragement = (t: T, short = false) =>
  `<div style="margin:4px 0 18px;padding:18px 20px;border-radius:12px;background:#1B2A5E;color:#fff;">
    <p style="font-size:16px;line-height:1.6;font-style:italic;margin:0 0 ${short ? "8" : "12"}px;color:#fff;">“${esc(t("learn.scholar.encourage.quote"))}”</p>
    ${short ? "" : `<p style="font-size:14px;line-height:1.7;margin:0 0 12px;color:#E6ECF8;">${esc(t("learn.scholar.encourage.practice"))}</p>`}
    <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;margin:0;color:#F9A738;">${esc(t("learn.scholar.encourage.motto"))}</p>
  </div>`;
const scholarFooter = (t: T) => small(esc(t("learn.scholar.email.whyReceive")));

export const offerUrl = (token: string) => `${LEARN_SITE}/scholarship/${token}`;
const PAGE = `${LEARN_SITE}/scholarship`;

export async function sendScholarshipAward(to: {
  email: string;
  name: string;
  code: string;
  locale: string;
  token: string;
  coveragePct: number;
  trackCount: number;
  /** The tracks it may be used on, when staff chose a list. */
  tracks: string[];
  message: string | null;
  expiresAt: Date;
  hasAccount: boolean;
  sponsorName?: string | null;
  partner?: { name: string; role: string } | null;
  pickDays?: number | null;
  completeDays?: number | null;
  /** The award letter, attached as a PDF. */
  letter?: { pdf: Buffer; filename: string } | null;
  /** A reminder before the offer ends (a new link, same award). */
  reminder?: boolean;
}) {
  const t = translator(to.locale);
  const first = to.name.trim().split(/\s+/)[0];
  const link = offerUrl(to.token);
  const next = encodeURIComponent(`/scholarship/${to.token}`);
  const signupUrl = `${LEARN_SITE}/learn/signup?next=${next}&email=${encodeURIComponent(to.email)}`;
  const loginUrl = `${LEARN_SITE}/learn/login?next=${next}`;
  const a = (href: string, label: string) => `<a href="${href}" style="color:#1B2A5E;font-weight:700;">${esc(label)}</a>`;
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#5b6b72;">${esc(k)}</td><td style="padding:6px 0;font-size:14px;font-weight:800;color:#131A1B;text-align:right;">${v}</td></tr>`;

  const award = `<div style="margin:6px 0 18px;border:1px solid #F4C9A0;border-radius:14px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1B2A5E,#27407F);padding:16px 20px;color:#fff;">
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#F9A738;font-weight:800;">${esc(t("learn.scholar.kicker"))}</div>
        <div style="font-size:19px;font-weight:900;margin-top:4px;">The Tilo Vision Scholarship</div>
        ${to.partner ? `<div style="font-size:13px;font-weight:700;margin-top:6px;color:#F9A738;">${esc(t(`learn.scholar.partner.${to.partner.role}`, { partner: to.partner.name }))}</div>` : ""}
      </div>
      <div style="padding:12px 20px;background:#FFFBF6;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${row(t("learn.scholar.award.coverage"), esc(coverageText(t, to.coveragePct)))}
          ${row(t("learn.scholar.award.tracks"), esc(tracksText(t, to.trackCount)))}
          ${row(t("learn.scholar.award.code"), esc(to.code))}
          ${row(t("learn.scholar.award.claimBy"), esc(fmtDate(to.expiresAt, to.locale)))}
          ${to.pickDays ? row(t("learn.scholar.terms.pickLabel"), esc(t("learn.scholar.terms.days", { n: String(to.pickDays) }))) : ""}
          ${to.completeDays ? row(t("learn.scholar.terms.completeLabel"), esc(t("learn.scholar.terms.days", { n: String(to.completeDays) }))) : ""}
          ${to.partner ? row(t("learn.scholar.partner.label"), esc(to.partner.name)) : ""}
          ${to.sponsorName ? row(t("learn.scholar.letter.sponsor"), esc(to.sponsorName)) : ""}
        </table>
      </div>
    </div>`;

  const steps = [1, 2, 3].map((n) => `<li style="margin-bottom:6px;">${esc(t(`learn.scholar.email.step${n}`))}</li>`).join("");
  const conditions = [
    to.pickDays ? t("learn.scholar.email.pickRule", { n: String(to.pickDays) }) : null,
    to.completeDays ? t("learn.scholar.email.completeRule", { n: String(to.completeDays) }) : null,
  ].filter((x): x is string => !!x);

  const body =
    p(esc(t("learn.scholar.email.hello", { name: first }))) +
    (to.reminder ? p(esc(t("learn.scholar.remind.offer.body", { date: fmtDate(to.expiresAt, to.locale) }))) : "") +
    p(t("learn.scholar.email.p1", { scholarship: strong("The Tilo Vision Scholarship") })) +
    (to.partner ? p(strong(esc(t(`learn.scholar.partner.${to.partner.role}`, { partner: to.partner.name })))) : "") +
    (to.sponsorName ? p(esc(t("learn.scholar.letter.sponsorLine", { sponsor: to.sponsorName }))) : "") +
    award +
    encouragement(t) +
    (to.tracks.length
      ? p(esc(t("learn.scholar.email.tracksList"))) +
        `<ul style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;padding-left:18px;">${to.tracks.map((x) => `<li>${strong(esc(x))}</li>`).join("")}</ul>`
      : p(esc(t("learn.scholar.email.anyTrack")))) +
    (to.message
      ? `<div style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #F47C20;background:#F4F7FB;border-radius:8px;font-size:14px;line-height:1.7;color:#131A1B;white-space:pre-line;">${esc(to.message)}</div>`
      : "") +
    p(strong(esc(t("learn.scholar.email.howTitle")))) +
    `<ol style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;padding-left:20px;">${steps}</ol>` +
    (conditions.length ? box(conditions.map((c) => `<p style="font-size:13px;color:#5b6b72;line-height:1.6;margin:0 0 4px;">${esc(c)}</p>`).join("")) : "") +
    p(esc(t("learn.scholar.email.sameEmail", { email: to.email }))) +
    p(strong(esc(t("learn.scholar.encourage.believe")))) +
    (to.letter ? p(esc(t("learn.scholar.email.letterAttached"))) : "") +
    small(esc(t("learn.scholar.email.scope"))) +
    (to.sponsorName ? small(esc(t("learn.scholar.email.sponsorShare"))) : "");

  const after =
    (to.hasAccount ? "" : `<p style="font-size:14px;color:#5b6b72;text-align:center;margin:0 0 12px;">${t("learn.scholar.email.haveAccount", { link: a(loginUrl, t("learn.scholar.signIn")) })}</p>`) +
    `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:0;word-break:break-all;">${t("learn.scholar.email.fallback", { url: a(link, link) })}</p>`;

  await arfaMailer.emails.send({
    to: to.email,
    subject: to.reminder ? t("learn.scholar.remind.offer.subject") : t("learn.scholar.email.subject", { name: first }),
    html: shell(
      t,
      esc(to.reminder ? t("learn.scholar.remind.offer.title") : t("learn.scholar.email.title")),
      body,
      to.hasAccount ? { href: loginUrl, label: `${t("learn.scholar.email.ctaKnown")} →` } : { href: signupUrl, label: `${t("learn.scholar.email.cta")} →` },
      after,
    ),
    attachments: to.letter ? [{ filename: to.letter.filename, content: to.letter.pdf, contentType: "application/pdf" }] : undefined,
  });
}

/** Sent once, when the scholarship is accepted. */
export async function sendScholarshipWelcome(to: {
  email: string;
  name: string;
  locale: string;
  code: string;
  coveragePct: number;
  trackCount: number;
  pickBy: Date | null;
  completeBy: Date | null;
  sponsorName: string | null;
  partner?: { name: string; role: string } | null;
}) {
  const t = translator(to.locale);
  const first = to.name.trim().split(/\s+/)[0];
  const steps = [1, 2, 3].map((n) => `<li style="margin-bottom:6px;">${esc(t(`learn.scholar.welcome.step${n}`))}</li>`).join("");
  const dates = [
    to.pickBy ? t("learn.scholar.welcome.pickBy", { date: fmtDate(to.pickBy, to.locale) }) : null,
    to.completeBy ? t("learn.scholar.welcome.completeBy", { date: fmtDate(to.completeBy, to.locale) }) : null,
  ].filter((x): x is string => !!x);
  const body =
    p(esc(t("learn.scholar.welcome.p1", { name: first, coverage: coverageText(t, to.coveragePct), tracks: tracksText(t, to.trackCount) }))) +
    (to.partner ? p(strong(esc(t(`learn.scholar.partner.${to.partner.role}`, { partner: to.partner.name })))) : "") +
    (to.sponsorName ? p(esc(t("learn.scholar.letter.sponsorLine", { sponsor: to.sponsorName }))) : "") +
    encouragement(t, true) +
    p(strong(esc(t("learn.scholar.welcome.next")))) +
    `<ol style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;padding-left:20px;">${steps}</ol>` +
    (dates.length ? box(dates.map((c) => `<p style="font-size:13px;font-weight:700;color:#131A1B;line-height:1.6;margin:0 0 4px;">${esc(c)}</p>`).join("")) : "") +
    p(esc(t("learn.scholar.welcome.letter"))) +
    scholarFooter(t);
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("learn.scholar.welcome.subject", { name: first }),
    html: shell(t, esc(t("learn.scholar.welcome.title")), body, { href: PAGE, label: `${t("learn.scholar.nudge.cta")} →` }),
  });
}

export interface ProgressLine {
  title: string;
  done: number;
  total: number;
  certified: boolean;
}

const progressTable = (t: T, lines: ProgressLine[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 16px;border-collapse:collapse;">
    ${lines
      .map((l) => {
        const pct = l.total ? Math.round((l.done / l.total) * 100) : 0;
        return `<tr><td style="padding:8px 0;border-bottom:1px solid #eef1f4;font-size:14px;color:#131A1B;font-weight:700;">${esc(l.title)}${l.certified ? ` <span style="color:#1f7a4d;">✓</span>` : ""}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eef1f4;font-size:13px;color:#5b6b72;text-align:right;white-space:nowrap;">${esc(t("learn.scholar.progress.lessons", { done: String(l.done), total: String(l.total) }))} · ${pct}%</td></tr>`;
      })
      .join("")}
  </table>`;

/** A reminder or progress email for an accepted scholarship (lib/learn/scholarship/notices.ts). */
export async function sendScholarNotice(to: {
  email: string;
  name: string;
  locale: string;
  kind: "pick" | "complete-half" | "complete-soon" | "progress" | "completed";
  date?: Date | null;
  daysLeft?: number;
  remaining?: number;
  lessonsThisMonth?: number;
  lines?: ProgressLine[];
}) {
  const t = translator(to.locale);
  const first = to.name.trim().split(/\s+/)[0];
  const date = to.date ? fmtDate(to.date, to.locale) : "";
  const k = `learn.scholar.notice.${to.kind}`;
  const vars = { name: first, date, n: String(to.daysLeft ?? 0), remaining: String(to.remaining ?? 0), lessons: String(to.lessonsThisMonth ?? 0) };
  const subject = to.kind === "pick" && (to.daysLeft ?? 0) <= 1 ? t("learn.scholar.notice.pick.subjectLast") : t(`${k}.subject`, vars);
  const body =
    p(esc(t("learn.scholar.email.hello", { name: first }))) +
    p(esc(t(`${k}.body`, vars))) +
    (to.kind === "progress" ? p(esc(t("learn.scholar.notice.progress.month", vars))) : "") +
    (to.lines?.length ? progressTable(t, to.lines) : "") +
    (to.kind !== "completed" ? p(esc(t("learn.scholar.notice.keepGoing"))) : "") +
    scholarFooter(t);
  const cta =
    to.kind === "pick"
      ? { href: PAGE, label: `${t("learn.scholar.nudge.cta")} →` }
      : to.kind === "completed"
        ? { href: `${LEARN_SITE}/learn/certificates`, label: `${t("learn.scholar.notice.completed.cta")} →` }
        : { href: `${LEARN_SITE}/learn`, label: `${t("learn.scholar.notice.continue")} →` };
  await arfaMailer.emails.send({ to: to.email, subject, html: shell(t, esc(t(`${k}.title`, vars)), body, cta) });
}

// ── Applications (public page /tilo-vision-scholarship) ──────────────────

export async function sendApplicationReceived(to: { email: string; name: string; locale: string; reference: string }) {
  const t = translator(to.locale);
  const first = to.name.trim().split(/\s+/)[0];
  const body =
    p(esc(t("learn.scholar.email.hello", { name: first }))) +
    p(esc(t("learn.scholarApply.email.received.p1"))) +
    p(esc(t("learn.scholarApply.email.received.p2"))) +
    box(`<p style="font-size:13px;color:#5b6b72;margin:0;">${esc(t("learn.scholarApply.email.reference"))} ${strong(esc(to.reference))}</p>`) +
    small(esc(t("learn.scholarApply.email.received.p3")));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("learn.scholarApply.email.received.subject"),
    html: shell(t, esc(t("learn.scholarApply.email.received.title")), body, { href: `${LEARN_SITE}/learning-box`, label: `${t("learn.scholarApply.email.explore")} →` }),
  });
}

export async function sendApplicationDeclined(to: { email: string; name: string; locale: string }) {
  const t = translator(to.locale);
  const first = to.name.trim().split(/\s+/)[0];
  const body = p(esc(t("learn.scholar.email.hello", { name: first }))) + p(esc(t("learn.scholarApply.email.declined.p1"))) + p(esc(t("learn.scholarApply.email.declined.p2")));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("learn.scholarApply.email.declined.subject"),
    html: shell(t, esc(t("learn.scholarApply.email.declined.title")), body, { href: `${LEARN_SITE}/learning-box`, label: `${t("learn.scholarApply.email.explore")} →` }),
  });
}

/** Staff alert (English): a new application to review. */
export async function sendApplicationAlert(a: { id: string; name: string; email: string; country: string | null; background: string | null; motivation: string; tracks: string[] }) {
  const t = translator("en");
  const row = (k: string, v: string) => `<tr><td style="padding:4px 12px 4px 0;font-size:13px;color:#5b6b72;vertical-align:top;">${k}</td><td style="padding:4px 0;font-size:14px;color:#131A1B;">${v}</td></tr>`;
  const body =
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;">
      ${row("Name", esc(a.name))}${row("Email", esc(a.email))}${row("Country", esc(a.country ?? "–"))}${row("Background", esc(a.background ?? "–"))}
      ${row("Tracks of interest", esc(a.tracks.join(", ") || "Any"))}
    </table>` +
    `<div style="margin:0 0 14px;padding:12px 16px;background:#F4F7FB;border-radius:8px;font-size:14px;line-height:1.7;color:#131A1B;white-space:pre-line;">${esc(a.motivation.slice(0, 1500))}</div>`;
  await arfaMailer.emails.send({
    to: ARFA_EMAIL,
    subject: `New Tilo Vision Scholarship application: ${a.name}`,
    html: shell(t, "New scholarship application", body, { href: `${LEARN_SITE}/admin_pro/learn/scholarships#applications`, label: "Review applications →" }),
  });
}

// ── Sponsors ──────────────────────────────────────────────────────────────

export interface SponsorReport {
  sponsor: string;
  awarded: number;
  accepted: number;
  tracksUnlocked: number;
  coveredCents: number;
  lessonsDone: number;
  lessonsTotal: number;
  certificates: number;
  examsPassed: number;
  scholars: Array<{ who: string; since: Date | null; tracks: ProgressLine[] }>;
}

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** The sponsor's impact report (English): totals and each scholar by first name and initial. */
export async function sendSponsorReport(to: string, r: SponsorReport) {
  const t = translator("en");
  const stat = (k: string, v: string) =>
    `<td style="padding:10px;text-align:center;border:1px solid #eef1f4;border-radius:8px;"><div style="font-size:20px;font-weight:900;color:#1B2A5E;">${v}</div><div style="font-size:11px;color:#5b6b72;text-transform:uppercase;letter-spacing:.06em;">${k}</div></td>`;
  const pct = r.lessonsTotal ? Math.round((r.lessonsDone / r.lessonsTotal) * 100) : 0;
  const body =
    p(`Thank you for making The Tilo Vision Scholarship possible. Here is the impact of your support as of ${esc(fmtDate(new Date(), "en"))}.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="6" border="0" style="margin:0 0 16px;"><tr>
      ${stat("Scholars", String(r.accepted))}${stat("Tracks", String(r.tracksUnlocked))}${stat("Progress", `${pct}%`)}${stat("Certificates", String(r.certificates))}
    </tr></table>` +
    p(`${r.awarded} scholarship${r.awarded === 1 ? "" : "s"} awarded, ${r.accepted} accepted. Tuition covered: ${strong(usd(r.coveredCents))}. Final exams passed: ${r.examsPassed}.`) +
    r.scholars
      .map((s) => `<p style="font-size:14px;font-weight:800;color:#131A1B;margin:16px 0 2px;">${esc(s.who)}</p>${s.tracks.length ? progressTable(t, s.tracks) : `<p style="font-size:13px;color:#8A9BA0;margin:0 0 8px;">Choosing tracks.</p>`}`)
      .join("") +
    small("Scholars are shown by first name and initial only. Questions: reply to this email.");
  await arfaMailer.emails.send({
    to,
    subject: `Your Tilo Vision Scholarship impact report: ${r.sponsor}`,
    html: shell(t, esc(`Impact report: ${r.sponsor}`), body, { href: `${LEARN_SITE}/tilo-vision-scholarship`, label: "About the scholarship →" }),
  });
}

// ── Donations to the scholarship fund ─────────────────────────────────────

const money = (cents: number, locale: string) =>
  new Intl.NumberFormat(isLocale(locale) ? locale : "en", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(cents / 100);

/** The thank-you for a gift (once per checkout), in the donor's language. */
export async function sendDonationThanks(to: { email: string; name: string | null; locale: string; amountCents: number; frequency: "once" | "monthly"; manage: string | null }) {
  const t = translator(to.locale);
  const first = to.name?.trim().split(/\s+/)[0];
  const amount = money(to.amountCents, to.locale);
  const body =
    p(esc(first ? t("donate.email.hello", { name: first }) : t("donate.email.helloAnon"))) +
    p(t(to.frequency === "monthly" ? "donate.email.p1Monthly" : "donate.email.p1Once", { amount: strong(esc(amount)) })) +
    p(esc(t("donate.email.p2"))) +
    encouragement(t, true) +
    p(esc(t("donate.email.p3"))) +
    (to.manage ? p(t("donate.email.manage", { link: `<a href="${to.manage}" style="color:#1B2A5E;font-weight:700;">${esc(t("donate.email.manageLink"))}</a>` })) : "") +
    small(esc(t("donate.email.legal")));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("donate.email.subject"),
    html: shell(t, esc(t("donate.email.title")), body, { href: `${LEARN_SITE}/tilo-vision-scholarship`, label: `${t("donate.email.cta")} →` }),
  });
}

/** Staff alert (English): a new gift. */
export async function sendDonationAlert(d: { name: string | null; email: string | null; amountCents: number; frequency: "once" | "monthly" }) {
  const t = translator("en");
  await arfaMailer.emails.send({
    to: ARFA_EMAIL,
    subject: `New scholarship donation: ${money(d.amountCents, "en")}${d.frequency === "monthly" ? " monthly" : ""}`,
    html: shell(
      t,
      "New gift to the Tilo Vision Scholarship fund",
      p(`${strong(esc(money(d.amountCents, "en")))} ${d.frequency === "monthly" ? "every month" : "one time"} from ${esc(d.name ?? "a donor")}${d.email ? ` (${esc(d.email)})` : ""}. A thank-you email was sent.`),
      { href: `${LEARN_SITE}/admin_pro/learn/scholarships#donations`, label: "See donations →" },
    ),
  });
}
