import { arfaMailer } from "@/lib/resend";
import { LEARN_SITE, learnEmailEsc as esc, learnEmailP as p, learnEmailShell as shell } from "@/lib/learn/emails";
import { translator } from "@/lib/learn/i18n";
import { isLocale } from "@/lib/i18n/config";
import { validTimeZone } from "./shared";

// Community emails: cohort welcome, the 24h live-session reminder, the weekly
// "falling behind" nudge and the reply digest. Each goes out in the
// learner's saved language, through the same mailer and layout as the other
// Learn emails. Names are first names only.

interface To {
  email: string;
  name: string;
  locale: string | null;
}

const first = (name: string) => esc(name.trim().split(/\s+/)[0] ?? "");
const loc = (l: string | null) => (isLocale(l) ? l : "en");

/** "Tuesday, 6 October 2026 at 18:00 (Africa/Nairobi)" in the reader's language. */
export function fmtSession(at: Date, timezone: string, locale: string): string {
  const tz = validTimeZone(timezone) ? timezone : "UTC";
  const s = new Intl.DateTimeFormat(locale, { timeZone: tz, dateStyle: "full", timeStyle: "short" }).format(at);
  return `${s} (${tz})`;
}

export async function sendCohortWelcome(
  to: To,
  c: { id: string; name: string; trackTitle: string; nextSession: Date | null; timezone: string; meetingUrl: string | null },
) {
  const t = translator(to.locale);
  const body =
    p(t("community.email.welcome.p1", { cohort: `<strong style="color:#131A1B;">${esc(c.name)}</strong>`, track: esc(c.trackTitle) })) +
    (c.nextSession ? p(t("community.email.welcome.next", { when: esc(fmtSession(c.nextSession, c.timezone, loc(to.locale))) })) : "") +
    p(t("community.email.welcome.p2"));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("community.email.welcome.subject", { cohort: c.name }),
    html: shell(t, t("community.email.welcome.title", { name: first(to.name) }), body, {
      href: `${LEARN_SITE}/learn/community/cohort/${c.id}`,
      label: `${t("community.email.openCohort")} →`,
    }),
  });
}

export async function sendSessionReminder(
  to: To,
  c: { id: string; name: string; timezone: string; meetingUrl: string | null },
  at: Date,
) {
  const t = translator(to.locale);
  const when = fmtSession(at, c.timezone, loc(to.locale));
  const body =
    p(t("community.email.reminder.p1", { cohort: `<strong style="color:#131A1B;">${esc(c.name)}</strong>`, when: esc(when) })) +
    (c.meetingUrl && /^https?:\/\//i.test(c.meetingUrl)
      ? p(`<a href="${esc(c.meetingUrl)}" style="color:#F47C20;font-weight:600;">${t("community.email.reminder.join")} →</a>`)
      : "") +
    p(t("community.email.reminder.p2"));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("community.email.reminder.subject", { cohort: c.name }),
    html: shell(t, t("community.email.reminder.title", { name: first(to.name) }), body, {
      href: `${LEARN_SITE}/learn/community/cohort/${c.id}`,
      label: `${t("community.email.openCohort")} →`,
    }),
  });
}

export async function sendBehindNudge(
  to: To,
  c: { id: string; name: string },
  progress: { mine: number; expected: number; nextLessonId: string | null },
) {
  const t = translator(to.locale);
  const body =
    p(t("community.email.nudge.p1", { cohort: `<strong style="color:#131A1B;">${esc(c.name)}</strong>`, mine: progress.mine, expected: progress.expected })) +
    p(t("community.email.nudge.p2"));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("community.email.nudge.subject", { cohort: c.name }),
    html: shell(t, t("community.email.nudge.title", { name: first(to.name) }), body, {
      href: progress.nextLessonId ? `${LEARN_SITE}/learn/lesson/${progress.nextLessonId}` : `${LEARN_SITE}/learn/community/cohort/${c.id}`,
      label: `${t("community.email.nudge.cta")} →`,
    }),
  });
}

export async function sendReplyDigest(to: To, threads: Array<{ title: string; replies: number; href: string }>) {
  const t = translator(to.locale);
  const list = `<ul style="padding-left:18px;margin:0 0 14px;">${threads
    .map(
      (th) =>
        `<li style="font-size:14px;color:#5b6b72;line-height:1.7;margin-bottom:6px;"><a href="${LEARN_SITE}${th.href}" style="color:#131A1B;font-weight:600;">${esc(th.title)}</a> · ${esc(
          t(th.replies === 1 ? "community.email.digest.replies.one" : "community.email.digest.replies.other", { n: th.replies }),
        )}</li>`,
    )
    .join("")}</ul>`;
  const body =
    p(t("community.email.digest.p1")) +
    list +
    `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:16px 0 0;">${t("community.email.digest.optOut", {
      link: `<a href="${LEARN_SITE}/learn/account" style="color:#8A9BA0;">${t("community.email.digest.settings")}</a>`,
    })}</p>`;
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("community.email.digest.subject"),
    html: shell(t, t("community.email.digest.title", { name: first(to.name) }), body, {
      href: `${LEARN_SITE}${threads[0]?.href ?? "/learn/community"}`,
      label: `${t("community.email.digest.cta")} →`,
    }),
  });
}
