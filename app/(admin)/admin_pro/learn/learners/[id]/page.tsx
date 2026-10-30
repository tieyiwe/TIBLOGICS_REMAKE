import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity, Award, Ban, BookOpen, CalendarClock, CreditCard, ExternalLink, Flame, GraduationCap, Inbox, KeyRound, LogIn,
  Mail, MessageSquare, PauseCircle, ShieldAlert, Sparkles, Trash2, Undo2,
} from "lucide-react";
import { Badge, Card, EmptyState, StatCard, Tabs, tableStyles, type BadgeTone } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { loadLearnerDetail, type TrackDetail } from "@/lib/learn/admin/learner-detail";
import { deviceLabel } from "@/lib/learn/logins";
import { canManageLearners, requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { readAccountState } from "@/lib/learn/account-status";
import { ensureAccountTables } from "@/lib/learn/account-status/db";
import { OWNER_EMAIL } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { auditFor } from "@/lib/admin/audit";
import { threadsForLearner } from "@/lib/learn/inbox/threads";
import { campaignsForLearner } from "@/lib/learn/inbox/campaigns";
import { plainPreview } from "@/lib/learn/inbox/markdown";
import { composerContext } from "../../../communications/_components/context";
import { Conversation } from "../../../communications/_components/Conversation";
import { ActionButton, CertificateRevoke, LearnerHeaderActions, type LearnerSummary } from "./LearnerActions";
import { NotesPanel, TagsEditor } from "./NotesPanel";
import Assessments from "./Assessments";
import { YouthCard } from "./YouthCard";
import { youthAdminInfo } from "@/lib/learn/youth-account";
import { scholarshipsOfLearner } from "@/lib/learn/scholarship/admin";
import { ago, avatarHue, day, dt, human, initials, money } from "../_components/format";

export const dynamic = "force-dynamic";

// One ARFA learner as a profile: who they are, their account status, plan,
// progress, purchases, messages, sign-ins, private notes and the account
// controls (suspend, block, passwords, access, export, delete). Privacy: no
// drafts, reflections or Tutor conversation content, only counts.

const LANG: Record<string, string> = { en: "English", fr: "French", sw: "Swahili" };
const LEVEL: Record<string, { label: string; tone: BadgeTone }> = {
  mastered: { label: "Mastered", tone: "success" },
  partial: { label: "Partly", tone: "warn" },
  new: { label: "New", tone: "neutral" },
};
const METHOD: Record<string, string> = {
  password: "Password",
  "owner-admin-password": "Owner admin password",
  invite: "Team invitation",
  google: "Google",
};
const PLAN_TONE: Record<string, BadgeTone> = { active: "success", trial: "info", lifetime: "success", "past due": "warn", cancelled: "danger", none: "neutral" };

const TABS = ["overview", "progress", "purchases", "messages", "activity", "notes", "danger"] as const;
type Tab = (typeof TABS)[number];

const ACTION_LABEL: Record<string, string> = {
  "learner.suspend": "Suspended",
  "learner.unsuspend": "Suspension lifted",
  "learner.block": "Blocked",
  "learner.unblock": "Unblocked",
  "learner.password.reset_link": "Reset link sent",
  "learner.password.temporary": "Temporary password set",
  "learner.email.verified": "Email marked verified",
  "learner.email.change": "Email changed",
  "learner.sessions.revoke": "Signed out everywhere",
  "learner.tags": "Tags changed",
  "learner.note.add": "Note added",
  "learner.note.delete": "Note deleted",
  "learner.export": "Data exported",
  "learner.delete": "Account deleted",
  "access.comp.grant": "Free access granted",
  "access.comp.revoke": "Free access revoked",
  "access.extend": "Access extended",
  "capstone.review": "Capstone reviewed",
  "comms.thread.reply": "Replied in Inbox",
};

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="a-micro">{k}</dt>
      <dd className="mt-1 break-words font-dm text-[13.5px] text-[var(--a-ink)]">{v}</dd>
    </div>
  );
}

