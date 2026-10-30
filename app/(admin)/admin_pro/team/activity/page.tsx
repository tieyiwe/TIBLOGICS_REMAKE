import Link from "next/link";
import { Activity, Download, Eye, LogIn, MousePointerClick, FileDown } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, buttonClasses, type BadgeTone } from "@/components/admin/ui";
import { can, FEATURES } from "@/lib/admin/permissions";
import { OWNER_EMAIL } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseTimelineFilters, retentionMonths, timeline, type TimelineFilters, type TimelineRow } from "@/lib/admin/team/footprint";
import { requireTeamPage } from "../_components/data";
import { TEAM_TABS } from "../_components/shared";
import RetentionSetting from "../_components/RetentionSetting";
import { dt, ago } from "../../learn/learners/_components/format";

export const dynamic = "force-dynamic";

// Staff footprint: sign-ins (with failed attempts), admin page views (one per
// path per person per 10 minutes), API changes and exports, merged with the
// audit log's detailed actions. Filters live in the URL; the CSV export (owner
// or admin) uses the same filters.

function q(f: TimelineFilters, over: Partial<TimelineFilters> = {}): string {
  const m = { ...f, ...over };
  const p = new URLSearchParams();
  if (m.email) p.set("person", m.email);
  if (m.type) p.set("type", m.type);
  if (m.area) p.set("area", m.area);
  if (m.from) p.set("from", m.from);
  if (m.to) p.set("to", m.to);
  if (m.page > 1) p.set("page", String(m.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function kindInfo(r: TimelineRow): { label: string; tone: BadgeTone; icon: typeof Activity } {
  switch (r.kind) {
    case "signin":
      return { label: "Sign-in", tone: r.meta && (r.meta as { newDevice?: boolean }).newDevice ? "warn" : "success", icon: LogIn };
    case "signin_failed":
      return { label: "Failed sign-in", tone: "danger", icon: LogIn };
    case "signout_forced":
      return { label: "Signed out", tone: "warn", icon: LogIn };
    case "page_view":
      return { label: "Page view", tone: "neutral", icon: Eye };
    case "export":
      return { label: "Export", tone: "orange", icon: FileDown };
    case "api_write":
      return { label: r.success ? "Change" : "Refused", tone: r.success ? "info" : "danger", icon: MousePointerClick };
    default:
      return { label: "Action", tone: "info", icon: Activity };
  }
}

export default async function TeamActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { session, viewer } = await requireTeamPage();
  const f = parseTimelineFilters(await searchParams);
  const [{ rows, more }, people, months] = await Promise.all([
    timeline(f, f.email ? [f.email] : null),
    prisma.collaborator.findMany({ select: { email: true, name: true }, orderBy: { name: "asc" } }).catch(() => []),
    retentionMonths(),
  ]);
  const names = new Map<string, string>([[OWNER_EMAIL, `${process.env.ADMIN_NAME ?? "Tieyiwe"} (owner)`], ...people.map((p) => [p.email.toLowerCase(), p.name] as [string, string])]);
  const canExport = can(session.user, "__admin__");
  const filtered = !!(f.email || f.type || f.area || f.from || f.to);
  const input =
    "h-9 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13.5px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20";
  const label = "flex min-w-0 flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team & Roles"
        subtitle="The footprint of every staff member: sign-ins, pages opened, changes made and exports."
        tabs={TEAM_TABS}
        activeTab="/admin_pro/team/activity"
        className="mb-0"
        actions={
          canExport ? (
            <a href={`/api/admin/team/activity/export${q({ ...f, page: 1 })}`} className={buttonClasses("secondary")}>
              <Download size={16} aria-hidden /> Download CSV
            </a>
          ) : null
        }
      />

      <form method="get" aria-label="Filter activity" className="grid gap-3 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto_auto_auto] lg:items-end">
        <label className={label}>
          Person
          <select name="person" defaultValue={f.email} className={input}>
            <option value="">Everyone</option>
            {[...names.entries()].map(([email, name]) => (
              <option key={email} value={email}>
                {name} ({email})
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Type
          <select name="type" defaultValue={f.type} className={input}>
            <option value="">All types</option>
            <option value="signin">Sign-ins</option>
            <option value="page_view">Page views</option>
            <option value="action">Actions</option>
            <option value="export">Exports</option>
          </select>
        </label>
        <label className={label}>
          Area
          <select name="area" defaultValue={f.area} className={input}>
            <option value="">All areas</option>
            <option value="dashboard">Dashboard</option>
            {FEATURES.map((x) => (
              <option key={x.key} value={x.key}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          From
          <input type="date" name="from" defaultValue={f.from} className={input} />
        </label>
        <label className={label}>
          To
          <input type="date" name="to" defaultValue={f.to} className={input} />
        </label>
        <div className="flex gap-2">
          <Button type="submit" variant="primary">
            Filter
          </Button>
          {filtered ? (
            <Button href="/admin_pro/team/activity" variant="ghost">
              Clear
            </Button>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon={Activity} title={filtered ? "Nothing matches these filters" : "No staff activity yet"} body="Sign-ins, page views, changes and exports appear here as they happen." />
      ) : (
        <ol className="divide-y divide-[var(--a-border)] overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
          {rows.map((r) => {
            const k = kindInfo(r);
            const Icon = k.icon;
            return (
              <li key={r.id} className="flex gap-3 px-4 py-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--a-surface-2)] text-[var(--a-ink-3)]">
                  <Icon size={15} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link href={`/admin_pro/team/activity${q(f, { email: r.email, page: 1 })}`} className="font-dm text-[13.5px] font-semibold text-[var(--a-ink)] hover:underline">
                      {names.get(r.email) ?? r.email}
                    </Link>
                    <Badge tone={k.tone}>{k.label}</Badge>
                    {r.area ? <span className="font-dm text-[12px] text-[var(--a-ink-3)]">{FEATURES.find((x) => x.key === r.area)?.label ?? r.area}</span> : null}
                  </div>
                  <p className="mt-0.5 break-words font-dm text-[13px] text-[var(--a-ink-2)]">{r.summary}</p>
                  {r.device || r.ipPrefix || r.country ? (
                    <p className="mt-0.5 font-dm text-[12px] text-[var(--a-ink-3)]">{[r.device, r.ipPrefix, r.country].filter(Boolean).join(" · ")}</p>
                  ) : null}
                </div>
                <time dateTime={new Date(r.at).toISOString()} title={dt(r.at)} className="shrink-0 whitespace-nowrap font-dm text-[12px] tabular-nums text-[var(--a-ink-3)]">
                  {ago(r.at)}
                </time>
              </li>
            );
          })}
        </ol>
      )}

      {f.page > 1 || more ? (
        <nav aria-label="Pages" className="flex items-center justify-between gap-2">
          {f.page > 1 ? (
            <Button href={`/admin_pro/team/activity${q(f, { page: f.page - 1 })}`} variant="secondary">
              Newer
            </Button>
          ) : (
            <span />
          )}
          <span className="font-dm text-[13px] text-[var(--a-ink-3)]">Page {f.page}</span>
          {more ? (
            <Button href={`/admin_pro/team/activity${q(f, { page: f.page + 1 })}`} variant="secondary">
              Older
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <RetentionSetting months={months} canEdit={viewer.isOwner} />
    </div>
  );
}
