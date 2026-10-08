// AI-Empowered Youth: emails to a learner's parent or guardian, in the
// learner's language, from the ARFA mailbox.
//   consent  under 13: what we collect, why, how to delete; the link to confirm
//   info     13 to 17: the program, the parent dashboard link
//   weekly   Sunday summary (lib/learn/youth-digest.ts)
import { arfaMailer } from "@/lib/resend";
import { ARFA_EMAIL, learnEmailEsc as esc, learnEmailP as p, learnEmailShell as shell, LEARN_SITE } from "./emails";
import { translator } from "./i18n";
import { needsParentConsent, markParentEmailSent, type YouthProfile } from "./youth-account";
import type { ParentSummary } from "./youth-dashboard";

export const parentDashboardUrl = (token: string) => `${LEARN_SITE}/parent/${encodeURIComponent(token)}`;

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

const list = (items: string[]) =>
  `<ul style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;padding-left:20px;">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

/** The consent request (under 13) or the information email (13 to 17). */
export async function sendParentEmail(child: YouthProfile): Promise<void> {
  if (!child.parentEmail || !child.parentToken) throw new Error("No parent email");
  const t = translator(child.locale);
  const name = esc(firstName(child.name));
  const url = parentDashboardUrl(child.parentToken);
  const consent = needsParentConsent(child) && child.parentConsent !== "granted";
  const k = consent ? "learn.email.youth.consent" : "learn.email.youth.info";
  const body =
    p(t(`${k}.p1`, { name })) +
    p(`<strong style="color:#131A1B;">${t("learn.email.youth.collect.title")}</strong>`) +
    list([1, 2, 3, 4].map((n) => t(`learn.email.youth.collect.${n}`))) +
    p(`<strong style="color:#131A1B;">${t("learn.email.youth.why.title")}</strong> ${t("learn.email.youth.why.body")}`) +
    p(`<strong style="color:#131A1B;">${t("learn.email.youth.safety.title")}</strong> ${t("learn.email.youth.safety.body")}`) +
    p(`<strong style="color:#131A1B;">${t("learn.email.youth.delete.title")}</strong> ${t("learn.email.youth.delete.body", { email: esc(ARFA_EMAIL) })}`) +
    p(t(`${k}.p2`, { name }));
  await arfaMailer.emails.send({
    to: child.parentEmail,
    subject: t(`${k}.subject`, { name: firstName(child.name) }),
    html: shell(t, t(`${k}.title`, { name }), body, { href: url, label: `${t(`${k}.cta`)} →` }, p(t("learn.email.youth.notYou"))),
  });
  await markParentEmailSent(child.studentId);
}

/** The weekly summary for a parent. */
export async function sendParentWeeklyEmail(child: YouthProfile, s: ParentSummary): Promise<void> {
  if (!child.parentEmail || !child.parentToken) throw new Error("No parent email");
  const t = translator(child.locale);
  const name = esc(firstName(child.name));
  const row = (label: string, value: string | number) =>
    `<tr><td style="padding:6px 0;font-size:14px;color:#5b6b72;">${label}</td><td style="padding:6px 0;font-size:14px;color:#131A1B;font-weight:700;text-align:right;">${value}</td></tr>`;
  const table = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 14px;">${[
    row(t("learn.parent.stat.lessonsWeek"), s.lessonsThisWeek),
    row(t("learn.parent.stat.minutesWeek"), t("learn.parent.minutes", { n: s.minutesThisWeek })),
    row(t("learn.parent.stat.lessons"), s.lessonsDone),
    row(t("learn.parent.stat.quizzes"), s.quizzesPassed),
    row(t("learn.parent.stat.labs"), s.labsPassed),
    row(t("learn.parent.stat.certificates"), s.certificates.length),
  ].join("")}</table>`;
  const recent = s.recent.slice(0, 5).map((r) => `${esc(r.title)} <span style="color:#8A9BA0;">(${t(`learn.parent.kind.${r.kind}`)})</span>`);
  const body =
    p(t(s.lessonsThisWeek > 0 ? "learn.email.youth.weekly.p1" : "learn.email.youth.weekly.quiet", { name })) +
    table +
    (recent.length ? p(`<strong style="color:#131A1B;">${t("learn.parent.recent")}</strong>`) + list(recent) : "") +
    p(t("learn.email.youth.weekly.p2"));
  await arfaMailer.emails.send({
    to: child.parentEmail,
    subject: t("learn.email.youth.weekly.subject", { name: firstName(child.name) }),
    html: shell(t, t("learn.email.youth.weekly.title", { name }), body, { href: parentDashboardUrl(child.parentToken), label: `${t("learn.email.youth.weekly.cta")} →` }),
  });
}

/** Tells ARFA staff a parent asked for deletion; tells the parent it is on its way. */
export async function sendDeletionRequestEmails(child: YouthProfile): Promise<void> {
  const t = translator(child.locale);
  const admin = `${LEARN_SITE}/admin_pro/learn/learners/${encodeURIComponent(child.studentId)}`;
  await arfaMailer.emails.send({
    to: ARFA_EMAIL,
    subject: `Parent deletion request: learner ${child.studentId}`,
    html: shell(
      translator("en"),
      "A parent asked us to delete a child's account",
      p(`Learner id: <strong>${esc(child.studentId)}</strong>. Access is already locked. Delete the account from the admin (Learners, Delete) within 30 days, then reply to the parent at ${esc(child.parentEmail ?? "")}.`),
      { href: admin, label: "Open the learner →" },
    ),
  });
  if (child.parentEmail) {
    await arfaMailer.emails.send({
      to: child.parentEmail,
      subject: t("learn.email.youth.deletion.subject"),
      html: shell(t, t("learn.email.youth.deletion.title"), p(t("learn.email.youth.deletion.p1", { name: esc(firstName(child.name)) })) + p(t("learn.email.youth.deletion.p2", { email: esc(ARFA_EMAIL) }))),
    });
  }
}
