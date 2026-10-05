import prisma from "@/lib/prisma";
import { arfaMailer } from "@/lib/resend";
import { LEARN_SITE, learnEmailEsc as esc, learnEmailP as p, learnEmailShell as shell } from "@/lib/learn/emails";
import { translator, type T } from "@/lib/learn/i18n";
import { isLocale } from "@/lib/i18n/config";
import { getPlan } from "./plan";
import { TEAM_INVITE_DAYS } from "./config";

// Team emails: the invitation, the manager's nudge, the weekly overdue
// reminder and the weekly manager digest, through the same mailer and layout
// as the other Learn emails. Each goes out in the recipient's language.

const loc = (l: string | null | undefined) => (isLocale(l) ? l : "en");
const strong = (s: string) => `<strong style="color:#131A1B;">${s}</strong>`;
const ul = (items: string[]) =>
  `<ul style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;padding-left:18px;">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

export const inviteUrl = (token: string) => `${LEARN_SITE}/join-team/${token}`;

/** Track titles in a language: French titles where the track has one. */
async function trackTitles(ids: string[], locale: string): Promise<Array<{ id: string; title: string }>> {
  if (ids.length === 0) return [];
  const rows = await prisma.learnTrack.findMany({ where: { id: { in: ids }, status: "live" }, select: { id: true, title: true, titleFr: true, sortOrder: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({ id: r.id, title: locale === "fr" && r.titleFr ? r.titleFr : r.title }));
}

export async function sendTeamInvite(to: {
  email: string;
  teamName: string;
  inviterName: string;
  /** Shown so the recipient knows exactly who sent it. */
  inviterEmail?: string | null;
  token: string;
  expiresAt: Date;
  locale: string | null | undefined;
  name?: string | null;
  tracks?: string[];
  dueAt?: Date | null;
  /** The recipient already has an ARFA account: the button signs them in. */
  hasAccount?: boolean;
}) {
  const t = translator(to.locale);
  const fmt = new Intl.DateTimeFormat(loc(to.locale), { dateStyle: "long" });
  const tracks = to.tracks ?? [];
  const first = to.name?.trim().split(/\s+/)[0];
  const invite = inviteUrl(to.token);
  const next = encodeURIComponent(`/join-team/${to.token}`);
  const signupUrl = `${LEARN_SITE}/learn/signup?next=${next}&email=${encodeURIComponent(to.email)}`;
  const loginUrl = `${LEARN_SITE}/learn/login?next=${next}`;
  const link = (href: string, label: string) => `<a href="${href}" style="color:#1B2A5E;font-weight:700;">${esc(label)}</a>`;
  const body =
    (first ? p(esc(t("team.email.hello", { name: first }))) : "") +
    p(t("team.email.invite.p1", { inviter: strong(esc(to.inviterName)), team: strong(esc(to.teamName)) })) +
    (to.inviterEmail
      ? `<p style="font-size:13px;color:#5b6b72;line-height:1.6;margin:0 0 14px;padding:10px 14px;background:#F4F7FB;border-radius:10px;">${t("team.email.invite.sentBy", { inviter: esc(to.inviterName), email: esc(to.inviterEmail), team: esc(to.teamName) })}</p>`
      : "") +
    p(esc(t("team.email.invite.about"))) +
    (tracks.length
      ? p(esc(t(tracks.length === 1 ? "team.email.invite.tracks.one" : "team.email.invite.tracks.other"))) +
        ul(tracks.map((x) => strong(esc(x)))) +
        (to.dueAt ? p(esc(t("team.email.invite.due", { date: fmt.format(to.dueAt) }))) : "")
      : "") +
    p(t("team.email.invite.p2")) +
    p(t("team.email.invite.expires", { date: esc(fmt.format(to.expiresAt)) }));
  // A new learner creates the account (email filled in) and lands back on the
  // invitation to join; someone with an account signs in and does the same.
  const after =
    (to.hasAccount ? "" : `<p style="font-size:14px;color:#5b6b72;text-align:center;margin:0 0 12px;">${t("team.email.invite.haveAccount", { link: link(loginUrl, t("team.email.invite.signIn")) })}</p>`) +
    `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:0;word-break:break-all;">${t("team.email.invite.fallback", { url: link(invite, invite) })}</p>`;
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("team.email.invite.subject", { team: to.teamName, inviter: to.inviterName }),
    html: shell(
      t,
      esc(t("team.email.invite.title", { inviter: to.inviterName, team: to.teamName })),
      body,
      to.hasAccount
        ? { href: loginUrl, label: `${t("team.email.invite.ctaKnown")} →` }
        : { href: signupUrl, label: `${t("team.email.invite.cta")} →` },
      after,
    ),
  });
}

/**
 * Sends (or re-sends) one invitation with everything the manager chose:
 * name, tracks and due date (from its plan), in the invitee's language: the
 * account's saved language if they already have one, else the language the
 * manager picked, else the manager's.
 */
