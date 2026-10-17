import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { canViewAnalytics, getAnalytics, parseRange, RANGES, STALL_DAYS, MIN_ANSWERS } from "@/lib/admin/analytics";
import { PageHeader } from "@/components/admin/ui";
import { Card, DayBars, Delta, Empty, Kpi, Meter, SectionTitle, int, money, pct, td, th } from "../ui";
import { AnalyticsTabs } from "../tabs";

// Per-request and session-scoped: never prerendered. The numbers themselves
// are cached for a minute in lib/admin/analytics.ts.
export const dynamic = "force-dynamic";

// Owner analytics: revenue, funnel, learning, retention, engagement and
// content for the last 7/30/90 days, each compared with the period before.
// Owner and admins only (it shows revenue); collaborators keep the visitor
// view at /admin_pro/analytics/visitors.

const SECTIONS = [
  ["revenue", "Revenue"], ["funnel", "Funnel"], ["learning", "Learning"], ["retention", "Retention"],
  ["engagement", "Engagement"], ["content", "Content"],
] as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function BusinessReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdminPage();
  if (!canViewAnalytics(session.user)) redirect("/admin_pro/analytics/visitors");
  const range = parseRange((await searchParams).range);
  const a = await getAnalytics(range);
  const r = a.revenue;
  const L = a.learning;
  const signups = a.funnel.steps[0];
  const prevWord = `previous ${range} days`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business report"
        subtitle={
          <>
            Last {range} days ({fmtDate(a.from)} to today) compared with the {prevWord}. Times in UTC. Updated{" "}
            {new Date(a.generatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
            (cached for a minute).
          </>
        }
        className="mb-0"
        actions={
          <nav
            className="inline-flex rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface-2)] p-0.5"
            aria-label="Date range"
          >
            {RANGES.map((d) => (
              <Link
                key={d}
                href={`/admin_pro/analytics/report?range=${d}`}
                aria-current={d === range ? "page" : undefined}
                className={`inline-flex h-8 items-center rounded-[8px] px-3 font-dm text-[13px] font-semibold ${
                  d === range
                    ? "bg-[var(--a-surface)] text-[var(--a-ink)] shadow-[0_1px_2px_rgba(13,27,42,.08)] ring-1 ring-[var(--a-border)]"
                    : "text-[var(--a-ink-3)] hover:text-[var(--a-ink)]"
                }`}
              >
                {d} days
              </Link>
            ))}
          </nav>
        }
      />
      <AnalyticsTabs active="/admin_pro/analytics/report" viewer={session.user} />
      <nav
        className="sticky top-[-16px] z-[2] -mx-4 flex gap-1 overflow-x-auto border-b border-[var(--a-border)] bg-[var(--a-bg)]/95 px-4 backdrop-blur sm:top-[-24px] sm:-mx-6 sm:px-6"
        aria-label="Sections"
      >
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex h-10 shrink-0 items-center border-b-2 border-transparent px-3 font-dm text-[13.5px] font-semibold text-[var(--a-ink-3)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-ink)]"
          >
            {label}
          </a>
        ))}
        <Link
          href="/admin_pro/analytics/visitors"
          className="ml-auto inline-flex h-10 shrink-0 items-center gap-1 px-3 font-dm text-[13.5px] font-semibold text-[var(--a-blue)] hover:underline"
        >
          Live visitors
        </Link>
      </nav>

      {/* ── Revenue ─────────────────────────────────────────────────────── */}
      <SectionTitle id="revenue">Revenue</SectionTitle>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label={`Paid one-time revenue, last ${range} days`} value={money(r.total.cur)} pair={r.total} prevLabel={money(r.total.prev)} note="Stored amounts" />
        <Kpi
          label="Est. recurring revenue (MRR) now"
          value={money(r.mrr.totalCents)}
          note={`Estimate: ARFA subscriptions + team seats${r.mrr.toolkitCents != null && r.mrr.toolkitActive ? " + Toolkit Live" : ""}`}
        />
        <Kpi label={`New paid Learn subscriptions`} value={int(r.newLearnSubs.cur)} pair={r.newLearnSubs} />
        <Kpi
          label="Learn subscriptions cancelled"
          value={int(r.cancelledLearnSubs.cur)}
          pair={r.cancelledLearnSubs}
          invert
          note="Estimate: by date of last change"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card title="One-time revenue by source" subtitle={`Last ${range} days vs ${prevWord}`} csv="revenue" range={range}>
          <ul className="space-y-4">
            {r.sources.map((s) => (
              <li key={s.key}>
                <div className="flex justify-between gap-2 font-dm text-sm">
                  <span className="text-[var(--a-ink-2)] min-w-0">{s.label}</span>
                  <span className="font-semibold text-[var(--a-ink)] tabular-nums shrink-0">{s.tracked ? money(s.cents.cur) : "not tracked"}</span>
                </div>
                <Meter value={s.cents.cur} max={Math.max(1, ...r.sources.map((x) => x.cents.cur))} />
                {s.tracked && (
                  <p className="mt-1 font-dm text-[11px] text-[var(--a-ink-3)]">
                    {int(s.count.cur)} payments · <Delta v={s.cents} /> vs {money(s.cents.prev)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Paid one-time revenue per day" subtitle="All one-time sources, stored amounts" csv="revenue-daily" range={range} className="lg:col-span-2">
          <DayBars data={r.daily} format={money} label="Revenue" />
        </Card>
      </div>

      <Card title="Recurring revenue (estimates)" subtitle="Subscriptions in force today, at list prices. Renewals are not stored, so check Stripe for exact figures." range={range}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-dm min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--a-border)] text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                <th className={th}>Product</th><th className={th}>Active</th><th className={th}>Basis</th><th className={`${th} text-right`}>Est. MRR</th>
              </tr>
            </thead>
            <tbody className="text-[var(--a-ink-2)]">
              <tr className="border-b border-[var(--a-border)]">
                <td className={td}>ARFA · AI Academy subscriptions</td>
                <td className={td}>{int(r.mrr.learnMonthly)} monthly{r.mrr.learnAnnual ? `, ${int(r.mrr.learnAnnual)} annual (legacy)` : ""}</td>
                <td className={td}>{money(r.mrr.learnPriceCents)}/month each; annual ÷ 12</td>
                <td className={`${td} text-right font-semibold text-[var(--a-ink)]`}>{money(r.mrr.learnCents)}</td>
              </tr>
              <tr className="border-b border-[var(--a-border)]">
                <td className={td}>Team plans</td>
                <td className={td}>{a.tables.Team ? `${int(r.mrr.teams)} teams, ${int(r.mrr.teamSeats)} seats` : "not tracked"}</td>
                <td className={td}>Seats × seat price (comped teams excluded){r.newTeams ? ` · ${int(r.newTeams.cur)} paid teams started in period (incl. since cancelled)` : ""}</td>
                <td className={`${td} text-right font-semibold text-[var(--a-ink)]`}>{money(r.mrr.teamCents)}</td>
              </tr>
              <tr>
                <td className={td}>Toolkit Live / Compliance Guard</td>
                <td className={td}>{a.tables.ToolkitSubscription ? int(r.mrr.toolkitActive) : "not tracked"}</td>
                <td className={td}>
                  {r.mrr.toolkitCents == null ? "Price not set in env (TOOLKIT_PRICE_CENTS / GUARD_PRICE_CENTS)" : "Active × plan price"}
                  {r.newToolkitSubs ? ` · ${int(r.newToolkitSubs.cur)} new in period` : ""}
                </td>
                <td className={`${td} text-right font-semibold text-[var(--a-ink)]`}>{r.mrr.toolkitCents == null ? "–" : money(r.mrr.toolkitCents)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Funnel ──────────────────────────────────────────────────────── */}
      <SectionTitle id="funnel">Funnel</SectionTitle>
      <Card
        title="Sign-up funnel"
        subtitle={`Learners who signed up in the last ${range} days and how far they have got so far. The previous cohort has had longer, so later steps favour it.`}
        csv="funnel"
        range={range}
      >
        {a.funnel.visitors && (
          <p className="mb-4 font-dm text-sm text-[var(--a-ink-2)]">
            <span className="font-semibold text-[var(--a-ink)]">{int(a.funnel.visitors.cur)}</span> unique site visitors (sessions){" "}
            <Delta v={a.funnel.visitors} /> · sign-up rate {pct(signups.cur, a.funnel.visitors.cur)} of visitors (not linked per person)
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-dm min-w-[560px]">
            <thead>
              <tr className="border-b border-[var(--a-border)] text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                <th className={th}>Step</th><th className={`${th} w-2/5`}></th><th className={`${th} text-right`}>Learners</th>
                <th className={`${th} text-right`}>Of sign-ups</th><th className={`${th} text-right`}>From previous step</th><th className={`${th} text-right`}>Previous period</th>
              </tr>
            </thead>
            <tbody className="text-[var(--a-ink-2)]">
              {a.funnel.steps.map((s, i) => {
                const before = i === 0 ? null : a.funnel.steps[i - 1];
                return (
                  <tr key={s.key} className="border-b border-[var(--a-border)] last:border-0">
                    <td className={td}>{s.label}</td>
                    <td className={`${td} align-middle`}><Meter value={s.cur} max={signups.cur} color={i === 0 ? "#1B3A6B" : "#2251A3"} /></td>
                    <td className={`${td} text-right font-semibold text-[var(--a-ink)] tabular-nums`}>{int(s.cur)}</td>
                    <td className={`${td} text-right tabular-nums`}>{pct(s.cur, signups.cur)}</td>
                    <td className={`${td} text-right tabular-nums`}>{before ? pct(s.cur, before.cur) : "–"}</td>
                    <td className={`${td} text-right tabular-nums text-[var(--a-ink-3)]`}>{int(s.prev)} ({pct(s.prev, signups.prev)})</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Learning ────────────────────────────────────────────────────── */}
      <SectionTitle id="learning">Learning</SectionTitle>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="Daily active learners (last 24 h)" value={int(L.dau.cur)} pair={L.dau} />
        <Kpi label="Weekly active (last 7 days)" value={int(L.wau.cur)} pair={L.wau} />
        <Kpi label="Monthly active (last 30 days)" value={int(L.mau.cur)} pair={L.mau} note={`Stickiness DAU/MAU ${pct(L.dau.cur, L.mau.cur)}`} />
        <Kpi label={`Lessons completed, last ${range} days`} value={int(L.lessons.cur)} pair={L.lessons} />
      </div>
      <p className="-mt-3 font-dm text-xs text-[var(--a-ink-3)]">
        Active = signed in, completed a lesson or earned XP. Compared with the same window ending {fmtDate(a.from)}.
        {!a.tables.LoginEvent && " Sign-in history is not tracked yet, so only lessons and XP count."}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Lessons completed per day" csv="activity-daily" range={range}>
          <DayBars data={L.lessonsPerDay} label="Lessons completed" />
        </Card>
        <Card title="Active learners per day" csv="activity-daily" range={range}>
          <DayBars data={L.dailyActive} label="Active learners" />
        </Card>
      </div>

      <Card
        title="Tracks"
        subtitle={`Enrolled = touched the track (lesson, quiz, lab, exam or placement), all time. Completed = certificate earned, or every lesson done or tested out. Median days = first activity to certificate (or last lesson), for completers. Stalled = not completed and no activity for ${STALL_DAYS}+ days; the drop-off module is where their next lesson sits. Pass rates are for the last ${range} days.`}
        csv="tracks"
        range={range}
      >
        {L.tracks.length === 0 ? <Empty>No tracks yet.</Empty> : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm font-dm min-w-[980px]">
              <thead>
                <tr className="border-b border-[var(--a-border)] text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                  <th className={th}>Track</th><th className={`${th} text-right`}>Enrolled</th><th className={`${th} text-right`}>New / active</th>
                  <th className={`${th} text-right`}>Completed</th><th className={`${th} text-right`}>Median days</th><th className={`${th} text-right`}>Avg progress</th>
                  <th className={`${th} text-right`}>Certs</th><th className={th}>Biggest drop-off</th>
                  <th className={`${th} text-right`}>Quiz pass</th><th className={`${th} text-right`}>Exam pass</th>
                </tr>
              </thead>
              <tbody className="text-[var(--a-ink-2)]">
                {L.tracks.map((t) => (
                  <tr key={t.id} className="border-b border-[var(--a-border)] last:border-0">
                    <td className={td}>
                      <span className="font-medium text-[var(--a-ink)]">{t.title}</span>
                      <span className="block text-[11px] text-[var(--a-ink-3)]">{t.lessons} lessons{t.status !== "live" ? ` · ${t.status.replace("_", " ")}` : ""}</span>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{int(t.enrolled)}</td>
                    <td className={`${td} text-right tabular-nums`}>{int(t.startedInPeriod)} / {int(t.activeInPeriod)}</td>
                    <td className={`${td} text-right tabular-nums`}>{int(t.completed)} <span className="text-[var(--a-ink-3)]">({t.completionPct}%)</span></td>
                    <td className={`${td} text-right tabular-nums`}>{t.medianDays == null ? "–" : t.medianDays}</td>
                    <td className={`${td} text-right tabular-nums`}>{t.enrolled ? `${t.avgProgressPct}%` : "–"}</td>
                    <td className={`${td} text-right tabular-nums`}>{int(t.certificates)}</td>
                    <td className={td}>
                      {t.dropModule ? (
                        <>
                          <span className="text-[var(--a-ink)]">{t.dropModule}</span>
                          <span className="block text-[11px] text-[var(--a-ink-3)]">{t.dropModuleStalls} of {t.stalled} stalled</span>
                        </>
                      ) : <span className="text-[var(--a-ink-3)]">{t.stalled ? `${t.stalled} stalled` : "–"}</span>}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{t.quiz.attempts ? `${pct(t.quiz.passed, t.quiz.attempts)} of ${t.quiz.attempts}` : "–"}</td>
                    <td className={`${td} text-right tabular-nums`}>{t.exam.attempts ? `${pct(t.exam.passed, t.exam.attempts)} of ${t.exam.attempts}` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card title="Assessment pass rates" subtitle={`Last ${range} days vs ${prevWord}`} csv="assessments" range={range}>
          <ul className="space-y-3 font-dm text-sm">
            {L.assessments.map((x) => (
              <li key={x.kind} className="flex items-baseline justify-between gap-3">
                <span className="text-[var(--a-ink-2)]">{x.kind === "quiz" ? "Module quizzes" : x.kind === "exam" ? "Final exams" : "Labs"}</span>
                <span className="text-right">
                  <span className="font-semibold text-[var(--a-ink)] tabular-nums">{pct(x.passed.cur, x.attempts.cur)}</span>
                  <span className="text-[var(--a-ink-3)]"> of {int(x.attempts.cur)} · before {pct(x.passed.prev, x.attempts.prev)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card
          title="Hardest questions"
          subtitle={`Lowest share answered correctly, all time, at least ${MIN_ANSWERS} answers.`}
          csv="hardest-questions"
          range={range}
          className="lg:col-span-2"
        >
          {L.hardest.length === 0 ? <Empty>Not enough answers yet.</Empty> : (
            <ol className="space-y-3 font-dm text-sm">
              {L.hardest.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-12 text-right font-semibold tabular-nums text-[#B42318]">{h.correctPct}%</span>
                  <span className="min-w-0">
                    <span className="text-[var(--a-ink)] line-clamp-2">{h.question}</span>
                    <span className="block text-[11px] text-[var(--a-ink-3)]">
                      {h.kind === "exam" ? "Final exam" : "Quiz"} · {h.track} · {h.module} · {int(h.answers)} answers
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* ── Retention ───────────────────────────────────────────────────── */}
      <SectionTitle id="retention">Retention</SectionTitle>
      <Card
        title="Weekly sign-up cohorts"
        subtitle="Share of each week's sign-ups active (signed in, completed a lesson or earned XP) in each week after signing up. Weeks start Monday, UTC."
        csv="retention"
        range={range}
      >
        <div className="overflow-x-auto">
          <table className="text-xs font-dm border-separate border-spacing-0.5 min-w-full">
            <thead>
              <tr className="text-left text-[var(--a-ink-3)]">
                <th className="py-1 pr-3 font-semibold whitespace-nowrap">Week of</th>
                <th className="py-1 pr-3 font-semibold text-right">Sign-ups</th>
                {Array.from({ length: a.retention.weeks }, (_, k) => (
                  <th key={k} className="py-1 px-1 font-semibold text-center whitespace-nowrap">W{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.retention.cohorts.map((c) => (
                <tr key={c.week}>
                  <td className="py-1 pr-3 whitespace-nowrap text-[var(--a-ink-2)]">{fmtDate(`${c.week}T00:00:00Z`).replace(/, \d{4}$/, "")}</td>
                  <td className="py-1 pr-3 text-right tabular-nums text-[var(--a-ink)] font-semibold">{c.size}</td>
                  {Array.from({ length: a.retention.weeks }, (_, k) => {
                    if (k >= c.retained.length) return <td key={k} />;
                    if (!c.size) return <td key={k} className="text-center text-[#C5D1E0]">·</td>;
                    const share = c.retained[k] / c.size;
                    return (
                      <td
                        key={k}
                        title={`${c.retained[k]} of ${c.size} active in week ${k}`}
                        className="h-8 min-w-[44px] rounded text-center tabular-nums"
                        style={{
                          background: share ? `rgba(34, 81, 163, ${0.08 + share * 0.82})` : "#F4F7FB",
                          color: share > 0.5 ? "#fff" : "#0D1B2A",
                        }}
                      >
                        {Math.round(share * 100)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Engagement ──────────────────────────────────────────────────── */}
      <SectionTitle id="engagement">Engagement</SectionTitle>
      <Card title="Feature use" subtitle={`Last ${range} days vs ${prevWord}. Features whose tables do not exist yet show as not tracked.`} csv="engagement" range={range}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8">
          {a.engagement.map((e) => (
            <div key={e.key} className="flex items-baseline justify-between gap-3 border-b border-[var(--a-border)] py-2.5 font-dm text-sm">
              <span className="text-[var(--a-ink-2)] min-w-0">{e.label}</span>
              {e.tracked ? (
                <span className="shrink-0 text-right">
                  <span className="font-semibold text-[var(--a-ink)] tabular-nums">{int(e.cur)}</span>{" "}
                  <span className="text-xs"><Delta v={{ cur: e.cur, prev: e.prev }} /></span>
                </span>
              ) : (
                <span className="shrink-0 text-xs text-[var(--a-ink-3)]">not tracked</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <SectionTitle id="content">Content</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Top blog posts" subtitle="By view count, all time (views are not stored per day)." csv="blog" range={range}>
          {a.content.blog.length === 0 ? <Empty>No post views recorded yet.</Empty> : (
            <ol className="space-y-2 font-dm text-sm">
              {a.content.blog.map((b) => (
                <li key={b.slug} className="flex items-baseline justify-between gap-3">
                  <a href={`/ai-times/${b.slug}`} className="min-w-0 truncate text-[var(--a-blue)] hover:underline">{b.title}</a>
                  <span className="shrink-0 tabular-nums font-semibold text-[var(--a-ink)]">{int(b.views)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card title="Top store products" subtitle={`Paid orders in the last ${range} days; all-time units below.`} csv="products" range={range}>
          {a.content.products.length === 0 && a.content.productsAllTime.length === 0 ? <Empty>No store sales yet.</Empty> : (
            <div className="space-y-4 font-dm text-sm">
              {a.content.products.length === 0 ? <p className="text-[var(--a-ink-3)]">No sales in this period.</p> : (
                <ol className="space-y-2">
                  {a.content.products.map((p) => (
                    <li key={p.name} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-[var(--a-ink-2)]">{p.name}</span>
                      <span className="shrink-0 tabular-nums"><span className="text-[var(--a-ink-3)]">{p.units} × </span><span className="font-semibold text-[var(--a-ink)]">{money(p.cents)}</span></span>
                    </li>
                  ))}
                </ol>
              )}
              {a.content.productsAllTime.length > 0 && (
                <p className="text-xs text-[var(--a-ink-3)]">
                  All time: {a.content.productsAllTime.slice(0, 5).map((p) => `${p.name} (${p.sold})`).join(", ")}
                </p>
              )}
            </div>
          )}
        </Card>
        {a.tables.PageView && (
          <Card title="Top pages" subtitle={`Page views in the last ${range} days`} csv="pages" range={range} className="lg:col-span-2">
            {a.content.pages.length === 0 ? <Empty>No page views in this period.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-dm">
                  <thead>
                    <tr className="border-b border-[var(--a-border)] text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                      <th className={th}>Page</th><th className={`${th} w-1/3`}></th><th className={`${th} text-right`}>Views</th><th className={`${th} text-right`}>Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--a-ink-2)]">
                    {a.content.pages.map((p) => (
                      <tr key={p.page} className="border-b border-[var(--a-border)] last:border-0">
                        <td className={`${td} break-all`}>{p.page}</td>
                        <td className={`${td} align-middle`}><Meter value={p.views} max={a.content.pages[0].views} /></td>
                        <td className={`${td} text-right tabular-nums font-semibold text-[var(--a-ink)]`}>{int(p.views)}</td>
                        <td className={`${td} text-right tabular-nums`}>{int(p.visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
