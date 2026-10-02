import Link from "next/link";
import { Download, MessageSquare, Users } from "lucide-react";
import { Button, EmptyState, PageHeader, buttonClasses } from "@/components/admin/ui";
import { LEARN_TABS } from "../tabs";
import prisma from "@/lib/prisma";
import { canManageLearners, requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import {
  filterQuery, listLearners, parseFilters, type LearnerFilters, type SortKey,
} from "@/lib/learn/admin/learners";
import { LearnersTable, type Row } from "./LearnersTable";

export const dynamic = "force-dynamic";

// TIBLOGICS Learn learners: who signed up, their plan, progress, placement
// check and sign-ins. Filters live in the URL (a plain GET form), so a view
// can be bookmarked and the CSV export uses exactly the same filters.

export default async function LearnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Learner PII: owner, admin, or a collaborator with the "learners" (or
  // older Learn "events") permission. Bulk actions: owner or admin only.
  const session = await requireLearnerPage("read");
  const canManage = canManageLearners(session);
  const f = parseFilters(await searchParams);
  const [{ rows, total, page, pages, tracks }, tagRows] = await Promise.all([
    listLearners(f),
    prisma.$queryRaw<Array<{ tag: string }>>`SELECT DISTINCT unnest("tags") AS tag FROM "LearnerAccount" ORDER BY 1 LIMIT 200`.catch(() => []),
  ]);

  const sortLink = (key: SortKey) =>
    filterQuery(f, { sort: key, dir: f.sort === key && f.dir === "desc" ? "asc" : "desc", page: 1 });
  const sortHead = (key: SortKey, label: string) => (
    <Link href={`/admin_pro/learn/learners${sortLink(key)}`} className="hover:text-[var(--a-ink)]" aria-label={`Sort by ${label}`}>
      {label}
      {f.sort === key ? (f.dir === "desc" ? " ↓" : " ↑") : ""}
    </Link>
  );
  const headers = {
    name: sortHead("name", "Learner"),
    created: sortHead("created", "Signed up"),
    progress: sortHead("progress", "Progress"),
    lastLogin: sortHead("lastLogin", "Last login"),
    logins: sortHead("logins", "Logins 30d"),
    xp: sortHead("xp", "XP"),
    certs: sortHead("certs", "Certs"),
  };
  const tableRows: Row[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    createdAt: r.createdAt.toISOString(),
    locale: r.locale,
    emailVerified: r.emailVerified,
    planLabels: r.plan.labels,
    planStatus: r.plan.status,
    tracksStarted: r.tracksStarted,
    progress: r.progress,
    placement: r.placement,
    lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
    logins30: r.logins30,
    xp: r.xp,
    certificates: r.certificates,
    accountStatus: r.accountStatus,
    suspendedUntil: r.suspendedUntil?.toISOString() ?? null,
    tags: r.tags,
  }));
  const input =
    "h-9 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13.5px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20";
  const exportHref = `/api/admin/learn/learners/export${filterQuery(f, { page: 1 })}`;
  const filtered = !!(f.q || f.plan || f.active || f.never || f.cert || f.track || f.tag || f.status || f.lang || f.team || f.inactive || f.progressMin != null || f.progressMax != null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learners"
        subtitle="Everyone who signed up for ARFA, the TIBLOGICS AI Academy: account status, plan, progress, placement check and sign-ins."
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/learners"
        className="mb-0"
        actions={
          <>
            {canManage ? (
              <Button href="/admin_pro/communications/new" variant="secondary" icon={MessageSquare}>
                Message learners
              </Button>
            ) : null}
            <a href={exportHref} className={buttonClasses("secondary")}>
              <Download size={16} aria-hidden />
              Download CSV ({total.toLocaleString("en")})
            </a>
          </>
        }
      />

      <form method="get" aria-label="Filter learners" className="flex flex-wrap items-end gap-3 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)]">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
          Search
          <input name="q" defaultValue={f.q} placeholder="Name or email" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
          Plan
          <select name="plan" defaultValue={f.plan ?? ""} className={input}>
            <option value="">Any plan</option>
            <option value="paid">Paying (subscription or track)</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual (legacy)</option>
            <option value="comped">Comped</option>
            <option value="team">Team</option>
            <option value="tracks">Tracks bought</option>
            <option value="none">None</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
          Activity
          <select name="active" defaultValue={f.active ? String(f.active) : ""} className={input}>
            <option value="">Any time</option>
            <option value="7">Active in last 7 days</option>
            <option value="30">Active in last 30 days</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
          Track
          <select name="track" defaultValue={f.track ?? ""} className={input}>
            <option value="">Any track</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
          Account
          <select name="status" defaultValue={f.status ?? ""} className={input}>
            <option value="">Any (not deleted)</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
            <option value="deleted">Deleted</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
          Tag
          <select name="tag" defaultValue={f.tag ?? ""} className={input}>
            <option value="">Any tag</option>
            {tagRows.map((t) => (
              <option key={t.tag} value={t.tag}>{t.tag}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
          Language
          <select name="lang" defaultValue={f.lang ?? ""} className={input}>
            <option value="">Any</option>
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-[var(--ink2)]">
          <input type="checkbox" name="never" value="1" defaultChecked={f.never} /> Never back since sign-up
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-[var(--ink2)]">
          <input type="checkbox" name="cert" value="1" defaultChecked={f.cert} /> Has a certificate
        </label>
        {f.sort !== "created" && <input type="hidden" name="sort" value={f.sort} />}
        {f.dir !== "desc" && <input type="hidden" name="dir" value={f.dir} />}
        <button type="submit" className={buttonClasses("primary")}>Apply</button>
        {filtered && (
          <Link href="/admin_pro/learn/learners" className="pb-2 text-sm text-[var(--blue2)] underline">
            Clear
          </Link>
        )}
      </form>

      <section className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)]">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">
            {total.toLocaleString("en")} learner{total === 1 ? "" : "s"}
            {filtered ? " match" : ""}
          </h2>
          <p className="text-xs text-[var(--ink3)]">
            Active = signed in, finished a lesson or earned XP. Progress = lessons done in the tracks started.
          </p>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtered ? "No learners match these filters" : "No learners yet"}
            body={filtered ? "Try widening the plan, activity or track filter." : "Sign-ups to TIBLOGICS Learn appear here."}
            action={filtered ? <Button href="/admin_pro/learn/learners" variant="secondary">Clear filters</Button> : undefined}
            compact
          />
        ) : (
          <div className="mt-4">
            <LearnersTable rows={tableRows} headers={headers} canManage={canManage} />
          </div>
        )}
        {pages > 1 && <Pager f={f} page={page} pages={pages} />}
      </section>
    </div>
  );
}

function Pager({ f, page, pages }: { f: LearnerFilters; page: number; pages: number }) {
  const link = (p: number, label: string, disabled: boolean) =>
    disabled ? (
      <span className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--ink3)] opacity-50">{label}</span>
    ) : (
      <Link href={`/admin_pro/learn/learners${filterQuery(f, { page: p })}`} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]">
        {label}
      </Link>
    );
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      {link(page - 1, "Previous", page <= 1)}
      <span className="text-xs text-[var(--ink3)]">
        Page {page} of {pages}
      </span>
      {link(page + 1, "Next", page >= pages)}
    </div>
  );
}
