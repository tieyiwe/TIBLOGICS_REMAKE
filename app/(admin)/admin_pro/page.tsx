import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  DollarSign,
  Flag,
  Flame,
  GraduationCap,
  LifeBuoy,
  Mail,
  Megaphone,
  Newspaper,
  ShoppingBag,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { requireAdminPage } from "./_lib/admin-page-auth";
import { getToday } from "@/lib/admin/today";
import { canSee } from "@/components/admin/shell/nav";
import { Badge, Button, Card, EmptyState, PageHeader, StatCard, type BadgeTone } from "@/components/admin/ui";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

// The "Today" view. Every number is read from records (lib/admin/today.ts);
// nothing is sampled or invented, and an empty state says so. Cards and inbox
// rows respect the same per-permission visibility as the sidebar.

const OWNER_TZ = "America/New_York";

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function pct(cur: number, prev: number): number | string | null {
  if (prev === 0) return null; // "up from nothing" is not a percentage
  const p = Math.round(((cur - prev) / prev) * 1000) / 10;
  // Off a tiny base a percentage is noise ("+8200%"); show the change instead.
  if (Math.abs(p) >= 500) return `${cur - prev > 0 ? "+" : ""}${(cur - prev).toLocaleString("en-US")}`;
  return p;
}

function greeting(now: Date) {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: OWNER_TZ }).format(now)) % 24;
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function timeAgo(d: Date, now: Date) {
  const mins = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 30 ? `${days}d ago` : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: OWNER_TZ });
}