export default async function LearnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireLearnerPage("read");
  const canManage = canManageLearners(session);
  const { id } = await params;
  const sp = await searchParams;
  const tabRaw = (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) ?? "overview";
  const tab: Tab = (TABS as readonly string[]).includes(tabRaw) ? (tabRaw as Tab) : "overview";

  const d = await loadLearnerDetail(id);
  if (!d) notFound();
  await ensureAccountTables().catch(() => {});
  const [state, notes, audits, threads, campaigns, ctx, knownTags] = await Promise.all([
    readAccountState(id),
    prisma.learnerNote.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" }, take: 200 }).catch(() => []),
    auditFor("learner", id, 100),
    threadsForLearner(id),
    campaignsForLearner(id),
    canManage ? composerContext(session.user.email) : Promise.resolve(null),
    prisma.$queryRaw<Array<{ tag: string }>>`SELECT DISTINCT unnest("tags") AS tag FROM "LearnerAccount" ORDER BY 1 LIMIT 200`.catch(() => []),
  ]);
  const [scholarships, youthMap] = await Promise.all([scholarshipsOfLearner(id, d.student.email), youthAdminInfo([id])]);
  const youth = youthMap.get(id) ?? null;
  const statusRow = await prisma.learnerAccount.findUnique({ where: { studentId: id }, select: { statusChangedAt: true, statusChangedBy: true } }).catch(() => null);

  const { student: s, plan } = d;
  const sub = d.subscription;
  const comped = sub?.status === "comped";
  const compTimed = comped && (sub?.plan === "comp_timed" || sub?.plan === "referral");
  const paidStripe = !!sub?.stripe && ["active", "trialing", "past_due"].includes(sub.status);
  const isOwnerAccount = s.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const learner: LearnerSummary = {
    id: s.id,
    name: s.name,
    email: s.email,
    locale: s.locale,
    status: state.status,
    emailVerified: !!s.emailVerified,
    comped,
    compTimed,
    paidStripe,
    isOwnerAccount,
  };
  const activeCerts = d.certificates.filter((c) => !c.revoked).length;
  const overall = d.tracks.length ? Math.round(d.tracks.reduce((n, t) => n + t.done, 0) / Math.max(1, d.tracks.reduce((n, t) => n + t.lessons, 0)) * 100) : 0;
  const unreadThreads = threads.filter((t) => t.adminUnread > 0).length;
  const hue = avatarHue(s.id);
  const base = `/admin_pro/learn/learners/${s.id}`;
  const tabHref = (t: Tab) => (t === "overview" ? base : `${base}?tab=${t}`);

  const statusBadge =
    state.status === "suspended" ? (
      <Badge tone="warn" dot>Suspended{state.suspendedUntil ? ` until ${day(state.suspendedUntil)}` : ""}</Badge>
    ) : state.status === "blocked" ? (
      <Badge tone="danger" dot>Blocked</Badge>
    ) : state.status === "deleted" ? (
      <Badge tone="neutral" dot>Deleted</Badge>
    ) : (
      <Badge tone="success" dot>Active</Badge>
    );

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="font-dm text-[12.5px] text-[var(--a-ink-3)]">
        <Link href="/admin_pro/learn" className="hover:text-[var(--a-ink)] hover:underline">Learn</Link>
        <span className="mx-1.5">/</span>
        <Link href="/admin_pro/learn/learners" className="hover:text-[var(--a-ink)] hover:underline">Learners</Link>
        <span className="mx-1.5">/</span>
        <span aria-current="page" className="text-[var(--a-ink-2)]">{s.name}</span>
      </nav>

      {/* Profile header */}
      <section className="relative overflow-hidden rounded-[var(--a-radius-hero)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
        <div aria-hidden className="h-16 bg-[linear-gradient(120deg,#0D1B2A_0%,#1B3A6B_60%,#2a4f8a_100%)]">
          <div className="h-full w-full bg-[radial-gradient(circle_at_85%_20%,rgba(244,124,32,.35),transparent_45%)]" />
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span
                aria-hidden
                className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] font-syne text-[28px] font-bold text-white shadow-[0_6px_18px_rgba(13,27,42,.18)] ring-4 ring-[var(--a-surface)]"
                style={{ background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 32%))` }}
              >
                {initials(s.name)}
              </span>
              <div className="min-w-0 pt-3">
                <h1 className="truncate font-syne text-[24px] font-bold leading-tight text-[var(--a-ink)] sm:text-[26px]">{s.name}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-dm text-[13.5px] text-[var(--a-ink-3)]">
                  <a href={`mailto:${s.email}`} className="truncate hover:text-[var(--a-blue)] hover:underline">{s.email}</a>
                  <span aria-hidden>·</span>
                  <span>{LANG[s.locale] ?? s.locale}</span>
                  <span aria-hidden>·</span>
                  <span>Joined {day(s.createdAt)}</span>
                </p>
              </div>
            </div>
            {canManage && ctx ? <div className="sm:pt-3"><LearnerHeaderActions learner={learner} composer={ctx} /></div> : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Status">
            {statusBadge}
            <Badge tone={PLAN_TONE[plan.status] ?? "neutral"}>{plan.labels.join(" · ")}</Badge>
            {s.emailVerified ? <Badge tone="info">Email verified</Badge> : <Badge tone="warn">Email unverified</Badge>}
            {state.mustChangePassword ? <Badge tone="warn">Must change password</Badge> : null}
            {state.marketingOptOut ? <Badge tone="neutral">Unsubscribed from news</Badge> : null}
            {isOwnerAccount ? <Badge tone="orange">Owner account</Badge> : null}
            {scholarships.some((x) => x.status === "claimed") ? <Badge tone="orange" dot>Tilo Vision Scholar</Badge> : null}
            {state.tags.map((t) => (
              <Badge key={t} tone="orange">#{t}</Badge>
            ))}
          </div>

          {state.status === "suspended" || state.status === "blocked" ? (
            <div
              className={cn(
                "mt-4 flex gap-3 rounded-[12px] border px-4 py-3",
                state.status === "blocked" ? "border-[#f6cccc] bg-[var(--a-danger-bg)]" : "border-[#f7dcb5] bg-[var(--a-warn-bg)]",
              )}
              role="status"
            >
              {state.status === "blocked" ? <Ban size={18} className="mt-0.5 shrink-0 text-[var(--a-danger)]" aria-hidden /> : <PauseCircle size={18} className="mt-0.5 shrink-0 text-[var(--a-warn)]" aria-hidden />}
              <div className="min-w-0 font-dm text-[13px]">
                <p className="font-semibold text-[var(--a-ink)]">
                  {state.status === "blocked" ? "Blocked: cannot sign in or sign up again with this email." : state.suspendedUntil ? `Suspended until ${dt(state.suspendedUntil)}.` : "Suspended until lifted."}
                </p>
                {state.statusReason ? <p className="mt-0.5 text-[var(--a-ink-2)]">Reason shown to the learner: “{state.statusReason}”</p> : null}
                {statusRow?.statusChangedAt ? (
                  <p className="mt-0.5 text-[var(--a-ink-3)]">By {statusRow.statusChangedBy ?? "an admin"}, {dt(statusRow.statusChangedAt)}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Progress" value={d.tracks.length ? `${overall}%` : "None"} hint={`${d.tracks.length} track${d.tracks.length === 1 ? "" : "s"} started`} icon={BookOpen} tone="navy" />
        <StatCard label="Total XP" value={d.xp.total.toLocaleString("en")} spark={d.xp.weeks.map((w) => w.points)} hint="last 12 weeks" icon={Flame} tone="orange" />
        <StatCard label="Logins (30 days)" value={d.logins.last30} hint={s.lastLoginAt ? `Last ${ago(s.lastLoginAt)}` : "Never signed in"} icon={LogIn} />
        <StatCard label="Certificates" value={activeCerts} hint={d.certificates.length > activeCerts ? `${d.certificates.length - activeCerts} revoked` : undefined} icon={Award} tone="success" />
        <StatCard label="Messages" value={threads.length} hint={unreadThreads ? `${unreadThreads} awaiting reply` : `${campaigns.length} received`} icon={Inbox} tone={unreadThreads ? "warn" : "default"} href={tabHref("messages")} />
      </div>

      <div className="border-b border-[var(--a-border)]">
        <Tabs
          ariaLabel="Learner sections"
          active={tabHref(tab)}
          items={[
            { label: "Overview", href: tabHref("overview") },
            { label: "Progress", href: tabHref("progress"), count: d.tracks.length },
            { label: "Purchases", href: tabHref("purchases"), count: d.purchases.length + (sub ? 1 : 0) },
            { label: "Messages", href: tabHref("messages"), count: threads.length + campaigns.filter((c) => !c.recipient.threadId).length },
            { label: "Activity", href: tabHref("activity"), count: d.logins.total },
            { label: "Notes", href: tabHref("notes"), count: notes.length },
            ...(canManage ? [{ label: "Danger zone", href: tabHref("danger") }] : []),
          ]}
        />
      </div>

      {tab === "overview" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            {youth && (
              <YouthCard
                learnerId={id}
                canManage={canManage}
                info={{
                  ...youth,
                  parentEmailSentAt: youth.parentEmailSentAt?.toISOString() ?? null,
                  deleteRequestedAt: youth.deleteRequestedAt?.toISOString() ?? null,
                }}
              />
            )}
            <Card title="Profile and plan" icon={GraduationCap}>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field k="Email verified" v={s.emailVerified ? day(s.emailVerified) : "No"} />
                <Field k="Last login" v={dt(s.lastLoginAt)} />
                <Field k="Language" v={LANG[s.locale] ?? s.locale} />
                <Field k="Plan" v={plan.labels.join(" · ")} />
                <Field k="Plan status" v={plan.status === "none" ? "None" : human(plan.status)} />
                <Field k="Portfolio" v={d.portfolio ? (d.portfolio.isPublic ? "Public" : "Private") : "Not set up"} />
                <Field k="Leaderboard" v={s.leaderboardOptIn ? "Opted in" : "Not opted in"} />
                <Field k="Accessibility mode" v={s.accessibilityMode ? "On" : "Off"} />
                <Field k="News emails" v={state.marketingOptOut ? "Unsubscribed" : "Subscribed"} />
              </dl>
              <div className="mt-5 border-t border-[var(--a-border)] pt-4">
                <p className="a-micro">Team</p>
                {d.teams.length || d.ownedTeams.length ? (
                  <ul className="mt-2 space-y-1 font-dm text-[13.5px] text-[var(--a-ink-2)]">
                    {d.teams.map((t) => (
                      <li key={t.teamId}>
                        <Link href={`/admin_pro/learn/teams/${t.teamId}`} className="font-semibold text-[var(--a-blue)] hover:underline">{t.name}</Link> · {human(t.role)} · seat {t.status} · team {t.comped ? "comped" : t.teamStatus}
                      </li>
                    ))}
                    {d.ownedTeams.filter((o) => !d.teams.some((t) => t.teamId === o.id)).map((o) => (
                      <li key={o.id}>
                        Owns <Link href={`/admin_pro/learn/teams/${o.id}`} className="font-semibold text-[var(--a-blue)] hover:underline">{o.name}</Link> · {o.seats} seats · {o.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 font-dm text-[13.5px] text-[var(--a-ink-3)]">Not on a team.</p>
                )}
              </div>
            </Card>

            {scholarships.length > 0 && (
              <Card
                title="Tilo Vision Scholarship"
                icon={Award}
                action={<Link href={`/admin_pro/learn/scholarships?q=${encodeURIComponent(s.email)}`} className="font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">Manage</Link>}
              >
                <ul className="space-y-4">
                  {scholarships.map((x) => (
                    <li key={x.id}>
                      <div className="flex flex-wrap items-center gap-2 font-dm text-[13.5px]">
                        <span className="font-mono text-[12px] text-[var(--a-ink-3)]">{x.code}</span>
                        <Badge tone={x.status === "claimed" ? "success" : x.status === "revoked" ? "danger" : x.status === "draft" ? "warn" : "info"}>
                          {x.status === "claimed" ? "Accepted" : x.status === "approved" ? (x.expired ? "Offer expired" : "Sent, waiting") : x.status === "draft" ? "Draft" : "Revoked"}
                        </Badge>
                      </div>
                      <dl className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Field k="Coverage" v={x.coveragePct >= 100 ? "100% (free)" : `${x.coveragePct}%`} />
                        <Field k="Tracks chosen" v={`${x.picks.length} of ${x.trackCount}`} />
                        <Field k="Value covered" v={money(x.coveredCents, "usd")} />
                        <Field k="Accepted" v={x.claimedAt ? day(x.claimedAt) : "Not yet"} />
                      </dl>
                      {x.picks.length > 0 && (
                        <ul className="mt-2 space-y-1 font-dm text-[13px] text-[var(--a-ink-2)]">
                          {x.picks.map((p) => (
                            <li key={p.trackId}>
                              <span className="font-semibold text-[var(--a-ink)]">{p.trackTitle}</span> · {p.paidCents ? `paid ${money(p.paidCents, "usd")}` : "free"} · {p.lessonsDone}/{p.lessonsTotal} lessons
                              {p.examBest != null ? ` · best exam ${p.examBest}%` : ""}
                              {p.certificate ? " · certificate issued" : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card title="Learning at a glance" icon={Sparkles}>
              {d.tracks.length === 0 ? (
                <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">No track started yet.</p>
              ) : (
                <ul className="space-y-3">
                  {d.tracks.map((t) => (
                    <li key={t.id}>
                      <div className="flex items-baseline justify-between gap-3 font-dm text-[13.5px]">
                        <span className="min-w-0 truncate font-semibold text-[var(--a-ink)]">{t.title}</span>
                        <span className="shrink-0 tabular-nums text-[var(--a-ink-2)]">{t.done}/{t.lessons} · {t.percent}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--a-surface-2)]">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#1B3A6B,#2251A3)]" style={{ width: `${t.percent}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--a-border)] pt-4 sm:grid-cols-4">
                <Field k="Review cards" v={`${d.review.cards} (${d.review.due} due)`} />
                <Field k="Review days" v={d.review.sessions} />
                <Field k="Studio challenges" v={d.studio.done} />
                <Field k="Tutor messages" v={`${d.tutor.messages} in ${d.tutor.threads}`} />
              </dl>
            </Card>
          </div>

          <div className="min-w-0 space-y-5">
            <Card title="Tags" subtitle="Filter and message learners by tag.">
              <TagsEditor learnerId={s.id} tags={state.tags} known={knownTags.map((k) => k.tag)} canManage={canManage && state.status !== "deleted"} />
            </Card>
            <Card title="Latest notes" action={<Link href={tabHref("notes")} className="font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">All notes</Link>}>
              {notes.length === 0 ? (
                <p className="font-dm text-[13px] text-[var(--a-ink-3)]">No notes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.slice(0, 3).map((n) => (
                    <li key={n.id} className="font-dm text-[13px]">
                      <p className="line-clamp-3 whitespace-pre-wrap text-[var(--a-ink-2)]">{n.body}</p>
                      <p className="mt-0.5 text-[12px] text-[var(--a-ink-3)]">{n.authorName || n.authorEmail} · {ago(n.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Recent admin activity" action={<Link href={`/admin_pro/audit?target=${s.id}`} className="font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">Audit log</Link>}>
              {audits.length === 0 ? (
                <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Nothing yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {audits.slice(0, 5).map((a) => (
                    <li key={a.id} className="font-dm text-[13px]">
                      <p className="font-semibold text-[var(--a-ink)]">{ACTION_LABEL[a.action] ?? a.action}</p>
                      <p className="text-[12px] text-[var(--a-ink-3)]">{a.actorName || a.actorEmail} · {ago(a.at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "progress" ? (
        <div className="space-y-5">
          <Card title={`Tracks (${d.tracks.length})`} icon={BookOpen}>
            {d.tracks.length === 0 ? (
              <EmptyState icon={BookOpen} title="No track started yet" body="Progress, placement checks, quizzes and labs appear here." compact />
            ) : (
              <div className="space-y-5">
                {d.tracks.map((t) => (
                  <TrackBlock key={t.id} t={t} />
                ))}
              </div>
            )}
          </Card>
          <Assessments studentId={s.id} />
          <Card title="Certificates" icon={Award}>
            {d.certificates.length === 0 ? (
              <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">None yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--a-border)]">
                {d.certificates.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 font-dm text-[13.5px]">
                    <span className={c.revoked ? "text-[var(--a-ink-3)] line-through" : "text-[var(--a-ink)]"}>
                      <strong>{c.certificateName}</strong> · {c.track} · {day(c.issuedAt)}
                      {c.examScore != null && ` · exam ${c.examScore}%`}
                      {c.distinction && " · distinction"}
                    </span>
                    <span className="flex items-center gap-2">
                      {c.revoked ? <Badge tone="danger">Revoked</Badge> : <Badge tone="success">Valid</Badge>}
                      <Link href={`/certificates/${c.verificationId}`} target="_blank" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">
                        Verify page <ExternalLink size={12} aria-hidden />
                      </Link>
                      {canManage ? <CertificateRevoke id={c.id} revoked={c.revoked} /> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={`XP (${d.xp.total.toLocaleString("en")} total)`} icon={Flame}>
            <XpChart weeks={d.xp.weeks} />
            {d.xp.bySource.length > 0 ? (
              <table className="mt-4 w-full font-dm text-[13px]">
                <tbody className="divide-y divide-[var(--a-border)]">
                  {d.xp.bySource.map((r) => (
                    <tr key={r.source}>
                      <td className="py-1.5 text-[var(--a-ink-2)]">{human(r.source)}</td>
                      <td className="py-1.5 text-right tabular-nums text-[var(--a-ink-3)]">{r.count}×</td>
                      <td className="py-1.5 text-right font-semibold tabular-nums text-[var(--a-ink)]">{r.points.toLocaleString("en")} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </Card>
        </div>
      ) : null}

      {tab === "purchases" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            <Card
              title="Subscription"
              icon={CreditCard}
              action={
                sub?.stripeCustomerId ? (
                  <a
                    href={`https://dashboard.stripe.com/customers/${encodeURIComponent(sub.stripeCustomerId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline"
                  >
                    Open in Stripe <ExternalLink size={12} aria-hidden />
                  </a>
                ) : null
              }
            >
              {sub ? (
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field k="Plan" v={sub.status === "comped" ? (compTimed ? "Free access (timed)" : "Free access (comped)") : sub.plan === "annual" ? "Annual (legacy)" : "Monthly"} />
                  <Field k="Status" v={<>{human(sub.status)}{sub.cancelAtPeriodEnd ? " (cancels at period end)" : ""}</>} />
                  <Field k="Started" v={day(sub.createdAt)} />
                  <Field k={compTimed ? "Free access ends" : "Current period ends"} v={day(sub.currentPeriodEnd)} />
                  {sub.graceUntil ? <Field k="Grace until" v={day(sub.graceUntil)} /> : null}
                  <Field k="Last change" v={day(sub.updatedAt)} />
                  <Field k="Stripe customer" v={sub.stripeCustomerId ? <code className="font-mono text-[12.5px]">{sub.stripeCustomerId}</code> : "None"} />
                  <Field k="Stripe subscription" v={sub.stripeSubscriptionId ? <code className="font-mono text-[12.5px]">{sub.stripeSubscriptionId}</code> : "None"} />
                </dl>
              ) : (
                <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">No subscription.</p>
              )}
            </Card>
            <Card title="Tracks bought" icon={GraduationCap}>
              {d.purchases.length ? (
                <div className={tableStyles.wrap}>
                  <table className={tableStyles.table}>
                    <thead className={tableStyles.thead}>
                      <tr>
                        <th className={tableStyles.th}>Track</th>
                        <th className={cn(tableStyles.th, "text-right")}>Amount</th>
                        <th className={tableStyles.th}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.purchases.map((p) => (
                        <tr key={p.id} className={tableStyles.tr}>
                          <td className={cn(tableStyles.td, "font-medium text-[var(--a-ink)]")}>{p.track}</td>
                          <td className={cn(tableStyles.td, "text-right tabular-nums")}>{money(p.amountCents, p.currency)}</td>
                          <td className={tableStyles.td}>{day(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">None.</p>
              )}
            </Card>
          </div>
          <Card title="Access" subtitle="Free access is the same comp as Admin, Test access. Nothing is charged.">
            {canManage && state.status !== "deleted" ? (
              <div className="flex flex-col gap-2">
                {!comped && !paidStripe ? <ActionButton kind="grantComp" learner={learner} label="Grant free access" variant="primary" /> : null}
                {comped ? <ActionButton kind="revokeComp" learner={learner} label={compTimed ? "End free access now" : "Revoke free access"} variant="secondary" /> : null}
                {!paidStripe && !(comped && !compTimed) ? <ActionButton kind="extendAccess" learner={learner} label="Extend access by days" variant="secondary" /> : null}
                {paidStripe ? <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">Paid through Stripe: change the billing there.</p> : null}
              </div>
            ) : (
              <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Only the owner or an admin can change access.</p>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "messages" ? (
        <div className="space-y-5">
          <Card title="Conversations" icon={MessageSquare} subtitle="In-app Inbox threads with this learner. Replies also reach arfa_edu@tiblogics.com.">
            {threads.length === 0 ? (
              <EmptyState icon={Inbox} title="No conversations yet" body="Use Message at the top of the page to write to this learner." compact />
            ) : (
              <div className="space-y-6">
                {threads.map((th) => (
                  <details key={th.id} open={th === threads[0]} className="group rounded-[var(--a-radius-card)] border border-[var(--a-border)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                      <span className="min-w-0">
                        <span className="block truncate font-dm text-[14px] font-semibold text-[var(--a-ink)]">{th.subject}</span>
                        <span className="block truncate font-dm text-[12.5px] text-[var(--a-ink-3)]">
                          {th.messages.length} message{th.messages.length === 1 ? "" : "s"} · last {ago(th.lastMessageAt)} · {plainPreview(th.messages[th.messages.length - 1]?.body ?? "", 80)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {th.adminUnread > 0 ? <Badge tone="orange" dot>Awaiting reply</Badge> : null}
                        {th.learnerUnread > 0 ? <Badge tone="neutral">Unread by learner</Badge> : null}
                        {th.status === "closed" ? <Badge tone="neutral">Closed</Badge> : null}
                      </span>
                    </summary>
                    <div className="border-t border-[var(--a-border)] p-4">
                      <Conversation
                        threadId={th.id}
                        status={th.status}
                        learnerName={s.name}
                        canManage={canManage && state.status !== "deleted"}
                        compact
                        messages={th.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
                      />
                    </div>
                  </details>
                ))}
              </div>
            )}
          </Card>
          <Card title="Messages received" icon={Mail} subtitle="Every send from the communications center, with its outcome. Opens are not tracked.">
            {campaigns.length === 0 ? (
              <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">None yet.</p>
            ) : (
              <div className={tableStyles.wrap}>
                <table className={tableStyles.table}>
                  <thead className={tableStyles.thead}>
                    <tr>
                      <th className={tableStyles.th}>Subject</th>
                      <th className={tableStyles.th}>Type</th>
                      <th className={tableStyles.th}>Channels</th>
                      <th className={tableStyles.th}>Outcome</th>
                      <th className={tableStyles.th}>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(({ recipient: r, campaign: c }) => (
                      <tr key={r.id} className={tableStyles.tr}>
                        <td className={cn(tableStyles.td, "font-medium text-[var(--a-ink)]")}>
                          <Link href={`/admin_pro/communications/${c.id}`} className="hover:underline">{c.subject}</Link>
                        </td>
                        <td className={tableStyles.td}><Badge tone={c.kind === "marketing" ? "orange" : "info"}>{c.kind === "marketing" ? "Marketing" : "Service"}</Badge></td>
                        <td className={tableStyles.td}>{[c.viaEmail && (r.emailed ? "Email" : "Email (not sent)"), c.viaInbox && (r.threadId ? "Inbox" : "Inbox (not sent)")].filter(Boolean).join(", ")}</td>
                        <td className={tableStyles.td}>
                          <Badge tone={r.status === "sent" ? "success" : r.status === "failed" ? "danger" : r.status === "skipped" ? "neutral" : "info"}>{human(r.status)}</Badge>
                          {r.error ? <span className="ml-2 font-dm text-[12px] text-[var(--a-ink-3)]">{r.error}</span> : null}
                        </td>
                        <td className={cn(tableStyles.td, "whitespace-nowrap")}>{r.sentAt ? dt(r.sentAt) : `Scheduled ${dt(c.scheduledAt)}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "activity" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card title={`Sign-ins (${d.logins.total})`} icon={LogIn} padded={false}>
            {!d.logins.ready ? (
              <p className="p-5 font-dm text-[13.5px] text-[var(--a-warn)]">The sign-in table could not be created. Check the database connection.</p>
            ) : d.logins.recent.length === 0 ? (
              <EmptyState icon={LogIn} title="No sign-ins recorded yet" body={s.lastLoginAt ? `Last login before tracking began: ${dt(s.lastLoginAt)}` : undefined} compact />
            ) : (
              <div className="overflow-x-auto">
                <table className={tableStyles.table}>
                  <thead className={tableStyles.thead}>
                    <tr>
                      <th className={tableStyles.th}>Time</th>
                      <th className={tableStyles.th}>Device</th>
                      <th className={tableStyles.th}>Country</th>
                      <th className={tableStyles.th}>Network</th>
                      <th className={tableStyles.th}>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.logins.recent.map((l) => (
                      <tr key={l.id} className={tableStyles.tr}>
                        <td className={cn(tableStyles.td, "whitespace-nowrap")}>{dt(l.at)}</td>
                        <td className={tableStyles.td} title={l.userAgent ?? ""}>{deviceLabel(l)}</td>
                        <td className={tableStyles.td}>{l.country ?? "Unknown"}</td>
                        <td className={cn(tableStyles.td, "font-mono text-[12px]")}>{l.ipPrefix ?? "Unknown"}</td>
                        <td className={tableStyles.td}>{METHOD[l.method] ?? l.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card title="Admin actions" icon={Activity} action={<Link href={`/admin_pro/audit?target=${s.id}`} className="font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">Full audit log</Link>}>
            {audits.length === 0 ? (
              <p className="font-dm text-[13px] text-[var(--a-ink-3)]">No admin action on this learner yet.</p>
            ) : (
              <ol className="relative space-y-4 before:absolute before:bottom-1 before:left-[5px] before:top-1 before:w-px before:bg-[var(--a-border)]">
                {audits.map((a) => (
                  <li key={a.id} className="relative pl-5 font-dm text-[13px]">
                    <span aria-hidden className={cn("absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ring-2 ring-[var(--a-surface)]", /block|delete|revoke|suspend/.test(a.action) && !/unblock|unsuspend/.test(a.action) ? "bg-[var(--a-danger)]" : "bg-[var(--a-blue)]")} />
                    <p className="font-semibold text-[var(--a-ink)]">{ACTION_LABEL[a.action] ?? a.action}</p>
                    <p className="text-[12px] text-[var(--a-ink-3)]">{a.actorName || a.actorEmail} · {dt(a.at)}</p>
                    {a.meta && typeof a.meta === "object" && "reason" in a.meta && a.meta.reason ? (
                      <p className="mt-0.5 text-[12.5px] text-[var(--a-ink-2)]">“{String(a.meta.reason)}”</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "notes" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card title="Private notes" subtitle="Visible to staff only. Every change is in the audit log.">
            <NotesPanel
              learnerId={s.id}
              canManage={canManage && state.status !== "deleted"}
              notes={notes.map((n) => ({ id: n.id, authorEmail: n.authorEmail, authorName: n.authorName, body: n.body, createdAt: n.createdAt.toISOString() }))}
            />
          </Card>
          <Card title="Tags">
            <TagsEditor learnerId={s.id} tags={state.tags} known={knownTags.map((k) => k.tag)} canManage={canManage && state.status !== "deleted"} />
          </Card>
        </div>
      ) : null}

      {tab === "danger" && canManage ? (
        <div className="space-y-4">
          <DangerRow
            icon={state.status === "blocked" ? Undo2 : Ban}
            title={state.status === "blocked" ? "Unblock this account" : "Block this account"}
            body={
              state.status === "blocked"
                ? "Lets the learner sign in again and sign up with this email."
                : "Permanent ban: signs the learner out, refuses password and Google sign-in, and refuses a new sign-up with the same email."
            }
            action={
              isOwnerAccount || state.status === "deleted" ? null : state.status === "blocked" ? (
                <ActionButton kind="unblock" learner={learner} label="Unblock" />
              ) : (
                <ActionButton kind="block" learner={learner} label="Block learner" variant="danger" />
              )
            }
          />
          <DangerRow
            icon={KeyRound}
            title="Reset access to the account"
            body="Signs out every device, or sets a temporary password the learner must change at the next sign-in."
            action={
              state.status === "deleted" ? null : (
                <div className="flex flex-wrap gap-2">
                  <ActionButton kind="signOutEverywhere" learner={learner} label="Sign out everywhere" />
                  {!isOwnerAccount ? <ActionButton kind="tempPassword" learner={learner} label="Temporary password" /> : null}
                </div>
              )
            }
          />
          <DangerRow
            icon={ShieldAlert}
            title="Export this learner's data"
            body="A JSON file with the profile, progress, attempts, certificates, purchases and messages, for a GDPR or PIPEDA access request. Never includes passwords."
            action={
              <a href={`/api/admin/learn/learners/${s.id}/export`} className="inline-flex h-9 items-center gap-2 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-4 font-dm text-sm font-semibold text-[var(--a-ink)] hover:bg-[var(--a-surface-2)]">
                Download JSON
              </a>
            }
          />
          <DangerRow
            icon={Trash2}
            danger
            title="Delete this account"
            body="Anonymises the learner: personal data and content are removed; payments and certificate verification records are kept without personal data. Cannot be undone."
            action={isOwnerAccount || state.status === "deleted" ? <Badge tone="neutral">{state.status === "deleted" ? "Already deleted" : "Owner account"}</Badge> : <ActionButton kind="delete" learner={learner} label="Delete account" variant="danger" />}
          />
        </div>
      ) : null}
    </div>
  );
}

function DangerRow({ icon: Icon, title, body, action, danger }: { icon: React.ElementType; title: string; body: string; action: React.ReactNode; danger?: boolean }) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[var(--a-radius-card)] border bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)] sm:flex-row sm:items-center sm:justify-between",
        danger ? "border-[#f6cccc]" : "border-[var(--a-border)]",
      )}
    >
      <div className="flex min-w-0 gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", danger ? "bg-[var(--a-danger-bg)] text-[var(--a-danger)]" : "bg-[var(--a-surface-2)] text-[var(--a-ink-2)]")} aria-hidden>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <h3 className={cn("font-dm text-[14.5px] font-semibold", danger ? "text-[var(--a-danger)]" : "text-[var(--a-ink)]")}>{title}</h3>
          <p className="mt-0.5 max-w-xl font-dm text-[13px] text-[var(--a-ink-3)]">{body}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </section>
  );
}

function XpChart({ weeks }: { weeks: Array<{ start: Date; points: number }> }) {
  const max = Math.max(1, ...weeks.map((w) => w.points));
  return (
    <div>
      <div className="flex h-28 items-end gap-1.5" role="img" aria-label={`XP per week, last 12 weeks: ${weeks.map((w) => w.points).join(", ")}`}>
        {weeks.map((w, i) => (
          <div key={w.start.toISOString()} className="flex h-full flex-1 flex-col justify-end" title={`Week of ${day(w.start)}: ${w.points} XP`}>
            <div
              className={cn("w-full rounded-t-[5px]", i === weeks.length - 1 ? "bg-[var(--a-orange)]" : "bg-[var(--a-navy)]/80")}
              style={{ height: `${Math.round((w.points / max) * 100)}%`, minHeight: w.points ? 3 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-dm text-[11px] text-[var(--a-ink-3)]">
        <span>{day(weeks[0].start)}</span>
        <span>This week</span>
      </div>
    </div>
  );
}

function TrackBlock({ t }: { t: TrackDetail }) {
  return (
    <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 font-dm text-[14.5px] font-semibold text-[var(--a-ink)]">
          {t.title}
          {t.purchased ? <Badge tone="success">Bought</Badge> : null}
        </h3>
        <p className="font-dm text-[13px] font-semibold tabular-nums text-[var(--a-ink)]">
          {t.done}/{t.lessons} lessons · {t.percent}%
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--a-surface-2)]">
        <div className="h-full rounded-full bg-[var(--a-success)]" style={{ width: `${t.percent}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-dm text-[12.5px] text-[var(--a-ink-3)]">
        <span>
          <CalendarClock size={12} className="mr-1 inline" aria-hidden />
          Placement:{" "}
          {t.diagnostic ? (t.diagnostic.status === "completed" ? `done ${day(t.diagnostic.completedAt)}` : `${t.diagnostic.status.replace("_", " ")} (started ${day(t.diagnostic.startedAt)})`) : "not taken"}
        </span>
        <span>Final exam: {t.exam ? `${t.exam.attempts} attempt${t.exam.attempts === 1 ? "" : "s"}, best ${t.exam.best ?? "none"}%${t.exam.passed ? ", passed" : ""}` : "not attempted"}</span>
        <span>Capstone: {t.capstone ? `${human(t.capstone.status)}${t.capstone.score != null ? ` (${t.capstone.score})` : ""}, ${day(t.capstone.at)}` : "not submitted"}</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full font-dm text-[13px]">
          <thead>
            <tr className="border-b border-[var(--a-border)] text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
              <th className="pb-2 pr-3 font-semibold">Module</th>
              <th className="pb-2 pr-3 font-semibold">Placement</th>
              <th className="pb-2 pr-3 text-right font-semibold">Lessons</th>
              <th className="pb-2 pr-3 font-semibold">Quiz</th>
              <th className="pb-2 pr-3 font-semibold">Labs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--a-border)]">
            {t.modules.map((m) => (
              <tr key={m.id} className="align-top">
                <td className="py-2 pr-3 text-[var(--a-ink)]">{m.title}</td>
                <td className="py-2 pr-3">
                  {m.placement ? (
                    <span title={`Updated ${dt(m.placement.at)}`} className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={LEVEL[m.placement.level]?.tone ?? "neutral"}>{LEVEL[m.placement.level]?.label ?? m.placement.level}</Badge>
                      <span className="text-[12px] text-[var(--a-ink-3)]">{m.placement.correct}/{m.placement.asked} · {m.placement.score}%</span>
                    </span>
                  ) : (
                    <span className="text-[var(--a-ink-3)]">None</span>
                  )}
                </td>
                <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums text-[var(--a-ink-2)]">
                  {m.lessons ? `${m.done}/${m.lessons}` : "None"}
                  {m.mastered > 0 ? <span className="text-[12px] text-[var(--a-ink-3)]"> ({m.mastered} tested out)</span> : null}
                </td>
                <td className="py-2 pr-3 text-[var(--a-ink-2)]">
                  {m.quiz ? `best ${m.quiz.best ?? 0}% · ${m.quiz.attempts}×${m.quiz.passed ? " · passed" : ""}` : <span className="text-[var(--a-ink-3)]">None</span>}
                </td>
                <td className="py-2 pr-3 text-[12.5px] text-[var(--a-ink-2)]">
                  {m.labs.length ? m.labs.map((l) => (
                    <p key={l.title}>
                      {l.title}: {l.passed ? "passed" : human(l.status)}
                      {l.score != null && ` (${l.score})`}
                    </p>
                  )) : <span className="text-[var(--a-ink-3)]">None</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
