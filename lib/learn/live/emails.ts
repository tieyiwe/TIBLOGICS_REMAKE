import { arfaMailer } from "@/lib/resend";
import { LEARN_SITE, learnEmailEsc as esc, learnEmailP as p, learnEmailShell as shell } from "@/lib/learn/emails";
import { translator } from "@/lib/learn/i18n";
import { isLocale } from "@/lib/i18n/config";
import { fmtSession } from "@/lib/learn/community/emails";

// Live expert session emails: RSVP confirmation (a seat, or the waitlist),
// a seat opening up from the waitlist, the 24h and 1h reminders and the
// recording. In the learner's saved language, through the same mailer and
// layout as the other Learn emails. The meeting link is never in an email:
// learners join from the session page, which records attendance.

export interface To {
  email: string;
  name: string;
  locale: string | null;
}

export interface MailSession {
  id: string;
  title: string;
  expertName: string;
  startsAt: Date;
  timezone: string;
}

const first = (name: string) => esc(name.trim().split(/\s+/)[0] ?? "");
const loc = (l: string | null) => (isLocale(l) ? l : "en");
const strong = (s: string) => `<strong style="color:#131A1B;">${esc(s)}</strong>`;
const page = (s: MailSession) => `${LEARN_SITE}/learn/live/${s.id}`;

export type RsvpMail = "going" | "waitlist" | "promoted";

export async function sendRsvpEmail(to: To, s: MailSession, kind: RsvpMail, position = 0) {
  const t = translator(to.locale);
  const when = esc(fmtSession(s.startsAt, s.timezone, loc(to.locale)));
  const vars = { session: strong(s.title), expert: esc(s.expertName), when };
  const body =
    kind === "waitlist"
      ? p(t("live.email.waitlist.p1", { ...vars, n: position })) + p(t("live.email.waitlist.p2"))
      : p(t(kind === "promoted" ? "live.email.promoted.p1" : "live.email.going.p1", vars)) +
        p(t("live.email.going.p2")) +
        p(`<a href="${LEARN_SITE}/api/learn/live/${s.id}/ics" style="color:#F47C20;font-weight:600;">${t("live.email.addToCalendar")} →</a>`);
  await arfaMailer.emails.send({
    to: to.email,
    subject: t(`live.email.${kind}.subject`, { session: s.title }),
    html: shell(t, t(`live.email.${kind}.title`, { name: first(to.name) }), body, { href: page(s), label: `${t("live.email.open")} →` }),
  });
}

export async function sendReminder(to: To, s: MailSession, which: "24h" | "1h") {
  const t = translator(to.locale);
  const when = esc(fmtSession(s.startsAt, s.timezone, loc(to.locale)));
  const body =
    p(t(`live.email.reminder${which}.p1`, { session: strong(s.title), expert: esc(s.expertName), when })) +
    p(t("live.email.reminder.p2"));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t(`live.email.reminder${which}.subject`, { session: s.title }),
    html: shell(t, t("live.email.reminder.title", { name: first(to.name) }), body, { href: page(s), label: `${t("live.email.openJoin")} →` }),
  });
}

export async function sendRecordingEmail(to: To, s: MailSession) {
  const t = translator(to.locale);
  const body = p(t("live.email.recording.p1", { session: strong(s.title), expert: esc(s.expertName) })) + p(t("live.email.recording.p2"));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("live.email.recording.subject", { session: s.title }),
    html: shell(t, t("live.email.recording.title", { name: first(to.name) }), body, { href: page(s), label: `${t("live.email.watch")} →` }),
  });
}
