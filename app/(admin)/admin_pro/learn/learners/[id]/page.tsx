import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { loadLearnerDetail, type TrackDetail } from "@/lib/learn/admin/learner-detail";
import { deviceLabel } from "@/lib/learn/logins";
import { AccessActions, CertificateRevoke } from "./LearnerActions";

export const dynamic = "force-dynamic";

// One TIBLOGICS Learn learner: plan, placement, progress per track and module,
// certificates, XP, Daily Review, Studio, Tutor usage (a count only) and
// sign-in history. No drafts, reflections or Tutor conversations.

const LANG: Record<string, string> = { en: "English", fr: "French", sw: "Swahili" };
const LEVEL: Record<string, { label: string; cls: string }> = {
  mastered: { label: "Mastered", cls: "bg-green-50 text-green-700" },
  partial: { label: "Partly", cls: "bg-amber-50 text-amber-800" },
  new: { label: "New", cls: "bg-[var(--s2)] text-[var(--ink3)]" },
};
const METHOD: Record<string, string> = {
  password: "Password",
  "owner-admin-password": "Owner admin password",
  invite: "Team invitation",
  google: "Google",
};

const dt = (d: Date | null | undefined) =>
  d ? d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC" : "—";
const day = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
const money = (cents: number, cur: string) => `${cur.toLowerCase() === "usd" ? "$" : cur.toUpperCase() + " "}${(cents / 100).toFixed(2)}`;
const human = (s: string) => s.replace(/[_-]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[var(--ink)]">{title}</h2>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{k}</dt>
      <dd className="mt-0.5 text-sm text-[var(--ink)]">{v}</dd>
    </div>
  );
}

