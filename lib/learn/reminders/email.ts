// The study reminder email: the fallback for learners who chose email but not
// WhatsApp. Same layout as every other Learn email (lib/learn/emails.ts).
import { arfaMailer } from "@/lib/resend";
import { LEARN_SITE, learnEmailEsc, learnEmailP, learnEmailShell } from "@/lib/learn/emails";
import { translator } from "@/lib/learn/i18n";
import type { ReminderLanguage } from "./shared";

export async function sendReminderEmail(s: { email: string; name: string; language: ReminderLanguage; lesson: string; streak: number }) {
  const t = translator(s.language);
  const strong = (v: string) => `<strong style="color:#131A1B;">${v}</strong>`;
  const body =
    learnEmailP(t("pwa.reminders.email.next", { lesson: strong(learnEmailEsc(s.lesson)) })) +
    learnEmailP(s.streak > 0 ? t("pwa.reminders.email.streak", { n: strong(String(s.streak)) }) : t("pwa.reminders.email.noStreak")) +
    learnEmailP(
      `<span style="font-size:12px;">${t("pwa.reminders.email.why")} <a href="${LEARN_SITE}/learn/account#reminders" style="color:#F47C20;">${t("pwa.reminders.email.manage")}</a></span>`,
    );
  await arfaMailer.emails.send({
    to: s.email,
    subject: t("pwa.reminders.email.subject"),
    html: learnEmailShell(t, t("pwa.reminders.email.title", { name: learnEmailEsc(s.name) }), body, {
      href: `${LEARN_SITE}/learn`,
      label: `${t("pwa.reminders.email.cta")} →`,
    }),
  });
}
