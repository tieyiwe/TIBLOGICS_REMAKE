import { arfaMailer } from "@/lib/resend";
import { LEARN_SITE, learnEmailEsc as esc, learnEmailP as p, learnEmailShell as shell } from "@/lib/learn/emails";
import { translator } from "@/lib/learn/i18n";
import { isLocale } from "@/lib/i18n/config";

// Team emails: the invitation and the weekly overdue-assignment reminder,
// through the same mailer and layout as the other Learn emails.

const loc = (l: string | null | undefined) => (isLocale(l) ? l : "en");

export const inviteUrl = (token: string) => `${LEARN_SITE}/join-team/${token}`;

export async function sendTeamInvite(to: {
  email: string;
  teamName: string;
  inviterName: string;
  token: string;
  expiresAt: Date;
  locale: string | null | undefined;
}) {
  const t = translator(to.locale);
  const until = new Intl.DateTimeFormat(loc(to.locale), { dateStyle: "long" }).format(to.expiresAt);
  const body =
    p(t("team.email.invite.p1", { inviter: esc(to.inviterName), team: `<strong style="color:#131A1B;">${esc(to.teamName)}</strong>` })) +
    p(t("team.email.invite.p2")) +
    p(t("team.email.invite.expires", { date: esc(until) }));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("team.email.invite.subject", { team: to.teamName }),
    html: shell(t, t("team.email.invite.title"), body, { href: inviteUrl(to.token), label: `${t("team.email.invite.cta")} →` }),
  });
}

export async function sendOverdueReminder(to: {
  email: string;
  name: string;
  teamName: string;
  locale: string | null | undefined;
  items: Array<{ title: string; slug: string; dueAt: Date; percent: number }>;
}) {
  const t = translator(to.locale);
  const fmt = new Intl.DateTimeFormat(loc(to.locale), { dateStyle: "medium" });
  const list = `<ul style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;padding-left:18px;">${to.items
    .map((i) => `<li><strong style="color:#131A1B;">${esc(i.title)}</strong>: ${esc(t("team.email.overdue.item", { date: fmt.format(i.dueAt), n: i.percent }))}</li>`)
    .join("")}</ul>`;
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("team.email.overdue.subject", { team: to.teamName }),
    html: shell(
      t,
      t("team.email.overdue.title", { name: esc(to.name.trim().split(/\s+/)[0] ?? "") }),
      p(t("team.email.overdue.p1", { team: esc(to.teamName) })) + list + p(t("team.email.overdue.p2")),
      { href: `${LEARN_SITE}/learn`, label: `${t("team.email.overdue.cta")} →` },
    ),
  });
}
