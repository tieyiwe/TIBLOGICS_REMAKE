import Link from "next/link";
import { Download, ScrollText } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, buttonClasses, tableStyles, type BadgeTone } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { AUDIT_PAGE, auditQuery, listAudit, parseAuditFilters, type AuditRow } from "@/lib/admin/audit";
import { dt, ago } from "../learn/learners/_components/format";

export const dynamic = "force-dynamic";

// Every admin action on learners, communication sends, access grants,
// certificate and capstone decisions and product publishes. Owner or admin
// only. Filters live in the URL; the CSV export uses the same filters.

const GROUPS: Array<[string, string]> = [
  ["", "All actions"],
  ["learner", "Learner accounts"],
  ["access", "Access grants"],
  ["comms", "Communications"],
  ["certificate", "Certificates"],
  ["capstone", "Capstone reviews"],
  ["product", "Products"],
  ["audit", "Audit exports"],
];

function tone(action: string): BadgeTone {
  if (/\.(block|delete|revoke)$|comp\.revoke|test\.revoke|certificate\.revoke/.test(action)) return "danger";
  if (/suspend$|temporary|sessions\.revoke|email\.change/.test(action) && !/unsuspend/.test(action)) return "warn";
  if (/^comms\./.test(action)) return "info";
  if (/grant|publish|unblock|unsuspend|restore|extend/.test(action)) return "success";
  return "neutral";
}

function details(r: AuditRow): string {
  const m = r.meta;
  if (!m || typeof m !== "object") return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(m)) {
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    const val = typeof v === "object" ? JSON.stringify(v) : String(v);
    parts.push(`${k}: ${val}`);
  }
  return parts.join(" · ").slice(0, 300);
}

function targetHref(r: AuditRow): string | null {
  if (!r.targetId) return null;
  if (r.targetType === "learner") return `/admin_pro/learn/learners/${r.targetId}`;
  if (r.targetType === "campaign") return `/admin_pro/communications/${r.targetId}`;
  if (r.targetType === "thread") return `/admin_pro/communications/inbox/${r.targetId}`;
  return null;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireLearnerPage("manage");
  const f = parseAuditFilters(await searchParams);
  const { rows, total, actors, actions } = await listAudit(f);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE));
  const filtered = !!(f.actor || f.action || f.target || f.from || f.to);
  const input =
    "h-9 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13.5px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20";
  const label = "flex min-w-0 flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        subtitle="Who did what, when: learner account actions, messages sent, access grants, certificates, capstone reviews and product publishes."
        actions={
          <a href={`/api/admin/audit/export${auditQuery({ ...f, page: 1 })}`} className={buttonClasses("secondary")}>
            <Download size={16} aria-hidden /> Download CSV ({total.toLocaleString("en")})
          </a>
        }
      />

      <form method="get" aria-label="Filter the audit log" className="grid gap-3 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)] sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.2fr_auto_auto_auto] lg:items-end">
        <label className={label}>
          Actor
          <select name="actor" defaultValue={f.actor} className={input}>
            <option value="">Anyone</option>
            {actors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Action
          <select name="action" defaultValue={f.action} className={input}>
            {GROUPS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
            <optgroup label="Exact action">
              {actions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className={label}>
          Target
          <input name="target" defaultValue={f.target} placeholder="Email, name or id" className={input} />
        </label>
        <label className={label}>
          From
          <input type="date" name="from" defaultValue={f.from} className={input} />
        </label>
        <label className={label}>
          To
          <input type="date" name="to" defaultValue={f.to} className={input} />
        </label>
        <div className="flex items-center gap-2">
          <button type="submit" className={buttonClasses("primary")}>Apply</button>
          {filtered ? <Link href="/admin_pro/audit" className={buttonClasses("ghost")}>Clear</Link> : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]">
          <EmptyState
            icon={ScrollText}
            title={filtered ? "Nothing matches these filters" : "No admin actions recorded yet"}
            body={filtered ? "Widen the dates or clear a filter." : "Actions on learners, sends and access grants appear here as they happen."}
            action={filtered ? <Button href="/admin_pro/audit" variant="secondary">Clear filters</Button> : undefined}
          />
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className={cn(tableStyles.wrap, "hidden md:block")}>
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>When</th>
                  <th className={tableStyles.th}>Actor</th>
                  <th className={tableStyles.th}>Action</th>
                  <th className={tableStyles.th}>Target</th>
                  <th className={tableStyles.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const href = targetHref(r);
                  return (
                    <tr key={r.id} className={cn(tableStyles.tr, "align-top")}>
                      <td className={cn(tableStyles.td, "whitespace-nowrap")} title={dt(r.at)}>
                        <span className="block text-[var(--a-ink)]">{ago(r.at)}</span>
                        <span className="block text-[11.5px] text-[var(--a-ink-3)]">{dt(r.at)}</span>
                      </td>
                      <td className={tableStyles.td}>
                        <span className="block font-medium text-[var(--a-ink)]">{r.actorName || r.actorEmail}</span>
                        <span className="block text-[12px] text-[var(--a-ink-3)]">{r.actorEmail}{r.actorRole ? ` · ${r.actorRole}` : ""}</span>
                      </td>
                      <td className={tableStyles.td}>
                        <Link href={`/admin_pro/audit${auditQuery({ ...f, action: r.action, page: 1 })}`}>
                          <Badge tone={tone(r.action)}>{r.action}</Badge>
                        </Link>
                      </td>
                      <td className={cn(tableStyles.td, "max-w-[240px]")}>
                        {r.targetLabel || r.targetId ? (
                          href ? (
                            <Link href={href} className="break-words font-medium text-[var(--a-blue)] hover:underline">{r.targetLabel || r.targetId}</Link>
                          ) : (
                            <span className="break-words">{r.targetLabel || r.targetId}</span>
                          )
                        ) : (
                          <span className="text-[var(--a-ink-3)]">None</span>
                        )}
                        {r.targetType ? <span className="block text-[11.5px] text-[var(--a-ink-3)]">{r.targetType}</span> : null}
                      </td>
                      <td className={cn(tableStyles.td, "max-w-[360px] break-words text-[12.5px]")}>{details(r)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <ul className="space-y-2 md:hidden">
            {rows.map((r) => {
              const href = targetHref(r);
              return (
                <li key={r.id} className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={tone(r.action)}>{r.action}</Badge>
                    <span className="font-dm text-[12px] text-[var(--a-ink-3)]">{ago(r.at)}</span>
                  </div>
                  <p className="mt-2 break-words font-dm text-[13px] text-[var(--a-ink)]">
                    {href ? <Link href={href} className="font-semibold text-[var(--a-blue)]">{r.targetLabel || r.targetId}</Link> : r.targetLabel || r.targetId || "No target"}
                  </p>
                  <p className="font-dm text-[12px] text-[var(--a-ink-3)]">by {r.actorName || r.actorEmail}</p>
                  {details(r) ? <p className="mt-1 break-words font-dm text-[12px] text-[var(--a-ink-2)]">{details(r)}</p> : null}
                </li>
              );
            })}
          </ul>
          {pages > 1 ? (
            <nav aria-label="Pages" className="flex items-center justify-between gap-3">
              {f.page > 1 ? <Link href={`/admin_pro/audit${auditQuery(f, { page: f.page - 1 })}`} className={buttonClasses("secondary", "sm")}>Previous</Link> : <span />}
              <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">Page {f.page} of {pages}</span>
              {f.page < pages ? <Link href={`/admin_pro/audit${auditQuery(f, { page: f.page + 1 })}`} className={buttonClasses("secondary", "sm")}>Next</Link> : <span />}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
