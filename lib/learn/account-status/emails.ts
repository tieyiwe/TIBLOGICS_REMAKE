// Account notices sent by admin actions, in the learner's language, from the
// ARFA mailer (arfa@tiblogics.com) with the ARFA email layout.
import { arfaMailer } from "@/lib/resend";
import { translator } from "@/lib/learn/i18n";
import { learnEmailShell, learnEmailEsc, learnEmailP, LEARN_SITE } from "@/lib/learn/emails";

/** "Your email changed": one notice to the old address, one to the new. */
export async function sendEmailChangedEmails(s: { name: string; locale: string; oldEmail: string; newEmail: string }) {
  const t = translator(s.locale);
  const name = learnEmailEsc(s.name.split(" ")[0] || s.name);
  const login = { href: `${LEARN_SITE}/learn/login`, label: `${t("comms.email.signInCta")} →` };
  const results = await Promise.allSettled([
    arfaMailer.emails.send({
      to: s.oldEmail,
      subject: t("comms.email.emailChangedOldSubject"),
      html: learnEmailShell(
        t,
        t("comms.email.emailChangedOldTitle", { name }),
        learnEmailP(t("comms.email.emailChangedOldBody", { email: learnEmailEsc(s.newEmail) })),
      ),
    }),
    arfaMailer.emails.send({
      to: s.newEmail,
      subject: t("comms.email.emailChangedNewSubject"),
      html: learnEmailShell(t, t("comms.email.emailChangedNewTitle", { name }), learnEmailP(t("comms.email.emailChangedNewBody")), login),
    }),
  ]);
  const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
  if (failed) throw failed.reason;
}