const APPT_TONE: Record<string, BadgeTone> = {
  PENDING: "warn",
  CONFIRMED: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

const ACTIVITY: Record<string, { icon: LucideIcon; label: string; cls: string }> = {
  learner: { icon: GraduationCap, label: "New ARFA learner", cls: "bg-[var(--a-info-bg)] text-[var(--a-info)]" },
  order: { icon: ShoppingBag, label: "Store order", cls: "bg-[var(--a-success-bg)] text-[var(--a-success)]" },
  appointment: { icon: CalendarDays, label: "Booking", cls: "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)]" },
  service_request: { icon: Briefcase, label: "Service request", cls: "bg-[var(--a-warn-bg)] text-[var(--a-warn)]" },
  prospect: { icon: Users, label: "Prospect", cls: "bg-[var(--a-surface-2)] text-[var(--a-ink-2)]" },
  lead: { icon: UserPlus, label: "Growth lead", cls: "bg-[var(--a-surface-2)] text-[var(--a-ink-2)]" },
};

// Nav route whose permission decides whether a staff member sees that activity.
const ACTIVITY_GATE: Record<string, string> = {
  learner: "/admin_pro/learn/learners",
  order: "/admin_pro/shop",
  appointment: "/admin_pro/appointments",
  service_request: "/admin_pro/service-requests",
  prospect: "/admin_pro/prospects",
  lead: "/admin_pro/growth/leads",
};

export default async function AdminDashboardPage() {
  const session = await requireAdminPage();
  const viewer = {
    isAdmin: !!session.user?.isAdmin,
    permissions: ((session.user as { permissions?: string[] } | undefined)?.permissions ?? []) as string[],
  };
  const see = (href: string) => canSee(href, viewer);
  const d = await getToday();
  const now = d.generatedAt;
  const firstName = (session.user?.name ?? "").split(" ")[0];

  const kpis = [
    see("/admin_pro/revenue") && (
      <StatCard
        key="rev"
        label="Revenue this month"
        value={money(d.revenue.mtd)}
        delta={pct(d.revenue.mtd, d.revenue.prevMtd)}
        deltaLabel={pct(d.revenue.mtd, d.revenue.prevMtd) === null ? undefined : "vs same days last month"}
        hint={pct(d.revenue.mtd, d.revenue.prevMtd) === null ? `${money(d.revenue.prevMtd)} same days last month` : undefined}
        spark={d.revenue.spark}
        href="/admin_pro/revenue"
        icon={DollarSign}
        tone="orange"
      />
    ),
    see("/admin_pro/learn/learners") && (
      <StatCard
        key="signups"
        label="New ARFA sign-ups"
        value={d.signups.cur}
        delta={pct(d.signups.cur, d.signups.prev)}
        deltaLabel="last 7 days"
        hint={`${d.signups.today} today`}
        spark={d.signups.spark}
        href="/admin_pro/learn/learners"
        icon={UserPlus}
        tone="navy"
      />
    ),
    see("/admin_pro/learn/learners") && (
      <StatCard
        key="active"
        label="Active learners"
        value={d.active.cur}
        delta={pct(d.active.cur, d.active.prev)}
        deltaLabel="last 7 days"
        href="/admin_pro/learn/learners"
        icon={GraduationCap}
      />
    ),
    (see("/admin_pro/growth/leads") || see("/admin_pro/prospects")) && (
      <StatCard
        key="leads"
        label="New leads"
        value={d.leads.cur}
        delta={pct(d.leads.cur, d.leads.prev)}
        deltaLabel="last 7 days"
        hint={`${d.leads.growth} growth, ${d.leads.prospects} prospects`}
        href={see("/admin_pro/growth/leads") ? "/admin_pro/growth/leads" : "/admin_pro/prospects"}
        icon={Users}
      />
    ),
    see("/admin_pro/appointments") && (
      <StatCard
        key="appts"
        label="Appointments"
        value={d.upcomingWeek}
        hint="next 7 days"
        href="/admin_pro/appointments"
        icon={CalendarClock}
      />
    ),
  ].filter(Boolean);

  type InboxRow = { key: string; icon: LucideIcon; count: number; label: string; action: string; href: string; tone: BadgeTone };
  const inbox: InboxRow[] = (
    [
      { key: "support", icon: LifeBuoy, count: d.inbox.support, label: "learner support requests waiting", action: "Answer", href: "/admin_pro/communications/support", tone: "danger" },
      { key: "growth", icon: Megaphone, count: d.inbox.growthDrafts, label: "social posts awaiting approval", action: "Review posts", href: "/admin_pro/growth/content", tone: "orange" },
      { key: "outreach", icon: Mail, count: d.inbox.outreachDrafts, label: "outreach emails awaiting approval", action: "Approve emails", href: "/admin_pro/growth/outreach", tone: "orange" },
      { key: "hot", icon: Flame, count: d.inbox.hotLeads, label: "hot leads to follow up", action: "Open leads", href: "/admin_pro/growth/leads", tone: "danger" },
      { key: "appts", icon: CalendarClock, count: d.inbox.pendingAppointments, label: "appointments to confirm", action: "Confirm", href: "/admin_pro/appointments", tone: "warn" },
      { key: "sr", icon: Briefcase, count: d.inbox.serviceRequests, label: "new service requests", action: "Triage", href: "/admin_pro/service-requests", tone: "warn" },
      { key: "capstones", icon: GraduationCap, count: d.inbox.capstones, label: "capstones to review", action: "Review", href: "/admin_pro/learn", tone: "info" },
      { key: "reports", icon: Flag, count: d.inbox.reports, label: "reported community posts", action: "Moderate", href: "/admin_pro/learn/community", tone: "danger" },
      { key: "blog", icon: Newspaper, count: d.inbox.blogDrafts, label: "unpublished blog drafts", action: "Edit drafts", href: "/admin_pro/blog", tone: "neutral" },
    ] satisfies InboxRow[]
  ).filter((r) => r.count > 0 && see(r.href));

  const dateLine = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: OWNER_TZ }).format(now);
  const totalTodo = inbox.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting(now)}${firstName ? `, ${firstName}` : ""}`}
        subtitle={
          <>
            {dateLine}.{" "}
            {totalTodo > 0 ? `${totalTodo} item${totalTodo === 1 ? "" : "s"} need you today.` : "Nothing is waiting on you."}
          </>
        }
        actions={
          <>
            {see("/admin_pro/growth") ? (
              <Button href="/admin_pro/growth" variant="secondary">
                Growth hub
              </Button>
            ) : null}
            {see("/admin_pro/appointments") ? (
              <Button href="/admin_pro/appointments" variant="primary" icon={CalendarDays}>
                Appointments
              </Button>
            ) : null}
          </>
        }
        className="mb-0"
      />

      {kpis.length > 0 ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">{kpis}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card
            title="Needs you"
            subtitle="Queues waiting on a decision, most urgent first"
            padded={false}
            action={totalTodo > 0 ? <Badge tone="orange">{totalTodo} open</Badge> : null}
          >
            {inbox.length === 0 ? (
              <EmptyState icon={CircleCheck} title="All caught up" body="No approvals, reviews or requests are waiting." compact />
            ) : (
              <ul className="divide-y divide-[var(--a-border)]">
                {inbox.map((r) => (
                  <li key={r.key}>
                    <Link
                      href={r.href}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-[#f8fafd]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--a-surface-2)] text-[var(--a-ink-2)] ring-1 ring-inset ring-[var(--a-border)]">
                        <r.icon size={16} aria-hidden />
                      </span>
                      <p className="min-w-0 flex-1 font-dm text-[14px] text-[var(--a-ink-2)]">
                        <Badge tone={r.tone} className="mr-2 tabular-nums">
                          {r.count}
                        </Badge>
                        {r.label}
                      </p>
                      <span className="hidden shrink-0 items-center gap-1 font-dm text-[13px] font-semibold text-[var(--a-blue)] group-hover:underline sm:inline-flex">
                        {r.action}
                        <ArrowRight size={14} aria-hidden />
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-[var(--a-ink-3)] sm:hidden" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {see("/admin_pro/appointments") ? (
            <Card
              title="Upcoming appointments"
              subtitle={`${d.upcomingWeek}${d.upcomingCapped ? "+" : ""} in the next 7 days`}
              padded={false}
              action={
                <Button href="/admin_pro/appointments" variant="ghost" size="sm" iconRight={ArrowRight}>
                  View all
                </Button>
              }
            >
              {d.upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No upcoming appointments"
                  body="Nothing booked in the next 30 days."
                  action={
                    <Button href="/admin_pro/appointments/availability" variant="secondary" size="sm">
                      Check availability
                    </Button>
                  }
                  compact
                />
              ) : (
                <ul className="divide-y divide-[var(--a-border)]">
                  {d.upcoming.map((a) => {
                    const day = a.date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
                    const num = a.date.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });
                    const wd = a.date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
                    return (
                      <li key={a.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] bg-[var(--a-info-bg)] font-dm leading-none text-[var(--a-navy)]">
                          <span className="text-[10px] font-semibold uppercase">{day}</span>
                          <span className="mt-0.5 text-[17px] font-bold tabular-nums">{num}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-dm text-[14px] font-semibold text-[var(--a-ink)]">
                            {a.firstName} {a.lastName}
                          </p>
                          <p className="truncate font-dm text-[12.5px] text-[var(--a-ink-3)]">
                            {wd} {a.timeSlot} · {a.serviceType.replace(/_/g, " ")}
                          </p>
                        </div>
                        <Badge tone={APPT_TONE[a.status] ?? "neutral"}>{a.status.charAt(0) + a.status.slice(1).toLowerCase()}</Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          ) : null}
        </div>

        <Card title="Recent activity" subtitle="Latest across ARFA · AI Academy, store, bookings and leads" padded={false}>
          {d.activity.length === 0 ? (
            <EmptyState title="No activity yet" body="New learners, orders, bookings and leads will show up here." compact />
          ) : (
            <ol className="divide-y divide-[var(--a-border)]">
              {d.activity
                .filter((a) => see(ACTIVITY_GATE[a.kind] ?? a.href))
                .map((a, i) => {
                  const meta = ACTIVITY[a.kind] ?? ACTIVITY.prospect;
                  return (
                    <li key={`${a.kind}-${i}`}>
                      <Link href={a.href} className="flex items-start gap-3 px-5 py-3 transition-colors duration-150 hover:bg-[#f8fafd]">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.cls}`}>
                          <meta.icon size={14} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{a.title}</p>
                          <p className="truncate font-dm text-[12.5px] text-[var(--a-ink-3)]">
                            {meta.label}
                            {a.detail ? ` · ${a.detail.replace(/_/g, " ")}` : ""}
                          </p>
                        </div>
                        <time dateTime={a.at.toISOString()} className="shrink-0 font-dm text-[12px] text-[var(--a-ink-3)] tabular-nums">
                          {timeAgo(a.at, now)}
                        </time>
                      </Link>
                    </li>
                  );
                })}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