export async function deliverInvite(inv: {
  teamId: string;
  teamName: string;
  memberId: string;
  email: string;
  token: string;
  inviterName: string;
  inviterEmail?: string | null;
  fallbackLocale: string;
}) {
  const [plan, known] = await Promise.all([
    getPlan(inv.teamId, inv.memberId).catch(() => null),
    prisma.student.findUnique({ where: { email: inv.email }, select: { locale: true } }).catch(() => null),
  ]);
  const locale = known?.locale ?? plan?.locale ?? inv.fallbackLocale;
  const tracks = await trackTitles(plan?.trackIds ?? [], loc(locale));
  await sendTeamInvite({
    email: inv.email,
    teamName: inv.teamName,
    inviterName: inv.inviterName,
    inviterEmail: inv.inviterEmail ?? null,
    token: inv.token,
    expiresAt: new Date(Date.now() + TEAM_INVITE_DAYS * 86_400_000),
    locale,
    name: plan?.name,
    tracks: tracks.map((x) => x.title),
    dueAt: plan?.dueAt ?? null,
    hasAccount: !!known,
  });
}

type Item = { title: string; dueAt: Date | null; percent: number };

function itemList(t: T, locale: string, items: Item[]) {
  const fmt = new Intl.DateTimeFormat(loc(locale), { dateStyle: "medium" });
  const now = Date.now();
  return ul(
    items.map((i) => {
      const note = i.dueAt
        ? t(i.dueAt.getTime() < now ? "team.email.nudge.itemOverdue" : "team.email.nudge.itemDue", { date: fmt.format(i.dueAt), n: i.percent })
        : t("team.email.nudge.itemNoDue", { n: i.percent });
      return `${strong(esc(i.title))}: ${esc(note)}`;
    }),
  );
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
  const list = ul(to.items.map((i) => `${strong(esc(i.title))}: ${esc(t("team.email.overdue.item", { date: fmt.format(i.dueAt), n: i.percent }))}`));
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

/** A manager's nudge: the learner's open assignments, with a way back in. */
export async function sendNudge(to: {
  email: string;
  name: string;
  teamName: string;
  managerName: string;
  locale: string | null | undefined;
  items: Item[];
  resumeHref: string | null;
}) {
  const t = translator(to.locale);
  const first = to.name.trim().split(/\s+/)[0] ?? "";
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("team.email.nudge.subject", { manager: to.managerName, team: to.teamName }),
    html: shell(
      t,
      esc(t("team.email.nudge.title", { name: first })),
      p(t("team.email.nudge.p1", { manager: strong(esc(to.managerName)), team: strong(esc(to.teamName)) })) +
        itemList(t, loc(to.locale), to.items) +
        p(esc(t("team.email.nudge.p2"))),
      { href: `${LEARN_SITE}${to.resumeHref ?? "/learn"}`, label: `${t("team.email.nudge.cta")} →` },
    ),
  });
}

export interface DigestData {
  teamName: string;
  members: number;
  activeThisWeek: number;
  lessonsThisWeek: number;
  certificatesThisWeek: number;
  avgPercent: number | null;
  overdue: number;
  pendingInvites: number;
  attention: Array<{ who: string; why: "inactive" | "overdue" }>;
}

/** The weekly manager summary. Opt-out link: the team dashboard's Reports tab. */
export async function sendManagerDigest(to: { email: string; name: string; locale: string | null | undefined; d: DigestData }) {
  const t = translator(to.locale);
  const { d } = to;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#5b6b72;font-size:14px;">${esc(label)}</td><td style="padding:6px 0;text-align:right;font-weight:800;color:#131A1B;font-size:14px;">${esc(value)}</td></tr>`;
  const table = `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 14px;">${[
    row(t("team.email.digest.active"), `${d.activeThisWeek} / ${d.members}`),
    row(t("team.email.digest.lessons"), String(d.lessonsThisWeek)),
    row(t("team.email.digest.avg"), d.avgPercent == null ? "-" : `${d.avgPercent}%`),
    row(t("team.email.digest.overdue"), String(d.overdue)),
    row(t("team.email.digest.certs"), String(d.certificatesThisWeek)),
    row(t("team.email.digest.pending"), String(d.pendingInvites)),
  ].join("")}</table>`;
  const attention = d.attention.length
    ? p(strong(esc(t("team.email.digest.attention")))) + ul(d.attention.map((a) => `${esc(a.who)}: ${esc(t(`team.email.digest.why.${a.why}`))}`))
    : p(esc(t("team.email.digest.allGood")));
  await arfaMailer.emails.send({
    to: to.email,
    subject: t("team.email.digest.subject", { team: d.teamName }),
    html: shell(
      t,
      esc(t("team.email.digest.title", { team: d.teamName })),
      p(esc(t("team.email.hello", { name: to.name.trim().split(/\s+/)[0] ?? "" }))) +
        table +
        attention +
        `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:18px 0 0;">${esc(t("team.email.digest.optOut"))} <a href="${LEARN_SITE}/learn/team?tab=reports" style="color:#2563eb;">${esc(t("team.email.digest.optOutLink"))}</a></p>`,
      { href: `${LEARN_SITE}/learn/team`, label: `${t("team.email.digest.cta")} →` },
    ),
  });
}