export default async function LearnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPage();
  // Learner PII: the Learn ("events") permission, as in the sidebar.
  if (!(session.user.isAdmin || session.user.permissions?.some((p) => p === "*" || p === "events"))) redirect("/admin_pro");
  const { id } = await params;
  const d = await loadLearnerDetail(id);
  if (!d) notFound();
  const { student: s, plan } = d;
  const comped = d.subscription?.status === "comped";
  const maxWeek = Math.max(1, ...d.xp.weeks.map((w) => w.points));

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin_pro/learn/learners" className="text-sm text-[var(--blue2)] hover:underline">
          ← Learners
        </Link>
        <h1 className="mt-2 text-2xl font-black text-[var(--ink)]">{s.name}</h1>
        <p className="mt-1 text-sm text-[var(--ink3)]">
          {s.email} · signed up {dt(s.createdAt)} · {LANG[s.locale] ?? s.locale}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Plan", plan.labels.join(" · ")],
          ["Status", plan.status === "none" ? "—" : human(plan.status)],
          ["Total XP", d.xp.total.toLocaleString("en")],
          ["Logins (30 days)", d.logins.last30],
          ["Certificates", d.certificates.filter((c) => !c.revoked).length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{label}</p>
            <p className="mt-1 text-lg font-black text-[var(--ink)]">{value}</p>
          </div>
        ))}
      </div>

      <Card
        title="Profile and plan"
        right={<AccessActions email={s.email} comped={comped} canGrant={!!(session.user.isOwner || session.user.isAdmin)} />}
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field k="Email verified" v={s.emailVerified ? day(s.emailVerified) : "No"} />
          <Field k="Last login" v={dt(s.lastLoginAt)} />
          <Field k="Logins (all, last 400 days)" v={d.logins.total} />
          <Field k="Portfolio" v={d.portfolio ? (d.portfolio.isPublic ? "Public" : "Private") : "Not set up"} />
          <Field k="Leaderboard" v={s.leaderboardOptIn ? "Opted in" : "Not opted in"} />
          <Field k="Accessibility mode" v={s.accessibilityMode ? "On" : "Off"} />
        </dl>

        <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">Subscription</h3>
        {d.subscription ? (
          <dl className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field k="Plan" v={d.subscription.status === "comped" ? "Comped (free access)" : d.subscription.plan === "annual" ? "Annual (legacy)" : "Monthly"} />
            <Field k="Status" v={`${human(d.subscription.status)}${d.subscription.cancelAtPeriodEnd ? " (cancels at period end)" : ""}`} />
            <Field k="Started" v={day(d.subscription.createdAt)} />
            <Field k="Current period ends" v={day(d.subscription.currentPeriodEnd)} />
            {d.subscription.graceUntil && <Field k="Grace until" v={day(d.subscription.graceUntil)} />}
            <Field k="Last change" v={day(d.subscription.updatedAt)} />
            <Field k="Billing" v={d.subscription.stripe ? "Stripe" : "No Stripe subscription"} />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-[var(--ink3)]">No subscription.</p>
        )}

        <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">Tracks bought (one-time)</h3>
        {d.purchases.length ? (
          <ul className="mt-2 space-y-1 text-sm text-[var(--ink2)]">
            {d.purchases.map((p) => (
              <li key={p.id}>
                {p.track} · {money(p.amountCents, p.currency)} · {day(p.createdAt)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--ink3)]">None.</p>
        )}

        <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">Team</h3>
        {d.teams.length || d.ownedTeams.length ? (
          <ul className="mt-2 space-y-1 text-sm text-[var(--ink2)]">
            {d.teams.map((t) => (
              <li key={t.teamId}>
                <Link href={`/admin_pro/learn/teams/${t.teamId}`} className="font-semibold text-[var(--blue2)] underline">{t.name}</Link>{" "}
                · {human(t.role)} · seat {t.status} · team {t.comped ? "comped" : t.teamStatus}
                {t.joinedAt && ` · joined ${day(t.joinedAt)}`}
              </li>
            ))}
            {d.ownedTeams
              .filter((o) => !d.teams.some((t) => t.teamId === o.id))
              .map((o) => (
                <li key={o.id}>
                  Owns <Link href={`/admin_pro/learn/teams/${o.id}`} className="font-semibold text-[var(--blue2)] underline">{o.name}</Link> · {o.seats} seats · {o.status}
                </li>
              ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--ink3)]">Not on a team.</p>
        )}
      </Card>

      <Card title={`Progress and placement (${d.tracks.length} track${d.tracks.length === 1 ? "" : "s"})`}>
        {d.tracks.length === 0 ? (
          <p className="text-sm text-[var(--ink3)]">No track started yet.</p>
        ) : (
          <div className="space-y-6">
            {d.tracks.map((t) => (
              <TrackBlock key={t.id} t={t} />
            ))}
          </div>
        )}
      </Card>

      <Card title="Certificates">
        {d.certificates.length === 0 ? (
          <p className="text-sm text-[var(--ink3)]">None yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {d.certificates.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                <span className={c.revoked ? "text-[var(--ink3)] line-through" : "text-[var(--ink)]"}>
                  <strong>{c.certificateName}</strong> · {c.track} · {day(c.issuedAt)}
                  {c.examScore != null && ` · exam ${c.examScore}%`}
                  {c.distinction && " · distinction"}
                </span>
                <span className="flex items-center gap-3">
                  <Link href={`/certificates/${c.verificationId}`} target="_blank" className="text-xs font-semibold text-[var(--blue2)] underline">
                    Verify page
                  </Link>
                  <CertificateRevoke id={c.id} revoked={c.revoked} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`XP (${d.xp.total.toLocaleString("en")} total)`}>
          <p className="text-xs text-[var(--ink3)]">Per week, last 12 weeks (UTC, weeks start Monday).</p>
          <div className="mt-2 flex h-24 items-end gap-1" aria-label="XP per week">
            {d.xp.weeks.map((w) => (
              <div key={w.start.toISOString()} className="flex flex-1 flex-col items-center justify-end" title={`Week of ${day(w.start)}: ${w.points} XP`}>
                <div className="w-full rounded-t bg-[var(--ink)]" style={{ height: `${Math.round((w.points / maxWeek) * 100)}%`, minHeight: w.points ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-[var(--ink3)]">
            <span>{day(d.xp.weeks[0].start)}</span>
            <span>this week</span>
          </div>
          {d.xp.bySource.length > 0 && (
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-[var(--border)]">
                {d.xp.bySource.map((r) => (
                  <tr key={r.source}>
                    <td className="py-1.5 text-[var(--ink2)]">{human(r.source)}</td>
                    <td className="py-1.5 text-right text-[var(--ink3)]">{r.count}×</td>
                    <td className="py-1.5 text-right font-semibold text-[var(--ink)]">{r.points.toLocaleString("en")} XP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {d.xp.recent.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--blue2)]">Latest {d.xp.recent.length} awards</summary>
              <ul className="mt-2 space-y-1 text-xs text-[var(--ink2)]">
                {d.xp.recent.map((r, i) => (
                  <li key={i}>
                    {dt(r.createdAt)} · {human(r.source)} · +{r.points}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Daily Review">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field k="Cards" v={d.review.cards} />
              <Field k="Due now" v={d.review.due} />
              <Field k="Days completed" v={d.review.sessions} />
              <Field k="Last completed" v={day(d.review.lastAt)} />
            </dl>
            {d.review.byBox.length > 0 && (
              <p className="mt-3 text-xs text-[var(--ink3)]">
                By box: {d.review.byBox.map((b) => `box ${b.box}: ${b.count}`).join(" · ")}
              </p>
            )}
          </Card>
          <Card title="Learning Studio">
            <p className="text-sm text-[var(--ink2)]">
              {d.studio.done} challenge{d.studio.done === 1 ? "" : "s"} completed
              {d.studio.byTool.length > 0 && `: ${d.studio.byTool.map((t) => `${human(t.tool)} ${t.n}`).join(" · ")}`}
            </p>
          </Card>
          <Card title="Tutor">
            <p className="text-sm text-[var(--ink2)]">
              {d.tutor.messages} message{d.tutor.messages === 1 ? "" : "s"} sent in {d.tutor.threads} conversation{d.tutor.threads === 1 ? "" : "s"}
              {d.tutor.lastAt && ` · last ${day(d.tutor.lastAt)}`}
            </p>
            <p className="mt-1 text-xs text-[var(--ink3)]">Counts only: conversations are private to the learner.</p>
          </Card>
        </div>
      </div>

      <Card title={`Login history (${d.logins.total})`}>
        {!d.logins.ready ? (
          <p className="text-sm text-amber-800">The sign-in table could not be created. Check the database connection.</p>
        ) : d.logins.recent.length === 0 ? (
          <p className="text-sm text-[var(--ink3)]">
            No sign-ins recorded yet{s.lastLoginAt ? ` (last login before tracking began: ${dt(s.lastLoginAt)})` : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink3)]">
                  <th className="pb-2 pr-3">Time</th>
                  <th className="pb-2 pr-3">Device</th>
                  <th className="pb-2 pr-3">Country</th>
                  <th className="pb-2 pr-3">Network</th>
                  <th className="pb-2 pr-3">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {d.logins.recent.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap py-2 pr-3 text-[var(--ink2)]">{dt(l.at)}</td>
                    <td className="py-2 pr-3 text-[var(--ink2)]" title={l.userAgent ?? ""}>{deviceLabel(l)}</td>
                    <td className="py-2 pr-3 text-[var(--ink2)]">{l.country ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-[var(--ink3)]">{l.ipPrefix ?? "—"}</td>
                    <td className="py-2 pr-3 text-[var(--ink2)]">{METHOD[l.method] ?? l.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {d.logins.total > d.logins.recent.length && (
              <p className="mt-2 text-xs text-[var(--ink3)]">Showing the latest {d.logins.recent.length}.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function TrackBlock({ t }: { t: TrackDetail }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold text-[var(--ink)]">
          {t.title}
          {t.purchased && <span className="ml-2 rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">Bought</span>}
        </h3>
        <p className="text-sm font-semibold text-[var(--ink)]">
          {t.done}/{t.lessons} lessons · {t.percent}%
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full rounded bg-[var(--s2)]">
        <div className="h-1.5 rounded bg-green-600" style={{ width: `${t.percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-[var(--ink3)]">
        Placement check:{" "}
        {t.diagnostic
          ? t.diagnostic.status === "completed"
            ? `done ${dt(t.diagnostic.completedAt)}`
            : `${t.diagnostic.status.replace("_", " ")} (started ${day(t.diagnostic.startedAt)})`
          : "not taken"}
        {" · "}Final exam:{" "}
        {t.exam ? `${t.exam.attempts} attempt${t.exam.attempts === 1 ? "" : "s"}, best ${t.exam.best ?? "—"}%${t.exam.passed ? ", passed" : ""}` : "not attempted"}
        {" · "}Capstone: {t.capstone ? `${human(t.capstone.status)}${t.capstone.score != null ? ` (${t.capstone.score})` : ""}, ${day(t.capstone.at)}` : "not submitted"}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink3)]">
              <th className="pb-2 pr-3">Module</th>
              <th className="pb-2 pr-3">Placement</th>
              <th className="pb-2 pr-3 text-right">Lessons</th>
              <th className="pb-2 pr-3">Quiz</th>
              <th className="pb-2 pr-3">Labs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {t.modules.map((m) => (
              <tr key={m.id} className="align-top">
                <td className="py-2 pr-3 text-[var(--ink)]">{m.title}</td>
                <td className="py-2 pr-3">
                  {m.placement ? (
                    <span title={`Updated ${dt(m.placement.at)}`}>
                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${LEVEL[m.placement.level]?.cls ?? ""}`}>
                        {LEVEL[m.placement.level]?.label ?? m.placement.level}
                      </span>{" "}
                      <span className="text-xs text-[var(--ink3)]">
                        {m.placement.correct}/{m.placement.asked} · {m.placement.score}% · {day(m.placement.at)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--ink3)]">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap py-2 pr-3 text-right text-[var(--ink2)]">
                  {m.lessons ? `${m.done}/${m.lessons}` : "—"}
                  {m.mastered > 0 && <span className="text-xs text-[var(--ink3)]"> ({m.mastered} tested out)</span>}
                </td>
                <td className="py-2 pr-3 text-[var(--ink2)]">
                  {m.quiz ? `best ${m.quiz.best ?? "—"}% · ${m.quiz.attempts}× ${m.quiz.passed ? "· passed" : ""}` : <span className="text-xs text-[var(--ink3)]">—</span>}
                </td>
                <td className="py-2 pr-3 text-xs text-[var(--ink2)]">
                  {m.labs.length
                    ? m.labs.map((l) => (
                        <p key={l.title}>
                          {l.title}: {l.passed ? "passed" : human(l.status)}
                          {l.score != null && ` (${l.score})`}
                        </p>
                      ))
                    : <span className="text-[var(--ink3)]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
